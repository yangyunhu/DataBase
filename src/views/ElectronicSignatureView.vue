<template>
  <div class="electronic-signature-view">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="glow-circle glow-1"></div>
      <div class="glow-circle glow-2"></div>
      <div class="grid-pattern"></div>
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-badge">
        <el-icon class="badge-icon"><Stamp /></el-icon>
        <span class="badge-text">智能签章系统</span>
      </div>
      <h1 class="page-title">
        <span class="title-gradient">电子签章</span>
      </h1>
      <p class="page-desc">上传文档与印章，智能定位盖章，一键生成安全PDF</p>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 上传区域 -->
      <div class="upload-section">
        <div class="upload-card" :class="{ 'has-file': fileUrl }">
          <div class="card-glow"></div>
          <div class="card-content">
            <div class="upload-icon-wrapper">
              <div class="icon-circle">
                <el-icon class="upload-icon"><Document /></el-icon>
              </div>
              <div class="icon-ring"></div>
            </div>
            <h3 class="upload-title">上传文档</h3>
            <p class="upload-desc">只支持 PDF 格式</p>
            <el-upload
              class="file-upload"
              action="#"
              :auto-upload="false"
              :on-change="handleFileUpload"
              accept=".pdf"
              :limit="1"
              :file-list="fileList"
              :show-file-list="false"
            >
              <el-button
                type="primary"
                class="upload-btn"
                :class="{ 'has-file': fileUrl }"
              >
                <el-icon><Upload /></el-icon>
                <span>{{ fileUrl ? "重新选择" : "选择文件" }}</span>
              </el-button>
            </el-upload>
            <div v-if="fileUrl" class="file-status">
              <el-icon class="status-icon"><CircleCheckFilled /></el-icon>
              <span>已上传</span>
            </div>
          </div>
        </div>

        <div class="upload-divider">
          <div class="divider-line"></div>
          <div class="divider-icon">
            <el-icon><Connection /></el-icon>
          </div>
          <div class="divider-line"></div>
        </div>

        <div class="upload-card" :class="{ 'has-file': sealUrl }">
          <div class="card-glow"></div>
          <div class="card-content">
            <div class="upload-icon-wrapper">
              <div class="icon-circle seal">
                <el-icon class="upload-icon"><Stamp /></el-icon>
              </div>
              <div class="icon-ring seal"></div>
            </div>
            <h3 class="upload-title">上传印章</h3>
            <p class="upload-desc">只支持 PNG 格式</p>
            <el-upload
              class="seal-upload"
              action="#"
              :auto-upload="false"
              :on-change="handleSealUpload"
              accept=".png"
              :limit="1"
              :file-list="sealList"
              :show-file-list="false"
            >
              <el-button
                type="primary"
                class="upload-btn seal"
                :class="{ 'has-file': sealUrl }"
              >
                <el-icon><Upload /></el-icon>
                <span>{{ sealUrl ? "重新选择" : "选择印章" }}</span>
              </el-button>
            </el-upload>
            <div v-if="sealUrl" class="file-status">
              <el-icon class="status-icon"><CircleCheckFilled /></el-icon>
              <span>已上传</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 预览和编辑区域 -->
      <div v-if="fileUrl" class="preview-section">
        <div class="section-header">
          <div class="header-left">
            <div class="header-icon">
              <el-icon><View /></el-icon>
            </div>
            <div class="header-text">
              <h3>文档预览</h3>
              <p>
                {{ sealUrl ? "点击文档选择盖章位置" : "请先上传印章后再签章" }}
              </p>
            </div>
          </div>
          <div class="header-actions">
            <div v-if="sealUrl" class="seal-size-control">
              <span class="control-label">印章大小</span>
              <el-slider
                v-model="sealSize"
                :min="50"
                :max="200"
                :step="10"
                class="size-slider"
              />
              <span class="size-value">{{ sealSize }}px</span>
            </div>
            <el-button
              v-if="sealUrl"
              type="primary"
              class="export-btn"
              @click="exportPDF"
              :loading="isExporting"
            >
              <el-icon><Download /></el-icon>
              <span>导出PDF</span>
            </el-button>
          </div>
        </div>

        <!-- 浮动导航按钮 -->
        <div v-if="fileUrl" class="floating-nav-buttons">
          <el-button
            v-if="showScrollButton === 'top'"
            type="primary"
            class="nav-btn"
            @click="scrollToTop"
          >
            <el-icon><ArrowUp /></el-icon>
          </el-button>
          <el-button
            v-else-if="showScrollButton === 'bottom'"
            type="primary"
            class="nav-btn"
            @click="scrollToBottom"
          >
            <el-icon><ArrowDown /></el-icon>
          </el-button>
        </div>

        <div class="preview-container">
          <div class="preview-area" ref="previewArea">
            <!-- 图片预览 -->
            <img
              v-if="fileType === 'image'"
              :src="fileUrl"
              class="preview-image"
            />

            <!-- PDF预览 -->
            <div v-else-if="fileType === 'pdf'" class="pdf-preview-container">
              <!-- 加载状态 -->
              <div v-if="isPdfLoading" class="pdf-loading">
                <el-icon class="loading-icon"><Loading /></el-icon>
                <p>正在加载PDF文档...</p>
              </div>

              <!-- 错误提示 -->
              <div v-else-if="pdfError" class="pdf-error">
                <el-icon class="error-icon"><Warning /></el-icon>
                <p>{{ pdfError }}</p>
              </div>

              <!-- PDF内容 - 多页渲染 -->
              <div
                ref="pdfContent"
                class="pdf-content"
                :class="{ 'is-loading': isPdfLoading }"
                @scroll="handleScroll"
              >
                <div class="pdf-pages-container">
                  <div
                    v-for="(page, index) in pdfPages"
                    :key="index"
                    class="pdf-page-wrapper"
                  >
                    <canvas
                      :ref="(el) => setPdfCanvasRef(el, index)"
                      class="pdf-canvas"
                      @dblclick="(e) => handlePdfDoubleClick(e, index)"
                    ></canvas>
                  </div>
                </div>
              </div>
            </div>

            <!-- 印章标记 - 按页码分组显示 -->
            <div
              v-for="(seal, index) in seals"
              :key="index"
              class="seal-mark"
              :class="{ 'pdf-seal': fileType === 'pdf' }"
              :style="getSealStyle(seal)"
            >
              <img :src="sealUrl" class="seal-image transparent-bg" />
              <div class="seal-remove" @click.stop="removeSeal(index)">
                <el-icon><Close /></el-icon>
              </div>
              <div class="seal-glow"></div>
            </div>

            <!-- 双击事件捕获层 - 仅图片类型使用 -->
            <div
              v-if="sealUrl && fileType === 'image'"
              class="double-click-overlay"
              @dblclick="handlePreviewClick"
            ></div>
          </div>
        </div>

        <!-- 印章列表 -->
        <div v-if="seals.length > 0" class="seal-list">
          <div class="list-header">
            <el-icon><List /></el-icon>
            <span>已添加 {{ seals.length }} 个印章</span>
          </div>
          <div class="list-actions">
            <el-button type="danger" text @click="clearAllSeals">
              <el-icon><Delete /></el-icon>
              清空全部
            </el-button>
          </div>
        </div>
      </div>

      <!-- 操作提示 -->
      <div v-else class="operation-tip">
        <div class="tip-content">
          <div class="tip-icon-wrapper">
            <el-icon class="tip-icon"><InfoFilled /></el-icon>
          </div>
          <div class="tip-text">
            <h4>开始电子签章</h4>
            <p>请先上传文档和印章图片，然后在预览区域点击选择盖章位置</p>
          </div>
        </div>
        <div class="tip-steps">
          <div class="step" :class="{ active: fileUrl }">
            <div class="step-number">1</div>
            <div class="step-text">上传文档</div>
          </div>
          <div class="step-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="step" :class="{ active: sealUrl }">
            <div class="step-number">2</div>
            <div class="step-text">上传印章</div>
          </div>
          <div class="step-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="step" :class="{ active: fileUrl && sealUrl }">
            <div class="step-number">3</div>
            <div class="step-text">盖章导出</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import {
  Stamp,
  Document,
  Upload,
  View,
  Download,
  Delete,
  InfoFilled,
  CircleCheckFilled,
  Connection,
  Close,
  Pointer,
  List,
  ArrowRight,
  ArrowLeft,
  Lock,
  MagicStick,
  Timer,
  Cloudy,
  Loading,
  Warning,
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

// 设置PDF.js worker路径
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// 文件和印章数据
const fileList = ref<any[]>([]);
const sealList = ref<any[]>([]);
const fileUrl = ref<string>("");
const sealUrl = ref<string>("");
const fileType = ref<string>("");
const isExporting = ref<boolean>(false);

// 印章设置
const sealSize = ref<number>(100);
const seals = ref<any[]>([]);

// 预览区域引用
const previewArea = ref<HTMLElement | null>(null);
const pdfContent = ref<HTMLElement | null>(null);
const pdfCanvas = ref<HTMLCanvasElement | null>(null);

// PDF预览相关
const isPdfLoading = ref<boolean>(false);
const pdfError = ref<string>("");
const pdfUrl = ref<string>("");

// PDF原始尺寸和缩放比例
const pdfOriginalSize = ref({ width: 0, height: 0 });
const pdfScale = ref(1);

// PDF页面数据
const pdfPages = ref<number[]>([]);
const pdfCanvasRefs = ref<Map<number, HTMLCanvasElement>>(new Map());

// 设置PDF canvas引用
function setPdfCanvasRef(el: any, index: number) {
  if (el) {
    pdfCanvasRefs.value.set(index, el);
  }
}

// 签章模式
const isSealMode = ref<boolean>(false);

// 浮动按钮显示状态
const showScrollButton = ref<"top" | "bottom" | null>(null);

// 待加载的PDF文件
const pendingPdfFile = ref<File | null>(null);

// 处理文件上传 - 只支持PDF格式
function handleFileUpload(file: any) {
  // 校验文件格式，只支持PDF
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith(".pdf")) {
    ElMessage.error("只支持PDF格式的文件，请重新选择");
    return false; // 阻止上传
  }

  fileList.value = [file];
  const url = URL.createObjectURL(file.raw);
  fileUrl.value = url;

  // 设置文件类型为PDF
  fileType.value = "pdf";
  // 先保存文件引用，等DOM更新后再加载
  pendingPdfFile.value = file.raw;

  ElMessage.success("已上传PDF文件: " + file.name);
  return true;
}

