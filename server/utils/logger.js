// 日志级别
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// 当前日志级别
let currentLogLevel = LOG_LEVELS.INFO;

/**
 * 设置日志级别
 * @param {string} level - 日志级别：debug, info, warn, error
 */
function setLogLevel(level) {
  switch (level.toLowerCase()) {
    case 'debug':
      currentLogLevel = LOG_LEVELS.DEBUG;
      break;
    case 'info':
      currentLogLevel = LOG_LEVELS.INFO;
      break;
    case 'warn':
      currentLogLevel = LOG_LEVELS.WARN;
      break;
    case 'error':
      currentLogLevel = LOG_LEVELS.ERROR;
      break;
    default:
      currentLogLevel = LOG_LEVELS.INFO;
  }
  console.log(`[Logger] 日志级别已设置为: ${level}`);
}

/**
 * 生成带时间戳的日志信息
 * @param {string} level - 日志级别
 * @param {string} module - 模块名称
 * @param {string} message - 日志消息
 * @param {Error} [error] - 错误对象（可选）
 * @returns {string} 格式化的日志信息
 */
function formatLog(level, module, message, error) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}`;
  if (error) {
    logMessage += `\n${error.stack || error.message}`;
  }
  return logMessage;
}

/**
 * 调试级别日志
 * @param {string} module - 模块名称
 * @param {string} message - 日志消息
 * @param {Error} [error] - 错误对象（可选）
 */
function debug(module, message, error) {
  if (currentLogLevel <= LOG_LEVELS.DEBUG) {
    console.log(formatLog('debug', module, message, error));
  }
}

/**
 * 信息级别日志
 * @param {string} module - 模块名称
 * @param {string} message - 日志消息
 * @param {Error} [error] - 错误对象（可选）
 */
function info(module, message, error) {
  if (currentLogLevel <= LOG_LEVELS.INFO) {
    console.log(formatLog('info', module, message, error));
  }
}

/**
 * 警告级别日志
 * @param {string} module - 模块名称
 * @param {string} message - 日志消息
 * @param {Error} [error] - 错误对象（可选）
 */
function warn(module, message, error) {
  if (currentLogLevel <= LOG_LEVELS.WARN) {
    console.warn(formatLog('warn', module, message, error));
  }
}

/**
 * 错误级别日志
 * @param {string} module - 模块名称
 * @param {string} message - 日志消息
 * @param {Error} [error] - 错误对象（可选）
 */
function error(module, message, error) {
  if (currentLogLevel <= LOG_LEVELS.ERROR) {
    console.error(formatLog('error', module, message, error));
  }
}

module.exports = {
  setLogLevel,
  debug,
  info,
  warn,
  error
};
