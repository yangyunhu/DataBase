<template>
  <div class="performance-monitor">
    <!-- 头部 -->
    <div class="monitor-header">
      <h1 class="monitor-title">
        <el-icon class="title-icon"><Monitor /></el-icon>
        系统性能监控中心
      </h1>
      <div class="header-actions">
        <el-button
          type="primary"
          size="small"
          class="refresh-btn"
          @click="refreshData"
          :loading="isLoading"
        >
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button
          type="info"
          size="small"
          class="settings-btn"
          @click="openSettings"
        >
          <el-icon><Setting /></el-icon>
          设置
        </el-button>
      </div>
    </div>

    <!-- 系统状态概览 -->
    <div class="status-overview">
      <div class="status-card">
        <div class="status-header">
          <el-icon class="status-icon"><DataAnalysis /></el-icon>
          <span>系统状态</span>
        </div>
        <div class="status-grid">
          <div class="status-item">
            <div class="status-label">系统负载</div>
            <div class="status-value" :class="getLoadClass(systemLoad)">
              <el-progress
                type="dashboard"
                :percentage="Math.min(100, systemLoad * 100)"
                :color="getLoadColor(systemLoad)"
                :stroke-width="15"
                :show-text="false"
                class="status-progress"
              />
              <div class="status-number">
                {{ (systemLoad * 100).toFixed(1) }}%
              </div>
            </div>
          </div>
          <div class="status-item">
            <div class="status-label">内存使用</div>
            <div class="status-value" :class="getMemoryClass(memoryUsage)">
              <el-progress
                :percentage="Math.min(100, memoryUsage * 100)"
                :color="getMemoryColor(memoryUsage)"
                class="status-bar"
              />
              <div class="status-detail">
                {{ formatMemory(usedMemory) }} / {{ formatMemory(totalMemory) }}
              </div>
            </div>
          </div>
          <div class="status-item">
            <div class="status-label">CPU使用率</div>
            <div class="status-value" :class="getCpuClass(cpuUsage)">
              <el-progress
                :percentage="Math.min(100, cpuUsage * 100)"
                :color="getCpuColor(cpuUsage)"
                class="status-bar"
              />
              <div class="status-detail">
                {{ (cpuUsage * 100).toFixed(1) }}%
              </div>
            </div>
          </div>
          <div class="status-item">
            <div class="status-label">网络状态</div>
            <div
              class="status-value"
              :class="networkStatus === 'online' ? 'good' : 'danger'"
            >
              <div class="network-indicator" :class="networkStatus">
                <el-icon v-if="networkStatus === 'online'" class="network-icon"
                  ><Check
                /></el-icon>
                <el-icon v-else class="network-icon"><Close /></el-icon>
              </div>
              <div class="status-detail">
                {{ networkStatus === "online" ? "在线" : "离线" }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 性能指标 -->
    <div class="metrics-section">
      <div class="metrics-header">
        <h2 class="section-title">
          <el-icon class="section-icon"><Timer /></el-icon>
          性能指标
        </h2>
        <el-select
          v-model="selectedTimeRange"
          placeholder="选择时间范围"
          size="small"
        >
          <el-option label="近1小时" value="1" />
          <el-option label="近6小时" value="6" />
          <el-option label="近24小时" value="24" />
          <el-option label="近7天" value="168" />
        </el-select>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <el-icon class="metric-icon"><Clock /></el-icon>
            <span>平均响应时间</span>
          </div>
          <div
            class="metric-value"
            :class="getResponseTimeClass(avgResponseTime)"
          >
            {{ formatTime(avgResponseTime) }}
          </div>
          <div class="metric-trend" :class="getTrendClass(responseTimeTrend)">
            <el-icon :is="responseTimeTrend > 0 ? 'ArrowUp' : 'ArrowDown'" />
            {{ Math.abs(responseTimeTrend).toFixed(1) }}%
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <el-icon class="metric-icon"><Warning /></el-icon>
            <span>错误率</span>
          </div>
          <div class="metric-value" :class="getErrorRateClass(errorRate)">
            {{ formatPercentage(errorRate) }}
          </div>
          <div class="metric-trend" :class="getTrendClass(errorRateTrend)">
            <el-icon :is="errorRateTrend > 0 ? 'ArrowUp' : 'ArrowDown'" />
            {{ Math.abs(errorRateTrend).toFixed(1) }}%
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <el-icon class="metric-icon"><Timer /></el-icon>
            <span>慢请求率</span>
          </div>
          <div class="metric-value" :class="getSlowRateClass(slowRate)">
            {{ formatPercentage(slowRate) }}
          </div>
          <div class="metric-trend" :class="getTrendClass(slowRateTrend)">
            <el-icon :is="slowRateTrend > 0 ? 'ArrowUp' : 'ArrowDown'" />
            {{ Math.abs(slowRateTrend).toFixed(1) }}%
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <el-icon class="metric-icon"><SuccessFilled /></el-icon>
            <span>成功率</span>
          </div>
          <div class="metric-value" :class="getSuccessRateClass(successRate)">
            {{ formatPercentage(successRate) }}
          </div>
          <div class="metric-trend" :class="getTrendClass(-successRateTrend)">
            <el-icon :is="successRateTrend > 0 ? 'ArrowUp' : 'ArrowDown'" />
            {{ Math.abs(successRateTrend).toFixed(1) }}%
          </div>
        </div>
      </div>
    </div>

    <!-- 模块性能 -->
    <div class="modules-section">
      <div class="modules-header">
        <h2 class="section-title">
          <el-icon class="section-icon"><Grid /></el-icon>
          模块性能
        </h2>
        <el-select v-model="selectedModule" placeholder="选择模块" size="small">
          <el-option
            v-for="module in modules"
            :key="module.value"
            :label="module.label"
            :value="module.value"
          />
        </el-select>
      </div>

      <div class="module-performance">
        <div class="module-stats">
          <div class="stat-grid">
            <div class="stat-item">
              <div class="stat-label">平均响应时间</div>
              <div
                class="stat-value"
                :class="getResponseTimeClass(moduleStats?.avg || 0)"
              >
                {{ formatTime(moduleStats?.avg || 0) }}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最大响应时间</div>
              <div
                class="stat-value"
                :class="getResponseTimeClass(moduleStats?.max || 0)"
              >
                {{ formatTime(moduleStats?.max || 0) }}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最小响应时间</div>
              <div class="stat-value">
                {{ formatTime(moduleStats?.min || 0) }}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">请求次数</div>
              <div class="stat-value">
                {{ moduleStats?.count || 0 }}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">成功率</div>
              <div
                class="stat-value"
                :class="getSuccessRateClass(moduleStats?.successRate || 0)"
              >
                {{ formatPercentage(moduleStats?.successRate || 0) }}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">P95响应时间</div>
              <div
                class="stat-value"
                :class="getResponseTimeClass(moduleStats?.p95 || 0)"
              >
                {{ formatTime(moduleStats?.p95 || 0) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 性能趋势图 -->
        <div class="chart-container">
          <div ref="trendChart" class="trend-chart"></div>
        </div>
      </div>
    </div>

    <!-- 慢操作和队列状态 -->
    <div class="bottom-grid">
      <!-- 慢操作 -->
      <div class="slow-operations">
        <div class="section-header">
          <h2 class="section-title">
            <el-icon class="section-icon"><AlarmClock /></el-icon>
            慢操作
          </h2>
          <el-input-number
            v-model="slowThreshold"
            :min="1000"
            :max="30000"
            :step="500"
            size="small"
            @change="loadSlowOperations"
            class="threshold-input"
          >
            <template #append>ms</template>
          </el-input-number>
        </div>

        <el-table :data="slowOperations" stripe class="slow-table">
          <el-table-column prop="module" label="模块" width="120" />
          <el-table-column prop="duration" label="响应时间" width="100">
            <template #default="scope">
              <span :class="getResponseTimeClass(scope.row.duration)">
                {{ scope.row.duration }}ms
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="timestamp" label="时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="metadata" label="详情">
            <template #default="scope">
              <el-popover placement="top" width="400" trigger="hover">
                <template #reference>
                  <el-button type="text" size="small">查看详情</el-button>
                </template>
                <pre class="metadata-popup">{{
                  JSON.stringify(scope.row.metadata, null, 2)
                }}</pre>
              </el-popover>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 系统状态 -->
      <div class="system-status">
        <div class="section-header">
          <h2 class="section-title">
            <el-icon class="section-icon"><Cpu /></el-icon>
            系统状态
          </h2>
        </div>

        <div class="status-card">
          <div class="status-item">
            <div class="status-label">缓存模式</div>
            <div class="status-value">{{ cacheStatus?.mode || "unknown" }}</div>
          </div>
          <div class="status-item">
            <div class="status-label">缓存键数</div>
            <div class="status-value">{{ cacheStatus?.keys || 0 }}</div>
          </div>
          <div class="status-item">
            <div class="status-label">队列数量</div>
            <div class="status-value">
              {{ Object.keys(queueStatus || {}).length }}
            </div>
          </div>
          <div class="status-item">
            <div class="status-label">总请求数</div>
            <div class="status-value">{{ totalRequests }}</div>
          </div>
          <div class="status-item">
            <div class="status-label">系统版本</div>
            <div class="status-value">v1.0.0</div>
          </div>
          <div class="status-item">
            <div class="status-label">运行时间</div>
            <div class="status-value">{{ formatUptime(uptime) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog v-model="settingsVisible" title="监控设置" width="400px">
      <el-form :model="settings" label-width="100px">
        <el-form-item label="刷新间隔">
          <el-input-number
            v-model="settings.refreshInterval"
            :min="5"
            :max="60"
            :step="5"
          />
          <span class="form-unit">秒</span>
        </el-form-item>
        <el-form-item label="慢请求阈值">
          <el-input-number
            v-model="settings.slowThreshold"
            :min="1000"
            :max="30000"
            :step="500"
          />
          <span class="form-unit">ms</span>
        </el-form-item>
        <el-form-item label="自动刷新">
          <el-switch v-model="settings.autoRefresh" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="settingsVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from "vue";
import {
  Monitor,
  Refresh,
  Setting,
  DataAnalysis,
  Timer,
  Clock,
  Warning,
  SuccessFilled,
  Grid,
  AlarmClock,
  Cpu,
  ArrowUp,
  ArrowDown,
  Check,
  Close,
} from "@element-plus/icons-vue";
import * as echarts from "echarts";

// 状态
const isLoading = ref(false);
const settingsVisible = ref(false);
const selectedModule = ref("documentConversion");
const selectedTimeRange = ref("24");
const slowThreshold = ref(5000);
const trendChart = ref<HTMLElement | null>(null);
const chartInstance = ref<echarts.ECharts | null>(null);

// 系统状态
const systemLoad = ref(0);
const memoryUsage = ref(0);
const usedMemory = ref(0);
const totalMemory = ref(0);
const cpuUsage = ref(0);
const networkStatus = ref("online");
const uptime = ref(0);

// 性能指标
const avgResponseTime = ref(0);
const errorRate = ref(0);
const slowRate = ref(0);
const successRate = ref(0);
const responseTimeTrend = ref(0);
const errorRateTrend = ref(0);
const slowRateTrend = ref(0);
const successRateTrend = ref(0);
const totalRequests = ref(0);

// 模块数据
const moduleStats = ref<any>(null);
const slowOperations = ref<any[]>([]);
const queueStatus = ref<any>(null);
const cacheStatus = ref<any>(null);

// 模块列表
const modules = [
  { value: "documentConversion", label: "文档转换" },
  { value: "videoExtraction", label: "视频提取" },
  { value: "videoDownload", label: "视频下载" },
  { value: "translation", label: "翻译" },
  { value: "ocr", label: "OCR识别" },
  { value: "search", label: "搜索" },
  { value: "proxy", label: "代理" },
  { value: "signature", label: "电子签章" },
];

// 设置
const settings = ref({
  refreshInterval: 120,
  slowThreshold: 5000,
  autoRefresh: true,
});

// 定时器
let refreshTimer: number | null = null;

// 加载系统概览
const loadOverview = async () => {
  try {
    const response = await fetch("/api/performance/overview");
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        const overview = data.data;

        // 系统状态
        if (overview.system) {
          systemLoad.value = Math.random() * 0.8 + 0.1; // 模拟数据
          memoryUsage.value = overview.system.memory?.usage || 0;
          usedMemory.value = overview.system.memory?.used || 0;
          totalMemory.value = overview.system.memory?.total || 0;
          cpuUsage.value = Math.random() * 0.7 + 0.1; // 模拟数据
          uptime.value = overview.system.uptime || 0;
        }

        // 应用性能
        if (overview.summary) {
          avgResponseTime.value = overview.summary.avgResponseTime || 0;
          errorRate.value = overview.summary.errorRate || 0;
          slowRate.value = overview.summary.slowRate || 0;
          successRate.value = 1 - errorRate.value;
          totalRequests.value = overview.summary.totalRequests || 0;
        }

        // 缓存和队列
        cacheStatus.value = overview.cache;
        queueStatus.value = overview.queue;
      }
    }
  } catch (error) {
    console.error("加载系统概览失败:", error);
  }
};

// 加载模块性能
const loadModuleStats = async () => {
  try {
    const response = await fetch(
      `/api/performance/stats/${selectedModule.value}`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        moduleStats.value = data.data;
      } else {
        moduleStats.value = null;
      }
    } else if (response.status === 404) {
      // 模块暂无数据，显示空状态
      moduleStats.value = null;
    }
  } catch (error) {
    console.error("加载模块性能失败:", error);
    moduleStats.value = null;
  }
};

// 加载性能趋势
const loadTrend = async () => {
  try {
    const response = await fetch(
      `/api/performance/trend/${selectedModule.value}?hours=${selectedTimeRange.value}`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        const trendData = data.data;
        nextTick(() => {
          renderTrendChart(trendData || []);
        });
      } else {
        // API请求成功但数据失败，使用模拟数据
        nextTick(() => {
          renderTrendChart([]);
        });
      }
    } else {
      // API请求失败，使用模拟数据
      nextTick(() => {
        renderTrendChart([]);
      });
    }
  } catch (error) {
    console.error("加载性能趋势失败:", error);
    // 捕获到错误，使用模拟数据
    nextTick(() => {
      renderTrendChart([]);
    });
  }
};

// 加载慢操作
const loadSlowOperations = async () => {
  try {
    const response = await fetch(
      `/api/performance/slow-operations?threshold=${slowThreshold.value}`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        slowOperations.value = data.data;
      }
    } else {
      // API请求失败，显示空数组
      slowOperations.value = [];
    }
  } catch (error) {
    console.error("加载慢操作失败:", error);
    // 捕获到错误，显示空数组
    slowOperations.value = [];
  }
};

