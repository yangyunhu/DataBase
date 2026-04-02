<template>
  <div class="color-picker-view">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon class="title-icon"><Brush /></el-icon>
        取色库
      </h1>
      <p class="page-desc">随机生成颜色，点击复制颜色值</p>
    </div>

    <div class="color-picker-container">
      <!-- 颜色生成控制 -->
      <div class="color-controls">
        <el-button
          type="primary"
          size="large"
          class="generate-colors-btn"
          @click="generateColors"
        >
          <el-icon><Refresh /></el-icon>
          <span>生成新颜色</span>
        </el-button>
        <el-select
          v-model="copyFormat"
          class="copy-format-select"
          placeholder="选择复制格式"
        >
          <el-option label="HEX" value="hex" />
          <el-option label="RGB" value="rgb" />
          <el-option label="RGBA" value="rgba" />
        </el-select>
      </div>

      <!-- 颜色卡片网格 -->
      <div class="color-grid">
        <div
          v-for="(color, index) in colors"
          :key="index"
          class="color-card"
          :style="{ background: color.hex }"
          @click="copyColor(color)"
        >
          <div class="color-info">
            <div class="color-value">{{ formatColor(color) }}</div>
            <el-button
              type="text"
              class="copy-btn"
              @click.stop="copyColor(color)"
            >
              <el-icon><DocumentCopy /></el-icon>
              <span>复制</span>
            </el-button>
          </div>
          <div class="color-overlay" v-if="copiedIndex === index">
            <el-icon class="check-icon"><Check /></el-icon>
            <span>已复制</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="color-features-grid">
      <div
        v-for="feature in features"
        :key="feature.title"
        class="color-feature-item"
      >
        <div class="color-feature-icon" :style="{ background: feature.color }">
          <el-icon><component :is="feature.icon" /></el-icon>
        </div>
        <h4>{{ feature.title }}</h4>
        <p>{{ feature.desc }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import {
  Brush,
  Refresh,
  DocumentCopy,
  Check,
  Grid,
  CopyDocument,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

interface Color {
  hex: string;
  rgb: string;
  rgba: string;
}

// 颜色数据
const colors = ref<Color[]>([]);
const copiedIndex = ref<number | null>(null);
const copyFormat = ref<string>("hex");

// 生成随机颜色
function generateColors() {
  const newColors: Color[] = [];
  for (let i = 0; i < 24; i++) {
    const hex = generateRandomHex();
    const rgb = hexToRgb(hex);
    const rgba = `${rgb}, 1`;
    newColors.push({
      hex,
      rgb,
      rgba: `rgba(${rgba})`,
    });
  }
  colors.value = newColors;
  copiedIndex.value = null;
}

// 生成随机十六进制颜色
function generateRandomHex(): string {
  const letters = "0123456789ABCDEF";
  let hex = "#";
  for (let i = 0; i < 6; i++) {
    hex += letters[Math.floor(Math.random() * 16)];
  }
  return hex;
}

// 十六进制转RGB
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// 格式化颜色值
function formatColor(color: Color): string {
  switch (copyFormat.value) {
    case "hex":
      return color.hex;
    case "rgb":
      return `rgb(${color.rgb})`;
    case "rgba":
      return color.rgba;
    default:
      return color.hex;
  }
}

// 播放复制提示音 - 叮咚声
function playCopySound() {
  try {
    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();

    // 创建第一个音（叮）
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();

    // 创建第二个音（咚）
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();

    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);

    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);

    // 设置波形为正弦波
    oscillator1.type = "sine";
    oscillator2.type = "sine";

    // 第一个音（叮）：较高的音调
    oscillator1.frequency.setValueAtTime(1200, audioContext.currentTime);

    // 第二个音（咚）：较低的音调，在第一个音之后播放
    oscillator2.frequency.setValueAtTime(800, audioContext.currentTime + 0.15);

    // 第一个音的音量曲线
    gainNode1.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode1.gain.linearRampToValueAtTime(
      0.1,
      audioContext.currentTime + 0.02,
    );
    gainNode1.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.1,
    );

    // 第二个音的音量曲线
    gainNode2.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
    gainNode2.gain.linearRampToValueAtTime(
      0.1,
      audioContext.currentTime + 0.17,
    );
    gainNode2.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.25,
    );

    // 播放第一个音
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.1);

    // 播放第二个音
    oscillator2.start(audioContext.currentTime + 0.15);
    oscillator2.stop(audioContext.currentTime + 0.25);
  } catch (error) {
    console.log("无法播放提示音:", error);
  }
}

// 复制颜色值
function copyColor(color: Color) {
  const colorValue = formatColor(color);
  navigator.clipboard
    .writeText(colorValue)
    .then(() => {
      ElMessage.success(`已复制颜色值: ${colorValue}`);
      // 播放复制提示音
      playCopySound();
      // 找到当前颜色的索引
      const index = colors.value.findIndex((c) => c.hex === color.hex);
      copiedIndex.value = index;
      // 3秒后重置复制状态
      setTimeout(() => {
        copiedIndex.value = null;
      }, 3000);
    })
    .catch((err) => {
      ElMessage.error("复制失败，请手动复制");
      console.error("复制失败:", err);
    });
}

// 功能说明
const features = [
  {
    title: "随机生成",
    desc: "每次生成24个随机颜色，丰富多样",
    icon: Refresh,
    color: "#4ECDC4",
  },
  {
    title: "多种格式",
    desc: "支持HEX、RGB、RGBA三种格式复制",
    icon: Brush,
    color: "#45B7D1",
  },
  {
    title: "一键复制",
    desc: "点击颜色卡片即可复制颜色值",
    icon: CopyDocument,
    color: "#FF6B6B",
  },
  {
    title: "响应式布局",
    desc: "适配不同屏幕尺寸，展示美观",
    icon: Grid,
    color: "#F7DC6F",
  },
];

// 初始化生成颜色
generateColors();
</script>

<style scoped>
.color-picker-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.title-icon {
  font-size: 2.5rem;
  color: #4ecdc4;
}

.page-desc {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
}

.color-picker-container {
  margin-bottom: 60px;
}

.color-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.generate-colors-btn {
  min-width: 180px;
}

.copy-format-select {
  width: 150px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

.color-card {
  position: relative;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.color-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.color-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.color-value {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
}

.copy-btn {
  color: #4ecdc4;
  font-size: 0.8rem;
  padding: 0;
}

.copy-btn:hover {
  color: #38b2ac;
}

.color-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  animation: fadeIn 0.3s ease;
}

.check-icon {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #4ecdc4;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.color-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-top: 60px;
}

.color-feature-item {
  text-align: center;
  padding: 30px;
  background: #f9f9f9;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.color-feature-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.color-feature-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  font-size: 1.5rem;
}

.color-feature-item h4 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.color-feature-item p {
  font-size: 0.95rem;
  color: #666;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .title-icon {
    font-size: 2rem;
  }

  .color-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .generate-colors-btn {
    width: 100%;
  }

  .copy-format-select {
    width: 100%;
  }

  .color-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
  }

  .color-card {
    height: 120px;
  }

  .color-features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
