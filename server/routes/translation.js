const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip } = require('docx');

// 引入公共工具
const { 
  setCache, 
  getCache, 
  startCacheCleanupTask, 
  createTaskQueue, 
  generateFileHash 
} = require('../utils/common');

// 引入日志工具
const logger = require('../utils/logger');

// 引入性能监控工具
const performance = require('../utils/performance');

const router = express.Router();

const BAIDU_TRANSLATE_APP_ID = '20260402002585685';
const BAIDU_TRANSLATE_SECRET_KEY = 'BWWLsNpL9rDKKeCowdgA';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

// 启动缓存清理任务
startCacheCleanupTask();

// 创建任务队列
const translationQueue = createTaskQueue();

function generateCacheKey(text, direction) {
  return `translate_${generateFileHash(Buffer.from(text + direction))}`;
}

// 百度翻译单次最大字符数限制（实际限制约6000字符，但为了安全设置为2000）
const MAX_CHARS_PER_REQUEST = 2000;

async function translateSingleSegment(text, from, to) {
  const tracker = performance.createPerformanceTracker('translation', { type: 'segment', textLength: text.length });
  
  logger.debug('翻译模块', `翻译单段文本，长度: ${text.length}, from: ${from}, to: ${to}`);
  
  const salt = Date.now().toString();
  const sign = crypto
    .createHash('md5')
    .update(BAIDU_TRANSLATE_APP_ID + text + salt + BAIDU_TRANSLATE_SECRET_KEY)
    .digest('hex');

  // 使用POST方式避免414错误
  const params = new URLSearchParams();
  params.append('q', text);
  params.append('from', from);
  params.append('to', to);
  params.append('appid', BAIDU_TRANSLATE_APP_ID);
  params.append('salt', salt);
  params.append('sign', sign);
  
  logger.debug('翻译模块', '发送翻译请求到百度API...');
  
  try {
    const response = await axios.post('https://fanyi-api.baidu.com/api/trans/vip/translate', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });

    logger.debug('翻译模块', `百度API响应: ${JSON.stringify(response.data).substring(0, 200)}`);

    if (response.data.error_code) {
      tracker.end({ success: false, error: response.data.error_msg });
      throw new Error(`翻译API错误: ${response.data.error_msg}`);
    }

    const result = response.data.trans_result.map(item => item.dst).join('\n');
    tracker.end({ success: true, resultLength: result.length });
    return result;
  } catch (error) {
    logger.error('翻译模块', '百度API请求失败:', error.message);
    if (error.response) {
      logger.error('翻译模块', '错误状态:', error.response.status);
      logger.error('翻译模块', '错误数据:', error.response.data);
    }
    tracker.end({ success: false, error: error.message });
    throw error;
  }
}

