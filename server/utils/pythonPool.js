const { spawn } = require('child_process');
const logger = require('./logger');
const performance = require('./performance');

class PythonProcessPool {
  constructor(pythonPath, maxProcesses = 3) {
    this.pythonPath = pythonPath;
    this.maxProcesses = maxProcesses;
    this.processes = [];
    this.availableProcesses = [];
    this.requestQueue = [];
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    logger.info('Python进程池', `初始化进程池，最大进程数: ${this.maxProcesses}`);
    
    for (let i = 0; i < this.maxProcesses; i++) {
      await this.createProcess(i);
    }
    
    this.isInitialized = true;
    logger.info('Python进程池', '进程池初始化完成');
  }

  async createProcess(id) {
    return new Promise((resolve, reject) => {
      const child = spawn(this.pythonPath, ['-u', '-c', `
import sys
import json
import traceback

def execute_task():
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            task = json.loads(line.strip())
            script_path = task['script']
            args = task['args']
            
            # 动态导入并执行脚本
            import importlib.util
            spec = importlib.util.spec_from_file_location("script", script_path)
            script = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(script)
            
            # 调用脚本的main函数
            result = script.main(*args)
            
            # 输出结果
            print(json.dumps({'success': True, 'result': result}))
            sys.stdout.flush()
            
        except Exception as e:
            error_info = {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }
            print(json.dumps(error_info))
            sys.stdout.flush()

if __name__ == '__main__':
    execute_task()
      `], {
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 100
      });

      const process = {
        id,
        child,
        isBusy: false,
        currentTask: null,
        resolve: null,
        reject: null
      };

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        
        // 尝试解析输出
        try {
          const lines = stdout.split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const result = JSON.parse(line);
              if (process.resolve) {
                if (result.success) {
                  process.resolve(result.result);
                } else {
                  process.reject(new Error(result.error));
                }
                process.resolve = null;
                process.reject = null;
                process.isBusy = false;
                this.releaseProcess(process);
              }
            } catch (e) {
              // 不是JSON，继续累积
            }
          }
        } catch (e) {
          // 解析失败，继续累积
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        if (stderr.includes('ERROR') || stderr.includes('error')) {
          logger.error('Python进程池', `进程${id}错误: ${data.toString()}`);
        }
      });

      child.on('error', (err) => {
        logger.error('Python进程池', `进程${id}启动失败:`, err);
        if (process.reject) {
          process.reject(err);
          process.resolve = null;
          process.reject = null;
          process.isBusy = false;
        }
      });

      child.on('close', (code) => {
        logger.warn('Python进程池', `进程${id}关闭，退出码: ${code}`);
        if (process.reject && !process.resolve) {
          process.reject(new Error(`Python进程意外关闭，退出码: ${code}`));
          process.reject = null;
        }
        process.isBusy = false;
        this.removeProcess(process);
      });

      this.processes.push(process);
      this.availableProcesses.push(process);
      
      // 等待进程启动完成
      setTimeout(() => {
        resolve(process);
      }, 1000);
    });
  }

  getAvailableProcess() {
    return this.availableProcesses.length > 0 ? this.availableProcesses.shift() : null;
  }

  releaseProcess(process) {
    process.isBusy = false;
    process.currentTask = null;
    this.availableProcesses.push(process);
    this.processRequestQueue();
  }

  removeProcess(process) {
    const index = this.processes.indexOf(process);
    if (index > -1) {
      this.processes.splice(index, 1);
    }
    
    const availableIndex = this.availableProcesses.indexOf(process);
    if (availableIndex > -1) {
      this.availableProcesses.splice(availableIndex, 1);
    }
    
    // 自动重新创建进程
    if (this.processes.length < this.maxProcesses) {
      this.createProcess(process.id);
    }
  }

  async executeScript(scriptPath, args, timeoutMs = 60000, moduleName = 'Python进程池') {
    const tracker = performance.createPerformanceTracker('pythonExecution', { script: scriptPath, args });
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const task = {
        scriptPath,
        args,
        timeoutMs,
        moduleName,
        resolve: (result) => {
          tracker.end({ success: true });
          resolve(result);
        },
        reject: (error) => {
          tracker.end({ success: false, error: error.message });
          reject(error);
        }
      };

      const process = this.getAvailableProcess();
      
      if (process) {
        this.executeWithProcess(process, task);
      } else {
        this.requestQueue.push(task);
        logger.debug('Python进程池', `任务已加入队列，队列长度: ${this.requestQueue.length}`);
      }
    });
  }

  executeWithProcess(process, task) {
    process.isBusy = true;
    process.currentTask = task;
    process.resolve = task.resolve;
    process.reject = task.reject;

    const taskData = {
      script: task.scriptPath,
      args: task.args
    };

    try {
      process.child.stdin.write(JSON.stringify(taskData) + '\n');
      
      // 设置超时
      const timeout = setTimeout(() => {
        if (process.reject) {
          process.reject(new Error(`${task.moduleName} 执行超时（${task.timeoutMs / 1000}秒）`));
          process.resolve = null;
          process.reject = null;
          process.isBusy = false;
          this.releaseProcess(process);
        }
      }, task.timeoutMs);

      // 清理超时
      const originalResolve = task.resolve;
      task.resolve = (result) => {
        clearTimeout(timeout);
        originalResolve(result);
      };

      const originalReject = task.reject;
      task.reject = (error) => {
        clearTimeout(timeout);
        originalReject(error);
      };

    } catch (error) {
      logger.error('Python进程池', '发送任务失败:', error);
      if (process.reject) {
        process.reject(error);
        process.resolve = null;
        process.reject = null;
        process.isBusy = false;
        this.releaseProcess(process);
      }
    }
  }

  processRequestQueue() {
    if (this.requestQueue.length === 0) return;

    while (this.requestQueue.length > 0) {
      const process = this.getAvailableProcess();
      if (!process) break;

      const task = this.requestQueue.shift();
      this.executeWithProcess(process, task);
    }
  }

  getStats() {
    return {
      totalProcesses: this.processes.length,
      availableProcesses: this.availableProcesses.length,
      busyProcesses: this.processes.filter(p => p.isBusy).length,
      queueLength: this.requestQueue.length
    };
  }

  async shutdown() {
    logger.info('Python进程池', '正在关闭进程池...');
    
    for (const process of this.processes) {
      try {
        process.child.kill();
      } catch (error) {
        logger.error('Python进程池', '关闭进程失败:', error);
      }
    }
    
    this.processes = [];
    this.availableProcesses = [];
    this.requestQueue = [];
    this.isInitialized = false;
    
    logger.info('Python进程池', '进程池已关闭');
  }
}

// 创建全局进程池实例
let globalPool = null;

function getPythonProcessPool(pythonPath, maxProcesses) {
  if (!globalPool) {
    globalPool = new PythonProcessPool(pythonPath, maxProcesses);
  }
  return globalPool;
}

async function executeWithPool(pythonPath, scriptPath, args, timeoutMs = 60000, moduleName = 'Python进程池') {
  const pool = getPythonProcessPool(pythonPath, 3);
  return await pool.executeScript(scriptPath, args, timeoutMs, moduleName);
}

module.exports = {
  PythonProcessPool,
  getPythonProcessPool,
  executeWithPool
};