// 监听文件类型和文件URL变化，等DOM更新后加载PDF
watch([fileType, fileUrl], async ([newType, newFileUrl]) => {
  if (newType === "pdf" && newFileUrl && pendingPdfFile.value) {
    // 等待DOM更新
    await nextTick();
    // 再等待一段时间确保Vue完成渲染（预览区域需要显示）
    await new Promise((resolve) => setTimeout(resolve, 300));
    // 加载PDF
    await loadPdfPreview(pendingPdfFile.value);
    pendingPdfFile.value = null;
  }
});

// 监听印章数组变化，调试用
watch(
  seals,
  (newSeals) => {
    console.log("印章数组变化 - 数量:", newSeals.length);
    console.log("印章数组:", newSeals);
  },
  { deep: true },
);

// 监听滚动事件，显示回到顶部或底部按钮
function handleScroll() {
  const scrollContainer = pdfContent.value || previewArea.value;
  if (!scrollContainer) return;

  const scrollTop = scrollContainer.scrollTop;
  const scrollHeight = scrollContainer.scrollHeight;
  const clientHeight = scrollContainer.clientHeight;

  // 如果内容高度小于容器高度，不显示按钮
  if (scrollHeight <= clientHeight) {
    showScrollButton.value = null;
    return;
  }

  // 判断显示哪个按钮
  if (scrollTop < 100) {
    // 在顶部附近，显示回到底部按钮
    showScrollButton.value = "bottom";
  } else if (scrollTop + clientHeight >= scrollHeight - 100) {
    // 在底部附近，显示回到顶部按钮
    showScrollButton.value = "top";
  } else {
    // 在中间位置，根据滚动方向决定（这里简化为显示回到顶部）
    showScrollButton.value = "top";
  }
}

