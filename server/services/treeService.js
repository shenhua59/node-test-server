const { readJsonFile, writeJsonFile } = require('../utils/fileUtil');
const { 
  generateId,
  findNodeRecursive,
  updateNodeRecursive,
  deleteNodeRecursive,
  addNodeRecursive,
  findParentRecursive,
  moveNodeById,
  updateNodeIdCascade,
  reorderNodesByWeight,
  normalizeWeights
} = require('../utils/helper');

/**
 * 递归排序树形结构
 * @param {Array} nodes 节点数组
 */
const sortTreeByWeight = (nodes) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return;
  }
  
  // 先对当前层级的权重进行标准化，确保从1开始连续递增
  normalizeWeights(nodes);
  
  // 对当前层级按weight排序（从小到大）
  nodes.sort((a, b) => {
    const weightA = a.weight || 0;
    const weightB = b.weight || 0;
    return weightA - weightB;
  });
  
  // 递归排序子节点
  nodes.forEach(node => {
    if (Array.isArray(node.subList) && node.subList.length > 0) {
      sortTreeByWeight(node.subList);
    }
  });
};


/**
 * 获取完整树形结构（包含content内容）
 * @returns {Promise<Array>} 树形结构数据
 */
const getTree = async () => {
  try {
    const treeData = await readJsonFile('treeData.json');
    
    // 确保返回的是数组
    if (!Array.isArray(treeData)) {
      return [];
    }
    

    // 根据weight字段对树形结构进行排序
    sortTreeByWeight(treeData);
    
    return treeData;
  } catch (error) {
    throw error;
  }
};

/**
 * 获取指定节点（包含content内容）
 * @param {string} id 节点ID
 * @returns {Promise<Object>} 节点信息
 */
const getNodeById = async (id) => {
  const tree = await readJsonFile('treeData.json');
  
  // 先对树形结构进行排序
  sortTreeByWeight(tree);
  
  // 合并content内容
  
  const node = findNodeRecursive(tree, id);
  return node;
};

/**
 * 添加节点
 * @param {Object} node 节点信息
 * @param {string} parentId 父节点ID
 * @returns {Promise<Object>} 新增节点
 */
const addNode = async (node, parentId) => {
  const tree = await readJsonFile('treeData.json');
  const now = Date.now();
  const resolvedParentId = parentId !== undefined && parentId !== null ? parentId : (node.parentId ?? 0);

  // 如果指定了非0父ID，则需要校验父节点存在
  if (resolvedParentId && String(resolvedParentId) !== '0') {
    const parentNode = findNodeRecursive(tree, String(resolvedParentId));
    if (!parentNode) {
      throw new Error(`父节点ID ${resolvedParentId} 不存在`);
    }
  }

  const newNode = {
    id: node.id || String(generateId(resolvedParentId)),
    parentId: resolvedParentId ?? 0,
    name: node.name || node.label || '未命名',
    type: node.type || 'menu',
    path: node.path || '',
    icon: node.icon || '',
    showType: Number.isInteger(node.showType) ? node.showType : 1,
    weight: Number.isInteger(node.weight) ? node.weight : 0,
    createUserId: typeof node.createUserId === 'number' ? node.createUserId : 0,
    createTime: node.createTime || now,
    updateUserId: typeof node.updateUserId === 'number' ? node.updateUserId : 0,
    updateTime: node.updateTime || now,
    permissionListJson: Array.isArray(node.permissionListJson) ? node.permissionListJson : [],
    subList: Array.isArray(node.subList) ? node.subList : [],
    content: node.content || '',
  };

  // 递归添加节点
  const isAdded = resolvedParentId && String(resolvedParentId) !== '0' ? addNodeRecursive(tree, resolvedParentId, newNode) : false;
  // 如果父节点不存在或为0，添加为顶级节点
  if (!resolvedParentId || String(resolvedParentId) === '0' || !isAdded) {
    tree.push(newNode);
  }
  
  // 应用weight排序逻辑
  if (newNode.weight !== undefined && newNode.weight !== null) {
    if (resolvedParentId && String(resolvedParentId) !== '0') {
      // 如果是子节点，在父节点的subList中应用排序
      const parentNode = findNodeRecursive(tree, String(resolvedParentId));
      if (parentNode && Array.isArray(parentNode.subList)) {
        const result = reorderNodesByWeight(parentNode.subList, newNode.weight);
        // 如果返回了新的最大weight值，更新新节点的weight
        if (result.newMaxWeight !== newNode.weight) {
          newNode.weight = result.newMaxWeight;
        }
      }
    } else {
      // 如果是顶级节点，在整个树中应用排序
      const result = reorderNodesByWeight(tree, newNode.weight);
      // 如果返回了新的最大weight值，更新新节点的weight
      if (result.newMaxWeight !== newNode.weight) {
        newNode.weight = result.newMaxWeight;
      }
    }
  }
  
  // 重新分配weight值，确保从1开始连续递增
  if (resolvedParentId && String(resolvedParentId) !== '0') {
    // 如果是子节点，在父节点的subList中重新分配weight
    const parentNode = findNodeRecursive(tree, String(resolvedParentId));
    if (parentNode && Array.isArray(parentNode.subList)) {
      normalizeWeights(parentNode.subList);
    }
  } else {
    // 如果是顶级节点，在整个树中重新分配weight
    normalizeWeights(tree);
  }

  await writeJsonFile('treeData.json', tree);
  
  return newNode;
};