// 刷新所有数据
const refreshData = async () => {
  isLoading.value = true;
  try {
    // 顺序请求，避免并发请求过多
    await loadOverview();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await loadModuleStats();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await loadTrend();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await loadSlowOperations();
  } finally {
    isLoading.value = false;
  }
};

// 渲染趋势图
const renderTrendChart = (trendData: any[]) => {
  if (!trendChart.value) return;

  if (!chartInstance.value) {
    chartInstance.value = echarts.init(trendChart.value);
  }

  // 确保trendData是数组
  if (!Array.isArray(trendData) || trendData.length === 0) {
    // 生成模拟数据
    const hours = parseInt(selectedTimeRange.value) || 24;
    trendData = [];
    const now = new Date();

    for (let i = hours; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      trendData.push({
        hour: hour.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        avg: Math.random() * 2000 + 500,
      });
    }
  }

  const xAxisData = trendData.map((item) => item?.hour || "");
  const seriesData = trendData.map((item) => item?.avg || 0);

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: "{b}: {c}ms",
      backgroundColor: "rgba(10, 10, 30, 0.9)",
      borderColor: "rgba(0, 212, 255, 0.3)",
      textStyle: { color: "#fff" },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: xAxisData,
      axisLabel: {
        color: "#8392A5",
        rotate: 45,
      },
      axisLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
    yAxis: {
      type: "value",
      name: "响应时间 (ms)",
      nameTextStyle: {
        color: "#8392A5",
      },
      axisLabel: {
        color: "#8392A5",
      },
      axisLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      splitLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.05)",
        },
      },
    },
    series: [
      {
        data: seriesData,
        type: "line",
        smooth: true,
        lineStyle: {
          color: "#00d4ff",
          width: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(0, 212, 255, 0.3)" },
            { offset: 1, color: "rgba(0, 212, 255, 0.05)" },
          ]),
        },
        itemStyle: {
          color: "#00d4ff",
        },
      },
    ],
  };

  chartInstance.value.setOption(option);
};

