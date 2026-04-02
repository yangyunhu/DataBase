<template>
  <div class="visualization-view-container">
    <div class="visualization-view">
      <div class="page-header">
        <h1 class="page-title">
          <el-icon class="title-icon"><PieChart /></el-icon>
          数据可视化
        </h1>
        <p class="page-desc">Excel数据一键生成专业图表，支持多种图表类型</p>
      </div>

      <div class="content-grid">
        <!-- 左侧数据区 -->
        <div class="data-section">
          <!-- 上传区域 -->
          <div class="upload-card">
            <div class="card-header">
              <el-icon><Upload /></el-icon>
              <span>上传Excel文件</span>
            </div>
            <el-upload
              class="excel-uploader"
              drag
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="false"
              accept=".xlsx,.xls"
            >
              <div class="uploader-content">
                <el-icon class="upload-icon"><Document /></el-icon>
                <p class="upload-text">点击或拖拽Excel文件到此处</p>
                <p class="upload-hint">支持 .xlsx、.xls 格式</p>
              </div>
            </el-upload>
          </div>

          <!-- 数据预览 -->
          <div v-if="tableData.length > 0" class="preview-card">
            <div class="card-header">
              <el-icon><View /></el-icon>
              <span>数据预览</span>
              <span class="record-count">{{ tableData.length }} 条记录</span>
              <el-button type="primary" link size="small" @click="showFullDataDialog = true">
                <el-icon><FullScreen /></el-icon>
                查看全部
              </el-button>
            </div>
            <div class="table-container">
              <el-table
                :data="tableData.slice(0, 5)"
                style="width: 100%"
                size="small"
                :header-cell-style="{
                  background: 'rgba(0, 255, 136, 0.1)',
                  color: '#00ff88',
                }"
              >
                <el-table-column
                  v-for="col in tableColumns"
                  :key="col"
                  :prop="col"
                  :label="col"
                  min-width="100"
                />
              </el-table>
              <p v-if="tableData.length > 5" class="more-data">
                + 还有 {{ tableData.length - 5 }} 条数据
              </p>
            </div>
          </div>

          <!-- 图表配置 -->
          <div v-if="tableData.length > 0" class="config-card">
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>图表配置</span>
            </div>

            <div class="config-form">
              <div class="form-item">
                <label>图表类型</label>
                <div class="chart-types">
                  <div
                    v-for="type in chartTypes"
                    :key="type.value"
                    class="type-item"
                    :class="{ active: selectedChartType === type.value }"
                    @click="selectedChartType = type.value"
                  >
                    <el-icon><component :is="type.icon" /></el-icon>
                    <span>{{ type.label }}</span>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-item">
                  <label>X轴数据</label>
                  <el-select v-model="xAxisColumn" placeholder="选择列">
                    <el-option
                      v-for="col in tableColumns"
                      :key="col"
                      :label="col"
                      :value="col"
                    />
                  </el-select>
                </div>
                <div class="form-item">
                  <label>Y轴数据</label>
                  <el-select v-model="yAxisColumn" placeholder="选择列">
                    <el-option
                      v-for="col in numericColumns"
                      :key="col"
                      :label="col"
                      :value="col"
                    />
                  </el-select>
                </div>
              </div>

              <div class="form-item">
                <label>图表标题</label>
                <el-input v-model="chartTitle" placeholder="输入图表标题" />
              </div>

              <div class="form-row">
                <div class="form-item">
                  <label>显示图例</label>
                  <el-switch v-model="showLegend" />
                </div>
                <div class="form-item">
                  <label>显示数据标签</label>
                  <el-switch v-model="showDataLabel" />
                </div>
              </div>

              <el-button
                type="primary"
                class="generate-btn"
                :disabled="!canGenerate"
                @click="generateChart"
              >
                <el-icon><MagicStick /></el-icon>
                <span>生成图表</span>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 右侧图表区 -->
        <div class="chart-section">
          <div class="chart-card" :class="{ 'has-chart': chartOption }">
            <div v-if="!chartOption" class="empty-state">
              <div class="empty-icon">
                <el-icon><DataLine /></el-icon>
              </div>
              <p>上传Excel并配置图表参数</p>
              <p class="sub-text">生成的图表将显示在这里</p>
            </div>
            <div v-else class="chart-container">
              <div ref="chartRef" class="chart"></div>
              <div class="chart-actions">
                <el-button type="primary" link @click="downloadChart('png')">
                  <el-icon><Download /></el-icon>
                  下载 PNG
                </el-button>
                <el-button type="primary" link @click="downloadChart('jpg')">
                  <el-icon><Download /></el-icon>
                  下载 JPG
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 查看全部数据对话框 -->
    <div class="dialog-container">
      <el-dialog
        v-model="showFullDataDialog"
        title="完整数据"
        width="80%"
        :close-on-click-modal="false"
      >
        <div class="full-data-container">
          <el-table
            :data="tableData"
            style="width: 100%"
            border
            :header-cell-style="{
              background: 'rgba(0, 255, 136, 0.1)',
              color: '#00ff88',
            }"
          >
            <el-table-column
              v-for="col in tableColumns"
              :key="col"
              :prop="col"
              :label="col"
              min-width="120"
            />
          </el-table>
        </div>
        <template #footer>
          <el-button @click="showFullDataDialog = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch, markRaw } from "vue";
