const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 引入公共工具
const { 
  setCache, 
  getCache, 
  startCacheCleanupTask, 
  getProcessingStrategy, 
  generateFileHash, 
  runPythonScript, 
  createTaskQueue 
} = require('../utils/common');

// 引入日志工具
const logger = require('../utils/logger');

// 引入性能监控工具
const performance = require('../utils/performance');

const router = express.Router();

// 配置文件上传（使用磁盘存储）
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const safeName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_");
    cb(null, safeName + "-" + uniqueSuffix + ext);
  },
});

// 使用固定的磁盘存储
const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 最大50MB
  }
});

// Python 路径
const PYTHON_PATH = "C:\\Users\\dmy53\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";
const PDF2WORD_SCRIPT = path.join(__dirname, '..', 'convert.py');

// 创建任务队列
const conversionQueue = createTaskQueue();

// 启动缓存清理任务
startCacheCleanupTask();









// PDF转Word - 使用 Python pdf2docx 库
async function convertPdfToWord(pdfPath) {
  const tracker = performance.createPerformanceTracker('documentConversion', { type: 'pdf2word' });
  
  try {
    logger.info('Document', '使用 Python pdf2docx 转换 PDF 到 Word...');
    logger.info('Document', '输入文件:', pdfPath);
    
    // 获取文件大小
    const fileStats = fs.statSync(pdfPath);
    const fileSize = fileStats.size;
    logger.info('Document', '文件大小:', (fileSize / 1024 / 1024).toFixed(2), 'MB');
    
    // 获取处理策略
    const strategy = getProcessingStrategy(fileSize);
    logger.info('Document', '处理策略:', strategy);
    
    const tempDir = path.dirname(pdfPath);
    const outputFileName = "output_" + Date.now() + ".docx";
    const outputPath = path.join(tempDir, outputFileName);
    
    // 调用 Python 脚本进行转换，为PDF转Word增加更长的超时时间
    const pdf2wordTimeout = strategy.timeout * 2; // PDF转Word需要更长时间
    const result = await runPythonScript(PYTHON_PATH, PDF2WORD_SCRIPT, ["pdf2word", pdfPath, outputPath], pdf2wordTimeout, 'Document');
    
    // 解析 Python 脚本的输出
    let conversionResult;
    try {
      // 提取 stdout 的最后一行作为 JSON 解析的输入
      const lines = result.stdout.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      conversionResult = JSON.parse(lastLine);
    } catch (parseError) {
      logger.error('Document', '解析转换结果失败:', parseError);
      logger.error('Document', 'Python 输出:', result.stdout);
      tracker.end({ success: false, error: '解析转换结果失败' });
      throw new Error("解析转换结果失败");
    }
    
    if (conversionResult.error) {
      tracker.end({ success: false, error: conversionResult.error });
      throw new Error(conversionResult.error);
    }
    
    // 读取转换后的文件
    const buffer = fs.readFileSync(outputPath);
    
    // 删除临时文件
    try {
      fs.unlinkSync(outputPath);
    } catch (e) {
      logger.warn('Document', '删除临时文件失败:', e.message);
    }
    
    logger.info('Document', 'Python 转换成功，文件大小:', buffer.length);
    tracker.end({ success: true, fileSize: buffer.length });
    return buffer;
    
  } catch (error) {
    logger.error('Document', 'Python 转换失败:', error);
    tracker.end({ success: false, error: error.message });
    throw error;
  }
}

// Word转PDF - 使用 Python docx2pdf 库
async function convertWordToPdf(docxPath) {
  const tracker = performance.createPerformanceTracker('documentConversion', { type: 'word2pdf' });
  
  try {
    logger.info('Document', '使用 Python docx2pdf 转换 Word 到 PDF...');
    logger.info('Document', '输入文件:', docxPath);
    
    // 获取文件大小
    const fileStats = fs.statSync(docxPath);
    const fileSize = fileStats.size;
    logger.info('Document', '文件大小:', (fileSize / 1024 / 1024).toFixed(2), 'MB');
    
    // 获取处理策略
    const strategy = getProcessingStrategy(fileSize);
    logger.info('Document', '处理策略:', strategy);
    
    const tempDir = path.dirname(docxPath);
    const outputFileName = "output_" + Date.now() + ".pdf";
    const outputPath = path.join(tempDir, outputFileName);
    
    // 调用 Python 脚本进行转换，使用动态超时
    const result = await runPythonScript(PYTHON_PATH, PDF2WORD_SCRIPT, ["word2pdf", docxPath, outputPath], strategy.timeout, 'Document');
    
    // 解析 Python 脚本的输出
    let conversionResult;
    try {
      // 提取 stdout 的最后一行作为 JSON 解析的输入
      const lines = result.stdout.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      conversionResult = JSON.parse(lastLine);
    } catch (parseError) {
      logger.error('Document', '解析转换结果失败:', parseError);
      logger.error('Document', 'Python 输出:', result.stdout);
      tracker.end({ success: false, error: '解析转换结果失败' });
      throw new Error("解析转换结果失败");
    }
    
    if (conversionResult.error) {
      tracker.end({ success: false, error: conversionResult.error });
      throw new Error(conversionResult.error);
    }
    
    // 读取转换后的文件
    const buffer = fs.readFileSync(outputPath);
    
    // 删除临时文件
    try {
      fs.unlinkSync(outputPath);
    } catch (e) {
      logger.warn('Document', '删除临时文件失败:', e.message);
    }
    
    logger.info('Document', 'Python 转换成功，文件大小:', buffer.length);
    tracker.end({ success: true, fileSize: buffer.length });
    return buffer;
    
  } catch (error) {
    logger.error('Document', 'Python 转换失败:', error);
    tracker.end({ success: false, error: error.message });
    throw error;
  }
}

