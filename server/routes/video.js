const express = require('express');
const path = require('path');
const fs = require('fs');

// 引入公共工具
const { 
  setCache, 
  getCache, 
  startCacheCleanupTask, 
  runPythonScript, 
  createTaskQueue, 
  generateFileHash 
} = require('../utils/common');

// 引入日志工具
const logger = require('../utils/logger');

// 引入性能监控工具
const performance = require('../utils/performance');

const router = express.Router();

// 启动缓存清理任务
startCacheCleanupTask();

// 创建任务队列
const downloadQueue = createTaskQueue();

// Python 路径
const PYTHON_PATH = "C:\\Users\\dmy53\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";
const VIDEO_EXTRACT_SCRIPT = path.join(__dirname, '..', 'video_extract.py');



// 视频提取API - 使用 yt-dlp 进行真实提取
router.post("/extract", async (req, res) => {
  const tracker = performance.createPerformanceTracker('videoExtraction');
  
  try {
    if (!req.body.videoUrl) {
      tracker.end({ success: false, error: '请输入视频链接' });
      return res.status(400).json({ error: "请输入视频链接" });
    }
    
    const videoUrl = req.body.videoUrl;
    const cacheKey = `video_${videoUrl}`;
    
    // 检查缓存
    const cachedInfo = getCache('parsedData', cacheKey);
    if (cachedInfo) {
      logger.info('视频模块', `从缓存获取视频信息: ${cachedInfo.title}`);
      tracker.end({ success: true, fromCache: true });
      return res.json(cachedInfo);
    }
    
    logger.info('视频模块', `开始提取视频: ${videoUrl}`);
    
    // 使用 Python 脚本提取视频信息
    const result = await runPythonScript(PYTHON_PATH, VIDEO_EXTRACT_SCRIPT, [videoUrl], 60000, '视频模块');
    
    // 解析 Python 脚本的输出
    let videoInfo;
    try {
      videoInfo = JSON.parse(result.stdout);
    } catch (parseError) {
      logger.error('视频模块', '解析视频信息失败', parseError);
      logger.error('视频模块', `Python 输出: ${result.stdout}`);
      tracker.end({ success: false, error: '解析视频信息失败' });
      return res.status(500).json({ error: "视频提取失败: 无法解析返回数据" });
    }
    
    // 检查是否有错误
    if (videoInfo.error) {
      logger.error('视频模块', `视频提取错误: ${videoInfo.error}`);
      // 如果有 supported: false 标记，说明是友好提示，返回 200 状态码
      if (videoInfo.supported == false) {
        tracker.end({ success: false, error: videoInfo.error, friendly: true });
        return res.json(videoInfo);
      }
      // 其他错误返回 500
      tracker.end({ success: false, error: videoInfo.error });
      return res.status(500).json({ error: videoInfo.error });
    }
    
    // 缓存视频信息
    setCache('parsedData', cacheKey, videoInfo);
    logger.info('视频模块', `视频提取成功: ${videoInfo.title} (已缓存)`);
    tracker.end({ success: true, title: videoInfo.title });
    return res.json(videoInfo);
    
  } catch (error) {
    logger.error('视频模块', '视频提取失败', error);
    tracker.end({ success: false, error: error.message });
    res.status(500).json({ error: "视频提取失败: " + error.message });
  }
});

