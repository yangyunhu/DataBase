const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { createHash } = require('crypto');

const router = express.Router();

// 缓存机制
const ocrCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时过期

// 清理过期缓存
function clearExpiredCache() {
  const now = Date.now();
  for (const [key, item] of ocrCache) {
    if (now - item.timestamp > CACHE_EXPIRY) {
      ocrCache.delete(key);
    }
  }
}

// 定期清理过期缓存（每小时清理一次）
setInterval(clearExpiredCache, 60 * 60 * 1000);

// 生成文件哈希值
function generateFileHash(buffer) {
  return createHash('md5').update(buffer).digest('hex');
}

// 配置文件上传
const storage = multer.diskStorage({
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

const upload = multer({ storage: storage });

// Python 路径
const PYTHON_PATH = "C:\\Users\\dmy53\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";
const OCR_SCRIPT = path.join(__dirname, '..', 'ocr_extract.py');

// 执行 Python 脚本的函数（OCR模块专用）
function runOcrPythonScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const fullArgs = [scriptPath, ...args];
    
    // 减少日志输出，只在错误时输出
    const child = spawn(PYTHON_PATH, fullArgs, {
      windowsHide: true,
    });
    
    let stdout = "";
    let stderr = "";
    
    // 设置子进程的编码
    child.stdout.on("data", (data) => {
      try {
        stdout += data.toString('utf-8');
      } catch (e) {
        console.error("[OCR模块] 编码转换错误:", e);
        // 尝试使用其他编码
        stdout += data.toString('latin1');
      }
    });
    
    child.stderr.on("data", (data) => {
      try {
        stderr += data.toString('utf-8');
        // 只打印关键错误信息
        if (data.toString('utf-8').includes('ERROR') || data.toString('utf-8').includes('error')) {
          console.error("[OCR模块] Python 错误:", data.toString('utf-8'));
        }
      } catch (e) {
        console.error("[OCR模块] 编码转换错误:", e);
        // 尝试使用其他编码
        stderr += data.toString('latin1');
      }
    });
    
    // 设置超时（60秒）
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("[OCR模块] Python 执行超时（60秒）"));
    }, 60000);
    
    child.on("close", (code) => {
      clearTimeout(timeout);
      
      // 只在失败时输出详细信息
      if (code !== 0) {
        console.error("[OCR模块] Python 退出码:", code);
        console.error("[OCR模块] Python 错误输出:", stderr);
      }
      
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`[OCR模块] Python 退出码 ${code}: ${stderr || stdout}`));
      }
    });
    
    child.on("error", (err) => {
      clearTimeout(timeout);
      console.error("[OCR模块] Python 进程错误:", err);
      reject(err);
    });
  });
}

// OCR文字提取API
router.post("/ocr", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "请选择图片文件" });
    }
    
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    
    // 生成文件哈希值用于缓存
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = generateFileHash(fileBuffer);
    const cacheKey = fileHash;
    
    // 检查缓存
    const cachedResult = ocrCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_EXPIRY) {
      console.log(`[OCR模块] 从缓存获取OCR结果: ${originalName}`);
      
      // 删除临时文件
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.log("[OCR模块] 删除临时文件失败:", e.message);
      }
      
      return res.json(cachedResult.ocrResult);
    }
    
    console.log(`[OCR模块] 开始OCR提取: ${originalName}`);
    
    // 执行Python OCR脚本
    let result;
    let ocrResult;
    try {
      result = await runOcrPythonScript(OCR_SCRIPT, [filePath]);
      
      // 解析OCR结果
      // 提取stdout的最后一行作为JSON解析的输入
      const lines = result.stdout.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      // 确保使用UTF-8编码解析
      ocrResult = JSON.parse(lastLine);
    } catch (parseError) {
      console.error("[OCR模块] 解析OCR结果失败:", parseError);
      if (result) {
        console.error("[OCR模块] Python 输出:", result.stdout);
      }
      // 返回友好错误信息，避免编码错误
      return res.status(500).json({ error: "OCR提取失败: 无法解析返回数据" });
    }
    
    // 清理临时文件
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.log("[OCR模块] 清理临时文件失败:", e.message);
    }
    
    if (ocrResult.error) {
      return res.status(500).json({ error: ocrResult.error });
    }
    
    // 缓存OCR结果
    ocrCache.set(cacheKey, {
      ocrResult,
      timestamp: Date.now()
    });
    
    // 设置响应头为UTF-8
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    console.log(`[OCR模块] OCR提取成功: 识别到 ${ocrResult.text.length} 个字符 (已缓存)`);
    return res.json(ocrResult);
    
  } catch (error) {
    console.error("[OCR模块] OCR提取失败:", error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.log("[OCR模块] 清理临时文件失败:", e.message);
      }
    }
    // 设置响应头为UTF-8
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(500).json({ error: "OCR提取失败: " + error.message });
  }
});

module.exports = router;