async function translateTextWithBaidu(text, from, to) {
  const tracker = performance.createPerformanceTracker('translation', { type: 'full', textLength: text.length });
  
  const cacheKey = generateCacheKey(text, `${from}2${to}`);
  const cachedResult = getCache('parsedData', cacheKey);
  
  if (cachedResult) {
    logger.info('翻译模块', `从缓存获取翻译结果，长度: ${text.length}`);
    tracker.end({ success: true, fromCache: true });
    return cachedResult;
  }

  try {
    let translatedText = '';
    
    // 如果文本超过限制，分段翻译
    if (text.length > MAX_CHARS_PER_REQUEST) {
      const segments = [];
      let start = 0;
      
      while (start < text.length) {
        let end = start + MAX_CHARS_PER_REQUEST;
        // 尽量在句子边界分割
        if (end < text.length) {
          const nextNewline = text.indexOf('\n', end - 100);
          if (nextNewline !== -1 && nextNewline < end + 100) {
            end = nextNewline + 1;
          }
        }
        segments.push(text.slice(start, end));
        start = end;
      }
      
      logger.info('翻译模块', `文本过长，分段翻译，共${segments.length}段`);
      
      // 批量翻译（使用Promise.all并行处理）
      const segmentPromises = segments.map((segment, index) => {
        return new Promise(async (resolve) => {
          try {
            // 为每个片段生成缓存键
            const segmentCacheKey = generateCacheKey(segment, `${from}2${to}`);
            const cachedSegment = getCache('parsedData', segmentCacheKey);
            
            if (cachedSegment) {
              logger.info('翻译模块', `从缓存获取片段${index + 1}结果`);
              resolve(cachedSegment);
              return;
            }
            
            const result = await translateSingleSegment(segment, from, to);
            // 缓存片段结果
            setCache('parsedData', segmentCacheKey, result);
            resolve(result);
          } catch (error) {
            logger.error('翻译模块', `片段${index + 1}翻译失败:`, error.message);
            resolve(segment); // 失败时返回原文
          }
        });
      });
      
      const translatedSegments = await Promise.all(segmentPromises);
      translatedText = translatedSegments.join('\n');
    } else {
      translatedText = await translateSingleSegment(text, from, to);
    }

    // 缓存完整结果
    setCache('parsedData', cacheKey, translatedText);
    logger.info('翻译模块', `翻译完成，长度: ${text.length}，已缓存`);
    tracker.end({ success: true, resultLength: translatedText.length });
    return translatedText;
  } catch (error) {
    logger.error('翻译模块', '百度翻译API调用失败:', error);
    tracker.end({ success: false, error: error.message });
    throw error;
  }
}

// 检测文档语言（中文或英文）
function detectDocumentLanguage(buffer) {
  const JSZip = require('jszip');
  
  return JSZip.loadAsync(buffer).then(zip => {
    return zip.file('word/document.xml').async('string');
  }).then(documentXml => {
    // 匹配所有<w:t>标签中的文本
    const textRegex = /<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/g;
    const matches = [...documentXml.matchAll(textRegex)];
    
    let chineseCount = 0;
    let englishCount = 0;
    
    for (const match of matches) {
      const text = match[1];
      if (text && text.trim()) {
        // 统计中文字符
        const chineseMatches = text.match(/[\u4e00-\u9fa5]/g);
        if (chineseMatches) {
          chineseCount += chineseMatches.length;
        }
        // 统计英文字母
        const englishMatches = text.match(/[a-zA-Z]/g);
        if (englishMatches) {
          englishCount += englishMatches.length;
        }
      }
    }
    
    // 根据字符数量判断语言
    if (chineseCount > englishCount) {
      return 'zh';
    } else if (englishCount > chineseCount) {
      return 'en';
    } else {
      // 如果相等或都为0，默认认为是中文
      return 'zh';
    }
  });
}