// 视频下载API - 优化版（使用任务队列）
router.post("/download-video", async (req, res) => {
  const tracker = performance.createPerformanceTracker('videoDownload');
  
  const { videoUrl, quality, format } = req.body;

  if (!videoUrl) {
    tracker.end({ success: false, error: '请输入视频链接' });
    return res.status(400).json({ error: "请输入视频链接" });
  }

  // 生成缓存键
  const cacheKey = `video_download_${generateFileHash(Buffer.from(`${videoUrl}_${quality || 'best'}_${format || 'mp4'}`))}`;

  // 检查缓存
  const cachedData = getCache('fileHash', cacheKey);
  if (cachedData) {
    logger.info('视频下载', `从缓存获取下载结果: ${cachedData.title}`);
    
    // 设置响应头
    const outputFormat = format || 'mp4';
    const contentType = outputFormat === 'mp4' ? 'video/mp4' : 'video/quicktime';
    const fileName = `${encodeURIComponent(cachedData.title || 'video')}.${outputFormat}`;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', cachedData.buffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.send(cachedData.buffer);
    tracker.end({ success: true, fromCache: true, fileSize: cachedData.buffer.length });
    logger.info('视频下载', `缓存下载完成: ${fileName}, 大小: ${cachedData.buffer.length} bytes`);
    return;
  }

  // 创建下载任务
  const downloadTask = async () => {
    let tempFilePath = null;
    
    try {
      logger.info('视频下载', `开始处理: ${videoUrl}`);

      // 使用 Python 脚本下载视频
      logger.debug('视频下载', `执行Python脚本: ${PYTHON_PATH} ${VIDEO_EXTRACT_SCRIPT} download ${videoUrl} ${quality || 'best'} ${format || 'mp4'}`);
      const result = await runPythonScript(PYTHON_PATH, VIDEO_EXTRACT_SCRIPT, ['download', videoUrl, quality || 'best', format || 'mp4'], 120000, '视频下载');

      logger.debug('视频下载', 'Python脚本执行完成');
      logger.debug('视频下载', `Python标准输出: ${result.stdout}`);
      logger.debug('视频下载', `Python标准错误: ${result.stderr}`);

      // 解析下载结果
      let downloadResult;
      try {
        downloadResult = JSON.parse(result.stdout);
      } catch (parseError) {
        logger.error('视频下载', '解析结果失败', parseError);
        logger.error('视频下载', `Python 输出: ${result.stdout}`);
        logger.error('视频下载', `Python 错误输出: ${result.stderr}`);
        tracker.end({ success: false, error: '解析结果失败' });
        return res.status(500).json({ error: "视频下载失败: 无法解析返回数据" });
      }

      logger.debug('视频下载', `解析结果: ${JSON.stringify(downloadResult)}`);

      if (downloadResult.error) {
        logger.error('视频下载', `Python错误: ${downloadResult.error}`);
        tracker.end({ success: false, error: downloadResult.error });
        return res.status(500).json({ error: downloadResult.error });
      }

      // 检查文件是否存在
      tempFilePath = downloadResult.filepath;
      logger.info('视频下载', `Python返回路径: ${tempFilePath}`);
      
      if (!tempFilePath || !fs.existsSync(tempFilePath)) {
        logger.error('视频下载', `文件不存在: ${tempFilePath}`);
        tracker.end({ success: false, error: '文件不存在' });
        return res.status(500).json({ error: "视频文件下载失败，文件不存在" });
      }

      const stats = fs.statSync(tempFilePath);
      logger.info('视频下载', `文件大小: ${stats.size} 字节`);

      // 检查文件大小是否合理
      if (stats.size < 1024) {
        logger.error('视频下载', `文件大小异常: ${stats.size} 字节`);
        // 清理异常文件
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          logger.error('视频下载', '清理异常文件失败', e);
        }
        tracker.end({ success: false, error: '文件大小异常' });
        return res.status(500).json({ error: "视频文件下载失败，文件大小异常" });
      }

      // 读取文件内容（用于缓存）
      const fileBuffer = fs.readFileSync(tempFilePath);

      // 缓存下载结果
      setCache('fileHash', cacheKey, {
        buffer: fileBuffer,
        title: downloadResult.title,
        timestamp: Date.now()
      });

      // 设置响应头
      const outputFormat = format || 'mp4';
      const contentType = outputFormat === 'mp4' ? 'video/mp4' : 'video/quicktime';
      const fileName = `${encodeURIComponent(downloadResult.title || 'video')}.${outputFormat}`;
      
      // 确保响应头正确设置
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      logger.info('视频下载', '开始传输文件...');
      logger.debug('视频下载', '响应头设置完成');
      
      // 创建文件流并传输
      const fileStream = fs.createReadStream(tempFilePath, {
        highWaterMark: 64 * 1024, // 64KB 缓冲区
        flags: 'r',
        encoding: null
      });
      
      let bytesTransferred = 0;
      
      fileStream.on('data', (chunk) => {
        bytesTransferred += chunk.length;
        if (bytesTransferred % (1024 * 1024) === 0) { // 每传输1MB记录一次
          logger.debug('视频下载', `已传输: ${(bytesTransferred / (1024 * 1024)).toFixed(2)} MB`);
        }
      });
      
      fileStream.on('error', (err) => {
        logger.error('视频下载', '文件流错误', err);
        if (!res.headersSent) {
          res.status(500).json({ error: "文件传输失败" });
        }
        // 清理文件
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (e) {
          logger.error('视频下载', '清理文件失败', e);
        }
      });
      
      fileStream.on('end', () => {
        logger.info('视频下载', `文件流读取完成，总传输: ${(bytesTransferred / (1024 * 1024)).toFixed(2)} MB`);
      });
      
      fileStream.on('close', () => {
        logger.info('视频下载', '文件流传输完成');
        // 删除临时文件
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            logger.info('视频下载', `临时文件已删除: ${tempFilePath}`);
          }
        } catch (err) {
          logger.error('视频下载', '删除临时文件失败', err);
        }
      });
      
      res.on('finish', () => {
        logger.info('视频下载', 'HTTP响应完成');
        tracker.end({ success: true, fileSize: bytesTransferred });
      });
      
      res.on('error', (err) => {
        logger.error('视频下载', 'HTTP响应错误', err);
        tracker.end({ success: false, error: err.message });
        // 清理文件
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (e) {
          logger.error('视频下载', '清理文件失败', e);
        }
      });
      
      // 直接使用管道传输，确保数据完整
      fileStream.pipe(res, { end: true });
      logger.debug('视频下载', '文件流已管道到响应');

    } catch (error) {
      logger.error('视频下载', '处理失败', error);
      tracker.end({ success: false, error: error.message });
      // 清理临时文件
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          logger.error('视频下载', '清理临时文件失败', e);
        }
      }
      if (!res.headersSent) {
        res.status(500).json({ error: "视频下载失败: " + error.message });
      }
    }
  };

  // 添加到任务队列
  downloadQueue.addTask(downloadTask);
});

module.exports = router;