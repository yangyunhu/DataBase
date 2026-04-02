const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const port = 3001;

// 配置CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, "../dist")));

// 解析JSON请求体
app.use(express.json({ charset: 'utf-8', limit: '50mb' }));

// 请求速率限制
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 200, // 每个IP限制200个请求
  message: {
    success: false,
    code: 429,
    message: '请求过于频繁，请稍后再试',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 跳过健康检查、静态文件请求和性能监控API
    return req.path === '/api/health' || req.path.startsWith('/static/') || req.originalUrl.startsWith('/api/performance/');
  }
};

// 实现速率限制中间件
const rateLimitStore = new Map();
app.use((req, res, next) => {
  // 跳过指定路径
  if (rateLimit.skip(req)) {
    return next();
  }
  
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - rateLimit.windowMs;
  
  // 获取该IP的请求记录
  let requests = rateLimitStore.get(ip) || [];
  
  // 清理过期的请求记录
  requests = requests.filter(timestamp => timestamp > windowStart);
  
  // 检查是否超过限制
  if (requests.length >= rateLimit.max) {
    return res.status(429).json(rateLimit.message);
  }
  
  // 添加当前请求记录
  requests.push(now);
  rateLimitStore.set(ip, requests);
  
  next();
});

// 负载均衡配置
const MAX_CONCURRENT_REQUESTS = 50; // 最大并发请求数
let activeRequests = 0;
const requestQueue = [];

// 导入日志工具
const logger = require('./utils/logger');

// 负载均衡中间件
app.use((req, res, next) => {
  // 跳过健康检查和静态文件请求
  if (req.path === '/api/health' || req.path.startsWith('/static/')) {
    return next();
  }
  
  // 检查并发请求数
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    next();
    // 请求完成后减少计数
    res.on('finish', () => {
      activeRequests--;
      // 处理队列中的请求
      if (requestQueue.length > 0) {
        const nextRequest = requestQueue.shift();
        nextRequest();
      }
    });
  } else {
    // 添加到请求队列
    requestQueue.push(() => {
      activeRequests++;
      next();
      // 请求完成后减少计数
      res.on('finish', () => {
        activeRequests--;
        // 处理队列中的请求
        if (requestQueue.length > 0) {
          const nextRequest = requestQueue.shift();
          nextRequest();
        }
      });
    });
  }
});

// 请求日志中间件
app.use((req, res, next) => {
  const startTime = Date.now();
  const { method, url, ip, headers } = req;
  
  // 记录请求开始
  logger.debug('请求', `${method} ${url} from ${ip}`);
  
  // 监听响应完成事件
  res.on('finish', () => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const statusCode = res.statusCode;
    
    // 根据状态码选择日志级别
    if (statusCode >= 500) {
      logger.error('响应', `${method} ${url} ${statusCode} ${responseTime}ms`);
    } else if (statusCode >= 400) {
      logger.warn('响应', `${method} ${url} ${statusCode} ${responseTime}ms`);
    } else {
      logger.info('响应', `${method} ${url} ${statusCode} ${responseTime}ms`);
    }
  });
  
  next();
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  logger.error('全局错误', `未捕获的错误: ${err.message}`);
  logger.error('全局错误', `错误堆栈: ${err.stack}`);
  
  // 检查响应是否已经发送
  if (res.headersSent) {
    return next(err);
  }
  
  // 统一错误响应格式
  res.status(500).json({
    success: false,
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 导入模块化路由
const videoRoutes = require('./routes/video');
const documentRoutes = require('./routes/document');
const searchRoutes = require('./routes/search');
const proxyRoutes = require('./routes/proxy');
const signatureRoutes = require('./routes/signature');
const ocrRoutes = require('./routes/ocr');
const translationRoutes = require('./routes/translation');
const performanceRoutes = require('./routes/performance');

// 引入临时文件清理工具
const { startTempCleanupTask } = require('./utils/tempCleanup');

// 注册路由
app.use('/api/performance', performanceRoutes);
app.use('/api', videoRoutes);
app.use('/api', documentRoutes);
app.use('/api', searchRoutes);
app.use('/api', proxyRoutes);
app.use('/api', signatureRoutes);
app.use('/api', ocrRoutes);
app.use('/api', translationRoutes);

// 健康检查API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 可视化数据API
app.post("/api/visualization", (req, res) => {
  try {
    setTimeout(() => {
      const chartData = {
        categories: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
        values: [120, 200, 150, 80, 70, 110, 130],
      };
      res.json(chartData);
    }, 1000);
  } catch (error) {
    console.error("数据处理失败:", error);
    res.status(500).json({ error: "数据处理失败" });
  }
});

// 处理404
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log('模块化路由已加载完成');
  console.log('所有服务模块已独立运行');
  
  // 启动临时文件清理任务
  startTempCleanupTask();
});