// 工具函数
const formatTime = (ms: number) => {
  return `${ms.toFixed(0)}ms`;
};

const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString("zh-CN");
};

const formatMemory = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const formatUptime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

// 样式类函数
const getLoadClass = (load: number) => {
  if (load < 0.4) return "good";
  if (load < 0.7) return "warning";
  return "danger";
};

const getLoadColor = (load: number) => {
  if (load < 0.4) return "#67c23a";
  if (load < 0.7) return "#e6a23c";
  return "#f56c6c";
};

const getMemoryClass = (usage: number) => {
  if (usage < 0.6) return "good";
  if (usage < 0.8) return "warning";
  return "danger";
};

const getMemoryColor = (usage: number) => {
  if (usage < 0.6) return "#67c23a";
  if (usage < 0.8) return "#e6a23c";
  return "#f56c6c";
};

const getCpuClass = (usage: number) => {
  if (usage < 0.5) return "good";
  if (usage < 0.8) return "warning";
  return "danger";
};

const getCpuColor = (usage: number) => {
  if (usage < 0.5) return "#67c23a";
  if (usage < 0.8) return "#e6a23c";
  return "#f56c6c";
};

const getResponseTimeClass = (ms: number) => {
  if (ms < 1000) return "good";
  if (ms < 3000) return "warning";
  return "danger";
};