// 回到顶部
function scrollToTop() {
  const scrollContainer = pdfContent.value || previewArea.value;
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// 回到底部
function scrollToBottom() {
  const scrollContainer = pdfContent.value || previewArea.value;
  if (scrollContainer) {
    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: "smooth",
    });
  }
}

// 加载PDF预览
async function loadPdfPreview(file: File) {
  try {
    isPdfLoading.value = true;
    pdfError.value = "";

    // 读取文件为ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 使用PDF.js加载PDF
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // 获取总页数
    const numPages = pdf.numPages;

    // 设置页面数组（用于v-for渲染）
    pdfPages.value = Array.from({ length: numPages }, (_, i) => i + 1);

    // 等待DOM更新，确保所有canvas都已渲染
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 获取第一页的原始尺寸
    const firstPage = await pdf.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1 });
    pdfOriginalSize.value = {
      width: viewport.width,
      height: viewport.height,
    };
    console.log("PDF加载 - 原始尺寸:", pdfOriginalSize.value);

    // 计算缩放比例，使PDF适应预览区域
    const previewWidth = previewArea.value?.clientWidth || viewport.width;
    const scale = (previewWidth - 40) / viewport.width; // 减去一些边距
    pdfScale.value = scale;
    console.log("PDF加载 - 缩放比例:", pdfScale.value);

    // 渲染每一页
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const scaledViewport = page.getViewport({ scale });

      // 获取对应页码的canvas
      const canvas = pdfCanvasRefs.value.get(i - 1);
      if (!canvas) {
        console.warn(`Canvas for page ${i} not found`);
        continue;
      }

      // 设置canvas尺寸
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      // 渲染PDF到canvas
      const context = canvas.getContext("2d");
      if (context) {
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;
      }
    }

    isPdfLoading.value = false;
  } catch (error) {
    console.error("PDF预览初始化失败:", error);
    pdfError.value = "PDF预览初始化失败: " + (error as Error).message;
    isPdfLoading.value = false;
  }
}

