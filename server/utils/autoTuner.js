const logger = require('./logger');
const performance = require('./performance');
const os = require('os');

class AutoTuner {
  constructor(options = {}) {
    this.isRunning = false;
    this.tuningInterval = options.tuningInterval || 5 * 60 * 1000; // 默认5分钟
    this.checkInterval = null;
    
    // 性能阈值配置
    this.thresholds = {
      slowResponseTime: options.slowResponseTime || 5000, // 5秒
      highErrorRate: options.highErrorRate || 0.1, // 10%
      highMemoryUsage: options.highMemoryUsage || 0.8, // 80%
      highCpuUsage: options.highCpuUsage || 0.7, // 70%
      lowCacheHitRate: options.lowCacheHitRate || 0.5 // 50%
    };
    
    // 可调参数
    this.parameters = {
      maxConcurrentTasks: 3,
      cacheTTL: 24 * 60 * 60 * 1000, // 24小时
      pythonPoolSize: 3,
      queueConcurrency: 3,
      logLevel: 'info'
    };
    
    // 历史数据
    this.history = [];
    this.maxHistorySize = 100;
    
    // 调优建议
    this.recommendations = [];
  }

  // 启动自动调优
  start() {
    if (this.isRunning) {
      logger.warn('自动调优', '自动调优已经在运行');
      return;
    }

    this.isRunning = true;
    logger.info('自动调优', '启动自动调优系统');
    
    // 立即执行一次分析
    this.analyzeAndTune();
    
    // 定期执行
    this.checkInterval = setInterval(() => {
      this.analyzeAndTune();
    }, this.tuningInterval);
  }