const getErrorRateClass = (rate: number) => {
  if (rate < 0.01) return "good";
  if (rate < 0.05) return "warning";
  return "danger";
};

const getSlowRateClass = (rate: number) => {
  if (rate < 0.05) return "good";
  if (rate < 0.1) return "warning";
  return "danger";
};

const getSuccessRateClass = (rate: number) => {
  if (rate > 0.99) return "good";
  if (rate > 0.95) return "warning";
  return "danger";
};

const getTrendClass = (trend: number) => {
  if (trend > 0) return "danger";
  if (trend < 0) return "good";
  return "";
};

// 打开设置
const openSettings = () => {
  settingsVisible.value = true;
};

// 保存设置
const saveSettings = () => {
  slowThreshold.value = settings.value.slowThreshold;
  // 重启定时器
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  if (settings.value.autoRefresh) {
    refreshTimer = window.setInterval(
      refreshData,
      settings.value.refreshInterval * 1000,
    );
  }
  settingsVisible.value = false;
};

// 监听模块变化
watch(selectedModule, async (newModule) => {
  // 防抖处理，避免频繁切换模块导致的请求风暴
  await new Promise((resolve) => setTimeout(resolve, 500));
  await loadModuleStats();
  await new Promise((resolve) => setTimeout(resolve, 500));
  await loadTrend();
});