// 重置PDF状态
function resetPdfState() {
  pdfError.value = "";
  isPdfLoading.value = false;
  if (previewArea.value) {
    previewArea.value.innerHTML = "";
  }
}

// 处理印章上传
// 处理印章上传 - 只支持PNG格式
function handleSealUpload(file: any) {
  // 校验文件格式，只支持PNG
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith(".png")) {
    ElMessage.error("只支持PNG格式的印章图片，请重新选择");
    return false; // 阻止上传
  }

  sealList.value = [file];
  const url = URL.createObjectURL(file.raw);
  sealUrl.value = url;
  ElMessage.success("已上传印章: " + file.name);
  return true;
}

// 处理预览区域点击（图片类型）
function handlePreviewClick(event: MouseEvent) {
  if (!sealUrl.value || !previewArea.value) return;

  const rect = previewArea.value.getBoundingClientRect();
  // 计算印章中心点位置（相对于预览区域）
  const x = event.clientX - rect.left - sealSize.value / 2;
  const y = event.clientY - rect.top - sealSize.value / 2;

  // 计算百分比坐标（0-1之间），以鼠标点击位置为中心
  const relX = (event.clientX - rect.left) / rect.width;
  const relY = (event.clientY - rect.top) / rect.height;

  // 保存坐标
  seals.value.push({
    x,
    y,
    relX,
    relY,
  });
  ElMessage.success("已添加印章");
}

// 处理PDF双击事件
function handlePdfDoubleClick(event: MouseEvent, pageIndex: number) {
  if (!sealUrl.value) return;

  const canvas = pdfCanvasRefs.value.get(pageIndex);
  if (!canvas) return;

  // 调试信息
  console.log(`双击事件 - pageIndex: ${pageIndex}`);
  console.log(
    `pdfScale: ${pdfScale.value}, pdfOriginalSize:`,
    pdfOriginalSize.value,
  );

  // 确保缩放比例和原始尺寸已设置
  if (!pdfScale.value || !pdfOriginalSize.value.height) {
    ElMessage.error("PDF尚未加载完成，请稍后再试");
    return;
  }

  const rect = canvas.getBoundingClientRect();

  // 计算鼠标在canvas上的位置（以鼠标点击位置为中心）
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // 计算预览区域显示位置（用于在canvas上显示印章）
  // 印章左上角位置 = 鼠标位置 - 印章大小/2
  const displayX = mouseX - sealSize.value / 2;
  const displayY = mouseY - sealSize.value / 2;

  // 转换为PDF原生坐标（points）
  // PDF坐标系：原点在左下角，Y轴向上
  // Canvas坐标系：原点在左上角，Y轴向下
  // 印章中心点的PDF坐标
  const pdfCenterX = mouseX / pdfScale.value;
  const pdfCenterY = pdfOriginalSize.value.height - mouseY / pdfScale.value;

  // 保存坐标
  seals.value.push({
    // 预览显示位置（相对于当前页canvas）
    x: displayX,
    y: displayY,
    // 页码（从0开始）
    pageIndex: pageIndex,
    // PDF原生坐标（用于导出）- 印章中心点
    pdfX: pdfCenterX,
    pdfY: pdfCenterY,
    // 印章大小（PDF原生尺寸）
    pdfSealSize: sealSize.value / pdfScale.value,
  });

  ElMessage.success(`已添加印章（第${pageIndex + 1}页）`);
}