  // 停止自动调优
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    logger.info('自动调优', '停止自动调优系统');
  }

  // 分析并调优
  async analyzeAndTune() {
    logger.info('自动调优', '开始性能分析和自动调优...');
    
    try {
      const analysis = await this.collectMetrics();
      this.history.push(analysis);
      
      // 限制历史数据大小
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }
      
      // 生成调优建议
      const recommendations = this.generateRecommendations(analysis);
      this.recommendations = recommendations;
      
      // 应用调优
      if (recommendations.length > 0) {
        await this.applyTuning(recommendations);
      }
      
      logger.info('自动调优', `分析完成，生成 ${recommendations.length} 条调优建议`);
      
    } catch (error) {
      logger.error('自动调优', '分析失败:', error.message);
    }
  }

  // 收集性能指标
  async collectMetrics() {
    const timestamp = Date.now();
    
    // 系统资源
    const systemMetrics = {
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usage: (os.totalmem() - os.freemem()) / os.totalmem()
      },
      cpu: {
        loadAvg: os.loadavg(),
        cores: os.cpus().length
      },
      uptime: os.uptime()
    };

    // 应用性能指标
    const appMetrics = {
      documentConversion: performance.getPerformanceStats('documentConversion'),
      videoExtraction: performance.getPerformanceStats('videoExtraction'),
      videoDownload: performance.getPerformanceStats('videoDownload'),
      translation: performance.getPerformanceStats('translation'),
      ocr: performance.getPerformanceStats('ocr'),
      search: performance.getPerformanceStats('search')
    };

    // 计算整体性能指标
    let totalRequests = 0;
    let totalErrors = 0;
    let totalDuration = 0;
    let slowRequests = 0;

    for (const [module, stats] of Object.entries(appMetrics)) {
      if (stats) {
        totalRequests += stats.count;
        totalErrors += stats.count * (1 - stats.successRate);
        totalDuration += stats.sum;
        
        // 统计慢请求
        const recentMetrics = performance.getRecentMetrics(module, 100);
        slowRequests += recentMetrics.filter(m => m.duration > this.thresholds.slowResponseTime).length;
      }
    }

    const avgResponseTime = totalRequests > 0 ? totalDuration / totalRequests : 0;
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    const slowRate = totalRequests > 0 ? slowRequests / totalRequests : 0;

    return {
      timestamp,
      system: systemMetrics,
      application: appMetrics,
      summary: {
        totalRequests,
        totalErrors,
        avgResponseTime,
        errorRate,
        slowRate
      }
    };
  }

  // 生成调优建议
  generateRecommendations(analysis) {
    const recommendations = [];
    const { system, summary, application } = analysis;

    // 1. 内存使用调优
    if (system.memory.usage > this.thresholds.highMemoryUsage) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        issue: `内存使用率过高: ${(system.memory.usage * 100).toFixed(1)}%`,
        action: 'reduce_cache_size',
        description: '减少缓存大小和TTL，释放内存',
        parameter: 'cacheTTL',
        suggestedValue: Math.max(1 * 60 * 60 * 1000, this.parameters.cacheTTL / 2), // 至少1小时
        currentValue: this.parameters.cacheTTL
      });
    }

    // 2. 响应时间调优
    if (summary.avgResponseTime > this.thresholds.slowResponseTime) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        issue: `平均响应时间过长: ${summary.avgResponseTime.toFixed(0)}ms`,
        action: 'increase_concurrency',
        description: '增加并发处理能力',
        parameter: 'maxConcurrentTasks',
        suggestedValue: Math.min(10, this.parameters.maxConcurrentTasks + 1),
        currentValue: this.parameters.maxConcurrentTasks
      });
    }

    // 3. 错误率调优
    if (summary.errorRate > this.thresholds.highErrorRate) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        issue: `错误率过高: ${(summary.errorRate * 100).toFixed(1)}%`,
        action: 'reduce_concurrency',
        description: '降低并发数，减少系统压力',
        parameter: 'maxConcurrentTasks',
        suggestedValue: Math.max(1, this.parameters.maxConcurrentTasks - 1),
        currentValue: this.parameters.maxConcurrentTasks
      });
    }

    // 4. CPU负载调优
    const cpuLoad = system.cpu.loadAvg[0] / system.cpu.cores;
    if (cpuLoad > this.thresholds.highCpuUsage) {
      recommendations.push({
        type: 'cpu',
        priority: 'medium',
        issue: `CPU负载过高: ${(cpuLoad * 100).toFixed(1)}%`,
        action: 'reduce_python_pool',
        description: '减少Python进程池大小',
        parameter: 'pythonPoolSize',
        suggestedValue: Math.max(1, this.parameters.pythonPoolSize - 1),
        currentValue: this.parameters.pythonPoolSize
      });
    }

    // 5. 缓存命中率调优
    let totalCacheHits = 0;
    let totalCacheRequests = 0;
    
    for (const [module, stats] of Object.entries(application)) {
      if (stats && stats.cacheHitRate !== undefined) {
        totalCacheHits += stats.cacheHitRate * stats.count;
        totalCacheRequests += stats.count;
      }
    }
    
    const overallCacheHitRate = totalCacheRequests > 0 ? totalCacheHits / totalCacheRequests : 0;
    
    if (overallCacheHitRate < this.thresholds.lowCacheHitRate && totalCacheRequests > 10) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        issue: `缓存命中率过低: ${(overallCacheHitRate * 100).toFixed(1)}%`,
        action: 'increase_cache_ttl',
        description: '增加缓存TTL，提高命中率',
        parameter: 'cacheTTL',
        suggestedValue: Math.min(7 * 24 * 60 * 60 * 1000, this.parameters.cacheTTL * 1.5), // 最多7天
        currentValue: this.parameters.cacheTTL
      });
    }

    // 6. 模块特定调优
    for (const [module, stats] of Object.entries(application)) {
      if (stats) {
        // 检查特定模块的响应时间
        if (stats.avg > this.thresholds.slowResponseTime) {
          recommendations.push({
            type: 'module',
            priority: 'medium',
            issue: `${module} 模块响应时间过长: ${stats.avg}ms`,
            action: 'optimize_module',
            description: `优化 ${module} 模块性能`,
            module: module,
            parameter: 'moduleOptimization',
            suggestedValue: true,
            currentValue: false
          });
        }
      }
    }

    // 按优先级排序
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }

  // 应用调优
  async applyTuning(recommendations) {
    logger.info('自动调优', `应用 ${recommendations.length} 条调优建议`);

    for (const rec of recommendations) {
      try {
        await this.applyRecommendation(rec);
        logger.info('自动调优', `已应用: ${rec.description}`);
      } catch (error) {
        logger.error('自动调优', `应用失败: ${rec.description}`, error.message);
      }
    }
  }

  // 应用单条建议
  async applyRecommendation(rec) {
    switch (rec.action) {
      case 'reduce_cache_size':
        this.parameters.cacheTTL = rec.suggestedValue;
        // 触发缓存清理
        const { clearExpiredCache } = require('./common');
        clearExpiredCache();
        break;

      case 'increase_concurrency':
      case 'reduce_concurrency':
        this.parameters.maxConcurrentTasks = rec.suggestedValue;
        this.parameters.queueConcurrency = rec.suggestedValue;
        break;

      case 'reduce_python_pool':
      case 'increase_python_pool':
        this.parameters.pythonPoolSize = rec.suggestedValue;
        break;

      case 'increase_cache_ttl':
        this.parameters.cacheTTL = rec.suggestedValue;
        break;

      case 'optimize_module':
        // 记录模块优化建议，供后续手动优化
        logger.info('自动调优', `模块 ${rec.module} 需要优化，请检查代码实现`);
        break;

      default:
        logger.warn('自动调优', `未知的调优动作: ${rec.action}`);
    }
  }

  // 获取当前参数
  getParameters() {
    return { ...this.parameters };
  }

  // 获取调优建议
  getRecommendations() {
    return [...this.recommendations];
  }

  // 获取性能历史
  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }

  // 手动设置参数
  setParameter(name, value) {
    if (this.parameters.hasOwnProperty(name)) {
      const oldValue = this.parameters[name];
      this.parameters[name] = value;
      logger.info('自动调优', `手动设置参数 ${name}: ${oldValue} -> ${value}`);
      return true;
    }
    return false;
  }

  // 获取性能报告
  getPerformanceReport() {
    const latest = this.history[this.history.length - 1];
    if (!latest) {
      return { error: '暂无性能数据' };
    }

    return {
      timestamp: latest.timestamp,
      system: {
        memory: {
          total: `${(latest.system.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB`,
          used: `${(latest.system.memory.used / 1024 / 1024 / 1024).toFixed(2)} GB`,
          usage: `${(latest.system.memory.usage * 100).toFixed(1)}%`
        },
        cpu: {
          cores: latest.system.cpu.cores,
          loadAvg: latest.system.cpu.loadAvg.map(l => l.toFixed(2))
        }
      },
      application: latest.summary,
      recommendations: this.recommendations.length,
      currentParameters: this.parameters
    };
  }
}

// 创建全局实例
let globalAutoTuner = null;

function getAutoTuner(options) {
  if (!globalAutoTuner) {
    globalAutoTuner = new AutoTuner(options);
  }
  return globalAutoTuner;
}

module.exports = {
  AutoTuner,
  getAutoTuner
};