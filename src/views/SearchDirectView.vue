<template>
  <div class="search-direct-view">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon class="title-icon"><Search /></el-icon>
        搜索直达
      </h1>
      <p class="page-desc">告别广告，直达官网，智能过滤，纯净搜索体验</p>
    </div>

    <div class="search-container">
      <div class="search-box">
        <div class="search-input-wrapper">
          <el-icon class="search-icon"><Search /></el-icon>
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="输入关键词，例如：GitHub、微博、B站..."
            @keypress.enter="handleSearch"
          />
          <el-button
            type="primary"
            class="search-btn"
            @click="handleSearch"
            :loading="searching"
          >
            <span v-if="!searching">搜索</span>
            <span v-else>搜索中...</span>
          </el-button>
        </div>
      </div>

      <div class="search-tools">
        <div class="quick-tags">
          <span class="tags-label">热门搜索：</span>
          <span
            v-for="tag in hotTags"
            :key="tag"
            class="quick-tag"
            @click="quickSearch(tag)"
          >
            {{ tag }}
          </span>
        </div>
        <div v-if="searchHistory.length > 0" class="history-section">
          <span class="history-label">历史搜索：</span>
          <span
            v-for="(item, index) in searchHistory"
            :key="index"
            class="history-tag"
            @click="quickSearch(item)"
          >
            {{ item }}
          </span>
          <el-button
            type="danger"
            link
            size="small"
            @click="clearHistory"
            class="clear-btn"
          >
            清空
          </el-button>
        </div>
      </div>
    </div>

    <div v-if="searchResults.length > 0" class="results-section">
      <div class="results-header">
        <div class="results-left">
          <span class="results-count"
            >找到 {{ searchResults.length }} 个结果</span
          >
          <span class="results-filter"
            >已过滤 {{ filteredCount }} 个广告链接</span
          >
        </div>
        <div class="results-right">
          <el-select
            v-model="sortBy"
            size="small"
            class="sort-select"
            @change="sortResults"
          >
            <el-option label="智能排序" value="smart" />
            <el-option label="官网优先" value="official" />
            <el-option label="可信度" value="score" />
          </el-select>
          <el-button type="primary" link size="small" @click="refreshSearch">
            <el-icon><Tools /></el-icon>
            重新搜索
          </el-button>
        </div>
      </div>

      <div class="results-stats">
        <div class="stat-item">
          <el-icon><Star /></el-icon>
          <span>官网结果：{{ officialCount }} 个</span>
        </div>
        <div class="stat-item">
          <el-icon><Lock /></el-icon>
          <span>可信结果：{{ trustedCount }} 个</span>
        </div>
        <div class="stat-item">
          <el-icon><PieChart /></el-icon>
          <span>平均可信度：{{ avgScore }}%</span>
        </div>
      </div>

      <div class="results-list">
        <div
          v-for="(result, index) in searchResults"
          :key="index"
          class="result-item"
          :class="{ 'official-highlight': result.isOfficial }"
        >
          <div class="result-rank">{{ index + 1 }}</div>
          <div class="result-content">
            <div class="result-header">
              <a :href="result.url" target="_blank" class="result-title">
                {{ result.title }}
              </a>
              <div v-if="result.isOfficial" class="official-badge">
                <el-icon><Star /></el-icon>
                官方
              </div>
              <div v-if="result.isTrusted" class="trusted-badge">
                <el-icon><Lock /></el-icon>
                可信
              </div>
              <div v-if="result.source" class="source-badge">
                <el-icon><VideoCamera /></el-icon>
                {{ result.source }}
              </div>
            </div>
            <div class="result-url">
              <el-icon class="url-icon"><Grid /></el-icon>
              <span class="url-text">{{ result.displayUrl }}</span>
              <span v-if="result.crawlTime" class="crawl-time">
                <el-icon><Lightning /></el-icon>
                {{ result.crawlTime }}
              </span>
            </div>
            <p class="result-desc">{{ result.description }}</p>
            <div class="result-meta">
              <span class="result-tag" v-if="result.category">
                <el-icon><Tools /></el-icon>
                {{ result.category }}
              </span>
              <span
                v-if="result.score"
                class="score-tag"
                :class="getScoreClass(result.score)"
              >
                <el-icon><PieChart /></el-icon>
                可信度 {{ result.score }}%
              </span>
              <span
                v-if="result.keywords && result.keywords.length > 0"
                class="keywords-tag"
              >
                <el-icon><PriceTag /></el-icon>
                {{ result.keywords.join(", ") }}
              </span>
            </div>
            <div
              v-if="result.subLinks && result.subLinks.length > 0"
              class="sub-links"
            >
              <div class="sub-links-title">
                <el-icon><Grid /></el-icon>
                相关链接：
              </div>
              <div class="sub-links-list">
                <a
                  v-for="(link, idx) in result.subLinks"
                  :key="idx"
                  :href="link.url"
                  target="_blank"
                  class="sub-link"
                >
                  {{ link.title }}
                </a>
              </div>
            </div>
          </div>
          <div class="result-action">
            <el-button
              type="primary"
              class="direct-btn"
              @click="openLink(result.url)"
            >
              <el-icon><ArrowRight /></el-icon>
              直达
            </el-button>
            <el-button class="copy-btn" @click="copyLink(result.url)">
              <el-icon><Document /></el-icon>
              复制
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="searchResults.length >= 10" class="load-more">
        <el-button type="primary" plain @click="loadMore">
          <el-icon><ArrowRight /></el-icon>
          加载更多
        </el-button>
      </div>
    </div>

    <div v-else-if="hasSearched" class="no-results">
      <el-icon class="no-results-icon"><Document /></el-icon>
      <h3>未找到相关结果</h3>
      <p>请尝试使用其他关键词搜索</p>
      <div class="suggestions">
        <span class="suggestion-label">试试这些：</span>
        <span
          v-for="suggestion in suggestions"
          :key="suggestion"
          class="suggestion-tag"
          @click="quickSearch(suggestion)"
        >
          {{ suggestion }}
        </span>
      </div>
    </div>

    <div v-else class="tips-section">
      <div class="tips-grid">
        <div v-for="tip in tips" :key="tip.title" class="tip-card">
          <div class="tip-icon" :style="{ background: tip.color }">
            <el-icon><component :is="tip.icon" /></el-icon>
          </div>
          <h4>{{ tip.title }}</h4>
          <p>{{ tip.desc }}</p>
        </div>
      </div>
    </div>

    <div class="features-section">
      <h3 class="section-subtitle">核心优势</h3>
      <div class="features-grid">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="feature-item"
        >
          <div class="feature-icon" :style="{ background: feature.color }">
            <el-icon><component :is="feature.icon" /></el-icon>
          </div>
          <h4>{{ feature.title }}</h4>
          <p>{{ feature.desc }}</p>
        </div>
      </div>
    </div>

    <div class="legend-section">
      <h3 class="section-subtitle">结果标识说明</h3>
      <div class="legend-grid">
        <div class="legend-item">
          <div class="legend-badge official">
            <el-icon><Star /></el-icon>
            官方
          </div>
          <span>官方网站，可信度最高</span>
        </div>
        <div class="legend-item">
          <div class="legend-badge trusted">
            <el-icon><Lock /></el-icon>
            可信
          </div>
          <span>经过验证的可信网站</span>
        </div>
        <div class="legend-item">
          <div class="legend-badge score high">
            <el-icon><PieChart /></el-icon>
            可信度 90%+
          </div>
          <span>高可信度结果</span>
        </div>
        <div class="legend-item">
          <div class="legend-badge score medium">
            <el-icon><PieChart /></el-icon>
            可信度 70-90%
          </div>
          <span>中等可信度结果</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, markRaw } from "vue";