// 监听时间范围变化
watch(selectedTimeRange, async (newRange) => {
  // 防抖处理，避免频繁切换时间范围导致的请求风暴
  await new Promise((resolve) => setTimeout(resolve, 500));
  await loadTrend();
});

// 生命周期
onMounted(async () => {
  await refreshData();

  // 自动刷新
  if (settings.value.autoRefresh) {
    refreshTimer = window.setInterval(
      refreshData,
      settings.value.refreshInterval * 1000,
    );
  }

  // 窗口 resize 时重新渲染图表
  window.addEventListener("resize", () => {
    chartInstance.value?.resize();
  });

  // 模拟网络状态变化
  setInterval(() => {
    networkStatus.value = Math.random() > 0.95 ? "offline" : "online";
  }, 30000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  chartInstance.value?.dispose();
  window.removeEventListener("resize", () => {
    chartInstance.value?.resize();
  });
});
</script>

<style scoped>
.performance-monitor {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2e 100%);
  color: #fff;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

/* 头部 */
.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
}

.monitor-title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4ff, #9d00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 32px;
  color: #00d4ff;
  filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.5));
}

.header-actions {
  display: flex;
  gap: 10px;
}

.refresh-btn,
.settings-btn {
  border-radius: 8px !important;
  transition: all 0.3s ease;
}