// 切换签章模式
function toggleSealMode() {
  isSealMode.value = !isSealMode.value;
  if (isSealMode.value) {
    ElMessage.success("已进入签章模式，双击文档任意位置添加印章");
  } else {
    ElMessage.info("已退出签章模式");
  }
}

// 计算印章的显示位置
function getSealDisplayPosition(seal: any) {
  // 直接使用保存的x和y坐标，简单直接
  return {
    x: seal.x,
    y: seal.y,
  };
}

// 获取印章样式（支持多页PDF）
function getSealStyle(seal: any) {
  const baseStyle = {
    width: sealSize.value + "px",
    height: sealSize.value + "px",
  };

  // 如果是PDF类型且有页码信息，需要计算相对于对应页面的位置
  if (fileType.value === "pdf" && seal.pageIndex !== undefined) {
    const canvas = pdfCanvasRefs.value.get(seal.pageIndex);
    if (canvas) {
      // 获取canvas相对于previewArea的位置
      const canvasRect = canvas.getBoundingClientRect();
      const previewRect = previewArea.value?.getBoundingClientRect();

      if (previewRect) {
        const offsetX = canvasRect.left - previewRect.left;
        const offsetY = canvasRect.top - previewRect.top;

        return {
          ...baseStyle,
          left: offsetX + seal.x + "px",
          top: offsetY + seal.y + "px",
        };
      }
    }
  }

  // 默认情况（图片类型或单页PDF）
  return {
    ...baseStyle,
    left: seal.x + "px",
    top: seal.y + "px",
  };
}

// 移除印章
function removeSeal(index: number) {
  seals.value.splice(index, 1);
  ElMessage.success("已移除印章");
}

// 清空所有印章
function clearAllSeals() {
  seals.value = [];
  ElMessage.success("已清空所有印章");
}

// 处理印章图片，将白色背景变为透明
async function processSealImage(sealUrl: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法创建canvas上下文"));
        return;
      }

      // 绘制原始图片
      ctx.drawImage(img, 0, 0);

      // 获取图片数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 处理每个像素
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // 如果像素接近白色（RGB都大于200），则设为完全透明
        if (r > 200 && g > 200 && b > 200) {
          data[i + 3] = 0; // 将alpha设为0（完全透明）
        }
      }

      // 将处理后的数据放回canvas
      ctx.putImageData(imageData, 0, 0);

      // 转换为PNG格式的Uint8Array
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(new Uint8Array(reader.result as ArrayBuffer));
          };
          reader.readAsArrayBuffer(blob);
        } else {
          reject(new Error("无法创建blob"));
        }
      }, "image/png");
    };
    img.onerror = () => reject(new Error("无法加载印章图片"));
    img.src = sealUrl;
  });
}

