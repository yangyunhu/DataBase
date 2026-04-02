<template>
  <div class="video-extract-view">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon class="title-icon"><VideoCamera /></el-icon>
        视频提取
      </h1>
      <p class="page-desc">支持B站、小红书视频提取与下载</p>
    </div>

    <div class="content-grid">
      <!-- 左侧输入区 -->
      <div class="input-section">
        <div class="input-card">
          <div class="card-header">
            <el-icon><Link /></el-icon>
            <span>视频链接</span>
          </div>
          
          <el-input
            v-model="videoUrl"
            type="textarea"
            :rows="4"
            placeholder="请粘贴视频链接，目前仅支持B站和小红书..."
            class="url-input"
          />
          
          <div class="platform-tags">
            <span class="tag supported">B站</span>
            <span class="tag supported">小红书</span>
            <span class="tag coming-soon">更多平台开发中...</span>
          </div>
          
          <el-button
            type="primary"
            size="large"
            class="extract-btn"
            :loading="loading"
            :disabled="!videoUrl"
            @click="extractVideo"
          >
            <el-icon v-if="!loading"><Download /></el-icon>
            <span>{{ loading ? '提取中...' : '提取视频' }}</span>
          </el-button>
        </div>

        <!-- 使用说明 -->
        <div class="tips-card">
          <h4><el-icon><InfoFilled /></el-icon> 使用说明</h4>
          <ul>
            <li><strong>支持平台：</strong>B站、小红书</li>
            <li><strong>其他平台：</strong>正在开发中，敬请期待</li>
            <li>B站视频：预览无声，水印嵌入画面无法去除</li>
            <li>系统自动识别视频源并提取信息</li>
            <li>提供多种清晰度与格式选择</li>
          </ul>
        </div>

        <!-- 免责声明 -->
        <div class="disclaimer-card">
          <h4><el-icon><WarningFilled /></el-icon> 免责声明</h4>
          <div class="disclaimer-content">
            <p>
              <strong>重要提示：</strong>本功能仅供学习和个人使用，请确保您拥有视频的合法使用权。
            </p>
            <p>
              提取的视频版权归原作者或平台所有，未经授权不得用于商业用途或传播。
            </p>
            <p>
              如因不当使用造成任何法律问题，责任由使用者自行承担。
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧预览区 -->
      <div class="preview-section">
        <div class="preview-card" :class="{ 'has-content': videoInfo || loading }">
          <div v-if="!videoInfo && !loading" class="empty-state">
            <div class="empty-icon">
              <el-icon><VideoPlay /></el-icon>
            </div>
            <p>输入链接后点击提取按钮</p>
            <p class="sub-text">视频预览与下载选项将显示在这里</p>
          </div>

          <!-- 加载状态 -->
          <div v-else-if="loading" class="loading-state">
            <div class="loading-animation">
              <div class="spinner"></div>
              <div class="loading-text">正在解析视频...</div>
              <div class="loading-steps">
                <div class="step" :class="{ active: step >= 1, done: step > 1 }">
                  <el-icon><Check v-if="step > 1" /><Loading v-else /></el-icon>
                  <span>解析链接</span>
                </div>
                <div class="step" :class="{ active: step >= 2, done: step > 2 }">
                  <el-icon><Check v-if="step > 2" /><Loading v-else /></el-icon>
                  <span>获取视频信息</span>
                </div>
                <div class="step" :class="{ active: step >= 3, done: step > 3 }">
                  <el-icon><Check v-if="step > 3" /><Loading v-else /></el-icon>
                  <span>处理视频数据</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 视频预览 -->
          <div v-else-if="videoInfo" class="video-result">
            <div class="video-preview">
              <!-- 视频播放器 -->
              <video
                v-if="selectedVideoUrl"
                :src="getProxyVideoUrl(selectedVideoUrl)"
                controls
                class="video-player"
                :poster="coverImageError ? videoInfo.cover : getProxyImageUrl(videoInfo.cover)"
              ></video>
              <!-- 封面图（当没有选中视频时） -->
              <template v-else>
                <img 
                  :src="coverImageError ? videoInfo.cover : getProxyImageUrl(videoInfo.cover)" 
                  alt="视频封面" 
                  @error="coverImageError = true"
                />
                <div class="play-overlay" @click="playVideo">
                  <el-icon><VideoPlay /></el-icon>
                </div>
              </template>
              <div class="video-duration">{{ videoInfo.duration }}</div>
            </div>

            <div class="video-info">
              <div class="platform-badge" v-if="videoInfo.platform">
                <el-tag type="primary" effect="dark" size="small">{{ videoInfo.platform }}</el-tag>
              </div>
              <h3 class="video-title">{{ videoInfo.title }}</h3>
              <div class="video-meta">
                <span><el-icon><User /></el-icon>{{ videoInfo.author }}</span>
                <span><el-icon><View /></el-icon>{{ videoInfo.views }}</span>
              </div>
              <!-- B站视频提示 -->
              <div v-if="videoInfo.platform === 'B站'" class="bilibili-notice">
                <el-alert
                  title="B站视频说明"
                  description="1. 预览时无声：B站视频和音频是分开的，下载后正常播放。2. 无法去水印：B站水印嵌入视频画面，无法通过下载去除。"
                  type="info"
                  :closable="false"
                  show-icon
                />
              </div>
            </div>

            <div class="download-options">
              <div class="option-group" v-if="videoInfo.formats && videoInfo.formats.length > 0">
                <label>清晰度</label>
                <el-radio-group v-model="selectedQuality" @change="onQualityChange">
                  <el-radio-button 
                    v-for="format in videoInfo.formats" 
                    :key="format.quality" 
                    :value="format.quality"
                  >
                    {{ format.quality }} ({{ format.size }})
                  </el-radio-button>
                </el-radio-group>
              </div>

              <div class="option-group">
                <label>格式</label>
                <el-radio-group v-model="selectedFormat">
                  <el-radio-button value="mp4">MP4</el-radio-button>
                  <el-radio-button value="mov">MOV</el-radio-button>
                </el-radio-group>
              </div>

              <el-button
                type="primary"
                size="large"
                class="download-btn"
                :loading="downloading"
                @click="downloadVideo"
              >
                <el-icon><Download /></el-icon>
                <span>{{ downloading ? '下载中...' : '下载视频' }}</span>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  VideoCamera, Link, Download, InfoFilled, WarningFilled,
  VideoPlay, Check, Loading, User, View
} from '@element-plus/icons-vue'