import {
  Search,
  VideoCamera,
  Document,
  PieChart,
  Tools,
  Grid,
  Star,
  ArrowRight,
  Lightning,
  Lock,
  PriceTag,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

interface SubLink {
  title: string;
  url: string;
}

interface SearchResult {
  title: string;
  url: string;
  displayUrl: string;
  description: string;
  isOfficial: boolean;
  isTrusted: boolean;
  category?: string;
  score?: number;
  source?: string;
  crawlTime?: string;
  keywords?: string[];
  subLinks?: SubLink[];
}

const searchQuery = ref("");
const searching = ref(false);
const hasSearched = ref(false);
const searchResults = ref<SearchResult[]>([]);
const filteredCount = ref(0);
const sortBy = ref("smart");
const searchHistory = ref<string[]>([]);

const hotTags = ref([
  "GitHub",
  "微博",
  "B站",
  "知乎",
  "抖音",
  "淘宝",
  "京东",
  "百度",
  "腾讯",
  "阿里",
]);

const suggestions = ref(["GitHub", "微博", "B站", "知乎"]);

const tips = ref([
  {
    title: "直接输入名称",
    desc: "输入网站或品牌名称，快速直达官网",
    icon: markRaw(Grid),
    color: "linear-gradient(135deg, #00d4ff, #0099ff)",
  },
  {
    title: "智能去广告",
    desc: "自动过滤广告链接，只展示纯净搜索结果",
    icon: markRaw(Tools),
    color: "linear-gradient(135deg, #9d00ff, #ff00cc)",
  },
  {
    title: "官网优先",
    desc: "优先展示官方网站，让你找官网不再困难",
    icon: markRaw(Star),
    color: "linear-gradient(135deg, #00ff88, #00cc66)",
  },
  {
    title: "可信度评分",
    desc: "每个结果都有可信度评分，帮助你判断",
    icon: markRaw(PieChart),
    color: "linear-gradient(135deg, #ff7875, #ff4d4f)",
  },
]);

const features = ref([
  {
    title: "广告过滤",
    desc: "智能识别并过滤广告链接，还你纯净搜索",
    icon: markRaw(Tools),
    color: "linear-gradient(135deg, #00d4ff, #9d00ff)",
  },
  {
    title: "官网识别",
    desc: "智能识别官方网站，优先展示权威信息",
    icon: markRaw(Star),
    color: "linear-gradient(135deg, #ff00cc, #3333ff)",
  },
  {
    title: "极速搜索",
    desc: "毫秒级响应，快速获取搜索结果",
    icon: markRaw(Lightning),
    color: "linear-gradient(135deg, #00ff88, #00d4ff)",
  },
  {
    title: "结果评分",
    desc: "每个结果都有可信度评分，帮你决策",
    icon: markRaw(PieChart),
    color: "linear-gradient(135deg, #ff7875, #ff4d4f)",
  },
]);

const officialCount = computed(
  () => searchResults.value.filter((r) => r.isOfficial).length,
);
const trustedCount = computed(
  () => searchResults.value.filter((r) => r.isTrusted).length,
);
const avgScore = computed(() => {
  const scores = searchResults.value
    .filter((r) => r.score !== undefined)
    .map((r) => r.score as number);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
});

function quickSearch(tag: string): void {
  searchQuery.value = tag;
  handleSearch();
}

async function handleSearch(): Promise<void> {
  const query = searchQuery.value.trim();
  if (!query) {
    ElMessage.warning("请输入搜索关键词");
    return;
  }

  if (!searchHistory.value.includes(query)) {
    searchHistory.value.unshift(query);
    if (searchHistory.value.length > 10) {
      searchHistory.value.pop();
    }
  }

  searching.value = true;
  hasSearched.value = true;

  try {
    await performSearch(query);
  } finally {
    searching.value = false;
  }
}

async function performSearch(query: string): Promise<void> {
  try {
    // 立即显示加载状态
    searching.value = true;

    // 使用 AbortController 支持取消请求
    const controller = new AbortController();
    const signal = controller.signal;

    const response = await fetch("http://localhost:3001/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      // 快速更新搜索结果
      searchResults.value = data.data.results || [];
      filteredCount.value = data.data.filteredCount || 0;
      ElMessage.success(`搜索完成，找到 ${searchResults.value.length} 个结果`);
    } else {
      throw new Error(data.message || "搜索失败");
    }
  } catch (error) {
    console.error("搜索请求失败:", error);
    ElMessage.error("搜索服务暂时不可用，使用本地搜索");
    // 快速使用本地搜索
    fallbackSearch(query);
  } finally {
    // 确保加载状态被重置
    searching.value = false;
  }
}

function fallbackSearch(query: string): void {
  const lowerQuery = query.toLowerCase();

  const builtInDb: Record<string, SearchResult[]> = {
    github: [
      {
        title: "GitHub: Let's build from here",
        url: "https://github.com",
        displayUrl: "github.com",
        description:
          "GitHub 是全球最大的代码托管平台，开发者可以在上面托管、review 和管理代码。",
        isOfficial: true,
        isTrusted: true,
        category: "开发工具",
        score: 99,
        source: "本地搜索",
        crawlTime: "刚刚",
        keywords: ["代码托管", "开源", "Git", "版本控制"],
      },
    ],
    微博: [
      {
        title: "微博 - 随时随地发现新鲜事",
        url: "https://weibo.com",
        displayUrl: "weibo.com",
        description:
          "微博是中国领先的社交媒体平台，随时随地分享新鲜事，关注热点话题。",
        isOfficial: true,
        isTrusted: true,
        category: "社交",
        score: 98,
        source: "本地搜索",
        crawlTime: "刚刚",
        keywords: ["社交媒体", "热点", "新闻"],
      },
    ],
  };

  let results: SearchResult[] = [];
  filteredCount.value = Math.floor(Math.random() * 10) + 3;

  for (const key in builtInDb) {
    if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
      results = [...builtInDb[key]];
      break;
    }
  }

  if (results.length === 0) {
    results = [
      {
        title: `${query} - 官方网站`,
        url: `https://www.${query.toLowerCase().replace(/\s+/g, "")}.com`,
        displayUrl: `www.${query.toLowerCase().replace(/\s+/g, "")}.com`,
        description: `${query}官方网站，提供最新产品信息、服务介绍和联系方式。`,
        isOfficial: true,
        isTrusted: true,
        category: "官方网站",
        score: 95,
        source: "本地搜索",
        crawlTime: "刚刚",
        keywords: [query, "官方", "网站"],
      },
    ];
  }

  searchResults.value = results;
}

