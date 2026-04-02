const express = require('express');

const router = express.Router();

// 使用 CommonJS 兼容的导入方式
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// 代理图片API - 用于绕过防盗链
router.get("/proxy-image", async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ error: "缺少图片URL" });
    }
    
    console.log(`[代理模块] 代理图片请求: ${imageUrl}`);
    
    // 根据URL来源设置合适的Referer
    let referer = '';
    if (imageUrl.includes('hdslb.com') || imageUrl.includes('bilibili.com')) {
      referer = 'https://www.bilibili.com';
    } else if (imageUrl.includes('xhscdn.com') || imageUrl.includes('xiaohongshu.com')) {
      referer = 'https://www.xiaohongshu.com';
    }
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    
    if (referer) {
      headers['Referer'] = referer;
    }
    
    const response = await fetch(imageUrl, { headers });
    
    if (!response.ok) {
      console.log(`[代理模块] 获取图片失败: ${response.status}`);
      return res.status(response.status).json({ error: "获取图片失败" });
    }
    
    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType);
    
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
    
    console.log(`[代理模块] 图片代理成功: ${imageUrl}`);
    
  } catch (error) {
    console.error("[代理模块] 图片代理失败:", error);
    res.status(500).json({ error: "图片代理失败" });
  }
});

// 代理视频API - 用于绕过防盗链
router.get("/proxy-video", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({ error: "缺少视频URL" });
    }
    
    console.log(`[代理模块] 代理视频请求: ${videoUrl}`);
    
    // 根据URL来源设置合适的Referer
    let referer = '';
    if (videoUrl.includes('bilivideo.com') || videoUrl.includes('bilibili.com')) {
      referer = 'https://www.bilibili.com';
    } else if (videoUrl.includes('xhscdn.com') || videoUrl.includes('xiaohongshu.com')) {
      referer = 'https://www.xiaohongshu.com';
    }
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    
    if (referer) {
      headers['Referer'] = referer;
    }
    
    const response = await fetch(videoUrl, { headers });
    
    if (!response.ok) {
      console.log(`[代理模块] 获取视频失败: ${response.status}`);
      return res.status(response.status).json({ error: "获取视频失败" });
    }
    
    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType);
    
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
    
    console.log(`[代理模块] 视频代理成功: ${videoUrl}`);
    
  } catch (error) {
    console.error("[代理模块] 视频代理失败:", error);
    res.status(500).json({ error: "视频代理失败" });
  }
});

module.exports = router;