const videoUrl = ref('')
const loading = ref(false)
const downloading = ref(false)
const step = ref(1)
const selectedQuality = ref('1080P')
const selectedFormat = ref('mp4')
const selectedVideoUrl = ref('')
const coverImageError = ref(false)

const videoInfo = ref<{
  title: string
  author: string
  duration: string
  views: string
  cover: string
  platform?: string
  formats?: Array<{
    quality: string
    size: string
    url: string
    format_id: string
  }>
} | null>(null)

// 从文本中提取 URL
const extractUrlFromText = (text: string): string => {
  // 匹配常见的 URL 格式
  // 支持：http(s)://域名/路径，路径可以包含字母、数字、特殊字符，直到遇到空格或中文字符
  const urlRegex = /(https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]?(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]?)+(?:\/[\w\-\.\/\?\%\&\=\+\#\@\:\~]*)?)/i
  const match = text.match(urlRegex)
  if (match) {
    let url = match[1]
    // 清理URL末尾的非URL字符（如中文标点）
    url = url.replace(/[^\x00-\x7F]+$/, '')
    return url
  }
  return text.trim()
}

// 获取代理图片 URL
const getProxyImageUrl = (url: string): string => {
  if (!url) return ''
  // 如果是 B站或小红书的图片，使用代理
  if (url.includes('hdslb.com') || url.includes('bilibili.com') || url.includes('xhscdn.com')) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`
  }
  return url
}

// 获取代理视频 URL
const getProxyVideoUrl = (url: string): string => {
  if (!url) return ''
  // 如果是 B站或小红书的视频，使用代理
  if (url.includes('bilivideo.com') || url.includes('bilibili.com') || url.includes('xhscdn.com')) {
    return `/api/proxy-video?url=${encodeURIComponent(url)}`
  }
  return url
}

// 验证链接是否支持的平台
const validatePlatform = (url: string): { valid: boolean; message?: string } => {
  const cleanUrl = url.trim().toLowerCase()
  
  // 检查是否是B站链接
  if (cleanUrl.includes('bilibili.com') || cleanUrl.includes('b23.tv')) {
    return { valid: true }
  }
  
  // 检查是否是小红书链接
  if (cleanUrl.includes('xiaohongshu.com') || cleanUrl.includes('xhslink.com')) {
    return { valid: true }
  }
  
  // 其他平台
  return {
    valid: false,
    message: '目前仅支持B站和小红书视频提取，其他平台正在开发中，请稍后再试。'
  }
}

const extractVideo = async () => {
  if (!videoUrl.value.trim()) {
    ElMessage.warning('请输入视频链接')
    return
  }

  // 从输入文本中提取 URL
  const extractedUrl = extractUrlFromText(videoUrl.value)
  
  // 验证平台
  const validation = validatePlatform(extractedUrl)
  if (!validation.valid) {
    ElMessage({
      message: validation.message,
      type: 'warning',
      duration: 8000,
      showClose: true
    })
    return
  }
  console.log('提取的URL:', extractedUrl)

  loading.value = true
  step.value = 1
  videoInfo.value = null

  // 模拟解析步骤
  setTimeout(() => { step.value = 2 }, 500)
  setTimeout(() => { step.value = 3 }, 1000)
  
  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ videoUrl: extractedUrl })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '视频提取失败')
    }

    const data = await response.json()
    videoInfo.value = data
    
    // 检查是否是不支持的链接提示
    if (data.supported == false && data.error) {
      loading.value = false
      // 显示详细的错误信息
      if (data.error.includes('\n')) {
        ElMessage({
          message: data.error.replace(/\n/g, '<br>'),
          type: 'warning',
          dangerouslyUseHTMLString: true,
          duration: 10000,
          showClose: true
        })
      } else {
        ElMessage.warning(data.error)
      }
      return
    }
    
    // 设置默认视频 URL（最高清晰度）
    if (data.formats && data.formats.length > 0) {
      selectedVideoUrl.value = data.formats[0].url
      selectedQuality.value = data.formats[0].quality
    }
    
    loading.value = false
    ElMessage.success('视频提取成功！')
  } catch (error: any) {
    loading.value = false
    // 显示详细的错误信息
    if (error.message && error.message.includes('\n')) {
      // 多行错误信息使用通知显示
      ElMessage({
        message: error.message.replace(/\n/g, '<br>'),
        type: 'error',
        dangerouslyUseHTMLString: true,
        duration: 8000,
        showClose: true
      })
    } else {
      ElMessage.error(error.message || '视频提取失败')
    }
  }
}

// 播放视频
const playVideo = () => {
  if (videoInfo.value?.formats && videoInfo.value.formats.length > 0) {
    // 找到选中清晰度的视频
    const format = videoInfo.value.formats.find(f => f.quality === selectedQuality.value)
    selectedVideoUrl.value = format?.url || videoInfo.value.formats[0].url
  }
}

// 切换清晰度
const onQualityChange = (quality: string) => {
  selectedQuality.value = quality
  if (videoInfo.value?.formats) {
    const format = videoInfo.value.formats.find(f => f.quality === quality)
    if (format) {
      selectedVideoUrl.value = format.url
    }
  }
}

const downloadVideo = async () => {
  downloading.value = true
  
  try {
    // 从输入文本中提取 URL
    const extractedUrl = extractUrlFromText(videoUrl.value)
    
    console.log('[视频下载] 开始下载:', extractedUrl)
    
    const response = await fetch('/api/download-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        videoUrl: extractedUrl,
        quality: selectedQuality.value,
        format: selectedFormat.value
      })
    })

    console.log('[视频下载] 响应状态:', response.status, response.statusText)
    console.log('[视频下载] Content-Type:', response.headers.get('content-type'))
    console.log('[视频下载] Content-Length:', response.headers.get('content-length'))

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '视频下载失败')
    }

    const blob = await response.blob()
    console.log('[视频下载] Blob大小:', blob.size, '字节')
    
    if (blob.size === 0) {
      throw new Error('下载的文件为空')
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `video-${Date.now()}.${selectedFormat.value}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    downloading.value = false
    ElMessage.success(`视频已下载 (${selectedQuality.value} ${selectedFormat.value})`)
  } catch (error: any) {
    downloading.value = false
    console.error('[视频下载] 错误:', error)
    ElMessage.error(error.message || '视频下载失败')
  }
}
</script>

