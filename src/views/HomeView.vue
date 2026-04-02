<template>
  <div class="home-view">
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>智能工具平台</span>
        </div>
        <h1 class="hero-title">
          <span class="title-line">一站式</span>
          <span class="title-highlight">多媒体处理</span>
          <span class="title-line">解决方案</span>
        </h1>
        <p class="hero-subtitle">
          视频提取、文档转换、数据可视化、随机图标、搜索直达，高效处理，安全可靠
        </p>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-value">5+</span>
            <span class="stat-label">核心功能</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">100%</span>
            <span class="stat-label">免费使用</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">∞</span>
            <span class="stat-label">持续更新</span>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="visual-container">
          <div class="core-glow"></div>
          <div class="core-pulse"></div>
          <div class="orbit orbit-1">
            <div class="satellite">
              <el-icon><VideoCamera /></el-icon>
            </div>
          </div>
          <div class="orbit orbit-2">
            <div class="satellite">
              <el-icon><Document /></el-icon>
            </div>
          </div>
          <div class="orbit orbit-3">
            <div class="satellite">
              <el-icon><PieChart /></el-icon>
            </div>
          </div>
          <div class="orbit orbit-4">
            <div class="satellite">
              <el-icon><Connection /></el-icon>
            </div>
          </div>
          <div class="center-core">
            <div class="core-ring ring-inner"></div>
            <div class="core-ring ring-outer"></div>
            <div class="core-icon">
              <el-icon><Tools /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-icon">
            <el-icon><Grid /></el-icon>
          </span>
          功能模块
        </h2>
        <p class="section-desc">选择你需要的功能，开始使用</p>
      </div>

      <div class="features-grid">
        <router-link
          v-for="feature in features"
          :key="feature.path"
          :to="feature.path"
          class="feature-card"
          :class="{ 'coming-soon': feature.comingSoon }"
          v-memo="[feature.path, feature.comingSoon]"
        >
          <div class="card-border"></div>
          <div class="card-content">
            <div class="card-header">
              <div
                class="card-icon"
                :style="{ '--accent-color': feature.color }"
              >
                <el-icon><component :is="feature.icon" /></el-icon>
              </div>
              <div v-if="feature.comingSoon" class="coming-badge">即将上线</div>
              <div v-if="feature.status === 'active'" class="status-badge">
                <span class="status-dot"></span>
                运行中
              </div>
            </div>

            <h3 class="card-title">{{ feature.title }}</h3>
            <p class="card-desc">{{ feature.description }}</p>

            <div class="card-footer">
              <div class="card-tags">
                <span v-for="tag in feature.tags" :key="tag" class="tag">{{
                  tag
                }}</span>
              </div>
              <div class="card-arrow">
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
          </div>

          <div class="card-glow" :style="{ background: feature.color }"></div>
        </router-link>
      </div>
    </section>

    <section class="why-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-icon">
            <el-icon><Star /></el-icon>
          </span>
          为什么选择我们
        </h2>
      </div>

      <div class="advantages-grid">
        <div
          v-for="adv in advantages"
          :key="adv.title"
          class="advantage-card"
          v-memo="[adv.title]"
        >
          <div class="adv-icon">
            <el-icon><component :is="adv.icon" /></el-icon>
          </div>
          <h4>{{ adv.title }}</h4>
          <p>{{ adv.desc }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw } from "vue";
import {
  VideoCamera,
  Document,
  PieChart,
  Tools,
  Grid,
  Star,
  StarFilled,
  ArrowRight,
  Lightning,
  Lock,
  Cloudy,
  Cpu,
  UserFilled,
  Search,
  Brush,
  Stamp,
  Picture,
  Connection,
} from "@element-plus/icons-vue";

