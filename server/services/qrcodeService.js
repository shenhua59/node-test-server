const fs = require('fs-extra');
const path = require('path');
const jwt = require('jsonwebtoken');

// 二维码数据存储文件路径
const QRCODE_DATA_FILE = path.join(__dirname, '../data/qrcodeData.json');

// 7天的毫秒数
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// JWT密钥（实际项目中应该从环境变量获取）
const JWT_SECRET = 'smars-ai-qrcode-jwt-2025';

// 短链接字符集
const SHORT_URL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * 生成短链接标识符
 */
const generateShortId = (length = 8) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += SHORT_URL_CHARS.charAt(Math.floor(Math.random() * SHORT_URL_CHARS.length));
  }
  return result;
};

/**
 * 初始化二维码数据文件
 */
const initQrcodeDataFile = async () => {
  try {
    await fs.ensureFile(QRCODE_DATA_FILE);
    const exists = await fs.pathExists(QRCODE_DATA_FILE);
    if (!exists || (await fs.readFile(QRCODE_DATA_FILE, 'utf8')).trim() === '') {
      await fs.writeJson(QRCODE_DATA_FILE, {
        qrcodes: {},
        shortUrls: {}, // 短链接映射表
        clients: {},
        lastCleanup: Date.now()
      }, { spaces: 2 });
    }
  } catch (error) {
    console.error('初始化二维码数据文件失败:', error);
    throw error;
  }
};

/**
 * 读取二维码数据
 */
const readQrcodeData = async () => {
  try {
    await initQrcodeDataFile();
    const data = await fs.readJson(QRCODE_DATA_FILE);
    
    // 确保所有必要的数据结构存在
    if (!data.qrcodes) data.qrcodes = {};
    if (!data.shortUrls) data.shortUrls = {};
    if (!data.clients) data.clients = {};
    if (!data.lastCleanup) data.lastCleanup = Date.now();
    
    return data;
  } catch (error) {
    console.error('读取二维码数据失败:', error);
    return { 
      qrcodes: {}, 
      shortUrls: {}, 
      clients: {}, 
      lastCleanup: Date.now() 
    };
  }
};

/**
 * 保存二维码数据
 */
const saveQrcodeData = async (data) => {
  try {
    await fs.writeJson(QRCODE_DATA_FILE, data, { spaces: 2 });
  } catch (error) {
    console.error('保存二维码数据失败:', error);
    throw error;
  }
};

/**
 * 清理过期的二维码数据和短链接
 */
const cleanupExpiredQrcodes = async (data) => {
  const now = Date.now();
  const qrcodes = data.qrcodes || {};
  const shortUrls = data.shortUrls || {};
  let cleanedQrcodes = 0;
  let cleanedShortUrls = 0;

  // 只在距离上次清理超过1小时时才执行清理
  if (now - (data.lastCleanup || 0) < 60 * 60 * 1000) {
    return data;
  }

  // 清理过期的二维码数据
  for (const key in qrcodes) {
    const qrcode = qrcodes[key];
    if (now > qrcode.expiresAt) {
      delete qrcodes[key];
      cleanedQrcodes++;
    }
  }

  // 清理过期的短链接
  for (const shortId in shortUrls) {
    const shortUrl = shortUrls[shortId];
    if (now > shortUrl.expiresAt) {
      delete shortUrls[shortId];
      cleanedShortUrls++;
    }
  }

  if (cleanedQrcodes > 0 || cleanedShortUrls > 0) {
    console.log(`清理了 ${cleanedQrcodes} 个过期的二维码数据和 ${cleanedShortUrls} 个过期的短链接`);
    data.lastCleanup = now;
    await saveQrcodeData(data);
  }

  return data;
};

/**
 * 生成二维码唯一标识（基于客户端token）
 */
const generateQrcodeKey = (params) => {
  const { id, studyId, task, token } = params;
  // 使用token作为客户端标识的一部分
  return `client_${token}_${id}_${studyId}_${task}`;
};

/**
 * 生成客户端标识
 */
const generateClientId = (token) => {
  // 基于token生成客户端标识
  return `smars_${token}_${Date.now()}`;
};

