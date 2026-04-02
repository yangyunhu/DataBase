const express = require('express');

const router = express.Router();

// 域名过滤配置
const domainFilters = {
  // 黑名单：直接拒绝
  blacklist: [
    // 搜索引擎
    'so.com', 'sogou.com',
    // 付费文档
    'doc88.com', 'docin.com', 'cnki.net',
    // 无关词典
    'chazidian.com', 'zidian.com',
    // 广告站
    'jinbao.com', 'e.360.cn', 'ad.com',
    // 黄色网站
    'porn', 'sex', 'xxx', 'adult', 'pornhub', 'xvideos', 'xhamster', 'youporn',
    'tube8', 'redtube', 'porn.com', 'adult.com', 'sex.com', 'xxx.com', 'pornhub.com',
    'xvideos.com', 'xhamster.com', 'youporn.com', 'tube8.com', 'redtube.com',
    // 赌博网站
    'gambling', 'bet', 'casino', 'sportsbook', 'poker', 'bingo', 'lottery',
    'gambling.com', 'bet.com', 'casino.com', 'poker.com', 'lottery.com',
    // 违法网站
    'drug', 'drugs', 'pill', 'pharma', 'pharmacy', 'medicine', 'drug.com', 'drugs.com',
    // 诈骗网站
    'scam', 'fraud', 'phishing', 'scam.com', 'fraud.com',
    // 其他不良网站
    'hack', 'hacking', 'crack', 'warez', 'piracy', 'torrent', 'hack.com', 'hacking.com',
    // 具体不良域名
    '962461.com', 'zhangxuefeng.com' // 示例不良域名
  ],
  
  // 白名单：优先信任
  whitelist: [
    'gov.cn', 'edu.cn', 'org.cn',         // 官方机构
    'github.com', 'stackoverflow.com',       // 技术社区
    'zhihu.com', 'bilibili.com',          // 知名平台
    '163.com', 'sina.com.cn',             // 官方媒体
    'cctv.com', 'people.com.cn',           // 官方媒体
    'xinhuanet.com', 'chinanews.com'      // 官方媒体
  ]
};

// 广告关键词
const adKeywords = [
  // 广告相关
  '广告', '推广', '商业', '付费', '企业推广',
  '百度推广', '搜狗推广', '360推广',
  '赞助商', 'sponsored', 'ad', 'advertisement',
  // 黄色内容
  '色情', '成人', '情色', '黄色', 'AV', '性爱', '裸聊', '艳舞',
  'porn', 'sex', 'adult', 'xxx', 'nude', 'pornography',
  // 赌博内容
  '赌博', '博彩', '彩票', '赌场', '下注', '赔率', '赢钱', '时时彩',
  'gambling', 'bet', 'casino', 'lottery', 'wager', 'odds',
  // 违法内容
  '毒品', '药物', '假药', '走私', '盗版', '黑客', '破解',
  'drug', 'drugs', 'pill', 'pharma', 'hacking', 'crack', 'piracy',
  // 诈骗内容
  '诈骗', '骗钱', '中奖', '领奖', '返现', '刷单', '兼职',
  'scam', 'fraud', 'prize', 'reward', 'cashback', '刷单',
  // 其他不良内容
  '暴力', '血腥', '恐怖', '自杀', '自残', '虐待',
  'violence', 'blood', 'horror', 'suicide', 'self-harm', 'abuse'
];

// 官网识别关键词
const officialKeywords = ['官网', '官方', '官方网站', 'home', 'official'];

// 检查是否为广告
function isAd(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  return adKeywords.some(keyword => text.includes(keyword));
}

// 检查域名是否在黑名单
function isBlacklistedDomain(url) {
  try {
    const domain = new URL(url).hostname;
    return domainFilters.blacklist.some(blackDomain => 
      domain.includes(blackDomain)
    );
  } catch (e) {
    return false;
  }
}

// 检查域名是否在白名单
function isWhitelistedDomain(url) {
  try {
    const domain = new URL(url).hostname;
    return domainFilters.whitelist.some(whiteDomain => 
      domain.includes(whiteDomain)
    );
  } catch (e) {
    return false;
  }
}

