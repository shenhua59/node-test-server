const express = require('express');
const router = express.Router();
const treeController = require('../controllers/treeController');
const { validateTreeNode } = require('../utils/validator');

// 获取完整树形结构（包含content内容）
router.get('/', treeController.getTree);

// 获取指定节点
router.get('/:id', treeController.getNodeById);

// 添加节点
router.post('/', validateTreeNode, treeController.addNode);

// 更新节点
router.put('/:id', validateTreeNode, treeController.updateNode);

// 删除节点
router.delete('/:id', treeController.deleteNode);

module.exports = router;
