<template>
  <div class="translation-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="title-wrapper">
        <div class="title-icon-wrapper">
          <el-icon class="title-icon"><Connection /></el-icon>
        </div>
        <div class="title-content">
          <h1 class="page-title">中英文翻译</h1>
          <p class="page-desc">
            支持Word文档翻译和文本翻译，准确快速，保持原有格式
          </p>
        </div>
      </div>
    </div>

    <!-- 模式切换 -->
    <div class="mode-switch">
      <div class="mode-switch-inner">
        <button
          :class="['mode-btn', { active: translationMode === 'file' }]"
          @click="translationMode = 'file'"
        >
          <div class="mode-btn-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="mode-btn-content">
            <span class="mode-btn-title">文档翻译</span>
            <span class="mode-btn-desc">Word 文档</span>
          </div>
        </button>
        <button
          :class="['mode-btn', { active: translationMode === 'text' }]"
          @click="translationMode = 'text'"
        >
          <div class="mode-btn-icon">
            <el-icon><EditPen /></el-icon>
          </div>
          <div class="mode-btn-content">
            <span class="mode-btn-title">文本翻译</span>
            <span class="mode-btn-desc">即时翻译</span>
          </div>
        </button>
      </div>
    </div>

    <!-- 文档翻译模式 -->
    <div v-if="translationMode === 'file'" class="translate-panel">
      <div class="panel-content">
        <!-- 上传区域 -->
        <div class="upload-wrapper">
          <el-upload
            class="upload-area"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="false"
            accept=".docx"
          >
            <div class="upload-inner">
              <div class="upload-illustration">
                <div class="upload-icon-bg">
                  <el-icon class="upload-icon"><Upload /></el-icon>
                </div>
                <div class="upload-particles">
                  <span></span><span></span><span></span>
                </div>
              </div>
              <div class="upload-text">
                <p class="upload-main-text">拖拽文件到此处，或点击上传</p>
                <p class="upload-sub-text">
                  支持 Word 格式(.docx)，单个文件不超过 50MB
                </p>
              </div>
              <div class="upload-tags">
                <span class="tag">
                  <el-icon><Check /></el-icon>
                  保持格式
                </span>
                <span class="tag">
                  <el-icon><Check /></el-icon>
                  安全加密
                </span>
                <span class="tag">
                  <el-icon><Check /></el-icon>
                  快速响应
                </span>
              </div>
            </div>
          </el-upload>
        </div>

        <!-- 已选文件 -->
        <div v-if="fileList.length > 0" class="file-section">
          <div class="section-label">
            <el-icon><Document /></el-icon>
            待翻译文件
          </div>
          <div class="file-list">
            <div
              v-for="(file, index) in fileList"
              :key="index"
              class="file-card"
            >
              <div class="file-card-content">
                <div class="file-icon" :class="getFileIconClass()">
                  <el-icon><component :is="getFileIcon()" /></el-icon>
                </div>
                <div class="file-details">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <button class="file-remove" @click="removeFile(index)">
                  <el-icon><Delete /></el-icon>
                </button>
              </div>
              <div v-if="file.status === 'translating'" class="file-progress">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: file.progress + '%' }"
                  ></div>
                </div>
                <span class="progress-text">翻译中...</span>
              </div>
              <div v-else-if="file.status === 'done'" class="file-status">
                <el-icon class="status-icon"><CircleCheck /></el-icon>
                <span>翻译完成</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 翻译方向说明 -->
        <div class="direction-section">
          <div class="section-label">
            <el-icon><Switch /></el-icon>
            智能翻译
          </div>
          <div class="auto-detect-info">
            <span class="info-text">系统会自动检测文档语言并翻译</span>
            <span class="info-sub">中文 → 英文 | 英文 → 中文</span>
          </div>
        </div>

        <!-- 翻译按钮 -->
        <button
          v-if="fileList.length > 0"
          class="action-btn primary"
          :disabled="translating"
          @click="startTranslate"
        >
          <el-icon v-if="!translating" class="btn-icon"><MagicStick /></el-icon>
          <el-icon v-else class="btn-icon spinning"><Loading /></el-icon>
          <span>{{ translating ? "翻译中..." : "开始翻译" }}</span>
        </button>

        <!-- 翻译结果 -->
        <div v-if="translatedFiles.length > 0" class="result-section">
          <div class="section-label success">
            <el-icon><CircleCheck /></el-icon>
            翻译完成
          </div>
          <div class="result-list">
            <div
              v-for="(file, index) in translatedFiles"
              :key="index"
              class="result-card"
            >
              <div class="result-icon">
                <el-icon><DocumentChecked /></el-icon>
              </div>
              <div class="result-info">
                <span class="result-name">{{ file.name }}</span>
                <span class="result-size">{{ formatFileSize(file.size) }}</span>
              </div>
              <button class="download-btn" @click="downloadFile(file)">
                <el-icon><Download /></el-icon>
                <span>下载</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文本翻译模式 -->
    <div v-else class="translate-panel text-mode">
      <div class="panel-content">
        <!-- 输入区域 -->
        <div class="text-section input-section">
          <div class="section-header">
            <div class="section-label">
              <el-icon><EditPen /></el-icon>
              输入文本
            </div>
            <button class="text-action-btn" @click="clearText">
              <el-icon><Delete /></el-icon>
              清空
            </button>
          </div>
          <div class="text-area-wrapper">
            <textarea
              v-model="inputText"
              class="text-area"
              placeholder="请输入需要翻译的文本内容..."
              maxlength="5000"
            ></textarea>
            <div class="text-stats">
              <span>{{ inputText.length }} / 5000</span>
            </div>
          </div>
        </div>

        <!-- 翻译方向选择 -->
        <div class="direction-section compact">
          <div class="direction-options">
            <button
              :class="[
                'direction-btn',
                { active: textTranslateDirection === 'zh2en' },
              ]"
              @click="textTranslateDirection = 'zh2en'"
            >
              <span class="lang-from">中文</span>
              <el-icon class="arrow-icon"><Right /></el-icon>
              <span class="lang-to">英文</span>
            </button>
            <button
              :class="[
                'direction-btn',
                { active: textTranslateDirection === 'en2zh' },
              ]"
              @click="textTranslateDirection = 'en2zh'"
            >
              <span class="lang-from">英文</span>
              <el-icon class="arrow-icon"><Right /></el-icon>
              <span class="lang-to">中文</span>
            </button>
          </div>
        </div>

        <!-- 翻译按钮 -->
        <button
          v-if="inputText.trim()"
          class="action-btn primary"
          :disabled="textTranslating"
          @click="translateText"
        >
          <el-icon v-if="!textTranslating" class="btn-icon"
            ><MagicStick
          /></el-icon>
          <el-icon v-else class="btn-icon spinning"><Loading /></el-icon>
          <span>{{ textTranslating ? "翻译中..." : "开始翻译" }}</span>
        </button>

        <!-- 翻译结果 -->
        <div v-if="translatedText" class="text-section output-section">
          <div class="section-header">
            <div class="section-label success">
              <el-icon><CircleCheck /></el-icon>
              翻译结果
            </div>
            <button class="text-action-btn copy" @click="copyText">
              <el-icon><DocumentCopy /></el-icon>
              复制
            </button>
          </div>
          <div class="text-area-wrapper output">
            <textarea
              v-model="translatedText"
              class="text-area"
              readonly
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="features-section">
      <div class="features-grid">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="feature-item"
        >
          <div
            class="feature-icon-wrapper"
            :style="{ '--feature-color': feature.color }"
          >
            <div class="feature-icon-bg"></div>
            <el-icon class="feature-icon"
              ><component :is="feature.icon"
            /></el-icon>
          </div>
          <h4 class="feature-title">{{ feature.title }}</h4>
          <p class="feature-desc">{{ feature.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import type { UploadFile } from "element-plus";
import {
  Connection,
  Document,
  EditPen,
  Upload,
  Delete,
  CircleCheck,
  MagicStick,
  Download,
  DocumentChecked,
  DocumentCopy,
  Check,
  Switch,
  Right,
  Loading,
} from "@element-plus/icons-vue";

const translationMode = ref<"file" | "text">("file");
const translating = ref(false);
const textTranslating = ref(false);
const fileList = ref<
  Array<{
    name: string;
    size: number;
    status: "pending" | "translating" | "done";
    progress: number;
    file?: File;
  }>
>([]);
const translatedFiles = ref<
  Array<{
    name: string;
    size: number;
    blob?: Blob;
  }>
>([]);
const inputText = ref("");
const translatedText = ref("");
const translateDirection = ref("zh2en");
const textTranslateDirection = ref("zh2en");

const features = [
  {
    title: "智能翻译",
    desc: "采用先进的翻译引擎，准确理解上下文",
    icon: MagicStick,
    color: "#00d4ff",
  },
  {
    title: "格式保留",
    desc: "文档翻译保持原有排版和格式",
    icon: DocumentChecked,
    color: "#9d00ff",
  },
  {
    title: "快速响应",
    desc: "实时翻译，即时显示结果",
    icon: Connection,
    color: "#00ff88",
  },
];

const getFileIcon = () => {
  return DocumentChecked;
};

const getFileIconClass = () => {
  return "word";
};

const handleFileChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  if (!file) return;

  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error("请上传Word格式的文件(.docx)");
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    ElMessage.error("文件大小不能超过50MB");
    return;
  }

  fileList.value.push({
    name: file.name,
    size: file.size,
    status: "pending",
    progress: 0,
    file: file,
  });
};