/**
 * 生成二维码JWT令牌
 */
const generateQrcodeToken = async (params) => {
  try {
    const { id, studyId, task, token } = params;
    
    const now = Date.now();
    const expiresAt = now + SEVEN_DAYS_MS;
    
    // 基于token生成客户端标识
    const clientId = generateClientId(token);
    
    // JWT载荷（简化结构）
    const payload = {
      id,
      studyId,
      task,
      token,
      clientId,
      createdAt: now,
      expiresAt
    };
    
    // 生成JWT令牌，设置7天过期
    const jwtToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'help-server',
      subject: 'qrcode-data'
    });
    
    // 保存到本地存储（用于统计和管理）
    let data = await readQrcodeData();
    data = await cleanupExpiredQrcodes(data);
    
    // 确保客户端数据结构存在
    if (!data.clients) {
      data.clients = {};
    }
    
    // 记录客户端信息
    if (!data.clients[token]) {
      data.clients[token] = {
        token,
        clientId: clientId,
        createdAt: now,
        qrcodes: [],
        totalGenerated: 0,
        lastActivity: now
      };
    }
    
    const qrcodeKey = generateQrcodeKey(params);
    
    // 保存二维码数据
    data.qrcodes[qrcodeKey] = {
      ...payload,
      jwtToken,
      qrcodeKey,
      accessCount: 0,
      lastAccess: null
    };
    
    // 更新客户端记录
    data.clients[token].qrcodes.push(qrcodeKey);
    data.clients[token].totalGenerated += 1;
    data.clients[token].lastActivity = now;
    
    // 生成短链接ID
    let shortId;
    do {
      shortId = generateShortId(8);
    } while (data.shortUrls && data.shortUrls[shortId]); // 确保短链接唯一
    
    // 保存短链接映射
    data.shortUrls[shortId] = {
      jwtToken,
      qrcodeKey,
      createdAt: now,
      expiresAt,
      accessCount: 0
    };
    
    await saveQrcodeData(data);
    
    return {
      qrcodeToken: shortId, // 返回短链接而不是完整JWT
      shortUrl: shortId,
      expiresAt
    };
    
  } catch (error) {
    console.error('生成二维码令牌失败:', error);
    throw error;
  }
};

/**
 * 验证二维码令牌（支持短链接和JWT）
 */
const validateQrcodeToken = async (qrcodeToken) => {
  try {
    let decoded;
    let isShortUrl = false;
    
    // 检查是否为短链接（8位字符）
    if (qrcodeToken.length === 8 && /^[A-Za-z0-9]+$/.test(qrcodeToken)) {
      isShortUrl = true;
      
      // 从短链接映射表获取JWT令牌
      let data = await readQrcodeData();
      
      if (!data.shortUrls || !data.shortUrls[qrcodeToken]) {
        return {
          valid: false,
          expired: false,
          remainingTime: 0,
          message: '短链接不存在或已失效'
        };
      }
      
      const shortUrlData = data.shortUrls[qrcodeToken];
      
      // 更新短链接访问次数
      shortUrlData.accessCount = (shortUrlData.accessCount || 0) + 1;
      await saveQrcodeData(data);
      
      // 验证完整的JWT令牌
      decoded = jwt.verify(shortUrlData.jwtToken, JWT_SECRET);
    } else {
      // 直接验证JWT令牌（兼容旧格式）
      decoded = jwt.verify(qrcodeToken, JWT_SECRET);
    }
    
    const now = Date.now();
    
    // 检查是否过期（双重验证）
    if (now > decoded.expiresAt) {
      return {
        valid: false,
        expired: true,
        remainingTime: 0,
        message: '二维码已过期'
      };
    }
    
    // 更新访问记录
    let data = await readQrcodeData();
    const qrcodeKey = generateQrcodeKey(decoded);
    
    // 更新二维码访问记录
    if (data.qrcodes && data.qrcodes[qrcodeKey]) {
      data.qrcodes[qrcodeKey].accessCount = (data.qrcodes[qrcodeKey].accessCount || 0) + 1;
      data.qrcodes[qrcodeKey].lastAccess = now;
    }
    
    // 更新客户端活动记录
    if (data.clients && data.clients[decoded.token]) {
      data.clients[decoded.token].lastActivity = now;
    }
    
    await saveQrcodeData(data);
    
    const remainingTime = decoded.expiresAt - now;
    
    return {
      valid: true,
      data: decoded,
      isShortUrl,
      shortUrl: isShortUrl ? qrcodeToken : null,
      expiresAt: decoded.expiresAt,
      remainingTime,
      message: '验证成功'
    };
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        valid: false,
        expired: true,
        remainingTime: 0,
        message: 'JWT令牌已过期'
      };
    }
    
    if (error.name === 'JsonWebTokenError') {
      return {
        valid: false,
        expired: false,
        remainingTime: 0,
        message: 'JWT令牌无效'
      };
    }
    
    console.error('验证二维码令牌失败:', error);
    throw error;
  }
};


