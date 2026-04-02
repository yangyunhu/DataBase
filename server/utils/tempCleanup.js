const fs = require('fs');
const path = require('path');

// 临时文件目录
const TEMP_DIR = path.join(__dirname, '..', 'temp');

// 临时文件过期时间（毫秒）
const TEMP_FILE_EXPIRY = 2 * 60 * 60 * 1000; // 2小时

/**
 * 清理过期的临时文件
 */
function cleanupTempFiles() {
  try {
    // 检查临时目录是否存在
    if (!fs.existsSync(TEMP_DIR)) {
      console.log('[临时文件清理] 临时目录不存在，跳过清理');
      return;
    }

    const now = Date.now();
    let cleanedCount = 0;
    let totalCount = 0;

    // 读取临时目录中的所有文件
    const files = fs.readdirSync(TEMP_DIR);
    totalCount = files.length;

    // 遍历文件，清理过期文件
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      
      try {
        // 获取文件状态
        const stats = fs.statSync(filePath);
        
        // 检查文件是否过期
        if (now - stats.mtimeMs > TEMP_FILE_EXPIRY) {
          // 删除过期文件
          fs.unlinkSync(filePath);
          cleanedCount++;
          console.log(`[临时文件清理] 删除过期文件: ${file}`);
        }
      } catch (error) {
        console.error(`[临时文件清理] 处理文件 ${file} 时出错:`, error.message);
      }
    }

    console.log(`[临时文件清理] 完成，共检查 ${totalCount} 个文件，清理 ${cleanedCount} 个过期文件`);
  } catch (error) {
    console.error('[临时文件清理] 清理过程出错:', error);
  }
}

/**
 * 启动临时文件清理任务
 * @param {number} interval - 清理间隔（毫秒），默认30分钟
 */
function startTempCleanupTask(interval = 30 * 60 * 1000) {
  // 立即执行一次清理
  cleanupTempFiles();
  
  // 定期执行清理
  setInterval(cleanupTempFiles, interval);
  console.log(`[临时文件清理] 启动定期清理任务，间隔 ${interval / 1000 / 60} 分钟`);
}

module.exports = {
  cleanupTempFiles,
  startTempCleanupTask
};