const features = ref([
  {
    path: "/video",
    title: "视频提取",
    description: "支持B站、小红书视频链接提取与下载，更多平台开发中...",
    icon: markRaw(VideoCamera),
    color: "linear-gradient(135deg, #00d4ff, #0099ff)",
    tags: ["B站", "小红书"],
    status: "active",
    comingSoon: false,
  },
  {
    path: "/document",
    title: "PDF转Word",
    description: "将PDF文档转换为可编辑的Word格式，精准保留原有排版和样式",
    icon: markRaw(Document),
    color: "linear-gradient(135deg, #9d00ff, #ff00cc)",
    tags: ["格式转换", "保留排版"],
    status: "active",
    comingSoon: false,
  },
  {
    path: "/word-to-pdf",
    title: "Word转PDF",
    description: "将Word文档转换为PDF格式，便于分享和打印，保留原有排版",
    icon: markRaw(Document),
    color: "linear-gradient(135deg, #00d4ff, #0099ff)",
    tags: ["格式转换", "PDF生成"],
    status: "active",
    comingSoon: false,
  },
  {
    path: "/visualization",
    title: "数据可视化",
    description: "Excel数据一键生成精美图表，支持多种图表类型",
    icon: markRaw(PieChart),
    color: "linear-gradient(135deg, #00ff88, #00cc66)",
    tags: ["图表生成", "数据分析"],
    status: "active",
    comingSoon: false,
  },
  {
    path: "/avatar",
    title: "随机头像",
    description:
      "一键生成风格独特的随机头像，支持人物、宠物、衣服、物品等多种类型",
    icon: markRaw(UserFilled),
    color: "linear-gradient(135deg, #ff7875, #ff4d4f)",
    tags: ["头像生成", "多类型"],
    status: "active",
    comingSoon: false,
  },
  {
    path: "/search",
    title: "搜索直达",
    description: "告别广告，直达官网，智能过滤，纯净搜索体验",
    icon: markRaw(Search),
    color: "linear-gradient(135deg, #ffc107, #ff5722)",
    tags: ["去广告", "官网直达"],
    status: "active",
    comingSoon: false,
  },
  {
    path: "/color",
    title: "取色库",
    description: "随机生成24个颜色值，支持HEX、RGB、RGBA格式复制",
    icon: markRaw(Brush),
    color: "linear-gradient(135deg, #4ECDC4, #45B7D1)",
    tags: ["颜色生成", "一键复制"],
    status: "active",
    comingSoon: false,
  },
  {
    path: "/signature",
    title: "电子签章",
    description: "上传文件和印章，选择盖章位置，生成带有电子印章的PDF文档",
    icon: markRaw(Stamp),
    color: "linear-gradient(135deg, #9B59B6, #3498DB)",
    tags: ["文件处理", "PDF生成"],
    status: "active",
    comingSoon: false,
  },
  {
    path: "/image-to-text",
    title: "图片文字提取",
    description:
      "上传图片，系统自动扫描并提取其中的文字内容，支持导出为PDF或Word文档",
    icon: markRaw(Picture),
    color: "linear-gradient(135deg, #FF6B6B, #4ECDC4)",
    tags: ["OCR识别", "文字提取"],
    status: "active",
    comingSoon: false,
  },
  {
    path: "/translation",
    title: "中英文翻译",
    description: "支持文档翻译和文本翻译，准确快速，保持原有格式",
    icon: markRaw(Connection),
    color: "linear-gradient(135deg, #00d4ff, #0099ff)",
    tags: ["文档翻译", "文本翻译"],
    status: "active",
    comingSoon: false,
  },
]);

const advantages = ref([
  {
    title: "极速处理",
    desc: "优化的算法引擎，秒级完成转换",
    icon: markRaw(Lightning),
  },
  {
    title: "隐私保护",
    desc: "文件处理后自动删除，不留痕迹",
    icon: markRaw(Lock),
  },
  {
    title: "云端处理",
    desc: "无需安装软件，在线即可使用",
    icon: markRaw(Cloudy),
  },
  { title: "持续进化", desc: "功能不断更新，满足更多需求", icon: markRaw(Cpu) },
]);
</script>

<style scoped>
.home-view {
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: 60px;
}

.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60px 0 80px;
  gap: 60px;
}

.hero-content {
  flex: 1;
  max-width: 600px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 20px;
  font-size: 13px;
  color: #00d4ff;
  margin-bottom: 24px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  background: #00d4ff;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.hero-title {
  font-size: 52px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 20px;
}

.title-line {
  display: block;
  color: #fff;
}

.title-highlight {
  display: block;
  background: linear-gradient(135deg, #00d4ff, #9d00ff, #ff00cc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.hero-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.8;
  margin-bottom: 40px;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4ff, #9d00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
}

.hero-visual {
  position: relative;
  width: 400px;
  height: 400px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.visual-container {
  position: relative;
  width: 350px;
  height: 350px;
}

/* 核心发光背景 */
.core-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.3), transparent 70%);
  border-radius: 50%;
  animation: glowPulse 3s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