// 导出PDF - 前端直接处理
async function exportPDF() {
  if (!fileUrl.value || !sealUrl.value) {
    ElMessage.error("请先上传文件和印章");
    return;
  }

  if (seals.value.length === 0) {
    ElMessage.error("请至少添加一个印章");
    return;
  }

  isExporting.value = true;
  ElMessage.info("正在生成PDF，请稍候...");

  try {
    // 获取文件对象
    const fileObj = fileList.value[0]?.raw;
    if (!fileObj) {
      throw new Error("文件数据丢失");
    }

    // 读取PDF文件
    const pdfBytes = await fileObj.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // 处理印章图片（将白色背景变为透明）
    const processedSealBytes = await processSealImage(sealUrl.value);

    // 嵌入处理后的印章图片到PDF
    const sealImage = await pdfDoc.embedPng(processedSealBytes);

    // 获取PDF页面
    const pages = pdfDoc.getPages();

    // 调试信息：打印所有印章数据
    console.log("导出PDF - 印章数量:", seals.value.length);
    console.log("导出PDF - 印章数据:", seals.value);
    console.log("导出PDF - PDF总页数:", pages.length);

    // 为每个印章位置添加印章
    for (const seal of seals.value) {
      // 获取印章所在的页码（默认为第一页）
      const pageIndex = seal.pageIndex || 0;
      console.log(
        `处理印章 - pageIndex: ${pageIndex}, pdfX: ${seal.pdfX}, pdfY: ${seal.pdfY}`,
      );

      if (pageIndex < pages.length) {
        const page = pages[pageIndex];
        const { width, height } = page.getSize();
        console.log(`页面 ${pageIndex} 尺寸: ${width} x ${height}`);

        // 使用PDF原生坐标直接绘制印章
        // pdfX和pdfY是印章中心点的PDF原生坐标
        // pdfSealSize是印章在PDF中的大小（正方形）
        const sealPdfSize = seal.pdfSealSize || 50; // 默认50 points

        // 确保坐标值有效，如果不是数字则使用默认值
        let pdfX =
          typeof seal.pdfX === "number" && !isNaN(seal.pdfX)
            ? seal.pdfX
            : width / 2;
        let pdfY =
          typeof seal.pdfY === "number" && !isNaN(seal.pdfY)
            ? seal.pdfY
            : height / 2;

        // 计算印章左下角位置（PDF坐标系原点在左下角）
        const drawX = pdfX - sealPdfSize / 2;
        const drawY = pdfY - sealPdfSize / 2;

        // 确保绘制位置在页面范围内
        const finalX = Math.max(0, Math.min(drawX, width - sealPdfSize));
        const finalY = Math.max(0, Math.min(drawY, height - sealPdfSize));

        // 绘制印章（保持正方形比例）
        // 白色背景已处理为透明，红色部分保持不透明
        page.drawImage(sealImage, {
          x: finalX,
          y: finalY,
          width: sealPdfSize,
          height: sealPdfSize,
          opacity: 1.0, // 完全不透明，因为白色背景已经透明
        });
      }
    }

    // 保存PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // 创建下载链接
    const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signed-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    ElMessage.success("PDF导出成功");
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出失败: " + (error as Error).message);
  } finally {
    isExporting.value = false;
  }
}
</script>

<style scoped>
/* 基础样式 */
.electronic-signature-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%);
  position: relative;
  overflow: hidden;
  padding: 40px 20px;
}

/* 背景装饰 */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.glow-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
}

.glow-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.4) 0%,
    transparent 70%
  );
  top: -200px;
  right: -200px;
  animation: float 20s ease-in-out infinite;
}

.glow-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(
    circle,
    rgba(236, 72, 153, 0.3) 0%,
    transparent 70%
  );
  bottom: -150px;
  left: -150px;
  animation: float 25s ease-in-out infinite reverse;
}

.grid-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

/* 页面头部 */
.page-header {
  text-align: center;
  margin-bottom: 50px;
  position: relative;
  z-index: 1;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 50px;
  padding: 8px 20px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
}

.badge-icon {
  font-size: 16px;
  color: #6366f1;
}

.badge-text {
  font-size: 14px;
  color: #a5b4fc;
  font-weight: 500;
}

.page-title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: -1px;
}

.title-gradient {
  background: linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-desc {
  font-size: 18px;
  color: #94a3b8;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
}

/* 主内容区 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* 上传区域 */
.upload-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.upload-card {
  position: relative;
  width: 320px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.upload-card:hover {
  transform: translateY(-5px);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 60px rgba(99, 102, 241, 0.1);
}

.upload-card.has-file {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.05);
}

.upload-card.has-file:hover {
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 60px rgba(34, 197, 94, 0.1);
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.1) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.4s;
}

.upload-card:hover .card-glow {
  opacity: 1;
}

.card-content {
  position: relative;
  z-index: 1;
}

.upload-icon-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 24px;
}

.icon-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.icon-circle.seal {
  background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
}

.upload-icon {
  font-size: 32px;
  color: white;
}

.icon-ring {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.icon-ring.seal {
  border-color: rgba(236, 72, 153, 0.3);
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.5;
  }
}

.upload-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.upload-desc {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 24px;
}

.upload-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  padding: 12px 32px;
  font-size: 15px;
  border-radius: 10px;
  transition: all 0.3s;
}

.upload-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
}

.upload-btn.seal {
  background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
}

.upload-btn.seal:hover {
  box-shadow: 0 10px 30px rgba(236, 72, 153, 0.4);
}

.upload-btn.has-file {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.file-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  color: #22c55e;
  font-size: 14px;
}

.status-icon {
  font-size: 16px;
}

/* 上传分隔线 */
.upload-divider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.divider-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(99, 102, 241, 0.5),
    transparent
  );
}

.divider-icon {
  width: 40px;
  height: 40px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  font-size: 18px;
}

