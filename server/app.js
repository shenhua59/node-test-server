const express = require('express');
const cors = require('cors');
const path = require('path');
const treeRoutes = require('./routes/treeRoutes');
const qrcodeRoutes = require('./routes/qrcodeRoutes');
const { PORT, API_PREFIX } = require('./config');
const { log } = require('./utils/logUtil'); // 引入日志工具
const axios = require('axios');

// 初始化Express应用
const app = express();

// 中间件
app.use(cors(
  {
    origin: 'http://localhost:9000', // 允许的前端地址
    credentials: true                // 允许携带 cookie
  }
));

// 请求日志中间件
app.use((req, res, next) => {
  log('info', `${req.method} ${req.originalUrl}`, 'frontend_request');
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务（用于提供初始数据）
app.use('/initial-data', express.static(path.resolve(__dirname, './data')));
app.post('/smars_ai_recon/territory_server_finalized', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:9000');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  console.log('✅ 收到清理请求:', req.body);
  res.send({ status: 'ok' });
});

// API路由
app.use(`${API_PREFIX}/tree`, treeRoutes);
app.use('/studyModel', qrcodeRoutes);
// app.get('/osimis/html', async (req, res) => {
//   const seriesOrthancId = req.query.seriesOrthancId;
//   const baseUrl = 'http://192.168.1.222:81/osimis-viewer/app/'; // 基础绝对路径

//   try {
//     const targetUrl = `http://192.168.1.222:81/osimis-viewer/app/index.html?series=${seriesOrthancId}`;
//     const response = await axios.get(targetUrl);
//     let html = response.data;

//     // 专门处理 <link rel="stylesheet" href="..."> 标签
//     html = html.replace(
//       /<link\s+rel="stylesheet"\s+href="([^"]+)"/g, // 精准匹配 CSS 链接
//       (match, relativePath) => {
//         // 跳过已为绝对路径的资源
//         if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
//           return match;
//         }
//         // 拼接绝对路径（自动处理斜杠问题）
//         const absolutePath = new URL(relativePath, baseUrl).href;
//         // 返回替换后的标签
//         return `<link rel="stylesheet" href="${absolutePath}"`;
//       }
//     );

//     // 其他资源替换（script、img 等，同之前的逻辑）
//     html = html.replace(
//       /<script\s+src="([^"]+)"/g,
//       (match, relativePath) => {
//         if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return match;
//         return `<script src="${new URL(relativePath, baseUrl).href}"`;
//       }
//     );

//     // 设置响应头并返回处理后的 HTML
//     res.setHeader('Content-Type', 'text/html; charset=utf-8');
//     res.send(html);

//   } catch (error) {
//     console.error('加载失败:', error);
//     res.status(500).send('加载失败');
//   }
// });
// 根路由
app.get('/', (req, res) => {
  res.json({ 
    message: '医疗影像软件帮助文档管理系统API',
    endpoints: {
      tree: `${API_PREFIX}/tree`,
      content: `${API_PREFIX}/content`
    }
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: '请求的资源不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err); // 打印错误堆栈到控制台
  log('error', err.message, 'backend_error'); // 记录错误到日志文件
  res.status(500).json({ message: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`API前缀: ${API_PREFIX}`);
});

module.exports = app;