const removeFile = (index: number) => {
  fileList.value.splice(index, 1);
  if (fileList.value.length === 0) {
    translatedFiles.value = [];
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const startTranslate = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning("请先上传文件");
    return;
  }

  translating.value = true;

  try {
    for (let i = 0; i < fileList.value.length; i++) {
      const file = fileList.value[i];
      file.status = "translating";
      file.progress = 0;

      const formData = new FormData();
      if (file.file) {
        formData.append("file", file.file);
        formData.append("direction", translateDirection.value);

        const response = await fetch(
          "http://localhost:3001/api/translate-document",
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "翻译失败" }));
          throw new Error(errorData.message || "翻译失败");
        }

        const blob = await response.blob();
        const fileName =
          file.name.replace(/\.[^/.]+$/, "") + "_translated.docx";

        translatedFiles.value.push({
          name: fileName,
          size: blob.size,
          blob: blob,
        });

        file.status = "done";
        file.progress = 100;
      }
    }

    ElMessage.success("文档翻译成功！");
  } catch (error) {
    ElMessage.error("文档翻译失败，请重试");
    console.error("翻译失败:", error);
  } finally {
    translating.value = false;
  }
};

const downloadFile = (file: { name: string; blob?: Blob }) => {
  if (!file.blob) return;

  const url = URL.createObjectURL(file.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  ElMessage.success("下载成功！");
};

const clearText = () => {
  inputText.value = "";
  translatedText.value = "";
};

const translateText = async () => {
  if (!inputText.value.trim()) {
    ElMessage.warning("请输入需要翻译的文本");
    return;
  }

  textTranslating.value = true;

  try {
    const response = await fetch("/api/translate-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: inputText.value,
        direction: textTranslateDirection.value,
      }),
    });

    if (!response.ok) {
      throw new Error("翻译失败");
    }

    const data = await response.json();
    translatedText.value = data.translatedText;

    ElMessage.success("文本翻译成功！");
  } catch (error) {
    ElMessage.error("文本翻译失败，请重试");
    console.error("翻译失败:", error);
  } finally {
    textTranslating.value = false;
  }
};

