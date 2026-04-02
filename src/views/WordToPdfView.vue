<template>
  <div class="word-to-pdf-view">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon class="title-icon"><Document /></el-icon>
        Word转PDF
      </h1>
      <p class="page-desc">将Word文档转换为PDF格式，便于分享和打印，保留原有排版</p>
    </div>

    <div class="convert-container">
      <!-- 上传区域 -->
      <div class="upload-section">
        <el-upload
          class="upload-area"
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          accept=".doc,.docx"
        >
          <div class="upload-content">
            <div class="upload-icon">
              <el-icon><Upload /></el-icon>
            </div>
            <div class="upload-text">
              <p class="main-text">点击或拖拽文件到此处上传</p>
              <p class="sub-text">支持 DOC、DOCX 格式，单个文件不超过 100MB</p>
            </div>
          </div>
        </el-upload>

        <!-- 已选文件 -->
        <div v-if="fileList.length > 0" class="file-list">
          <div v-for="(file, index) in fileList" :key="index" class="file-item">
            <div class="file-icon word">
              <el-icon><Document /></el-icon>
            </div>
            <div class="file-info">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
            </div>
            <div class="file-actions">
              <el-icon class="delete-btn" @click="removeFile(index)"><Delete /></el-icon>
            </div>
            <div v-if="file.status === 'converting'" class="file-progress">
              <el-progress :percentage="file.progress" :show-text="false" />
            </div>
            <div v-else-if="file.status === 'done'" class="file-status success">
              <el-icon><CircleCheck /></el-icon>
            </div>
          </div>
        </div>

        <!-- 转换按钮 -->
        <el-button
          v-if="fileList.length > 0"
          type="primary"
          size="large"
          class="convert-btn"
          :loading="converting"
          @click="startConvert"
        >
          <el-icon><Switch /></el-icon>
          <span>{{ converting ? '转换中...' : '开始转换' }}</span>
        </el-button>
      </div>

      <!-- 转换结果 -->
      <div v-if="convertedFiles.length > 0" class="result-section">
        <h3 class="result-title">
          <el-icon><CircleCheck /></el-icon>
          转换完成
        </h3>
        <div class="result-list">
          <div v-for="(file, index) in convertedFiles" :key="index" class="result-item">
            <div class="result-icon">
              <el-icon><DocumentChecked /></el-icon>
            </div>
            <div class="result-info">
              <span class="result-name">{{ file.name }}</span>
              <span class="result-size">{{ formatFileSize(file.size) }}</span>
            </div>
            <el-button type="primary" link @click="downloadFile(file)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="features-grid">
      <div v-for="feature in features" :key="feature.title" class="feature-item">
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import {
  Document, Upload, Delete, CircleCheck, Switch,
  Download, DocumentChecked, DocumentCopy, MagicStick
} from '@element-plus/icons-vue'

const converting = ref(false)
const fileList = ref<Array<{
  name: string
  size: number
  status: 'pending' | 'converting' | 'done'
  progress: number
  file?: File
}>>([])
const convertedFiles = ref<Array<{
  name: string
  size: number
  blob?: Blob
}>>([])

const features = [
  {
    title: '精准转换',
    desc: '保留原有排版、字体、图片位置',
    icon: MagicStick,
    color: 'linear-gradient(135deg, #00d4ff, #0099ff)'
  },
  {
    title: '批量处理',
    desc: '支持多个文件同时转换',
    icon: DocumentCopy,
    color: 'linear-gradient(135deg, #9d00ff, #ff00cc)'
  },
  {
    title: '安全保障',
    desc: '文件处理后自动删除',
    icon: CircleCheck,
    color: 'linear-gradient(135deg, #00ff88, #00cc66)'
  }
]

const handleFileChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  const allowedTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('请上传 Word 格式的文件')
    return
  }

  if (file.size > 100 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过100MB')
    return
  }

  fileList.value.push({
    name: file.name,
    size: file.size,
    status: 'pending',
    progress: 0,
    file: file
  })
}

const removeFile = (index: number) => {
  fileList.value.splice(index, 1)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const startConvert = async () => {
  converting.value = true
  convertedFiles.value = []

  for (let i = 0; i < fileList.value.length; i++) {
    const file = fileList.value[i]
    file.status = 'converting'

    try {
      const formData = new FormData()
      if (file.file) {
        formData.append('file', file.file)
        formData.append('conversionType', 'word2pdf')

        for (let progress = 0; progress <= 80; progress += 10) {
          file.progress = progress
          await new Promise(resolve => setTimeout(resolve, 150))
        }

        const response = await fetch('/api/document', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('转换失败')
        }

        const blob = await response.blob()
        const newName = file.name.replace(/\.[^/.]+$/, '') + '.pdf'
        
        convertedFiles.value.push({
          name: newName,
          size: blob.size,
          blob: blob
        })

        file.progress = 100
        file.status = 'done'
      }
    } catch (error) {
      ElMessage.error(`文件 ${file.name} 转换失败`)
      file.status = 'pending'
      file.progress = 0
    }
  }

  converting.value = false
  if (convertedFiles.value.length > 0) {
    ElMessage.success('转换完成！')
  } else if (fileList.value.length > 0) {
    ElMessage.warning('所有文件转换失败，请重试')
  }
}

const downloadFile = (file: { name: string; size: number; blob?: Blob }) => {
  const blob = file.blob || new Blob(['转换后的文件内容'], { 
    type: 'application/pdf'
  })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
  ElMessage.success(`已下载: ${file.name}`)
}
</script>

<style scoped>
.word-to-pdf-view {
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
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(157, 0, 255, 0.2));
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
  position: relative;
}

.file-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.file-icon.word {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
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

.file-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  overflow: hidden;
  border-radius: 0 0 12px 12px;
}

.file-progress :deep(.el-progress-bar__outer) {
  background: transparent;
  border-radius: 0;
}

.file-status {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.file-status.success {
  color: #52c41a;
}

.convert-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  border: none;
}

.convert-btn:hover {
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

.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(82, 196, 26, 0.1);
  border: 1px solid rgba(82, 196, 26, 0.3);
  border-radius: 12px;
}

.result-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #52c41a, #73d13d);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-name {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.result-size {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
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

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>