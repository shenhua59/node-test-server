const treeService = require('../services/treeService');
const { paginateData, formatResponse } = require('../utils/helper');

// 定义 extMap 数据常量
const EXT_MAP_DATA = {
  typeMap: {
    menu: "目录",
    button: "页面"
  },
  showTypeList: [
    { code: 0, name: "隐藏" },
    { code: 1, name: "显示" },
    { code: 9, name: "仅超管显示" }
  ],
  showTypeMap: {
    0: "隐藏",
    1: "显示",
    9: "仅超管显示"
  },
  typeList: [
    { code: "menu", name: "目录" },
    { code: "button", name: "页面" }
  ]
};

/**
 * 获取完整树形结构（包含content内容）
 */
const getTree = async (req, res) => {
  try {
    const tree = await treeService.getTree();
    
    // 检查数据是否为空或无效
    if (!tree || !Array.isArray(tree)) {
      return res.status(500).json({ message: '树形数据无效' });
    }
    
    // 格式化返回数据
    const response = formatResponse(tree, EXT_MAP_DATA);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 获取完整树形结构（包含content内容）- 统一接口
 */
const getTreeWithContent = async (req, res) => {
  try {
    const tree = await treeService.getTree();
    
    // 检查数据是否为空或无效
    if (!tree || !Array.isArray(tree)) {
      return res.status(500).json({ message: '树形数据无效' });
    }
    
    // 统计包含内容的节点数量
    const contentStats = countContentNodes(tree);
    
    // 格式化返回数据
    const response = formatResponse(tree, {
      ...EXT_MAP_DATA,
      contentStats
    });
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 统计包含内容的节点数量
 * @param {Array} nodes 节点数组
 * @returns {Object} 统计信息
 */
const countContentNodes = (nodes) => {
  let totalNodes = 0;
  let contentNodes = 0;
  let totalContentLength = 0;
  
  const countRecursive = (nodeList) => {
    if (!Array.isArray(nodeList)) return;
    
    nodeList.forEach(node => {
      totalNodes++;
      
      if (node.content) {
        contentNodes++;
        totalContentLength += node.content.length;
      }
      
      if (node.subList && node.subList.length > 0) {
        countRecursive(node.subList);
      }
    });
  };
  
  countRecursive(nodes);
  
  return {
    totalNodes,
    contentNodes,
    totalContentLength,
    contentCoverage: totalNodes > 0 ? Math.round((contentNodes / totalNodes) * 100) : 0
  };
};

/**
 * 获取指定节点
 */
const getNodeById = async (req, res) => {
  try {
    const { id } = req.params;
    const node = await treeService.getNodeById(id);
    
    if (!node) {
      return res.status(404).json({ message: `节点ID ${id} 不存在` });
    }
    
    const records = [node];
    const response = formatResponse(records, EXT_MAP_DATA);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 添加节点
 */
const addNode = async (req, res) => {
  try {
    const { parentId } = req.query;
    const nodeData = req.body;

    if (nodeData.type === 'button' && nodeData.description !== undefined) {
      nodeData.content = nodeData.description;
      delete nodeData.description;
    }
    const newNode = await treeService.addNode(nodeData, parentId);
    const records = [newNode];
    const response = formatResponse(records, EXT_MAP_DATA);
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 更新节点
 */
const updateNode = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (updates.type === 'button' && updates.description !== undefined) {
      updates.content = updates.description;
      delete updates.description;
    }
    const updatedNode = await treeService.updateNode(id, updates);
    const records = [updatedNode];
    const response = formatResponse(records, EXT_MAP_DATA);
    res.json(response);
  } catch (error) {
    if (error.message.includes('不存在')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * 删除节点
 */
const deleteNode = async (req, res) => {
  try {
    const { id } = req.params;
    // 添加请求超时处理
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时')), 35000); // 35秒超时
    });
    
    const deletePromise = treeService.deleteNode(id);
    const result = await Promise.race([deletePromise, timeoutPromise]);
    
    const records = [{ success: result, message: `节点ID ${id} 已删除` }];
    const response = formatResponse(records, EXT_MAP_DATA);
    
    res.json(response);
  } catch (error) {
    
    // 根据错误类型返回不同的状态码
    if (error.message.includes('不存在')) {
      return res.status(404).json({ 
        code: 404,
        msg: '节点不存在',
        obj: { message: error.message }
      });
    }
    
    if (error.message.includes('超时')) {
      return res.status(408).json({ 
        code: 408,
        msg: '请求超时',
        obj: { message: error.message }
      });
    }
    
    res.status(500).json({ 
      code: 500,
      msg: '删除失败',
      obj: { message: error.message }
    });
  }
};

module.exports = {
  getTree,
  getTreeWithContent,
  getNodeById,
  addNode,
  updateNode,
  deleteNode
};