import { ElMessage } from "element-plus";
import type { UploadFile } from "element-plus";
import * as echarts from "echarts";
import * as XLSX from "xlsx";
import {
  PieChart,
  Upload,
  Document,
  View,
  Setting,
  MagicStick,
  Download,
  DataLine,
  Histogram,
  TrendCharts,
  Aim,
  FullScreen,
} from "@element-plus/icons-vue";

const chartRef = ref<HTMLElement>();
let chartInstance: echarts.ECharts | null = null;

const tableData = ref<any[]>([]);
const tableColumns = ref<string[]>([]);
const selectedChartType = ref("bar");
const xAxisColumn = ref("");
const yAxisColumn = ref("");
const chartTitle = ref("");
const chartOption = ref<any>(null);
const showFullDataDialog = ref(false);
const showLegend = ref(true);
const showDataLabel = ref(false);

const chartTypes = [
  { value: "bar", label: "柱状图", icon: markRaw(Histogram) },
  { value: "line", label: "折线图", icon: markRaw(TrendCharts) },
  { value: "pie", label: "饼图", icon: markRaw(PieChart) },
  { value: "radar", label: "雷达图", icon: markRaw(Aim) },
];

// 辅助函数：尝试将字符串转换为数字
const tryParseNumber = (value: any): any => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const num = parseFloat(trimmed);
    if (!isNaN(num) && trimmed === num.toString()) {
      return num;
    }
  }
  return value;
};

// 辅助函数：清理和转换数据
const cleanData = (data: any[]): any[] => {
  return data.map(row => {
    const cleanedRow: any = {};
    Object.keys(row).forEach(key => {
      cleanedRow[key] = tryParseNumber(row[key]);
    });
    return cleanedRow;
  });
};

const numericColumns = computed(() => {
  if (tableData.value.length === 0) return [];
  const firstRow = tableData.value[0];
  return Object.keys(firstRow).filter(
    (key) => typeof firstRow[key] === "number",
  );
});

const canGenerate = computed(() => {
  return xAxisColumn.value && yAxisColumn.value;
});

const handleFileChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  if (!file) return;

  if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
    ElMessage.error("请上传Excel格式的文件");
    return;
  }

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (jsonData.length === 0) {
      ElMessage.warning("Excel文件中没有数据");
      return;
    }

    // 清理和转换数据
    const cleanedData = cleanData(jsonData);
    
    tableData.value = cleanedData;
    tableColumns.value = Object.keys(cleanedData[0] || {});
    xAxisColumn.value = tableColumns.value[0] || '';
    yAxisColumn.value = numericColumns.value[0] || '';
    chartTitle.value = `数据分析 - ${file.name}`;
    
    ElMessage.success(`文件解析成功！共 ${cleanedData.length} 条数据`);
  } catch (error) {
    console.error('Excel解析错误:', error);
    ElMessage.error("文件解析失败，请检查文件格式是否正确");
  }
};