<style scoped>
.video-extract-view {
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
  color: #00d4ff;
}

.page-desc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
}

/* 输入区 */
.input-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00d4ff;
  font-weight: 500;
  margin-bottom: 16px;
}

.url-input :deep(.el-textarea__inner) {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  resize: none;
}

.url-input :deep(.el-textarea__inner:focus) {
  border-color: #00d4ff;
}

.platform-tags {
  display: flex;
  gap: 8px;
  margin: 16px 0;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.tag.supported {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.2);
  color: #00d4ff;
}

.tag.unsupported {
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.2);
  color: #ff6464;
}

.tag.coming-soon {
  background: rgba(255, 170, 0, 0.1);
  border: 1px solid rgba(255, 170, 0, 0.2);
  color: #ffaa00;
}

.extract-btn {
  width: 100%;
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  border: none;
  height: 48px;
  font-size: 16px;
}

.extract-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
}

/* 使用说明 */
.tips-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
}

.tips-card h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-bottom: 12px;
}

.tips-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-card li {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  padding: 6px 0;
  padding-left: 16px;
  position: relative;
}

.tips-card li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #00d4ff;
}

/* 免责声明 */
.disclaimer-card {
  background: rgba(255, 100, 100, 0.08);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
  animation: pulse-warning 3s ease-in-out infinite;
}

