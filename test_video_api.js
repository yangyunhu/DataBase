import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testVideoDownloadAPI() {
  console.log('=== 测试视频下载API ===');
  
  const testUrl = 'https://www.bilibili.com/video/BV1PTzhB4E4S/';
  const outputDir = path.join(__dirname, 'test_downloads');
  
  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    console.log(`测试视频: ${testUrl}`);
    
    // 调用视频下载API
    console.log('开始请求API...');
    const response = await axios({
      method: 'POST',
      url: 'http://localhost:3001/api/download-video',
      data: {
        videoUrl: testUrl,
        quality: 'best',
        format: 'mp4'
      },
      responseType: 'stream',
      timeout: 60000 // 60秒超时
    });
    
    console.log(`响应状态: ${response.status}`);
    console.log(`响应头:`, response.headers);
    
    // 从响应头获取文件名
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'test_video.mp4';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match) {
        fileName = decodeURIComponent(match[1]);
      }
    }
    
    const outputPath = path.join(outputDir, fileName);
    console.log(`保存文件: ${outputPath}`);
    
    // 创建写入流
    const writer = fs.createWriteStream(outputPath);
    
    // 监听数据传输
    let bytesDownloaded = 0;
    response.data.on('data', (chunk) => {
      bytesDownloaded += chunk.length;
      if (bytesDownloaded % (1024 * 1024) === 0) {
        console.log(`已下载: ${(bytesDownloaded / (1024 * 1024)).toFixed(2)} MB`);
      }
    });
    
    // 管道响应流到文件
    response.data.pipe(writer);
    
    // 等待写入完成
    await new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('文件下载完成');
        resolve();
      });
      writer.on('error', (err) => {
        console.error('文件写入错误:', err);
        reject(err);
      });
      response.data.on('error', (err) => {
        console.error('响应流错误:', err);
        reject(err);
      });
      response.data.on('end', () => {
        console.log('响应流结束');
      });
    });
    
    // 检查文件大小
    const stats = fs.statSync(outputPath);
    console.log(`文件大小: ${stats.size} 字节`);
    
    if (stats.size > 1024) {
      console.log('PASS: 下载成功，文件大小正常');
    } else {
      console.log('FAIL: 下载失败，文件大小异常');
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求失败，无响应:', error.request);
    }
  }
}

// 运行测试
testVideoDownloadAPI().then(() => {
  console.log('=== 测试完成 ===');
}).catch((error) => {
  console.error('测试失败:', error);
});