// 提取XML中的文本节点进行翻译
async function translateDocxBuffer(buffer, from, to) {
  const JSZip = require('jszip');
  
  const zip = await JSZip.loadAsync(buffer);
  
  // 读取document.xml
  let documentXml = await zip.file('word/document.xml').async('string');
  
  // 匹配所有<w:t>标签中的文本（包括带属性的）
  const textRegex = /<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/g;
  const matches = [...documentXml.matchAll(textRegex)];
  
  // 收集所有需要翻译的文本（去重）
  const textMap = new Map();
  for (const match of matches) {
    const text = match[1];
    // 翻译所有非空文本
    if (text && text.trim()) {
      // 根据源语言判断需要翻译的文本
      if (from === 'zh') {
        // 中文转英文：只翻译包含中文字符的文本
        if (/[\u4e00-\u9fa5]/.test(text)) {
          if (!textMap.has(text)) {
            textMap.set(text, null);
          }
        }
      } else if (from === 'en') {
        // 英文转中文：只翻译包含英文字母的文本（排除纯数字和标点）
        if (/[a-zA-Z]/.test(text) && !/^\d+$/.test(text.trim())) {
          if (!textMap.has(text)) {
            textMap.set(text, null);
          }
        }
      }
    }
  }
  
  // 批量翻译文本（使用Promise.all并行处理）
  const textsToTranslate = Array.from(textMap.keys());
  logger.info('翻译模块', `开始批量翻译，共${textsToTranslate.length}个文本片段`);
  
  const translationPromises = textsToTranslate.map(text => {
    return new Promise(async (resolve) => {
      try {
        const translated = await translateTextWithBaidu(text, from, to);
        resolve([text, translated]);
      } catch (e) {
        logger.error('翻译模块', `文本翻译失败: ${text.substring(0, 50)}...`, e.message);
        resolve([text, text]); // 失败时返回原文
      }
    });
  });
  
  // 并行处理所有翻译请求
  const translationResults = await Promise.all(translationPromises);
  
  // 更新textMap
  for (const [text, translated] of translationResults) {
    textMap.set(text, translated);
  }
  
  // 替换XML中的文本（按长度从长到短排序，避免短文本干扰长文本）
  const sortedEntries = Array.from(textMap.entries())
    .filter(([original, translated]) => translated)
    .sort((a, b) => b[0].length - a[0].length);
  
  logger.info('翻译模块', `开始替换XML文本，共${sortedEntries.length}个不同文本`);
  
  for (const [original, translated] of sortedEntries) {
    // 转义特殊字符用于正则
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 替换所有匹配
    const regex = new RegExp(`(<w:t(?:\\s+[^>]*)?>)${escapedOriginal}(</w:t>)`, 'g');
    documentXml = documentXml.replace(regex, `$1${translated}$2`);
  }
  
  // 移除可能导致空白页的分页符
  // 只移除显式的分页符，不移除段落
  documentXml = documentXml.replace(/<w:br\s+w:type="page"\s*\/>/gi, '');
  documentXml = documentXml.replace(/w:pageBreakBefore="1"/gi, '');
  
  // 移除表格跨页属性，避免表格跨页产生空白
  // 1. 移除表格行的跨页属性
  documentXml = documentXml.replace(/<w:trPr>.*?<\/w:trPr>/gi, '');
  // 2. 移除表格单元格的跨页属性
  documentXml = documentXml.replace(/<w:tcPr>.*?<w:vMerge[^>]*>.*?<\/w:vMerge>.*?<\/w:tcPr>/gi, '');
  // 3. 移除表格属性中的跨页设置
  documentXml = documentXml.replace(/w:tblLayout="fixed"/gi, '');
  // 4. 移除段落中的分页前属性
  documentXml = documentXml.replace(/<w:pageBreakBefore\/>/gi, '');
  // 5. 移除表格行高设置（可能导致空白）
  documentXml = documentXml.replace(/<w:trHeight[^>]*>.*?<\/w:trHeight>/gi, '');
  // 6. 移除段前段后间距过大的设置
  documentXml = documentXml.replace(/<w:spacing[^>]*w:before="[5-9][0-9]{2,}"[^>]*>/gi, '<w:spacing w:before="0"/>');
  documentXml = documentXml.replace(/<w:spacing[^>]*w:after="[5-9][0-9]{2,}"[^>]*>/gi, '<w:spacing w:after="0"/>');
  // 7. 移除孤行控制和段中不分页设置
  documentXml = documentXml.replace(/w:widowControl="[^"]*"/gi, '');
  documentXml = documentXml.replace(/<w:keepNext\/>/gi, '');
  documentXml = documentXml.replace(/<w:keepLines\/>/gi, '');
  // 8. 移除表格的"允许跨页断行"设置（tblLook可能包含此设置）
  documentXml = documentXml.replace(/<w:tblLook[^>]*>/gi, '');
  // 9. 移除段落的分页属性
  documentXml = documentXml.replace(/<w:pPr>.*?<w:pageBreakBefore[^>]*>.*?<\/w:pPr>/gi, '');
  // 10. 移除所有tblPrEx（表格属性例外）
  documentXml = documentXml.replace(/<w:tblPrEx>.*?<\/w:tblPrEx>/gi, '');
  
  // 更新zip中的document.xml
  zip.file('word/document.xml', documentXml);
  
  // 生成新的buffer
  const resultBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  logger.info('翻译模块', `文档翻译完成，输出大小: ${resultBuffer.length} 字节`);
  return resultBuffer;
}

