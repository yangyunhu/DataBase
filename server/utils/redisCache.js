const logger = require('./logger');

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.fallbackMode = false;
    this.memoryCache = new Map();
    this.defaultTTL = 24 * 60 * 60; // 24小时（秒）
  }

  async connect(config = {}) {
    try {
      // 尝试动态导入redis模块
      let redis;
      try {
        redis = require('redis');
      } catch (e) {
        logger.warn('Redis', 'Redis模块未安装，使用内存缓存作为回退');
        this.fallbackMode = true;
        return false;
      }

      const redisConfig = {
        host: config.host || 'localhost',
        port: config.port || 6379,
        password: config.password || undefined,
        db: config.db || 0,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis', 'Redis服务器连接被拒绝');
            return new Error('Redis服务器连接被拒绝');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('重试时间超过1小时');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      };

      this.client = redis.createClient(redisConfig);

      this.client.on('error', (err) => {
        logger.error('Redis', 'Redis客户端错误:', err.message);
        this.isConnected = false;
        this.fallbackMode = true;
      });

      this.client.on('connect', () => {
        logger.info('Redis', 'Redis客户端已连接');
        this.isConnected = true;
        this.fallbackMode = false;
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis', 'Redis客户端正在重新连接...');
      });

      // 等待连接
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Redis连接超时'));
        }, 5000);

        this.client.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.client.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      return true;
    } catch (error) {
      logger.error('Redis', 'Redis连接失败:', error.message);
      logger.info('Redis', '切换到内存缓存模式');
      this.fallbackMode = true;
      return false;
    }
  }

  async get(key) {
    try {
      if (this.fallbackMode) {
        const item = this.memoryCache.get(key);
        if (!item) return null;
        
        // 检查是否过期
        if (Date.now() > item.expireAt) {
          this.memoryCache.delete(key);
          return null;
        }
        
        return item.value;
      }

      if (!this.isConnected) {
        return null;
      }

      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis', `获取缓存失败 (${key}):`, error.message);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (this.fallbackMode) {
        this.memoryCache.set(key, {
          value,
          expireAt: Date.now() + (ttl * 1000)
        });
        return true;
      }

      if (!this.isConnected) {
        return false;
      }

      const serializedValue = JSON.stringify(value);
      await this.client.setex(key, ttl, serializedValue);
      return true;
    } catch (error) {
      logger.error('Redis', `设置缓存失败 (${key}):`, error.message);
      return false;
    }
  }

  async delete(key) {
    try {
      if (this.fallbackMode) {
        return this.memoryCache.delete(key);
      }

      if (!this.isConnected) {
        return false;
      }

      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis', `删除缓存失败 (${key}):`, error.message);
      return false;
    }
  }

  async exists(key) {
    try {
      if (this.fallbackMode) {
        const item = this.memoryCache.get(key);
        if (!item) return false;
        
        if (Date.now() > item.expireAt) {
          this.memoryCache.delete(key);
          return false;
        }
        
        return true;
      }

      if (!this.isConnected) {
        return false;
      }

      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Redis', `检查缓存存在失败 (${key}):`, error.message);
      return false;
    }
  }

  async clear() {
    try {
      if (this.fallbackMode) {
        this.memoryCache.clear();
        return true;
      }

      if (!this.isConnected) {
        return false;
      }

      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.error('Redis', '清空缓存失败:', error.message);
      return false;
    }
  }

  async getStats() {
    try {
      if (this.fallbackMode) {
        return {
          mode: 'memory',
          keys: this.memoryCache.size,
          memory: process.memoryUsage().heapUsed
        };
      }

      if (!this.isConnected) {
        return {
          mode: 'disconnected',
          keys: 0,
          memory: 0
        };
      }

      const info = await this.client.info('memory');
      const dbSize = await this.client.dbsize();
      
      return {
        mode: 'redis',
        keys: dbSize,
        memory: info
      };
    } catch (error) {
      logger.error('Redis', '获取统计信息失败:', error.message);
      return {
        mode: 'error',
        keys: 0,
        memory: 0
      };
    }
  }

  async close() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis', 'Redis连接已关闭');
      }
    } catch (error) {
      logger.error('Redis', '关闭Redis连接失败:', error.message);
    }
  }

  // 批量操作
  async mget(keys) {
    try {
      if (this.fallbackMode) {
        const results = {};
        for (const key of keys) {
          results[key] = await this.get(key);
        }
        return results;
      }

      if (!this.isConnected) {
        return {};
      }

      const values = await this.client.mget(keys);
      const results = {};
      keys.forEach((key, index) => {
        results[key] = values[index] ? JSON.parse(values[index]) : null;
      });
      return results;
    } catch (error) {
      logger.error('Redis', '批量获取缓存失败:', error.message);
      return {};
    }
  }

  async mset(entries, ttl = this.defaultTTL) {
    try {
      if (this.fallbackMode) {
        for (const [key, value] of Object.entries(entries)) {
          await this.set(key, value, ttl);
        }
        return true;
      }

      if (!this.isConnected) {
        return false;
      }

      const pipeline = this.client.pipeline();
      for (const [key, value] of Object.entries(entries)) {
        pipeline.setex(key, ttl, JSON.stringify(value));
      }
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Redis', '批量设置缓存失败:', error.message);
      return false;
    }
  }

  // 缓存包装器
  async wrap(key, fn, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }
}

// 创建全局实例
let globalRedisCache = null;

function getRedisCache() {
  if (!globalRedisCache) {
    globalRedisCache = new RedisCache();
  }
  return globalRedisCache;
}

async function initRedisCache(config) {
  const cache = getRedisCache();
  await cache.connect(config);
  return cache;
}

module.exports = {
  RedisCache,
  getRedisCache,
  initRedisCache
};