/* 预览区域 */
.preview-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 30px;
  backdrop-filter: blur(10px);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.header-text h3 {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px 0;
}

.header-text p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.seal-size-control {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 16px;
  border-radius: 10px;
}

.control-label {
  font-size: 13px;
  color: #94a3b8;
  white-space: nowrap;
}

.size-slider {
  width: 120px;
}

.size-value {
  font-size: 13px;
  color: #6366f1;
  font-weight: 600;
  min-width: 45px;
}

/* 浮动导航按钮容器 */
.floating-nav-buttons {
  position: fixed;
  right: 20px;
  bottom: 100px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
  transition: all 0.3s ease;
  animation: fadeInUp 0.3s ease;
}

.nav-btn:hover {
  transform: translateY(-3px) scale(1.1);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
}

.nav-btn .el-icon {
  font-size: 20px;
  color: white;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.export-btn {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  padding: 12px 24px;
  font-size: 15px;
  border-radius: 10px;
  transition: all 0.3s;
}

.export-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(34, 197, 94, 0.4);
}

.preview-section {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
}

.preview-container {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 20px;
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.preview-area {
  position: relative;
  background: #0f172a;
  border: 2px dashed rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  overflow: hidden;
  flex: 1;
  cursor: crosshair;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 600px;
  display: block;
}

.pdf-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.pdf-content {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.pdf-content.is-loading {
  opacity: 0;
  pointer-events: none;
}

.pdf-pages-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.pdf-page-wrapper {
  display: flex;
  justify-content: center;
  background: white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pdf-canvas {
  max-width: 100%;
  height: auto;
  display: block;
}

.pdf-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #6366f1;
}

.loading-icon {
  font-size: 48px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.pdf-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #ef4444;
  padding: 40px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
}

.pdf-content {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-content {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

/* 印章标记 */
.seal-mark {
  position: absolute;
  cursor: move;
  user-select: none;
  animation: sealAppear 0.3s ease-out;
  z-index: 1000;
}

/* 双击事件捕获层 */
.double-click-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  cursor: crosshair;
  pointer-events: auto;
}

@keyframes sealAppear {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.seal-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

/* 印章白色背景透明化 */
.seal-image.transparent-bg {
  mix-blend-mode: multiply;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3)) contrast(1.1);
}

.seal-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10;
}

.seal-mark:hover .seal-remove {
  opacity: 1;
}

.seal-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle,
    rgba(236, 72, 153, 0.2) 0%,
    transparent 70%
  );
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}

.seal-mark:hover .seal-glow {
  opacity: 1;
}

/* 点击提示 */
.click-hint {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #6366f1;
  animation: hintPulse 2s ease-in-out infinite;
}

.hint-icon {
  width: 60px;
  height: 60px;
  background: rgba(99, 102, 241, 0.1);
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

@keyframes hintPulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

/* 印章列表 */
.seal-list {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding: 16px 20px;
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
}

.list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a5b4fc;
  font-size: 14px;
}

/* 操作提示 */
.operation-tip {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 50px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.tip-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
}

.tip-icon-wrapper {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: tipFloat 3s ease-in-out infinite;
}

@keyframes tipFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.tip-icon {
  font-size: 36px;
  color: white;
}

.tip-text h4 {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px 0;
}

.tip-text p {
  font-size: 16px;
  color: #94a3b8;
  margin: 0;
}

/* 步骤指示器 */
.tip-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.3s;
}

.step.active .step-number {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
}

.step-text {
  font-size: 14px;
  color: #64748b;
  transition: all 0.3s;
}

.step.active .step-text {
  color: #a5b4fc;
}

.step-arrow {
  color: #475569;
  font-size: 20px;
}

/* 功能特性 */
.features-section {
  max-width: 1200px;
  margin: 60px auto 0;
  position: relative;
  z-index: 1;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  transition: all 0.4s;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: rgba(99, 102, 241, 0.3);
  background: rgba(99, 102, 241, 0.05);
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.2) 0%,
    rgba(139, 92, 246, 0.2) 100%
  );
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #818cf8;
  font-size: 28px;
}

.feature-card:hover .feature-icon {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.feature-card h4 {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px 0;
}

.feature-card p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 36px;
  }

  .upload-section {
    flex-direction: column;
  }

  .upload-divider {
    transform: rotate(90deg);
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .tip-steps {
    flex-direction: column;
    gap: 16px;
  }

  .step-arrow {
    transform: rotate(90deg);
  }
}
</style>