@keyframes pulse-warning {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(255, 100, 100, 0);
  }
  50% {
    box-shadow: 0 0 20px 5px rgba(255, 100, 100, 0.15);
  }
}

.disclaimer-card h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ff6464;
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
}

.disclaimer-card h4 .el-icon {
  font-size: 18px;
}

.disclaimer-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.disclaimer-content p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  line-height: 1.7;
  margin: 0;
}

.disclaimer-content strong {
  color: #ff6464;
  font-weight: 600;
}

/* 预览区 */
.preview-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-card.has-content {
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
  background: rgba(0, 212, 255, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon .el-icon {
  font-size: 36px;
  color: rgba(0, 212, 255, 0.3);
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-state .sub-text {
  font-size: 13px;
}

/* 加载状态 */
.loading-state {
  width: 100%;
  padding: 40px;
}

.loading-animation {
  text-align: center;
}

.spinner {
  width: 60px;
  height: 60px;
  margin: 0 auto 24px;
  border: 3px solid rgba(0, 212, 255, 0.1);
  border-top-color: #00d4ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #00d4ff;
  font-size: 16px;
  margin-bottom: 32px;
}

.loading-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 300px;
  margin: 0 auto;
}

.step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.step.active {
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
}

.step.done {
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
}

/* 视频结果 */
.video-result {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.video-preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  background: #000;
  aspect-ratio: 16 / 9;
  max-height: 400px;
}

.video-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.video-player {
  width: 100%;
  height: auto;
  max-height: 400px;
  display: block;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
}

.video-preview:hover .play-overlay {
  opacity: 1;
}

.play-overlay .el-icon {
  font-size: 48px;
  color: #fff;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
}

.video-info {
  margin-bottom: 24px;
}

.platform-badge {
  margin-bottom: 12px;
}

.platform-badge :deep(.el-tag) {
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  border: none;
  font-weight: 500;
}

.video-title {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 12px;
  line-height: 1.5;
}

.video-meta {
  display: flex;
  gap: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.video-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.bilibili-notice {
  margin-top: 12px;
}

.bilibili-notice :deep(.el-alert) {
  background: rgba(0, 174, 255, 0.1);
  border: 1px solid rgba(0, 174, 255, 0.3);
}

.bilibili-notice :deep(.el-alert__title) {
  color: #00aeff;
  font-weight: 500;
}

.bilibili-notice :deep(.el-alert__description) {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

/* 下载选项 */
.download-options {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
}

.option-group {
  margin-bottom: 16px;
}

.option-group label {
  display: block;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  margin-bottom: 8px;
}

.option-group :deep(.el-radio-button__inner) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.option-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: rgba(0, 212, 255, 0.2);
  border-color: #00d4ff;
  color: #00d4ff;
  box-shadow: none;
}

.download-btn {
  width: 100%;
  background: linear-gradient(135deg, #00ff88, #00cc66);
  border: none;
  height: 48px;
  font-size: 16px;
  margin-top: 8px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