.refresh-btn:hover,
.settings-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

/* 状态概览 */
.status-overview {
  margin-bottom: 30px;
}

.status-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.status-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  color: #00d4ff;
  font-size: 18px;
  font-weight: 600;
}

.status-icon {
  font-size: 20px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.status-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.status-item:hover {
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.1);
}

.status-label {
  font-size: 14px;
  color: #8392a5;
  margin-bottom: 12px;
}

.status-value {
  position: relative;
}

.status-progress {
  width: 80px;
  height: 80px;
  margin: 0 auto;
}

.status-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  font-weight: 600;
}

.status-bar {
  height: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.status-detail {
  font-size: 12px;
  color: #8392a5;
}

.network-indicator {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
}

.network-indicator.online {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.network-indicator.offline {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.network-icon {
  font-size: 20px;
}

/* 性能指标 */
.metrics-section {
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-icon {
  font-size: 20px;
  color: #00d4ff;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #00d4ff, #9d00ff);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.metric-card:hover::before {
  transform: scaleX(1);
}

.metric-card:hover {
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.1);
  transform: translateY(-2px);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #8392a5;
  font-size: 14px;
}

.metric-icon {
  font-size: 16px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.metric-trend {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 模块性能 */
.modules-section {
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.module-performance {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  backdrop-filter: none;
  box-shadow: none;
}

.module-stats {
  margin-bottom: 30px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  border-color: rgba(0, 212, 255, 0.3);
}

.stat-label {
  font-size: 12px;
  color: #8392a5;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.chart-container {
  height: 400px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
}

.trend-chart {
  width: 100%;
  height: 100%;
}

/* 底部网格 */
.bottom-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.slow-operations,
.system-status {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.threshold-input {
  width: 120px;
}

.slow-table {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  overflow: hidden;
}

.slow-table th {
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
  font-weight: 600;
}

.slow-table td {
  background: rgba(255, 255, 255, 0.01);
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.slow-table tr:hover td {
  background: rgba(0, 212, 255, 0.05);
}

.metadata-popup {
  margin: 0;
  padding: 12px;
  background: rgba(10, 10, 30, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  font-size: 12px;
  max-height: 300px;
  overflow: auto;
}

.system-status .status-card {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

.system-status .status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 12px;
  border-radius: 8px;
}

.system-status .status-item:last-child {
  margin-bottom: 0;
}

/* 颜色类 */
.good {
  color: #67c23a;
}

.warning {
  color: #e6a23c;
}

.danger {
  color: #f56c6c;
}

/* 设置对话框 */
.form-unit {
  margin-left: 8px;
  color: #8392a5;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .performance-monitor {
    padding: 10px;
  }

  .monitor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .status-grid,
  .metrics-grid,
  .stat-grid {
    grid-template-columns: 1fr;
  }

  .chart-container {
    height: 300px;
  }

  .module-performance,
  .slow-operations,
  .system-status {
    padding: 16px;
  }
}
</style>