const copyText = () => {
  navigator.clipboard.writeText(translatedText.value);
  ElMessage.success("复制成功！");
};
</script>

<style scoped>
/* ===== 基础样式 ===== */
.translation-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px;
  min-height: 100vh;
}

/* ===== 页面标题 ===== */
.page-header {
  margin-bottom: 48px;
}

.title-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.title-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.2),
    rgba(0, 153, 255, 0.2)
  );
  border: 2px solid rgba(0, 212, 255, 0.5);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
}

.title-icon {
  font-size: 32px;
  color: #00d4ff;
}

.title-content {
  text-align: left;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #fff 0%, #00d4ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* ===== 模式切换 ===== */
.mode-switch {
  margin-bottom: 32px;
}

.mode-switch-inner {
  display: flex;
  gap: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 6px;
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.mode-btn.active {
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.15),
    rgba(0, 153, 255, 0.15)
  );
  border: 1px solid rgba(0, 212, 255, 0.4);
}

.mode-btn-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

.mode-btn.active .mode-btn-icon {
  background: rgba(0, 212, 255, 0.2);
  color: #00d4ff;
}

.mode-btn-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mode-btn-title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.3s ease;
}

.mode-btn.active .mode-btn-title {
  color: #fff;
}

.mode-btn-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

/* ===== 翻译面板 ===== */
.translate-panel {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 48px;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ===== 上传区域 ===== */
.upload-wrapper {
  width: 100%;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 60px 40px;
  transition: all 0.3s ease;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: rgba(0, 212, 255, 0.5);
  background: rgba(0, 212, 255, 0.05);
}

.upload-area :deep(.el-upload-dragger.is-dragover) {
  border-color: #00d4ff;
  background: rgba(0, 212, 255, 0.1);
}

.upload-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.upload-illustration {
  position: relative;
  width: 100px;
  height: 100px;
}

.upload-icon-bg {
  width: 80px;
  height: 80px;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.2),
    rgba(0, 153, 255, 0.2)
  );
  border: 2px solid rgba(0, 212, 255, 0.4);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 40px rgba(0, 212, 255, 0.2);
}

.upload-icon {
  font-size: 36px;
  color: #00d4ff;
}

.upload-particles span {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #00d4ff;
  border-radius: 50%;
  opacity: 0;
  animation: particle 2s ease-in-out infinite;
}

.upload-particles span:nth-child(1) {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  animation-delay: 0s;
}

.upload-particles span:nth-child(2) {
  bottom: 20%;
  right: 0;
  animation-delay: 0.6s;
}

