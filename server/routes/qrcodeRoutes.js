const express = require('express');
const router = express.Router();
const qrcodeController = require('../controllers/qrcodeController');

// 生成移动端二维码数据（JWT格式）
router.post('/getMobileQrcodeData', qrcodeController.getMobileQrcodeData);

// 兼容客户端的接口路径
router.post('/getMobileQrcode', qrcodeController.getMobileQrcodeData);

// 验证二维码是否过期
router.post('/verifyMobileQrcode', qrcodeController.validateQrcode);

// 获取客户端二维码列表
router.post('/getClientQrcodes', qrcodeController.getClientQrcodes);

// 获取所有客户端统计信息
router.get('/getAllClientsStats', qrcodeController.getAllClientsStats);

// 已删除重复的创建接口，使用 getMobileQrcodeData 即可

module.exports = router;