/**
 * 更新节点
 * @param {string} id 节点ID
 * @param {Object} updates 更新内容
 * @returns {Promise<Object>} 更新后的节点
 */
const updateNode = async (id, updates) => {
  const tree = await readJsonFile('treeData.json');

  const currentNode = findNodeRecursive(tree, id);
  if (!currentNode) {
    throw new Error(`节点ID ${id} 不存在`);
  }

  const toApply = { ...updates, updateTime: Date.now() };

  // 如果修改了parentId，执行移动
  if (toApply.parentId !== undefined && String(toApply.parentId) !== String(currentNode.parentId)) {
    const newPid = toApply.parentId;
    if (newPid && String(newPid) !== '0') {
      const parentNode = findNodeRecursive(tree, newPid);
      if (!parentNode) {
        throw new Error(`父节点ID ${newPid} 不存在`);
      }
      // 禁止将父节点设置为当前节点或其子孙
      if (String(newPid) === String(id)) {
        throw new Error('不可将父节点设置为自身');
      }
      // 简单检测：若newPid在currentNode子树中，拒绝
      const foundNewPidInSub = findNodeRecursive(currentNode.subList || [], newPid);
      if (foundNewPidInSub) {
        throw new Error('不可将父节点设置为自己的子孙节点');
      }
    }
    const moved = moveNodeById(tree, id, newPid ?? 0);
    if (!moved) {
      throw new Error('移动节点失败');
    }
  }

  // 应用其他字段（可能包含id修改）
  const updatedNode = updateNodeRecursive(tree, id, toApply);
  if (!updatedNode) {
    throw new Error(`节点ID ${id} 不存在`);
  }

  // 如果修改了id，做级联处理
  if (toApply.id !== undefined && String(toApply.id) !== String(id)) {
    updateNodeIdCascade(updatedNode, String(toApply.id));
  }
  
  // 如果修改了weight字段，应用排序逻辑
  if (toApply.weight !== undefined && toApply.weight !== null) {
    const oldParentId = currentNode.parentId;
    const newParentId = toApply.parentId !== undefined ? toApply.parentId : oldParentId;
    
    if (newParentId && String(newParentId) !== '0') {
      // 如果是子节点，在父节点的subList中应用排序
      const parentNode = findNodeRecursive(tree, String(newParentId));
      if (parentNode && Array.isArray(parentNode.subList)) {
        const result = reorderNodesByWeight(parentNode.subList, toApply.weight, id);
        // 如果返回了新的最大weight值，更新当前节点的weight
        if (result.newMaxWeight !== toApply.weight) {
          toApply.weight = result.newMaxWeight;
        }
      }
    } else {
      // 如果是顶级节点，在整个树中应用排序
      const result = reorderNodesByWeight(tree, toApply.weight, id);
      // 如果返回了新的最大weight值，更新当前节点的weight
      if (result.newMaxWeight !== toApply.weight) {
        toApply.weight = result.newMaxWeight;
      }
    }
  }
  
  // 重新分配weight值，确保从1开始连续递增
  const newParentId = toApply.parentId !== undefined ? toApply.parentId : currentNode.parentId;
  if (newParentId && String(newParentId) !== '0') {
    // 如果是子节点，在父节点的subList中重新分配weight
    const parentNode = findNodeRecursive(tree, String(newParentId));
    if (parentNode && Array.isArray(parentNode.subList)) {
      normalizeWeights(parentNode.subList, id);
    }
  } else {
    // 如果是顶级节点，在整个树中重新分配weight
    normalizeWeights(tree, id);
  }

  await writeJsonFile('treeData.json', tree);
  
  return updatedNode;
};