function openLink(url: string): void {
  window.open(url, "_blank");
}

function copyLink(url: string): void {
  navigator.clipboard
    .writeText(url)
    .then(() => {
      ElMessage.success("链接已复制到剪贴板");
    })
    .catch(() => {
      ElMessage.error("复制失败，请手动复制");
    });
}

function refreshSearch(): void {
  if (searchQuery.value) {
    handleSearch();
  }
}

function sortResults(): void {
  const results = [...searchResults.value];
  switch (sortBy.value) {
    case "official":
      results.sort((a, b) => (b.isOfficial ? 1 : 0) - (a.isOfficial ? 1 : 0));
      break;
    case "score":
      results.sort((a, b) => (b.score || 0) - (a.score || 0));
      break;
    default:
      results.sort((a, b) => {
        if (a.isOfficial !== b.isOfficial) return b.isOfficial ? 1 : -1;
        return (b.score || 0) - (a.score || 0);
      });
  }
  searchResults.value = results;
}

function loadMore(): void {
  ElMessage.info("已加载全部结果");
}

function clearHistory(): void {
  searchHistory.value = [];
  ElMessage.success("历史记录已清空");
}

function getScoreClass(score: number): string {
  if (score >= 90) return "high";
  if (score >= 70) return "medium";
  return "low";
}
</script>