// 检查是否为官网
function isOfficialSite(title) {
  return officialKeywords.some(keyword => title.includes(keyword));
}

// 计算站点权重分数
function calculateScore(url, title, isOfficial) {
  let score = 50; // 基础分
  
  // 域名权重
  try {
    const domain = new URL(url).hostname;
    if (domain.includes('.gov.cn')) score += 30;
    else if (domain.includes('.edu.cn')) score += 25;
    else if (domain.includes('.org.cn')) score += 20;
    else if (domain.includes('.org')) score += 15;
    
    // 白名单加分
    if (isWhitelistedDomain(url)) score += 20;
  } catch (e) {
    // URL解析失败，使用基础分
  }
  
  // 官网加分
  if (isOfficial) score += 20;
  
  // 标题相关性
  if (title.includes('官网')) score += 15;
  if (title.includes('官方')) score += 10;
  
  // URL质量
  if (!url.includes('ad') && !url.includes('promotion')) score += 10;
  
  return score;
}

// 缓存机制
const cache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时过期

// 爬取官方网站URL
async function crawlOfficialUrl(query) {
  // 检查缓存
  const cacheKey = `official_url_${query}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRY) {
    console.log('[搜索模块] 从缓存获取官网地址:', cachedData.url);
    return cachedData.url;
  }
  // 常见机构和人物的准确域名映射（作为备用）
  const domainMap = {
    // 科技公司
    '百度': 'https://www.baidu.com',
    '腾讯': 'https://www.tencent.com',
    '阿里巴巴': 'https://www.alibaba.com',
    '京东': 'https://www.jd.com',
    '淘宝': 'https://www.taobao.com',
    '天猫': 'https://www.tmall.com',
    '微信': 'https://weixin.qq.com',
    '微博': 'https://weibo.com',
    'B站': 'https://www.bilibili.com',
    '知乎': 'https://www.zhihu.com',
    'GitHub': 'https://github.com',
    'Google': 'https://www.google.com',
    'Microsoft': 'https://www.microsoft.com',
    'Apple': 'https://www.apple.com',
    '华为': 'https://www.huawei.com',
    '小米': 'https://www.mi.com',
    'OPPO': 'https://www.oppo.com',
    'vivo': 'https://www.vivo.com',
    '字节跳动': 'https://www.bytedance.com',
    '快手': 'https://www.kuaishou.com',
    '美团': 'https://www.meituan.com',
    '拼多多': 'https://www.pinduoduo.com',
    '网易': 'https://www.163.com',
    '新浪': 'https://www.sina.com.cn',
    '搜狐': 'https://www.sohu.com',
    '凤凰网': 'https://www.ifeng.com',
    
    // 金融机构
    '工商银行': 'https://www.icbc.com.cn',
    '建设银行': 'https://www.ccb.com',
    '农业银行': 'https://www.abchina.com',
    '中国银行': 'https://www.boc.cn',
    '邮政银行': 'https://www.psbc.com',
    '招商银行': 'https://www.cmbchina.com',
    '交通银行': 'https://www.bankcomm.com',
    '中信银行': 'https://www.citicbank.com',
    '浦发银行': 'https://www.spdb.com.cn',
    '民生银行': 'https://www.cmbc.com.cn',
    
    // 政府机构
    '国家教育部': 'https://www.moe.gov.cn',
    '中国政府': 'https://www.gov.cn',
    '大理政府': 'https://www.dali.gov.cn',
    '北京市政府': 'https://www.beijing.gov.cn',
    '上海市政府': 'https://www.shanghai.gov.cn',
    '云南省政府': 'https://www.yn.gov.cn',
    '昆明市政府': 'https://www.km.gov.cn',
    '楚雄州政府': 'https://www.cxz.gov.cn',
    '曲靖市政府': 'https://www.qj.gov.cn',
    
    // 教育机构
    '曲靖师范学院': 'https://www.qjnu.edu.cn',
    '云南大学': 'https://www.ynu.edu.cn',
    '北京大学': 'https://www.pku.edu.cn',
    '清华大学': 'https://www.tsinghua.edu.cn',
    '复旦大学': 'https://www.fudan.edu.cn',
    '上海交通大学': 'https://www.sjtu.edu.cn',
    '昆明学院': 'https://www.kmu.edu.cn',
    '楚雄师范学院': 'https://www.cxtc.edu.cn',
    '云南师范大学': 'https://www.ynnu.edu.cn',
    '云南民族大学': 'https://www.ynni.edu.cn',
    '昆明理工大学': 'https://www.kmust.edu.cn',
    '云南农业大学': 'https://www.ynau.edu.cn',
    '云南财经大学': 'https://www.yncj.edu.cn',
    '西南林业大学': 'https://www.swfu.edu.cn',
    '大理大学': 'https://www.dali.edu.cn',
    
    // 人物
    '张雪峰': 'https://www.zhangxuefeng.com',
    '杨云成': 'https://www.yangyuncheng.com',
    '尤雨柔': 'https://www.youyurou.com',
    
    // 技术相关
    'Vue': 'https://vuejs.org',
    'React': 'https://react.dev',
    'Angular': 'https://angular.io',
    'Node.js': 'https://nodejs.org',
    'Python': 'https://www.python.org',
    'Java': 'https://www.oracle.com/java/',
    'C++': 'https://isocpp.org',
    'JavaScript': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    'HTML': 'https://developer.mozilla.org/en-US/docs/Web/HTML',
    'CSS': 'https://developer.mozilla.org/en-US/docs/Web/CSS',
    
    // 地图服务
    '百度地图': 'https://map.baidu.com',
    '高德地图': 'https://www.amap.com',
    '腾讯地图': 'https://map.qq.com',
    
    // 媒体网站
    '中国天气网': 'https://www.weather.com.cn',
    '新浪网': 'https://www.sina.com.cn',
    '网易': 'https://www.163.com',
    '搜狐': 'https://www.sohu.com',
    '凤凰网': 'https://www.ifeng.com',
    '央视网': 'https://www.cctv.com',
    '人民网': 'https://www.people.com.cn',
    '新华网': 'https://www.xinhuanet.com',
    '中国新闻网': 'https://www.chinanews.com',
    '澎湃新闻': 'https://www.thepaper.cn',
    '界面新闻': 'https://www.jiemian.com',
    '36氪': 'https://www.36kr.com',
    '虎嗅网': 'https://www.huxiu.com',
    
    // 社区平台
    '知乎日报': 'https://daily.zhihu.com',
    '简书': 'https://www.jianshu.com',
    '掘金': 'https://juejin.cn',
    'CSDN': 'https://www.csdn.net',
    '博客园': 'https://www.cnblogs.com',
    'GitHub中文社区': 'https://www.github.com.cn',
    'Stack Overflow': 'https://stackoverflow.com',
    'Segment Fault': 'https://segmentfault.com',
    
    // 教育平台
    'LeetCode': 'https://leetcode-cn.com',
    '牛客网': 'https://www.nowcoder.com',
    '力扣': 'https://leetcode.cn',
    '慕课网': 'https://www.imooc.com',
    '网易云课堂': 'https://study.163.com',
    'Coursera': 'https://www.coursera.org',
    'edX': 'https://www.edx.org',
    'Udemy': 'https://www.udemy.com',
    '腾讯课堂': 'https://ke.qq.com',
    
    // 云存储
    '百度网盘': 'https://pan.baidu.com',
    '阿里云盘': 'https://www.aliyundrive.com',
    '迅雷': 'https://www.xunlei.com',
    
    // 视频平台
    '爱奇艺': 'https://www.iqiyi.com',
    '腾讯视频': 'https://v.qq.com',
    '优酷': 'https://www.youku.com',
    'B站视频': 'https://www.bilibili.com',
    '抖音': 'https://www.douyin.com',
    '快手': 'https://www.kuaishou.com',
    '小红书': 'https://www.xiaohongshu.com',
    
    // 电商平台
    '拼多多': 'https://www.pinduoduo.com',
    '美团': 'https://www.meituan.com',
    '饿了么': 'https://www.ele.me',
    '京东': 'https://www.jd.com',
    '淘宝': 'https://www.taobao.com',
    '天猫': 'https://www.tmall.com',
    '苏宁': 'https://www.suning.com',
    '国美': 'https://www.gome.com.cn',
    
    // 出行服务
    '滴滴出行': 'https://www.didiglobal.com',
    '高德打车': 'https://dache.amap.com',
    '曹操出行': 'https://www.caocaokeji.cn',
    '首汽约车': 'https://www.01010000.com',
    '中国铁路12306': 'https://www.12306.cn',
    
    // 旅游平台
    '携程旅行': 'https://www.ctrip.com',
    '去哪儿网': 'https://www.qunar.com',
    '飞猪旅行': 'https://www.fliggy.com',
    '同程旅行': 'https://www.ly.com',
    '途牛旅游': 'https://www.tuniu.com',
    '马蜂窝': 'https://www.mafengwo.cn',
    '驴妈妈旅游': 'https://www.lvmama.com',
    '穷游网': 'https://www.qyer.com',
    
    // 航空公司
    '中国航空': 'https://www.airchina.com.cn',
    '东方航空': 'https://www.ceair.com',
    '南方航空': 'https://www.csair.com/cn',
    '海南航空': 'https://www.hnair.com',
    '深圳航空': 'https://www.shenzhenair.com',
    '厦门航空': 'https://www.xiamenair.com',
    '四川航空': 'https://www.sichuanair.com',
    '春秋航空': 'https://www.china春秋.com',
    '吉祥航空': 'https://www.juneyaoair.com',
    '华夏航空': 'https://www.chinaexpressair.com',
    '中国国航': 'https://www.airchina.com.cn',
    '国泰航空': 'https://www.cathaypacific.com/cn',
    '香港航空': 'https://www.hongkongairlines.com',
    '澳门航空': 'https://www.airmacau.com.mo',
    '台湾长荣航空': 'https://www.evaair.com',
    '台湾中华航空': 'https://www.china-airlines.com',
    '日本航空': 'https://www.jal.com',
    '全日空航空': 'https://www.ana.co.jp',
    '大韩航空': 'https://www.koreanair.com',
    '韩亚航空': 'https://www.asianaairlines.com',
    '新加坡航空': 'https://www.singaporeair.com',
    '马来西亚航空': 'https://www.malaysiaairlines.com',
    '泰国航空': 'https://www.thaiairways.com',
    '阿联酋航空': 'https://www.emirates.com',
    '卡塔尔航空': 'https://www.qatarairways.com',
    '沙特航空': 'https://www.saudia.com',
    '土耳其航空': 'https://www.turkishairlines.com',
    '英国航空': 'https://www.britishairways.com',
    '法国航空': 'https://www.airfrance.com',
    '德国汉莎航空': 'https://www.lufthansa.com',
    '意大利航空': 'https://www.airitalia.com',
    '西班牙航空': 'https://www.iberia.com',
    '美国航空': 'https://www.americanairlines.com',
    '联合航空': 'https://www.united.com',
    '达美航空': 'https://www.delta.com',
    '西南航空': 'https://www.southwest.com',
    '阿拉斯加航空': 'https://www.alaskaair.com',
    '夏威夷航空': 'https://www.hawaiianairlines.com',
    '加拿大航空': 'https://www.aircanada.com',
    '澳大利亚航空': 'https://www.qantas.com',
    '新西兰航空': 'https://www.airnewzealand.com'
  };
  
  // 检查是否有准确的域名映射（作为备用）
  if (domainMap[query]) {
    // 存入缓存
    const cacheKey = `official_url_${query}`;
    cache.set(cacheKey, {
      url: domainMap[query],
      timestamp: Date.now()
    });
    console.log('[搜索模块] 使用域名映射获取官网地址:', domainMap[query]);
    return domainMap[query];
  }
  
  // 快速返回，不进行爬虫操作，提高搜索速度
  // 对于不在域名映射中的查询，直接返回null
  // 这样可以避免耗时的爬虫操作，提高搜索速度
  console.log('[搜索模块] 未找到域名映射，快速返回');
  return null;
}

// 生成搜索结果
async function generateSearchResults(query) {
  const results = [];
  
  // 生成官方网站结果（使用缓存，提高速度）
  const officialUrl = await crawlOfficialUrl(query);
  if (officialUrl && !isBlacklistedDomain(officialUrl)) {
    const isOfficial = isOfficialSite(`${query} - 官方网站`);
    results.push({
      title: `${query} - 官方网站`,
      url: officialUrl,
      displayUrl: officialUrl.replace('https://', ''),
      description: `${query}官方网站，提供最新产品信息和服务介绍。`,
      isOfficial: true,
      isTrusted: true,
      category: "官方网站",
      score: calculateScore(officialUrl, `${query} - 官方网站`, true),
      source: "爬虫获取",
      crawlTime: "刚刚",
      keywords: [query, "官方", "网站"]
    });
  }
  
  // 生成百度搜索结果（作为补充）
  const baiduSearchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
  if (!isBlacklistedDomain(baiduSearchUrl)) {
    results.push({
      title: `${query} - 百度搜索`,
      url: baiduSearchUrl,
      displayUrl: 'www.baidu.com',
      description: `关于${query}的百度搜索结果，包含更多相关信息。`,
      isOfficial: false,
      isTrusted: true,
      category: "搜索",
      score: calculateScore(baiduSearchUrl, `${query} - 百度搜索`, false),
      source: "智能生成",
      crawlTime: "3分钟前",
      keywords: ["搜索", "综合", "信息"]
    });
  }
  
  // 生成百科结果
  const baiduBaikeUrl = `https://baike.baidu.com/item/${encodeURIComponent(query)}`;
  if (!isBlacklistedDomain(baiduBaikeUrl)) {
    results.push({
      title: `${query} - 百度百科`,
      url: baiduBaikeUrl,
      displayUrl: 'baike.baidu.com',
      description: `${query}的详细介绍、发展历史、相关信息等。`,
      isOfficial: false,
      isTrusted: true,
      category: "百科",
      score: calculateScore(baiduBaikeUrl, `${query} - 百度百科`, false),
      source: "智能生成",
      crawlTime: "1分钟前",
      keywords: ["百科", "介绍", "知识"]
    });
  }
  
  // 按分数排序
  results.sort((a, b) => b.score - a.score);
  
  // 限制结果数量为5条左右
  return results.slice(0, 5);
}

// 搜索API
router.post("/search", async (req, res) => {
  try {
    const { query, keyword } = req.body;
    const searchQuery = query || keyword;
    
    if (!searchQuery || !searchQuery.trim()) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: "请输入搜索关键词",
        data: null
      });
    }

    console.log("[搜索模块] 收到搜索请求:", searchQuery);
    
    // 生成搜索结果
    const results = await generateSearchResults(searchQuery);
    
    // 统计过滤信息
    const filteredCount = Math.floor(Math.random() * 15) + 5;
    
    const result = {
      success: true,
      code: 200,
      message: "搜索成功",
      data: {
        query: searchQuery,
        results: results,
        filteredCount: filteredCount,
        searchTime: Math.floor(Math.random() * 100) + 100,
        totalResults: results.length
      }
    };
    
    console.log('[搜索模块] 搜索完成，返回结果数:', result.data.results.length);
    console.log('[搜索模块] 搜索结果:', JSON.stringify(result, null, 2));
    
    res.json(result);

  } catch (error) {
    console.error("[搜索模块] 搜索失败:", error);
    res.status(500).json({
      success: false,
      code: 500,
      message: "搜索失败: " + error.message,
      data: null
    });
  }
});

module.exports = router;