// 简单的文件日志函数
function logToFile(message) {
  const logPath = path.join(__dirname, '..', 'translation.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

// 在路由之前记录请求
router.use('/translate-document', (req, res, next) => {
  const logFile = path.join(__dirname, '..', 'debug.log');
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] Middleware hit: ${req.method} ${req.path}\n`);
  next();
});

router.post('/translate-document', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      logger.error('翻译模块', '文件上传失败:', err.message);
      return res.status(400).json({
        success: false,
        message: '文件上传失败: ' + err.message
      });
    }
    next();
  });
}, async (req, res) => {
  const file = req.file;

  if (!file) {
    logger.error('翻译模块', '未上传文件');
    return res.status(400).json({
      success: false,
      message: '请上传文件'
    });
  }

  if (!file.originalname.match(/\.(docx)$/i)) {
    logger.error('翻译模块', '文件格式错误:', file.originalname);
    return res.status(400).json({
      success: false,
      message: '只支持Word格式(.docx)的文档'
    });
  }

  // 创建翻译任务
  const translationTask = async () => {
    try {
      logger.info('翻译模块', `开始处理文档: ${file.originalname}, 大小: ${file.buffer.length} 字节`);

      // 自动检测文档语言
      logger.info('翻译模块', '检测文档语言...');
      const detectedLang = await detectDocumentLanguage(file.buffer);
      logger.info('翻译模块', `检测到语言: ${detectedLang}`);
      
      // 根据检测到的语言自动设置翻译方向
      const from = detectedLang;
      const to = detectedLang === 'zh' ? 'en' : 'zh';
      logger.info('翻译模块', `自动翻译方向: ${from} -> ${to}`);

      // 直接操作Word文档XML进行翻译，保留所有格式
      logger.info('翻译模块', '开始翻译文档...');
      const buf = await translateDocxBuffer(file.buffer, from, to);
      logger.info('翻译模块', `翻译完成，输出大小: ${buf.length} 字节`);

      const fileName = file.originalname.replace(/\.docx$/i, '_translated.docx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.send(buf);

    } catch (error) {
      logger.error('翻译模块', '文档翻译失败:', error.message);
      logger.error('翻译模块', '错误堆栈:', error.stack);
      res.status(500).json({
        success: false,
        message: '文档翻译失败: ' + error.message
      });
    }
  };

  // 添加到任务队列
  translationQueue.addTask(translationTask);
});

router.post('/translate-text', async (req, res) => {
  try {
    const { text, direction } = req.body;

    if (!text || !text.trim()) {
      logger.error('翻译模块', '未输入需要翻译的文本');
      return res.status(400).json({
        success: false,
        message: '请输入需要翻译的文本'
      });
    }

    const from = direction === 'zh2en' ? 'zh' : 'en';
    const to = direction === 'zh2en' ? 'en' : 'zh';

    logger.info('翻译模块', `开始翻译文本，长度: ${text.length}, 方向: ${from} -> ${to}`);
    const translatedText = await translateTextWithBaidu(text.trim(), from, to);
    logger.info('翻译模块', `文本翻译完成，结果长度: ${translatedText.length}`);

    res.json({
      success: true,
      translatedText: translatedText
    });

  } catch (error) {
    logger.error('翻译模块', '文本翻译失败:', error.message);
    res.status(500).json({
      success: false,
      message: '文本翻译失败: ' + error.message
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '翻译服务正常运行',
    cacheSize: '使用公共缓存机制'
  });
});

module.exports = router;