.upload-particles span:nth-child(3) {
  bottom: 20%;
  left: 0;
  animation-delay: 1.2s;
}

@keyframes particle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.upload-text {
  text-align: center;
}

.upload-main-text {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px 0;
}

.upload-sub-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.upload-tags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.tag .el-icon {
  color: #00ff88;
  font-size: 14px;
}

/* ===== 文件列表 ===== */
.file-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

.section-label.success {
  color: #00ff88;
}

.section-label .el-icon {
  font-size: 16px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;
}

.file-card:hover {
  border-color: rgba(0, 212, 255, 0.3);
  background: rgba(0, 212, 255, 0.03);
}

.file-card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.file-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.file-icon.word {
  background: rgba(33, 150, 243, 0.15);
  color: #42a5f5;
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.file-name {
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.file-remove {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-remove:hover {
  background: rgba(255, 77, 79, 0.15);
  border-color: rgba(255, 77, 79, 0.3);
  color: #ff4d4f;
}

.file-progress {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff, #0099ff);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  color: #00d4ff;
  white-space: nowrap;
}

.file-status {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #00ff88;
}

.status-icon {
  font-size: 16px;
}

/* ===== 翻译方向选择 ===== */
.direction-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.direction-section.compact {
  align-items: center;
}

.direction-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.direction-section.compact .direction-options {
  justify-content: center;
}

.direction-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.direction-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
}

.direction-btn.active {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.4);
}

.lang-from,
.lang-to {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.3s ease;
}

.direction-btn.active .lang-from,
.direction-btn.active .lang-to {
  color: #fff;
}

.arrow-icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.3s ease;
}

.direction-btn.active .arrow-icon {
  color: #00d4ff;
}

/* ===== 操作按钮 ===== */
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.primary {
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  color: #fff;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

.action-btn.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 212, 255, 0.4);
}

.btn-icon {
  font-size: 20px;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ===== 结果区域 ===== */
.result-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 255, 136, 0.05);
  border: 1px solid rgba(0, 255, 136, 0.2);
  border-radius: 16px;
}

.result-icon {
  width: 48px;
  height: 48px;
  background: rgba(0, 255, 136, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #00ff88;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.result-name {
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-size {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: rgba(0, 255, 136, 0.15);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #00ff88;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.download-btn:hover {
  background: rgba(0, 255, 136, 0.25);
  border-color: rgba(0, 255, 136, 0.5);
}

/* ===== 文本翻译区域 ===== */
.text-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
}

.text-action-btn:hover {
  background: rgba(255, 77, 79, 0.1);
  border-color: rgba(255, 77, 79, 0.3);
  color: #ff4d4f;
}

.text-action-btn.copy:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
  color: #00d4ff;
}

.text-area-wrapper {
  position: relative;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.text-area-wrapper:focus-within {
  border-color: rgba(0, 212, 255, 0.4);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
}

.text-area-wrapper.output {
  background: rgba(0, 255, 136, 0.05);
  border-color: rgba(0, 255, 136, 0.2);
}

.text-area {
  width: 100%;
  min-height: 200px;
  padding: 20px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 15px;
  line-height: 1.7;
  resize: vertical;
  font-family: inherit;
  outline: none;
}

.text-area::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.text-stats {
  position: absolute;
  bottom: 12px;
  right: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  pointer-events: none;
}

/* ===== 功能说明 ===== */
.features-section {
  margin-top: 48px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-4px);
}

.feature-icon-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
}

.feature-icon-bg {
  position: absolute;
  inset: 0;
  background: var(--feature-color);
  opacity: 0.15;
  border-radius: 20px;
  filter: blur(20px);
  transition: all 0.3s ease;
}

.feature-item:hover .feature-icon-bg {
  opacity: 0.25;
  filter: blur(30px);
}

.feature-icon {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--feature-color);
}

.feature-title {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px 0;
}

.feature-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.5;
}

/* ===== 响应式设计 ===== */
@media (max-width: 768px) {
  .translation-view {
    padding: 24px 16px;
  }

  .title-wrapper {
    flex-direction: column;
    text-align: center;
  }

  .title-content {
    text-align: center;
  }

  .page-title {
    font-size: 28px;
  }

  .mode-switch-inner {
    flex-direction: column;
  }

  .mode-btn {
    width: 100%;
  }

  .translate-panel {
    padding: 20px;
  }

  .upload-area :deep(.el-upload-dragger) {
    padding: 40px 20px;
  }

  .direction-options {
    flex-direction: column;
    width: 100%;
  }

  .direction-btn {
    width: 100%;
    justify-content: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .file-card-content,
  .result-card {
    flex-wrap: wrap;
  }

  .file-details,
  .result-info {
    min-width: 0;
    flex: 1;
  }
}
</style>