const generateChart = () => {
  const xData = tableData.value.map((row) => row[xAxisColumn.value]);
  const yData = tableData.value.map((row) => row[yAxisColumn.value]);

  let option: any = {
    backgroundColor: "transparent",
    title: {
      text: chartTitle.value,
      left: "center",
      textStyle: {
        color: "#fff",
        fontSize: 18,
      },
    },
    tooltip: {
      trigger: selectedChartType.value === "pie" ? "item" : "axis",
      backgroundColor: "rgba(10, 10, 30, 0.9)",
      borderColor: "rgba(0, 255, 136, 0.3)",
      textStyle: { color: "#fff" },
    },
    legend: showLegend.value
      ? {
          show: true,
          top: "40px",
          textStyle: { color: "rgba(255,255,255,0.7)" },
        }
      : { show: false },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
  };

  switch (selectedChartType.value) {
    case "bar":
      option = {
        ...option,
        xAxis: {
          type: "category",
          data: xData,
          axisLine: { lineStyle: { color: "rgba(255,255,255,0.3)" } },
          axisLabel: { color: "rgba(255,255,255,0.7)" },
        },
        yAxis: {
          type: "value",
          axisLine: { lineStyle: { color: "rgba(255,255,255,0.3)" } },
          axisLabel: { color: "rgba(255,255,255,0.7)" },
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } },
        },
        series: [
          {
            name: yAxisColumn.value,
            data: yData,
            type: "bar",
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#00ff88" },
                { offset: 1, color: "#00cc66" },
              ]),
              borderRadius: [8, 8, 0, 0],
            },
            label: showDataLabel.value
              ? {
                  show: true,
                  position: "top",
                  color: "#fff",
                }
              : { show: false },
          },
        ],
      };
      break;

    case "line":
      option = {
        ...option,
        xAxis: {
          type: "category",
          data: xData,
          axisLine: { lineStyle: { color: "rgba(255,255,255,0.3)" } },
          axisLabel: { color: "rgba(255,255,255,0.7)" },
        },
        yAxis: {
          type: "value",
          axisLine: { lineStyle: { color: "rgba(255,255,255,0.3)" } },
          axisLabel: { color: "rgba(255,255,255,0.7)" },
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } },
        },
        series: [
          {
            name: yAxisColumn.value,
            data: yData,
            type: "line",
            smooth: true,
            lineStyle: { color: "#00d4ff", width: 3 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(0, 212, 255, 0.3)" },
                { offset: 1, color: "rgba(0, 212, 255, 0)" },
              ]),
            },
            itemStyle: { color: "#00d4ff" },
            label: showDataLabel.value
              ? {
                  show: true,
                  position: "top",
                  color: "#fff",
                }
              : { show: false },
          },
        ],
      };
      break;

    case "pie":
      option = {
        ...option,
        series: [
          {
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: "#0a0a1a",
              borderWidth: 2,
            },
            label: showDataLabel.value
              ? {
                  show: true,
                  color: "#fff",
                }
              : { show: false },
            data: tableData.value.map((row) => ({
              name: row[xAxisColumn.value],
              value: row[yAxisColumn.value],
            })),
            color: [
              "#00ff88",
              "#00d4ff",
              "#9d00ff",
              "#ff00cc",
              "#ff6b6b",
              "#ffd93d",
              "#6bcf7f",
            ],
          },
        ],
      };
      break;

    case "radar":
      const maxValue = Math.max(...yData) * 1.2;
      option = {
        ...option,
        radar: {
          indicator: xData.map((name: string) => ({ name, max: maxValue })),
          axisName: { color: "rgba(255,255,255,0.7)" },
          splitArea: {
            areaStyle: {
              color: ["rgba(0,255,136,0.05)", "rgba(0,255,136,0.1)"],
            },
          },
          axisLine: { lineStyle: { color: "rgba(255,255,255,0.2)" } },
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.2)" } },
        },
        series: [
          {
            type: "radar",
            name: yAxisColumn.value,
            data: [
              {
                value: yData,
                name: yAxisColumn.value,
                areaStyle: { color: "rgba(0, 212, 255, 0.3)" },
                lineStyle: { color: "#00d4ff", width: 2 },
                itemStyle: { color: "#00d4ff" },
                label: showDataLabel.value
                  ? {
                      show: true,
                      color: "#fff",
                    }
                  : { show: false },
              },
            ],
          },
        ],
      };
      break;
  }

  chartOption.value = option;
  nextTick(() => {
    initChart();
  });
};

const initChart = () => {
  if (!chartRef.value) return;

  if (chartInstance) {
    chartInstance.dispose();
  }

  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(chartOption.value);

  // 先移除可能存在的监听器，避免累积
  window.removeEventListener("resize", handleResize);
  window.addEventListener("resize", handleResize);
};

