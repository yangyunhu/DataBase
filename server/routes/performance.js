const express = require('express');
const router = express.Router();
const performance = require('../utils/performance');
const { getAutoTuner } = require('../utils/autoTuner');
const { getMessageQueue } = require('../utils/messageQueue');
const { getRedisCache } = require('../utils/redisCache');
const logger = require('../utils/logger');

// 获取所有模块性能统计
router.get('/stats', (req, res) => {
  try {
    const stats = performance.getAllPerformanceStats();
    res.json({
      success: true,
      data: stats,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('性能API', '获取性能统计失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取特定模块性能统计
router.get('/stats/:module', (req, res) => {
  try {
    const { module } = req.params;
    const stats = performance.getPerformanceStats(module);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: `模块 ${module} 暂无性能数据`
      });
    }
    
    res.json({
      success: true,
      data: stats,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('性能API', '获取模块性能统计失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取性能报告
router.get('/report', (req, res) => {
  try {
    const report = performance.getPerformanceReport();
    res.json({
      success: true,
      data: report,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('性能API', '获取性能报告失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取慢操作列表
router.get('/slow-operations', (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5000;
    const slowOps = performance.getSlowOperations(threshold);
    
    res.json({
      success: true,
      data: slowOps,
      threshold,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('性能API', '获取慢操作失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取性能趋势
router.get('/trend/:module', (req, res) => {
  try {
    const { module } = req.params;
    const hours = parseInt(req.query.hours) || 24;
    const trend = performance.getPerformanceTrend(module, hours);
    
    res.json({
      success: true,
      data: trend,
      hours,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('性能API', '获取性能趋势失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 清空性能数据
router.post('/clear', (req, res) => {
  try {
    const { module } = req.body;
    
    if (module) {
      performance.clearMetrics(module);
      logger.info('性能API', `已清空模块 ${module} 的性能数据`);
    } else {
      performance.clearMetrics();
      logger.info('性能API', '已清空所有性能数据');
    }
    
    res.json({
      success: true,
      message: module ? `已清空模块 ${module} 的性能数据` : '已清空所有性能数据',
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('性能API', '清空性能数据失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取自动调优状态
router.get('/tuner/status', (req, res) => {
  try {
    const tuner = getAutoTuner();
    const report = tuner.getPerformanceReport();
    const recommendations = tuner.getRecommendations();
    const parameters = tuner.getParameters();
    
    res.json({
      success: true,
      data: {
        report,
        recommendations,
        parameters,
        isRunning: tuner.isRunning
      },
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('性能API', '获取调优状态失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 启动自动调优
router.post('/tuner/start', (req, res) => {
  try {
    const tuner = getAutoTuner();
    tuner.start();
    
    res.json({
      success: true,
      message: '自动调优已启动',
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('性能API', '启动自动调优失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 停止自动调优
router.post('/tuner/stop', (req, res) => {
  try {
    const tuner = getAutoTuner();
    tuner.stop();
    
    res.json({
      success: true,
      message: '自动调优已停止',
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('性能API', '停止自动调优失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取消息队列状态
router.get('/queue/status', (req, res) => {
  try {
    const queue = getMessageQueue();
    const status = queue.getAllQueueStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('性能API', '获取队列状态失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取Redis缓存状态
router.get('/cache/status', async (req, res) => {
  try {
    const cache = getRedisCache();
    const stats = await cache.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('性能API', '获取缓存状态失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取系统概览
router.get('/overview', async (req, res) => {
  try {
    const stats = performance.getAllPerformanceStats();
    const tuner = getAutoTuner();
    const queue = getMessageQueue();
    const cache = getRedisCache();
    
    const overview = {
      performance: stats,
      tuner: {
        isRunning: tuner.isRunning,
        recommendationsCount: tuner.getRecommendations().length
      },
      queue: queue.getAllQueueStatus(),
      cache: await cache.getStats(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };
    
    res.json({
      success: true,
      data: overview,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('性能API', '获取系统概览失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;