/**
 * 获取客户端二维码列表
 */
const getClientQrcodes = async (clientToken) => {
  try {
    let data = await readQrcodeData();
    data = await cleanupExpiredQrcodes(data);
    
    if (!data.clients || !data.clients[clientToken]) {
      return {
        clientToken,
        qrcodes: [],
        totalGenerated: 0,
        message: '客户端不存在'
      };
    }
    
    const client = data.clients[clientToken];
    const qrcodes = client.qrcodes.map(qrcodeKey => {
      const qrcode = data.qrcodes[qrcodeKey];
      if (qrcode) {
        const now = Date.now();
        return {
          qrcodeKey,
          id: qrcode.id,
          studyId: qrcode.studyId,
          task: qrcode.task,
          createdAt: qrcode.createdAt,
          expiresAt: qrcode.expiresAt,
          expired: now > qrcode.expiresAt,
          remainingTime: Math.max(0, qrcode.expiresAt - now),
          accessCount: qrcode.accessCount || 0,
          lastAccess: qrcode.lastAccess
        };
      }
      return null;
    }).filter(Boolean);
    
    return {
      clientToken,
      clientId: client.clientId,
      createdAt: client.createdAt,
      lastActivity: client.lastActivity,
      totalGenerated: client.totalGenerated,
      qrcodes
    };
    
  } catch (error) {
    console.error('获取客户端二维码列表失败:', error);
    throw error;
  }
};

/**
 * 获取所有客户端统计信息
 */
const getAllClientsStats = async () => {
  try {
    let data = await readQrcodeData();
    data = await cleanupExpiredQrcodes(data);
    
    const clients = Object.values(data.clients || {});
    const qrcodes = Object.values(data.qrcodes || {});
    const now = Date.now();
    
    return {
      totalClients: clients.length,
      totalQrcodes: qrcodes.length,
      activeQrcodes: qrcodes.filter(q => now <= q.expiresAt).length,
      expiredQrcodes: qrcodes.filter(q => now > q.expiresAt).length,
      totalAccess: qrcodes.reduce((sum, q) => sum + (q.accessCount || 0), 0),
      clients: clients.map(client => ({
        token: client.token,
        clientId: client.clientId,
        createdAt: client.createdAt,
        lastActivity: client.lastActivity,
        totalGenerated: client.totalGenerated,
        activeQrcodes: client.qrcodes.filter(key => {
          const qrcode = data.qrcodes[key];
          return qrcode && now <= qrcode.expiresAt;
        }).length
      }))
    };
  } catch (error) {
    console.error('获取客户端统计失败:', error);
    return { 
      totalClients: 0, 
      totalQrcodes: 0, 
      activeQrcodes: 0, 
      expiredQrcodes: 0, 
      totalAccess: 0,
      clients: []
    };
  }
};

/**
 * 获取二维码统计信息
 */
const getQrcodeStats = async () => {
  try {
    return await getAllClientsStats();
  } catch (error) {
    console.error('获取二维码统计失败:', error);
    return { total: 0, active: 0, expired: 0, totalAccess: 0 };
  }
};

module.exports = {
  generateQrcodeToken,
  validateQrcodeToken,
  getQrcodeStats,
  getClientQrcodes,
  getAllClientsStats
};
