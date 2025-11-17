/**
 * 生成节点ID
 * @param {string|number} parentId 父节点ID
 * @returns {number} 新节点ID（时间戳后四位拼接随机数）
 */
const generateId = (parentId) => {
  const base = Date.now();
  const rand = Math.floor(Math.random() * 1000);
  return Number(`${base}${rand}`);
};

/**
 * 递归查找节点
 * @param {Array} nodes 节点数组
 * @param {string|number} id 要查找的节点ID
 * @returns {Object|null} 找到的节点或null
 */
const findNodeRecursive = (nodes, id) => {
  const targetId = String(id);
  for (const node of nodes) {
    if (String(node.id) === targetId) {
      return node;
    }
    if (node.subList && node.subList.length > 0) {
      const found = findNodeRecursive(node.subList, id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * 递归更新节点
 * @param {Array} nodes 节点数组
 * @param {string|number} id 要更新的节点ID
 * @param {Object} updates 更新内容
 * @returns {Object|null} 更新后的节点或null
 */
const updateNodeRecursive = (nodes, id, updates) => {
  const targetId = String(id);
  for (const node of nodes) {
    if (String(node.id) === targetId) {
      Object.assign(node, updates);
      return node;
    }
    if (node.subList && node.subList.length > 0) {
      const updated = updateNodeRecursive(node.subList, id, updates);
      if (updated) return updated;
    }
  }
  return null;
};

/**
 * 递归删除节点
 * @param {Array} nodes 节点数组
 * @param {string|number} id 要删除的节点ID
 * @returns {boolean} 是否删除成功
 */
const deleteNodeRecursive = (nodes, id) => {
  const targetId = String(id);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (String(node.id) === targetId) {
      // 递归删除所有子节点
      if (node.subList && node.subList.length > 0) {
        // 先删除所有子节点
        deleteAllChildrenRecursive(node.subList);
      }
      // 删除当前节点
      nodes.splice(i, 1);
      return true;
    }
    if (node.subList && node.subList.length > 0) {
      const deleted = deleteNodeRecursive(node.subList, id);
      if (deleted) return true;
    }
  }
  return false;
};

/**
 * 递归删除所有子节点
 * @param {Array} nodes 子节点数组
 */
const deleteAllChildrenRecursive = (nodes) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return;
  }
  
  // 递归删除每个子节点
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node.subList && node.subList.length > 0) {
      deleteAllChildrenRecursive(node.subList);
    }
    // 删除当前子节点
    nodes.splice(i, 1);
  }
};

/**
 * 递归添加节点
 * @param {Array} nodes 节点数组
 * @param {string|number} parentId 父节点ID
 * @param {Object} newNode 新节点
 * @returns {boolean} 是否添加成功
 */
const addNodeRecursive = (nodes, parentId, newNode) => {
  const targetId = String(parentId);
  for (const node of nodes) {
    if (String(node.id) === targetId) {
      if (!node.subList) node.subList = [];
      node.subList.push(newNode);
      return true;
    }
    if (node.subList && node.subList.length > 0) {
      const added = addNodeRecursive(node.subList, parentId, newNode);
      if (added) return true;
    }
  }
  return false;
};

/**
 * 递归查找目标节点的父级及位置信息
 * @param {Array} nodes
 * @param {string|number} id
 * @param {Object|null} parent
 * @returns {{ parentNode: Object|null, listRef: Array, index: number }|null}
 */
const findParentRecursive = (nodes, id, parent = null) => {
  const targetId = String(id);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (String(node.id) === targetId) {
      return { parentNode: parent, listRef: nodes, index: i };
    }
    if (node.subList && node.subList.length > 0) {
      const found = findParentRecursive(node.subList, id, node);
      if (found) return found;
    }
  }
  return null;
};

/**
 * 从树中移除指定ID的节点并返回该节点
 * @param {Array} nodes
 * @param {string|number} id
 * @returns {Object|null}
 */
const removeNodeById = (nodes, id) => {
  const info = findParentRecursive(nodes, id, null);
  if (!info) return null;
  const removed = info.listRef.splice(info.index, 1)[0];
  return removed || null;
};

/**
 * 在指定父节点下插入节点
 * @param {Array} nodes
 * @param {string|number} parentId
 * @param {Object} nodeToInsert
 * @returns {boolean}
 */
const insertNodeUnderParent = (nodes, parentId, nodeToInsert) => {
  const pid = String(parentId);
  if (pid === '0' || pid === '' || parentId === 0 || parentId === null || parentId === undefined) {
    nodes.push(nodeToInsert);
    return true;
  }
  return addNodeRecursive(nodes, pid, nodeToInsert);
};

/**
 * 判断targetId是否是rootNode的子孙
 * @param {Object} rootNode
 * @param {string|number} targetId
 * @returns {boolean}
 */
const isDescendant = (rootNode, targetId) => {
  const tid = String(targetId);
  if (!rootNode || !Array.isArray(rootNode.subList)) return false;
  const stack = [...rootNode.subList];
  while (stack.length) {
    const n = stack.pop();
    if (String(n.id) === tid) return true;
    if (n.subList && n.subList.length) stack.push(...n.subList);
  }
  return false;
};