/**
 * 递归删除节点及其所有子节点的内容数据（包括按钮类型）
 * @param {string} id 节点ID
 * @param {Array} tree 树形数据
 */
const deleteNodeContentRecursiveWithButtons = async (id, tree) => {
  try {
    const node = findNodeRecursive(tree, id);
    if (!node) {
      return;
    }
    
    
    // 递归删除所有子节点的内容数据
    if (node.subList && node.subList.length > 0) {
      
      // 使用Promise.all来并行删除子节点内容，提高性能
      const deletePromises = node.subList.map(async (child) => {
        try {
          await deleteNodeContentRecursiveWithButtons(child.id, tree);
        } catch (error) {
          console.error(`删除子节点 ${child.id} 内容数据失败: ${error.message}`);
          // 不抛出错误，继续执行
        }
      });
      
      await Promise.all(deletePromises);
    }

  } catch (error) {
    console.error(`删除节点 ${id} 内容数据时发生错误:`, error);
  }
};

/**
 * 删除节点
 * @param {string} id 节点ID
 * @returns {Promise<boolean>} 删除结果
 */
const deleteNode = async (id) => {
  try {
    
    // 增加超时时间，因为删除大量内容可能需要更长时间
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('删除操作超时')), 60000); // 60秒超时
    });
    
    const deleteOperation = async () => {
      const tree = await readJsonFile('treeData.json');
      
      // 先检查节点是否存在
      const targetNode = findNodeRecursive(tree, id);
      if (!targetNode) {
        throw new Error(`节点ID ${id} 不存在`);
      }
      
      
      // 先递归删除所有子节点的内容数据（包括按钮类型）
      const contentDeleteStart = Date.now();
      await deleteNodeContentRecursiveWithButtons(id, tree);
      const contentDeleteEnd = Date.now();
      
      // 递归删除节点
      const isDeleted = deleteNodeRecursive(tree, id);
      
      if (!isDeleted) {
        throw new Error(`删除节点 ${id} 失败`);
      }
      
      
      // 写入树形数据文件
      const writeStart = Date.now();
      await writeJsonFile('treeData.json', tree);
      const writeEnd = Date.now();
      
      // 添加一个小延迟，确保文件写入完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    };
    
    // 执行删除操作，带超时控制
    const result = await Promise.race([deleteOperation(), timeoutPromise]);
    return result;
    
  } catch (error) {
    
    // 如果是超时错误，提供更友好的错误信息
    if (error.message === '删除操作超时') {
      throw new Error('删除操作超时，请稍后重试');
    }
    
    throw error;
  }
};

module.exports = {
  getTree,
  getNodeById,
  addNode,
  updateNode,
  deleteNode
};