const downloadChart = (format: string) => {
  if (!chartInstance) return;

  const url = chartInstance.getDataURL({
    type: format as any,
    pixelRatio: 2,
    backgroundColor: "#0a0a1a",
  });

  const link = document.createElement("a");
  link.download = `chart.${format}`;
  link.href = url;
  link.click();

  ElMessage.success(`图表已下载为 ${format.toUpperCase()} 格式`);
};

// 独立的resize处理函数
const handleResize = () => {
  chartInstance?.resize();
};

// 监听图表配置变化，自动重新生成图表
watch(
  [selectedChartType, xAxisColumn, yAxisColumn, chartTitle, showLegend, showDataLabel],
  () => {
    if (canGenerate.value && chartOption.value) {
      generateChart();
    }
  }
);

onMounted(() => {
  // 组件挂载后的初始化
});

onUnmounted(() => {
  // 组件卸载时销毁ECharts实例
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  // 移除事件监听器
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.visualization-view {
  max-width: 1200px;
  margin: 0 auto;
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
  color: #00ff88;
}

.page-desc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.content-grid {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
}

/* 卡片样式 */
.upload-card,
.preview-card,
.config-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00ff88;
  font-weight: 500;
  margin-bottom: 16px;
}

.record-count {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

/* 上传区域 */
.excel-uploader :deep(.el-upload) {
  width: 100%;
}

.excel-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: 160px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed rgba(0, 255, 136, 0.3);
  border-radius: 12px;
}

.excel-uploader :deep(.el-upload-dragger:hover) {
  border-color: #00ff88;
  background: rgba(0, 255, 136, 0.05);
}

.uploader-content {
  text-align: center;
  padding: 20px;
}

.upload-icon {
  font-size: 40px;
  color: #00ff88;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #fff;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* 表格样式 */
.table-container {
  max-height: 200px;
  overflow: auto;
}

.table-container :deep(.el-table) {
  background: transparent;
}

.table-container :deep(.el-table__header-wrapper) {
  background: rgba(0, 255, 136, 0.1);
}

.table-container :deep(.el-table__body-wrapper) {
  background: transparent;
}

.table-container :deep(.el-table tr) {
  background: transparent;
}

.table-container :deep(.el-table td) {
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.more-data {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  padding: 12px;
  margin: 0;
}

/* 配置表单 */
.config-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.chart-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.type-item:hover {
  border-color: rgba(0, 255, 136, 0.3);
}

.type-item.active {
  background: rgba(0, 255, 136, 0.1);
  border-color: #00ff88;
  color: #00ff88;
}

.type-item .el-icon {
  font-size: 16px;
}

.config-form :deep(.el-input__wrapper),
.config-form :deep(.el-select .el-input__wrapper) {
  background: rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.config-form :deep(.el-input__inner) {
  color: #fff;
}

.generate-btn {
  width: 100%;
  background: linear-gradient(135deg, #00ff88, #00cc66);
  border: none;
  height: 44px;
  margin-top: 8px;
}

.generate-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
}

/* 图表区域 */
.chart-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-card.has-chart {
  display: block;
  padding: 24px;
}

.empty-state {
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: rgba(0, 255, 136, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon .el-icon {
  font-size: 36px;
  color: rgba(0, 255, 136, 0.3);
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-state .sub-text {
  font-size: 13px;
}

.chart-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart {
  flex: 1;
  min-height: 500px;
}

.chart-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 完整数据对话框样式 */
.full-data-container {
  max-height: 60vh;
  overflow: auto;
}

.full-data-container :deep(.el-table) {
  background: transparent;
}

.full-data-container :deep(.el-table__header-wrapper) {
  background: rgba(0, 255, 136, 0.1);
}

.full-data-container :deep(.el-table__body-wrapper) {
  background: transparent;
}

.full-data-container :deep(.el-table tr) {
  background: transparent;
}

.full-data-container :deep(.el-table td) {
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* 对话框样式 - 使用更具体的选择器，避免影响全局 */
.dialog-container :deep(.el-dialog) {
  background: #0a0a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-container :deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-container :deep(.el-dialog__title) {
  color: #00ff88;
}

.dialog-container :deep(.el-dialog__body) {
  color: rgba(255, 255, 255, 0.7);
}

/* 响应式 */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