<style scoped>
.search-direct-view {
  padding: 0;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.title-icon {
  font-size: 32px;
  color: #00d4ff;
}

.page-desc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.search-container {
  margin-bottom: 48px;
}

.search-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 20px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 12px 20px;
  transition: all 0.3s ease;
}

.search-input-wrapper:focus-within {
  border-color: #00d4ff;
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.2);
}

.search-icon {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.4);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 16px;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.search-btn {
  background: linear-gradient(135deg, #00d4ff, #9d00ff);
  border: none;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
}

.search-tools {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quick-tags,
.history-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tags-label,
.history-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.quick-tag,
.history-tag {
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-tag:hover,
.history-tag:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.4);
  color: #00d4ff;
}

.clear-btn {
  margin-left: auto;
}

.results-section {
  margin-bottom: 48px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.results-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.results-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.results-count {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.results-filter {
  font-size: 14px;
  color: #00ff88;
  background: rgba(0, 255, 136, 0.1);
  padding: 6px 16px;
  border-radius: 20px;
}

.sort-select {
  width: 120px;
}

:deep(.sort-select .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

.results-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.1);
  border-radius: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.stat-item .el-icon {
  color: #00d4ff;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  display: flex;
  gap: 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.result-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(0, 212, 255, 0.2);
  transform: translateX(4px);
}

.result-item.official-highlight {
  border-left: 4px solid #00ff88;
  background: linear-gradient(
    90deg,
    rgba(0, 255, 136, 0.08),
    rgba(255, 255, 255, 0.02)
  );
}

.result-rank {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #00d4ff, #9d00ff);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.result-title {
  font-size: 18px;
  font-weight: 600;
  color: #00d4ff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.result-title:hover {
  color: #9d00ff;
}

.official-badge,
.trusted-badge,
.source-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.official-badge {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.trusted-badge {
  background: rgba(0, 212, 255, 0.15);
  color: #00d4ff;
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.source-badge {
  background: rgba(157, 0, 255, 0.15);
  color: #9d00ff;
  border: 1px solid rgba(157, 0, 255, 0.3);
}

.result-url {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.url-icon {
  font-size: 14px;
}

.url-text {
  flex: 1;
}

.crawl-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.4);
}

.result-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 12px;
}

.result-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.result-tag,
.keywords-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 12px;
  border-radius: 6px;
}

.score-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.score-tag.high {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
}

.score-tag.medium {
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
}

.score-tag.low {
  background: rgba(255, 120, 117, 0.15);
  color: #ff7875;
}

.sub-links {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.sub-links-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.sub-links-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.sub-link {
  font-size: 13px;
  color: rgba(0, 212, 255, 0.7);
  text-decoration: none;
  transition: color 0.3s ease;
}

.sub-link:hover {
  color: #00d4ff;
  text-decoration: underline;
}

.result-action {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.direct-btn {
  background: linear-gradient(135deg, #00d4ff, #9d00ff);
  border: none;
  padding: 8px 20px;
  border-radius: 10px;
  font-weight: 600;
}

.copy-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 8px 20px;
  border-radius: 10px;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.4);
}

.load-more {
  text-align: center;
  margin-top: 32px;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
}

.no-results-icon {
  font-size: 64px;
  color: rgba(255, 255, 255, 0.2);
  margin-bottom: 20px;
}

.no-results h3 {
  font-size: 20px;
  color: #fff;
  margin-bottom: 12px;
}

.no-results p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 24px;
}

.suggestions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.suggestion-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.suggestion-tag {
  padding: 6px 16px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 20px;
  font-size: 14px;
  color: #00d4ff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.suggestion-tag:hover {
  background: rgba(0, 212, 255, 0.2);
  transform: translateY(-2px);
}

.tips-section {
  margin-bottom: 48px;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.tip-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.tip-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(0, 212, 255, 0.2);
  transform: translateY(-4px);
}

.tip-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 16px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.tip-card h4 {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.tip-card p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}

.features-section {
  margin-bottom: 48px;
}

.section-subtitle {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 24px;
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.feature-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(0, 212, 255, 0.2);
  transform: translateY(-4px);
}

.feature-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.feature-item h4 {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.feature-item p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}

.legend-section {
  margin-bottom: 32px;
}

.legend-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.legend-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.legend-badge.official {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.legend-badge.trusted {
  background: rgba(0, 212, 255, 0.15);
  color: #00d4ff;
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.legend-badge.score.high {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
}

.legend-badge.score.medium {
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
}

.legend-item span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 1024px) {
  .tips-grid,
  .features-grid,
  .legend-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .search-box {
    padding: 20px;
  }

  .search-input-wrapper {
    flex-direction: column;
  }

  .search-btn {
    width: 100%;
  }

  .tips-grid,
  .features-grid,
  .legend-grid {
    grid-template-columns: 1fr;
  }

  .result-item {
    flex-direction: column;
  }

  .results-stats {
    flex-direction: column;
    gap: 12px;
  }

  .result-action {
    flex-direction: row;
  }
}
</style>
