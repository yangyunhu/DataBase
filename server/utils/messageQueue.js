const logger = require('./logger');
const performance = require('./performance');
const EventEmitter = require('events');

class MessageQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.queues = new Map();
    this.processors = new Map();
    this.isRunning = false;
    this.concurrency = options.concurrency || 3;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 5000;
    this.maxQueueSize = options.maxQueueSize || 1000;
    this.processingTasks = new Map();
  }

  // 创建队列
  createQueue(queueName, options = {}) {
    if (this.queues.has(queueName)) {
      logger.warn('消息队列', `队列 ${queueName} 已存在`);
      return this.queues.get(queueName);
    }

    const queue = {
      name: queueName,
      messages: [],
      processing: [],
      completed: [],
      failed: [],
      options: {
        concurrency: options.concurrency || this.concurrency,
        retryAttempts: options.retryAttempts || this.retryAttempts,
        retryDelay: options.retryDelay || this.retryDelay,
        maxQueueSize: options.maxQueueSize || this.maxQueueSize,
        ...options
      },
      stats: {
        totalProcessed: 0,
        totalFailed: 0,
        totalRetried: 0,
        averageProcessingTime: 0
      }
    };

    this.queues.set(queueName, queue);
    logger.info('消息队列', `创建队列: ${queueName}`);
    return queue;
  }

  // 注册处理器
  registerProcessor(queueName, processor) {
    this.processors.set(queueName, processor);
    logger.info('消息队列', `注册处理器: ${queueName}`);
  }

  // 添加消息到队列
  async addMessage(queueName, message, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`队列 ${queueName} 不存在`);
    }

    if (queue.messages.length >= queue.options.maxQueueSize) {
      throw new Error(`队列 ${queueName} 已满`);
    }

    const messageItem = {
      id: this.generateMessageId(),
      data: message,
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || queue.options.retryAttempts,
      createdAt: Date.now(),
      delay: options.delay || 0,
      scheduledAt: options.delay ? Date.now() + options.delay : Date.now()
    };

    // 根据优先级插入
    const insertIndex = queue.messages.findIndex(m => m.priority < messageItem.priority);
    if (insertIndex === -1) {
      queue.messages.push(messageItem);
    } else {
      queue.messages.splice(insertIndex, 0, messageItem);
    }

    logger.debug('消息队列', `添加消息到 ${queueName}: ${messageItem.id}`);
    
    // 触发处理
    if (this.isRunning) {
      this.processQueue(queueName);
    }

    return messageItem.id;
  }

  // 批量添加消息
  async addMessages(queueName, messages, options = {}) {
    const messageIds = [];
    for (const message of messages) {
      const id = await this.addMessage(queueName, message, options);
      messageIds.push(id);
    }
    return messageIds;
  }

  // 处理队列
  async processQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return;

    const processor = this.processors.get(queueName);
    if (!processor) {
      logger.warn('消息队列', `队列 ${queueName} 没有注册处理器`);
      return;
    }

    // 检查并发限制
    if (queue.processing.length >= queue.options.concurrency) {
      return;
    }

    // 获取可处理的消息
    const now = Date.now();
    const availableMessage = queue.messages.find(m => m.scheduledAt <= now);
    
    if (!availableMessage) {
      return;
    }

    // 从等待队列移除
    const messageIndex = queue.messages.indexOf(availableMessage);
    queue.messages.splice(messageIndex, 1);

    // 添加到处理队列
    queue.processing.push(availableMessage);
    this.processingTasks.set(availableMessage.id, {
      queueName,
      startTime: Date.now()
    });

    // 处理消息
    this.processMessage(queueName, availableMessage, processor);

    // 继续处理队列中的其他消息
    if (queue.messages.length > 0 && queue.processing.length < queue.options.concurrency) {
      setImmediate(() => this.processQueue(queueName));
    }
  }

  // 处理单个消息
  async processMessage(queueName, message, processor) {
    const tracker = performance.createPerformanceTracker('messageQueue', { 
      queue: queueName, 
      messageId: message.id 
    });

    const queue = this.queues.get(queueName);
    
    try {
      logger.debug('消息队列', `处理消息 ${message.id} 在队列 ${queueName}`);
      
      const result = await processor(message.data);
      
      // 处理成功
      message.completedAt = Date.now();
      message.result = result;
      message.processingTime = message.completedAt - this.processingTasks.get(message.id).startTime;
      
      // 从处理队列移除
      const processingIndex = queue.processing.indexOf(message);
      if (processingIndex > -1) {
        queue.processing.splice(processingIndex, 1);
      }
      
      // 添加到完成队列
      queue.completed.push(message);
      
      // 更新统计
      queue.stats.totalProcessed++;
      this.updateAverageProcessingTime(queue, message.processingTime);
      
      // 清理完成的任务
      this.cleanupCompleted(queue);
      
      tracker.end({ success: true, processingTime: message.processingTime });
      
      // 触发事件
      this.emit('message:completed', { queue: queueName, message, result });
      
      logger.debug('消息队列', `消息 ${message.id} 处理完成，耗时: ${message.processingTime}ms`);
      
    } catch (error) {
      logger.error('消息队列', `消息 ${message.id} 处理失败:`, error.message);
      
      message.attempts++;
      message.lastError = error.message;
      
      if (message.attempts < message.maxAttempts) {
        // 重试
        message.scheduledAt = Date.now() + queue.options.retryDelay;
        queue.messages.push(message);
        queue.stats.totalRetried++;
        
        logger.warn('消息队列', `消息 ${message.id} 将在 ${queue.options.retryDelay}ms 后重试 (${message.attempts}/${message.maxAttempts})`);
        
        tracker.end({ success: false, error: error.message, willRetry: true });
        this.emit('message:retry', { queue: queueName, message, error });
      } else {
        // 最终失败
        message.failedAt = Date.now();
        
        // 从处理队列移除
        const processingIndex = queue.processing.indexOf(message);
        if (processingIndex > -1) {
          queue.processing.splice(processingIndex, 1);
        }
        
        // 添加到失败队列
        queue.failed.push(message);
        queue.stats.totalFailed++;
        
        tracker.end({ success: false, error: error.message, final: true });
        this.emit('message:failed', { queue: queueName, message, error });
        
        logger.error('消息队列', `消息 ${message.id} 最终失败`);
      }
    } finally {
      this.processingTasks.delete(message.id);
      
      // 继续处理队列
      if (this.isRunning) {
        setImmediate(() => this.processQueue(queueName));
      }
    }
  }

  // 更新平均处理时间
  updateAverageProcessingTime(queue, processingTime) {
    const total = queue.stats.totalProcessed;
    queue.stats.averageProcessingTime = 
      (queue.stats.averageProcessingTime * (total - 1) + processingTime) / total;
  }

  // 清理已完成的任务
  cleanupCompleted(queue) {
    const maxCompleted = 100;
    if (queue.completed.length > maxCompleted) {
      queue.completed = queue.completed.slice(-maxCompleted);
    }
  }

  // 启动队列处理
  start() {
    if (this.isRunning) {
      logger.warn('消息队列', '队列已经在运行');
      return;
    }

    this.isRunning = true;
    logger.info('消息队列', '启动队列处理');

    // 启动所有队列的处理
    for (const [queueName] of this.queues) {
      this.processQueue(queueName);
    }

    this.emit('started');
  }

  // 停止队列处理
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('消息队列', '停止队列处理');
    this.emit('stopped');
  }

  // 暂停队列
  pause(queueName) {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.paused = true;
      logger.info('消息队列', `暂停队列: ${queueName}`);
    }
  }

  // 恢复队列
  resume(queueName) {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.paused = false;
      logger.info('消息队列', `恢复队列: ${queueName}`);
      if (this.isRunning) {
        this.processQueue(queueName);
      }
    }
  }

  // 获取队列状态
  getQueueStatus(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    return {
      name: queue.name,
      waiting: queue.messages.length,
      processing: queue.processing.length,
      completed: queue.completed.length,
      failed: queue.failed.length,
      stats: { ...queue.stats },
      options: { ...queue.options }
    };
  }

  // 获取所有队列状态
  getAllQueueStatus() {
    const status = {};
    for (const [queueName] of this.queues) {
      status[queueName] = this.getQueueStatus(queueName);
    }
    return status;
  }

  // 重试失败的消息
  async retryFailed(queueName, messageId = null) {
    const queue = this.queues.get(queueName);
    if (!queue) return 0;

    let retried = 0;
    
    if (messageId) {
      // 重试特定消息
      const messageIndex = queue.failed.findIndex(m => m.id === messageId);
      if (messageIndex > -1) {
        const message = queue.failed.splice(messageIndex, 1)[0];
        message.attempts = 0;
        message.scheduledAt = Date.now();
        queue.messages.push(message);
        retried = 1;
      }
    } else {
      // 重试所有失败的消息
      const failedMessages = [...queue.failed];
      queue.failed = [];
      
      for (const message of failedMessages) {
        message.attempts = 0;
        message.scheduledAt = Date.now();
        queue.messages.push(message);
        retried++;
      }
    }

    if (retried > 0 && this.isRunning) {
      this.processQueue(queueName);
    }

    logger.info('消息队列', `重试 ${retried} 条失败消息在队列 ${queueName}`);
    return retried;
  }

  // 清空队列
  clearQueue(queueName, clearFailed = false) {
    const queue = this.queues.get(queueName);
    if (!queue) return;

    const waitingCount = queue.messages.length;
    queue.messages = [];
    
    if (clearFailed) {
      const failedCount = queue.failed.length;
      queue.failed = [];
      logger.info('消息队列', `清空队列 ${queueName}: ${waitingCount} 等待中, ${failedCount} 失败`);
    } else {
      logger.info('消息队列', `清空队列 ${queueName}: ${waitingCount} 等待中`);
    }
  }

  // 生成消息ID
  generateMessageId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取队列统计
  getQueueStats(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    return {
      ...queue.stats,
      currentWaiting: queue.messages.length,
      currentProcessing: queue.processing.length,
      currentCompleted: queue.completed.length,
      currentFailed: queue.failed.length
    };
  }
}

// 创建全局实例
let globalMessageQueue = null;

function getMessageQueue(options) {
  if (!globalMessageQueue) {
    globalMessageQueue = new MessageQueue(options);
  }
  return globalMessageQueue;
}

module.exports = {
  MessageQueue,
  getMessageQueue
};