/* 核心脉冲 */
.core-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border: 2px solid rgba(0, 212, 255, 0.4);
  border-radius: 50%;
  animation: corePulse 2s ease-out infinite;
  will-change: opacity, transform;
}

@keyframes corePulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

/* 轨道 */
.orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  will-change: transform;
}

.orbit-1 {
  width: 280px;
  height: 280px;
  animation: orbitRotate 20s linear infinite;
}

.orbit-2 {
  width: 220px;
  height: 220px;
  animation: orbitRotate 15s linear infinite reverse;
}

.orbit-3 {
  width: 160px;
  height: 160px;
  animation: orbitRotate 10s linear infinite;
}

.orbit-4 {
  width: 250px;
  height: 250px;
  animation: orbitRotate 18s linear infinite reverse;
}

@keyframes orbitRotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 卫星 */
.satellite {
  position: absolute;
  width: 44px;
  height: 44px;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.2),
    rgba(157, 0, 255, 0.2)
  );
  border: 1px solid rgba(0, 212, 255, 0.4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #00d4ff;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.orbit-1 .satellite {
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
}

.orbit-2 .satellite {
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  color: #9d00ff;
  border-color: rgba(157, 0, 255, 0.4);
}

.orbit-3 .satellite {
  top: 50%;
  right: -22px;
  transform: translateY(-50%);
  color: #00ff88;
  border-color: rgba(0, 255, 136, 0.4);
}

.orbit-4 .satellite {
  top: 50%;
  left: -22px;
  transform: translateY(-50%);
  color: #00d4ff;
  border-color: rgba(0, 212, 255, 0.4);
}

/* 中心核心 */
.center-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
}

.core-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px solid;
  will-change: transform;
}

.ring-inner {
  width: 80px;
  height: 80px;
  border-color: rgba(0, 212, 255, 0.5);
  border-top-color: transparent;
  animation: ringSpin 3s linear infinite;
}

.ring-outer {
  width: 100px;
  height: 100px;
  border-color: rgba(157, 0, 255, 0.3);
  border-bottom-color: transparent;
  animation: ringSpin 4s linear infinite reverse;
}

@keyframes ringSpin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.core-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #00d4ff, #9d00ff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  box-shadow:
    0 0 30px rgba(0, 212, 255, 0.5),
    0 0 60px rgba(157, 0, 255, 0.3);
}

.features-section {
  margin-bottom: 80px;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
}

.title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.2),
    rgba(157, 0, 255, 0.2)
  );
  border-radius: 12px;
  font-size: 24px;
  color: #00d4ff;
}

.section-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.4);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.feature-card {
  position: relative;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 20px;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-border {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 1px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.feature-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.04);
}

.feature-card:hover .card-border {
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.5),
    rgba(157, 0, 255, 0.3)
  );
}

.feature-card:hover .card-glow {
  opacity: 0.15;
}

.card-content {
  position: relative;
  padding: 24px;
  z-index: 1;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-icon {
  width: 56px;
  height: 56px;
  background: var(--accent-color);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.coming-badge {
  padding: 6px 12px;
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 12px;
  font-size: 12px;
  color: #ffc107;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 12px;
  font-size: 12px;
  color: #00ff88;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #00ff88;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 10px;
}

.card-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
  margin-bottom: 20px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-tags {
  display: flex;
  gap: 8px;
}

.tag {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.card-arrow {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00d4ff;
  transition: all 0.3s;
}

.feature-card:hover .card-arrow {
  background: linear-gradient(135deg, #00d4ff, #9d00ff);
  color: #fff;
  transform: translateX(4px);
}

.card-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  opacity: 0;
  filter: blur(80px);
  transition: opacity 0.4s;
  pointer-events: none;
}

.feature-card.coming-soon {
  opacity: 0.6;
  cursor: not-allowed;
}

.feature-card.coming-soon:hover {
  transform: none;
}

.why-section {
  margin-bottom: 60px;
}

.advantages-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.advantage-card {
  text-align: center;
  padding: 32px 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s;
}

.advantage-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(0, 212, 255, 0.2);
  transform: translateY(-4px);
}

.adv-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.15),
    rgba(157, 0, 255, 0.15)
  );
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #00d4ff;
}

.advantage-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.advantage-card p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.6;
}

@media (max-width: 1200px) {
  .advantages-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1024px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
  }

  .hero-visual {
    display: none;
  }

  .hero-stats {
    justify-content: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
  }

  .advantages-grid {
    grid-template-columns: 1fr;
  }
}
</style>
