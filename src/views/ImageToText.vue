<template>
  <div class="image-to-text-view">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon class="title-icon"><Picture /></el-icon>
        图片文字提取
      </h1>
      <p class="page-desc">
        上传图片，系统将自动扫描并提取其中的文字内容，支持导出为PDF或Word文档
      </p>
    </div>

    <div class="convert-container">
      <!-- 功能开发中提示 -->
      <div class="development-status">
        <div class="status-icon">
          <el-icon class="icon"><Timer /></el-icon>
        </div>
        <h3 class="status-title">功能开发中</h3>
        <p class="status-desc">图片文字提取功能正在开发中，敬请期待！</p>
        <p class="status-note">
          我们正在采用先进的OCR技术，将为您提供更准确、更快速的文字提取体验。
        </p>
      </div>
    </div>

    <!-- 功能说明 -->
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
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import type { UploadFile } from "element-plus";
import {
  Picture,
  Upload,
  Delete,
  CircleCheck,
  MagicStick,
  Document,
  Download,
  DocumentChecked,
  View,
  Eye,
  Timer,
} from "@element-plus/icons-vue";

const extracting = ref(false);
const fileList = ref<
  Array<{
    name: string;
    size: number;
    url: string;
    file: File;
  }>
>([]);
const extractedText = ref("");

const features = [
  {
    title: "智能识别",
    desc: "支持多种字体和排版，准确提取文字内容",
    icon: View,
    color: "linear-gradient(135deg, #00d4ff, #0099ff)",
  },
  {
    title: "多格式支持",
    desc: "支持 JPG、JPEG、PNG、BMP 等常见图片格式",
    icon: Picture,
    color: "linear-gradient(135deg, #9d00ff, #ff00cc)",
  },
  {
    title: "灵活导出",
    desc: "支持导出为 PDF 和 Word 文档格式",
    icon: Download,
    color: "linear-gradient(135deg, #00ff88, #00cc66)",
  },
];

const handleFileChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/png", "image/bmp"];
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error("请上传图片格式的文件");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error("文件大小不能超过10MB");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    fileList.value.push({
      name: file.name,
      size: file.size,
      url: e.target?.result as string,
      file: file,
    });
  };
  reader.readAsDataURL(file);
};

const removeFile = (index: number) => {
  fileList.value.splice(index, 1);
  if (fileList.value.length === 0) {
    extractedText.value = "";
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const startExtract = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning("请先上传图片");
    return;
  }

  extracting.value = true;

  try {
    const formData = new FormData();
    formData.append("file", fileList.value[0].file);
    formData.append("action", "extract-text");

    const response = await fetch("/api/extract-text", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("提取失败");
    }

    const data = await response.json();
    extractedText.value = data.text;

    ElMessage.success("文字提取成功！");
  } catch (error) {
    ElMessage.error("文字提取失败，请重试");
    console.error("提取失败:", error);
  } finally {
    extracting.value = false;
  }
};

const exportToPDF = async () => {
  if (!extractedText.value) {
    ElMessage.warning("请先提取文字内容");
    return;
  }

  try {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: extractedText.value,
        format: "pdf",
      }),
    });

    if (!response.ok) {
      throw new Error("导出失败");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "extracted-text.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    ElMessage.success("PDF导出成功！");
  } catch (error) {
    ElMessage.error("PDF导出失败，请重试");
    console.error("PDF导出失败:", error);
  }
};

const exportToWord = async () => {
  if (!extractedText.value) {
    ElMessage.warning("请先提取文字内容");
    return;
  }

  try {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: extractedText.value,
        format: "word",
      }),
    });

    if (!response.ok) {
      throw new Error("导出失败");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "extracted-text.docx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    ElMessage.success("Word导出成功！");
  } catch (error) {
    ElMessage.error("Word导出失败，请重试");
    console.error("Word导出失败:", error);
  }
};
</script>

<style scoped>
.image-to-text-view {
  max-width: 1000px;
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
  color: #00d4ff;
}

.page-desc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.convert-container {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
}

.upload-section {
  width: 100%;
}

.upload-area {
  width: 100%;
  margin-bottom: 24px;
}

.upload-area :deep(.el-upload-dragger) {
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed rgba(0, 212, 255, 0.3);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: rgba(0, 212, 255, 0.6);
  background: rgba(0, 212, 255, 0.05);
}

.upload-area :deep(.el-upload-dragger.is-dragover) {
  border-color: #00d4ff;
  background: rgba(0, 212, 255, 0.1);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.upload-icon {
  width: 72px;
  height: 72px;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.2),
    rgba(157, 0, 255, 0.2)
  );
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  font-size: 32px;
  color: #00d4ff;
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.2);
}

.upload-text {
  text-align: center;
}

.main-text {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.sub-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.file-list {
  margin-bottom: 24px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  margin-bottom: 12px;
}

.file-preview {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.file-size {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.file-actions {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s;
}

.file-actions:hover {
  color: #ff4d4f;
}

.extract-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  border: none;
}

.extract-btn:hover {
  background: linear-gradient(135deg, #0099ff, #0077cc);
}

.result-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 20px;
}

.result-content {
  margin-bottom: 24px;
}

.text-area {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  resize: vertical;
}

.text-area :deep(textarea) {
  background: transparent;
  color: #fff;
  border: none;
  resize: vertical;
}

.text-area :deep(.el-textarea__inner) {
  background: transparent;
  color: #fff;
  border: none;
}

.export-section {
  margin-top: 24px;
}

.export-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16px;
}

.export-buttons {
  display: flex;
  gap: 16px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.feature-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}

.feature-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
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

.development-status {
  text-align: center;
  padding: 60px 20px;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 20px;
  margin: 0 auto;
  max-width: 600px;
}

.status-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.2),
    rgba(157, 0, 255, 0.2)
  );
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 40px;
  color: #00d4ff;
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
}

.status-title {
  font-size: 24px;
  font-weight: 700;
  color: #00d4ff;
  margin-bottom: 16px;
}

.status-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
}

.status-note {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }

  .export-buttons {
    flex-direction: column;
  }

  .development-status {
    padding: 40px 16px;
  }

  .status-icon {
    width: 60px;
    height: 60px;
    font-size: 30px;
  }

  .status-title {
    font-size: 20px;
  }

  .status-desc {
    font-size: 14px;
  }

  .status-note {
    font-size: 12px;
  }
}
</style>