/**
 * 移动节点到新的父节点
 * @param {Array} nodes
 * @param {string|number} id
 * @param {string|number} newParentId
 * @returns {Object} 移动后的节点
 */
const moveNodeById = (nodes, id, newParentId) => {
  const node = removeNodeById(nodes, id);
  if (!node) return null;

  // 防止将节点移动到其自身或其子孙节点下
  if (String(newParentId) === String(node.id) || isDescendant(node, newParentId)) {
    // 将节点放回原位，避免数据丢失
    insertNodeUnderParent(nodes, node.parentId, node);
    return null;
  }

  const success = insertNodeUnderParent(nodes, newParentId, node);
  if (!success) {
    // 插入失败则放回原位
    insertNodeUnderParent(nodes, node.parentId, node);
    return null;
  }
  node.parentId = newParentId ?? 0;
  return node;
};

/**
 * 当节点ID变化时，级联更新其所有子孙节点的parentId
 * @param {Object} node 根节点
 * @param {string|number} newId 新ID
 */
const updateNodeIdCascade = (node, newId) => {
  const oldId = node.id;
  node.id = newId;
  if (Array.isArray(node.subList)) {
    for (const child of node.subList) {
      if (String(child.parentId) === String(oldId)) {
        child.parentId = newId;
      }
      if (child.subList && child.subList.length) {
        updateNodeIdCascade(child, child.id);
      }
    }
  }
};

/**
 * 分页处理函数
 * @param {Array} data 原始数据数组
 * @param {number} current 当前页码
 * @param {number} size 每页大小
 * @returns {Object} 分页结果
 */
const paginateData = (data, current = 1, size = 20) => {
  const total = data.length;
  const startIndex = (current - 1) * size;
  const endIndex = startIndex + size;
  const records = data.slice(startIndex, endIndex);
  
  return {
    records,
    total,
    current: parseInt(current),
    size: parseInt(size),
    pages: Math.ceil(total / size)
  };
};

/**
 * 根据weight字段重新排序节点
 * @param {Array} nodes 节点数组
 * @param {number} newWeight 新的weight值
 * @param {string} excludeId 排除的节点ID（用于更新时）
 * @returns {Array} 重新排序后的节点数组
 */
const reorderNodesByWeight = (nodes, newWeight, excludeId = null) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return nodes;
  }

  // 过滤掉要排除的节点（用于更新时）
  const otherNodes = excludeId ? nodes.filter(node => String(node.id) !== String(excludeId)) : nodes;
  
  // 找到当前weight的最大值
  const maxWeight = Math.max(...otherNodes.map(node => node.weight || 0), 0);
  
  // 如果传入的weight等于最大值，需要特殊处理
  if (newWeight === maxWeight) {
    // 新数据的weight设为最大值，其他所有数据的weight都减1
    otherNodes.forEach(node => {
      if (node.weight > 0) {
        node.weight = node.weight - 1;
      }
    });
    
    // 返回新的weight值（等于原最大值）
    return { nodes, newMaxWeight: maxWeight };
  } else {
    // 原来的逻辑：找到所有weight >= newWeight的节点
    const affectedNodes = otherNodes.filter(node => node.weight >= newWeight);
    
    // 将这些节点的weight依次加1
    affectedNodes.forEach(node => {
      node.weight = (node.weight || 0) + 1;
    });
    
    return { nodes, newMaxWeight: newWeight };
  }
};

/**
 * 重新分配weight值，确保从1开始连续递增，且每个weight值唯一
 * @param {Array} nodes 节点数组
 * @param {string} excludeId 排除的节点ID（用于更新时）
 */
const normalizeWeights = (nodes, excludeId = null) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return;
  }
  
  // 过滤掉要排除的节点，并按当前weight排序
  const otherNodes = excludeId ? nodes.filter(node => String(node.id) !== String(excludeId)) : nodes;
  const sortedNodes = otherNodes.sort((a, b) => (a.weight || 0) - (b.weight || 0));
  
  // 强制重新分配所有节点的weight值，从1开始连续递增
  let nextWeight = 1;
  sortedNodes.forEach(node => {
    node.weight = nextWeight;
    nextWeight++;
  });
};

/**
 * 格式化返回数据结构
 * @param {Array} records 记录数组
 * @param {Object} extMap 扩展数据
 * @returns {Object} 格式化后的返回数据
 */
const formatResponse = (records, extMap = {}) => {
  return {
    code: 200,
    msg: '成功',
    obj: { records },
    extMap
  };
};

module.exports = {
  generateId,
  findNodeRecursive,
  updateNodeRecursive,
  deleteNodeRecursive,
  addNodeRecursive,
  paginateData,
  formatResponse,
  findParentRecursive,
  removeNodeById,
  insertNodeUnderParent,
  moveNodeById,
  updateNodeIdCascade,
  reorderNodesByWeight,
  normalizeWeights,
  deleteAllChildrenRecursive
};
