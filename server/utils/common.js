const { spawn } = require('child_process');
const { createHash } = require('crypto');
const os = require('os');
const logger = require('./logger');
const { executeWithPool } = require('./pythonPool');

// 进程池配置（根据CPU核心数动态设置）
const cpuCount = os.cpus().length;
const MAX_CONCURRENT_TASKS = Math.max(3, cpuCount - 1); // 动态设置最大并发任务数

// 缓存机制
const cache = {
  fileHash: new Map(),      // 文件哈希缓存
  parsedData: new Map(),     // 解析结果缓存
  fontCache: new Map(),      // 字体缓存
  templateCache: new Map()    // 模板缓存
};
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时过期

/**
 * 设置缓存
 * @param {string} cacheType - 缓存类型
 * @param {string} key - 缓存键
 * @param {*} value - 缓存值
 */
function setCache(cacheType, key, value) {
  if (!cache[cacheType]) return;
  cache[cacheType].set(key, {
    value,
    timestamp: Date.now()
  });
}

/**
 * 获取缓存
 * @param {string} cacheType - 缓存类型
 * @param {string} key - 缓存键
 * @returns {*} 缓存值或null
 */
function getCache(cacheType, key) {
  if (!cache[cacheType]) return null;
  const item = cache[cacheType].get(key);
  if (!item) return null;
  
  // 检查是否过期
  if (Date.now() - item.timestamp > CACHE_EXPIRY) {
    cache[cacheType].delete(key);
    return null;
  }
  
  return item.value;
}

/**
 * 清理过期缓存
 */
function clearExpiredCache() {
  const now = Date.now();
  for (const cacheType in cache) {
    for (const [key, item] of cache[cacheType]) {
      if (now - item.timestamp > CACHE_EXPIRY) {
        cache[cacheType].delete(key);
      }
    }
  }
}

/**
 * 定期清理过期缓存
 * @param {number} interval - 清理间隔（毫秒），默认1小时
 */
function startCacheCleanupTask(interval = 60 * 60 * 1000) {
  setInterval(clearExpiredCache, interval);
  logger.info('Cache', `启动定期清理任务，间隔 ${interval / 1000 / 60} 分钟`);
}

// 文件大小分类
const EXTRA_SMALL_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const SMALL_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MEDIUM_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const LARGE_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * 根据文件大小获取处理策略
 * @param {number} fileSize - 文件大小（字节）
 * @returns {object} 处理策略
 */
function getProcessingStrategy(fileSize) {
  if (fileSize < EXTRA_SMALL_FILE_SIZE) {
    return { priority: 'high', timeout: 30000 }; // 超小文件30秒超时
  } else if (fileSize < SMALL_FILE_SIZE) {
    return { priority: 'high', timeout: 60000 }; // 小文件60秒超时
  } else if (fileSize < MEDIUM_FILE_SIZE) {
    return { priority: 'medium', timeout: 120000 }; // 中等文件120秒超时
  } else if (fileSize < LARGE_FILE_SIZE) {
    return { priority: 'low', timeout: 180000 }; // 大文件180秒超时
  } else {
    return { priority: 'low', timeout: 300000 }; // 超大文件300秒超时
  }
}

/**
 * 生成文件哈希值用于缓存
 * @param {Buffer} buffer - 文件缓冲区
 * @returns {string} 哈希值
 */
function generateFileHash(buffer) {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * 执行 Python 脚本
 * @param {string} pythonPath - Python 路径
 * @param {string} scriptPath - 脚本路径
 * @param {array} args - 脚本参数
 * @param {number} timeoutMs - 超时时间（毫秒）
 * @param {string} moduleName - 模块名称
 * @param {boolean} usePool - 是否使用进程池
 * @returns {Promise} 执行结果
 */
function runPythonScript(pythonPath, scriptPath, args, timeoutMs = 60000, moduleName = 'Common', usePool = false) {
  if (usePool) {
    return executeWithPool(pythonPath, scriptPath, args, timeoutMs, moduleName);
  }
  
  return new Promise((resolve, reject) => {
    const fullArgs = [scriptPath, ...args];
    
    // 减少日志输出，只在错误时输出详细信息
    const child = spawn(pythonPath, fullArgs, {
      windowsHide: true,
      // 增加缓冲区大小，避免大文件输出时阻塞
      maxBuffer: 1024 * 1024 * 100, // 100MB
    });
    
    let stdout = "";
    let stderr = "";
    
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on("data", (data) => {
      const dataStr = data.toString();
      stderr += dataStr;
      // 只打印关键错误信息，减少日志输出
      if (dataStr.includes('ERROR') || dataStr.includes('error')) {
        logger.error(moduleName, `Python 错误: ${dataStr}`);
      }
    });
    
    // 设置动态超时
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`${moduleName} Python 执行超时（${timeoutMs / 1000}秒）`));
    }, timeoutMs);
    
    child.on("close", (code) => {
      clearTimeout(timeout);
      
      // 只在失败时输出详细信息
      if (code !== 0) {
        logger.error(moduleName, `Python 退出码: ${code}`);
        logger.error(moduleName, `Python 错误输出: ${stderr}`);
      }
      
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${moduleName} Python 退出码 ${code}: ${stderr || stdout}`));
      }
    });
    
    child.on("error", (err) => {
      clearTimeout(timeout);
      logger.error(moduleName, 'Python 进程错误', err);
      reject(err);
    });
  });
}

/**
 * 创建任务队列处理器
 * @param {number} maxConcurrent - 最大并发数
 * @returns {object} 队列处理器
 */
function createTaskQueue(maxConcurrent = MAX_CONCURRENT_TASKS) {
  let activeTasks = 0;
  const taskQueue = [];

  function processQueue() {
    if (activeTasks < maxConcurrent && taskQueue.length > 0) {
      const task = taskQueue.shift();
      activeTasks++;
      
      task()
        .finally(() => {
          activeTasks--;
          processQueue();
        });
    }
  }

  function addTask(task) {
    taskQueue.push(task);
    processQueue();
  }

  return {
    addTask,
    getQueueLength: () => taskQueue.length,
    getActiveTasks: () => activeTasks
  };
}

module.exports = {
  setCache,
  getCache,
  clearExpiredCache,
  startCacheCleanupTask,
  getProcessingStrategy,
  generateFileHash,
  runPythonScript,
  createTaskQueue,
  MAX_CONCURRENT_TASKS
};
