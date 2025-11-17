const qrcodeService = require('../services/qrcodeService');
const { formatResponse } = require('../utils/helper');

/**
 * 生成移动端二维码数据（JWT格式）
 * 接口路径: /studyModel/getMobileQrcodeData 或 /studyModel/getMobileQrcode
 * 参数: id, studyId, task, token
 */
const getMobileQrcodeData = async (req, res) => {
  try {
    const { id, studyId, task, token } = req.body;
    
    // 参数验证
    if (!id || !studyId || !task || !token) {
      return res.status(400).json({
        code: 400,
        msg: '参数不完整',
        obj: {
          message: '缺少必要参数: id, studyId, task, token',
          required: ['id', 'studyId', 'task', 'token']
        }
      });
    }

    // 生成二维码JWT令牌
    const result = await qrcodeService.generateQrcodeToken({
      id,
      studyId,
      task,
      token
    });

    // 返回成功响应
    res.json({
      code: 200,
      msg: '二维码数据生成成功',
      obj: {
        qrcodeToken: result.qrcodeToken,
        id,
        studyId,
        task,
        token,
        expiresAt: result.expiresAt,
        validFor: '7天'
      }
    });

  } catch (error) {
    console.error('生成二维码数据失败:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      obj: { message: error.message }
    });
  }
};

/**
 * 验证二维码是否过期
 * 接口路径: /studyModel/validateQrcode
 * 参数: qrcodeToken
 */
const validateQrcode = async (req, res) => {
  try {
    const { qrcodeToken } = req.body;
    
    // 参数验证
    if (!qrcodeToken) {
      return res.status(400).json({
        code: 400,
        msg: '参数不完整',
        obj: {
          message: '缺少必要参数: qrcodeToken'
        }
      });
    }

    // 验证二维码JWT令牌
    const result = await qrcodeService.validateQrcodeToken(qrcodeToken);

    if (!result.valid) {
        res.json({
            code: 10001,
            msg: '二维码不合法',
            obj: {
            valid: false,
            expired: result.expired,
            remainingTime: result.remainingTime
            }
      });
      return
    }

    // 返回成功响应
    res.json({
      code: 200,
      msg: '验证成功',
      obj: {
        valid: true,
        data: result.data,
        expiresAt: result.expiresAt,
        remainingTime: result.remainingTime
      }
    });

  } catch (error) {
    console.error('验证二维码失败:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      obj: { message: error.message }
    });
  }
};


/**
 * 获取客户端二维码列表
 * 接口路径: /studyModel/getClientQrcodes
 * 参数: clientToken
 */
const getClientQrcodes = async (req, res) => {
  try {
    const { clientToken } = req.body;
    
    // 参数验证
    if (!clientToken) {
      return res.status(400).json({
        code: 400,
        msg: '参数不完整',
        obj: {
          message: '缺少必要参数: clientToken'
        }
      });
    }

    // 获取客户端二维码列表
    const result = await qrcodeService.getClientQrcodes(clientToken);

    res.json({
      code: 200,
      msg: '获取成功',
      obj: result
    });

  } catch (error) {
    console.error('获取客户端二维码列表失败:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      obj: { message: error.message }
    });
  }
};

/**
 * 获取所有客户端统计信息
 * 接口路径: /studyModel/getAllClientsStats
 */
const getAllClientsStats = async (req, res) => {
  try {
    const result = await qrcodeService.getAllClientsStats();

    res.json({
      code: 200,
      msg: '获取成功',
      obj: result
    });

  } catch (error) {
    console.error('获取客户端统计失败:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      obj: { message: error.message }
    });
  }
};

module.exports = {
  getMobileQrcodeData,
  validateQrcode,
  getClientQrcodes,
  getAllClientsStats
};
