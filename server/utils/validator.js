/**
 * 验证树形节点数据
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {Function} next 下一步中间件
 */
const validateTreeNode = (req, res, next) => {
  const {
    id, parentId,
    name, label,
    type, path, icon,
    showType, weight,
    permissionListJson,
    subList
  } = req.body;

  // 兼容 label -> name
  if (!name && label) {
    req.body.name = String(label);
  }

  const isPost = req.method === 'POST';

  // 创建必须提供 name；更新时如果提供则校验
  if (isPost) {
    if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim() === '') {
      return res.status(400).json({ message: 'name（目录名称）不能为空且必须是字符串' });
    }
  } else {
    if (req.body.name !== undefined && (typeof req.body.name !== 'string' || req.body.name.trim() === '')) {
      return res.status(400).json({ message: 'name（目录名称）必须是非空字符串' });
    }
  }

  // id（如果存在）
  if (id !== undefined && (typeof id !== 'string' && typeof id !== 'number')) {
    return res.status(400).json({ message: 'id必须是字符串或数字' });
  }

  // parentId（如果存在）
  if (parentId !== undefined && (typeof parentId !== 'string' && typeof parentId !== 'number')) {
    return res.status(400).json({ message: 'parentId必须是字符串或数字' });
  }

  // type（如果存在）
  if (type !== undefined && (typeof type !== 'string' || type.trim() === '')) {
    return res.status(400).json({ message: 'type（类型）必须是非空字符串' });
  }

  // path/icon（如果存在）
  if (path !== undefined && (typeof path !== 'string')) {
    return res.status(400).json({ message: 'path必须是字符串' });
  }
  if (icon !== undefined && (typeof icon !== 'string')) {
    return res.status(400).json({ message: 'icon必须是字符串' });
  }

  // showType（如果存在）
  if (showType !== undefined) {
    const isValid = typeof showType === 'number' && Number.isInteger(showType);
    if (!isValid) {
      return res.status(400).json({ message: 'showType必须是整数' });
    }
  }

  // weight（如果存在）
  if (weight !== undefined) {
    const isValid = typeof weight === 'number' && Number.isInteger(weight) && weight >= 0;
    if (!isValid) {
      return res.status(400).json({ message: 'weight（排序/权重）必须是大于等于0的整数' });
    }
  }

  // permissionListJson（如果存在）
  if (permissionListJson !== undefined) {
    if (!Array.isArray(permissionListJson) || !permissionListJson.every(p => typeof p === 'string')) {
      return res.status(400).json({ message: 'permissionListJson（授权权限）必须是字符串数组' });
    }
  }

  // subList（如果存在）
  if (subList !== undefined && (!Array.isArray(subList))) {
    return res.status(400).json({ message: 'subList必须是数组' });
  }

  next();
};

/**
 * 验证内容数据
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {Function} next 下一步中间件
 */
const validateContent = (req, res, next) => {
  const { id, content } = req.body;
  
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return res.status(400).json({ message: '内容ID不能为空且必须是字符串' });
  }
  
  if (content === undefined || content === null) {
    return res.status(400).json({ message: '内容不能为空' });
  }
  
  next();
};

module.exports = {
  validateTreeNode,
  validateContent
};
