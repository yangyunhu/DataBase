const logger = require('./logger');

const performanceMetrics = {
  documentConversion: [],
  videoExtraction: [],
  videoDownload: [],
  translation: [],
  ocr: [],
  search: [],
  proxy: [],
  signature: []
};

const MAX_METRICS_PER_MODULE = 1000;

function recordPerformance(type, duration, metadata = {}) {
  if (!performanceMetrics[type]) {
    logger.warn('性能监控', `未知的性能类型: ${type}`);
    return;
  }

  const metric = {
    duration,
    timestamp: Date.now(),
    ...metadata
  };

  performanceMetrics[type].push(metric);

  if (performanceMetrics[type].length > MAX_METRICS_PER_MODULE) {
    performanceMetrics[type].shift();
  }
}

function getPerformanceStats(type) {
  if (!performanceMetrics[type] || performanceMetrics[type].length === 0) {
    return null;
  }

  const metrics = performanceMetrics[type];
  const durations = metrics.map(m => m.duration);

  const sortedDurations = [...durations].sort((a, b) => a - b);
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;
  const median = sortedDurations[Math.floor(sortedDurations.length / 2)];
  const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)];
  const p99 = sortedDurations[Math.floor(sortedDurations.length * 0.99)];

  return {
    count: metrics.length,
    avg: Math.round(avg),
    min: Math.min(...durations),
    max: Math.max(...durations),
    median,
    p95,
    p99,
    sum: Math.round(sum),
    successRate: calculateSuccessRate(metrics)
  };
}

function calculateSuccessRate(metrics) {
  if (metrics.length === 0) return 100;
  
  const successCount = metrics.filter(m => !m.error).length;
  return Math.round((successCount / metrics.length) * 100);
}

function getAllPerformanceStats() {
  const stats = {};
  
  for (const type in performanceMetrics) {
    stats[type] = getPerformanceStats(type);
  }
  
  return stats;
}

function getRecentMetrics(type, limit = 10) {
  if (!performanceMetrics[type]) {
    return [];
  }

  return performanceMetrics[type].slice(-limit);
}

function clearMetrics(type) {
  if (type) {
    if (performanceMetrics[type]) {
      performanceMetrics[type] = [];
      logger.info('性能监控', `已清除 ${type} 的性能数据`);
    }
  } else {
    for (const key in performanceMetrics) {
      performanceMetrics[key] = [];
    }
    logger.info('性能监控', '已清除所有性能数据');
  }
}

function getPerformanceReport() {
  const stats = getAllPerformanceStats();
  const report = {
    timestamp: new Date().toISOString(),
    summary: {},
    details: stats
  };

  let totalOperations = 0;
  let totalDuration = 0;
  let totalErrors = 0;

  for (const type in stats) {
    if (stats[type]) {
      totalOperations += stats[type].count;
      totalDuration += stats[type].sum;
      totalErrors += Math.round(stats[type].count * (1 - stats[type].successRate / 100));
    }
  }

  report.summary = {
    totalOperations,
    totalDuration,
    avgDuration: totalOperations > 0 ? Math.round(totalDuration / totalOperations) : 0,
    totalErrors,
    overallSuccessRate: totalOperations > 0 ? Math.round(((totalOperations - totalErrors) / totalOperations) * 100) : 100
  };

  return report;
}

function createPerformanceTracker(type, metadata = {}) {
  const startTime = Date.now();
  
  return {
    end: (additionalMetadata = {}) => {
      const duration = Date.now() - startTime;
      recordPerformance(type, duration, { ...metadata, ...additionalMetadata });
      return duration;
    },
    getElapsedTime: () => Date.now() - startTime
  };
}

async function measurePerformance(type, fn, metadata = {}) {
  const tracker = createPerformanceTracker(type, metadata);
  
  try {
    const result = await fn();
    tracker.end({ success: true });
    return result;
  } catch (error) {
    tracker.end({ success: false, error: error.message });
    throw error;
  }
}

function getSlowOperations(type, threshold = 5000, limit = 10) {
  if (!performanceMetrics[type]) {
    return [];
  }

  return performanceMetrics[type]
    .filter(m => m.duration > threshold)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit);
}

function getPerformanceTrend(type, hours = 24) {
  if (!performanceMetrics[type] || performanceMetrics[type].length === 0) {
    return null;
  }

  const now = Date.now();
  const startTime = now - hours * 60 * 60 * 1000;
  
  const recentMetrics = performanceMetrics[type].filter(m => m.timestamp >= startTime);
  
  if (recentMetrics.length === 0) {
    return null;
  }

  const hourlyData = {};
  
  for (const metric of recentMetrics) {
    const hour = Math.floor(metric.timestamp / (60 * 60 * 1000));
    if (!hourlyData[hour]) {
      hourlyData[hour] = [];
    }
    hourlyData[hour].push(metric.duration);
  }

  const trend = [];
  
  for (const hour in hourlyData) {
    const durations = hourlyData[hour];
    trend.push({
      hour: new Date(parseInt(hour) * 60 * 60 * 1000).toISOString(),
      count: durations.length,
      avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      min: Math.min(...durations),
      max: Math.max(...durations)
    });
  }

  return trend.sort((a, b) => a.hour.localeCompare(b.hour));
}

module.exports = {
  recordPerformance,
  getPerformanceStats,
  getAllPerformanceStats,
  getRecentMetrics,
  clearMetrics,
  getPerformanceReport,
  createPerformanceTracker,
  measurePerformance,
  getSlowOperations,
  getPerformanceTrend
};