// 文档转换API
router.post("/document", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "请选择文件" });
    }
    
    const conversionType = req.body.conversionType;
    const originalName = req.file.originalname;
    
    logger.info('Document', `开始转换: ${originalName}, 类型: ${conversionType}`);
    
    // 生成文件哈希值用于缓存
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = generateFileHash(fileBuffer);
    const cacheKey = `${conversionType}_${fileHash}`;
    
    // 检查缓存
    const cachedData = getCache('fileHash', cacheKey);
    if (cachedData) {
      logger.info('Document', `从缓存获取转换结果，缓存键: ${cacheKey}`);
      
      let outputFilename;
      let contentType;
      
      if (conversionType === "pdf2word") {
        const baseName = originalName.replace(/\.pdf$/i, "");
        outputFilename = baseName + "-converted.docx";
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else if (conversionType === "word2pdf") {
        const baseName = originalName.replace(/\.(doc|docx)$/i, "");
        outputFilename = baseName + "-converted.pdf";
        contentType = "application/pdf";
      } else {
        return res.status(400).json({ error: "不支持的转换类型" });
      }
      
      // 设置响应头
      res.setHeader("Content-Type", contentType);
      const encodedFilename = encodeURIComponent(outputFilename);
      res.setHeader("Content-Disposition", `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
      res.setHeader("Content-Length", cachedData.buffer.length);
      
      // 删除临时文件
      if (req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          logger.warn('Document', '删除临时文件失败:', e.message);
        }
      }
      
      res.send(cachedData.buffer);
      logger.info('Document', `缓存转换完成: ${outputFilename}, 大小: ${cachedData.buffer.length} bytes`);
      return;
    }
    
    // 创建转换任务
    const conversionTask = async () => {
      try {
        let outputBuffer;
        let outputFilename;
        let contentType;
        
        // 使用磁盘存储的文件路径
        const filePath = req.file.path;
        
        if (conversionType === "pdf2word") {
          outputBuffer = await convertPdfToWord(filePath);
          const baseName = originalName.replace(/\.pdf$/i, "");
          outputFilename = baseName + "-converted.docx";
          contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (conversionType === "word2pdf") {
          outputBuffer = await convertWordToPdf(filePath);
          const baseName = originalName.replace(/\.(doc|docx)$/i, "");
          outputFilename = baseName + "-converted.pdf";
          contentType = "application/pdf";
        } else {
          return res.status(400).json({ error: "不支持的转换类型" });
        }
        
        // 缓存转换结果
        setCache('fileHash', cacheKey, {
          buffer: outputBuffer,
          timestamp: Date.now()
        });
        
        // 删除临时文件
        if (filePath && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            logger.warn('Document', '删除临时文件失败:', e.message);
          }
        }
        
        // 设置响应头
        res.setHeader("Content-Type", contentType);
        const encodedFilename = encodeURIComponent(outputFilename);
        res.setHeader("Content-Disposition", `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
        res.setHeader("Content-Length", outputBuffer.length);
        
        res.send(outputBuffer);
        
        logger.info('Document', `转换完成: ${outputFilename}, 大小: ${outputBuffer.length} bytes`);
        
      } catch (error) {
        logger.error('Document', '文档转换失败:', error);
        if (req.file.path && fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {
            logger.warn('Document', '删除临时文件失败:', e.message);
          }
        }
        res.status(500).json({ error: "文档转换失败: " + error.message });
      }
    };
    
    // 添加到任务队列
    conversionQueue.addTask(conversionTask);
    
  } catch (error) {
    logger.error('Document', '文档转换失败:', error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        logger.warn('Document', '删除临时文件失败:', e.message);
      }
    }
    res.status(500).json({ error: "文档转换失败: " + error.message });
  }
});

module.exports = router;