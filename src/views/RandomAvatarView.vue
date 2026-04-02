<template>
  <div class="random-avatar-view">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon class="title-icon"><UserFilled /></el-icon>
        随机头像
      </h1>
      <p class="page-desc">一键生成风格独特的随机头像，支持多种类型和风格</p>
    </div>

    <div class="avatar-container">
      <!-- 头像展示区 -->
      <div class="avatar-display-section">
        <div class="avatar-preview">
          <div class="avatar-frame">
            <div
              class="avatar-glow"
              :style="{ background: currentAvatar.color }"
            ></div>
            <div class="avatar-content">
              <div v-if="currentAvatar.avatar" class="avatar-image">
                <!-- 这里将根据头像类型显示不同的头像 -->
                <img
                  v-if="currentAvatar.canvasData"
                  :src="currentAvatar.canvasData"
                  :alt="currentAvatar.type"
                  class="avatar-img"
                />
                <div
                  v-else
                  :class="['avatar-type-' + currentAvatar.type]"
                ></div>
              </div>
              <div v-else class="avatar-placeholder">
                <el-icon :size="avatarSize"><UserFilled /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="avatar-actions">
          <el-button
            type="primary"
            size="large"
            class="generate-btn"
            @click="generateAvatar"
          >
            <el-icon><Refresh /></el-icon>
            <span>生成新头像</span>
          </el-button>
          <el-button
            size="large"
            class="download-btn"
            :disabled="!currentAvatar.avatar"
            @click="downloadAvatar"
          >
            <el-icon><Download /></el-icon>
            <span>下载头像</span>
          </el-button>
        </div>
      </div>

      <!-- 配置面板 -->
      <div class="avatar-config-section">
        <div class="avatar-config-item">
          <label class="avatar-config-label">
            <el-icon><Picture /></el-icon>
            头像类型
          </label>
          <el-radio-group
            v-model="config.avatarType"
            class="avatar-style-group"
          >
            <el-radio-button value="human">人物</el-radio-button>
            <el-radio-button value="pet">宠物</el-radio-button>
            <el-radio-button value="clothing">衣服</el-radio-button>
            <el-radio-button value="object">物品</el-radio-button>
          </el-radio-group>
        </div>

        <div class="avatar-config-item">
          <label class="avatar-config-label">
            <el-icon><FullScreen /></el-icon>
            头像尺寸
          </label>
          <div class="avatar-size-config">
            <el-radio-group
              v-model="config.avatarSize"
              class="avatar-size-group"
            >
              <el-radio-button :value="64">64px</el-radio-button>
              <el-radio-button :value="128">128px</el-radio-button>
              <el-radio-button :value="256">256px</el-radio-button>
              <el-radio-button :value="0">自定义</el-radio-button>
            </el-radio-group>
            <el-input-number
              v-if="config.avatarSize === 0"
              v-model="config.customAvatarSize"
              :min="32"
              :max="512"
              :step="32"
              size="large"
              class="custom-size-input"
              placeholder="输入尺寸"
            />
          </div>
        </div>

        <div class="avatar-config-item">
          <label class="avatar-config-label">
            <el-icon><Brush /></el-icon>
            头像颜色
          </label>
          <div class="avatar-color-config">
            <el-color-picker
              v-model="config.avatarColor"
              show-alpha
              class="color-picker"
            />
            <el-radio-group
              v-model="config.avatarColorMode"
              class="color-mode-group"
            >
              <el-radio-button value="solid">纯色</el-radio-button>
              <el-radio-button value="gradient">渐变</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="avatar-config-item">
          <label class="avatar-config-label">
            <el-icon><Download /></el-icon>
            下载格式
          </label>
          <el-radio-group
            v-model="config.downloadFormat"
            class="download-format-group"
          >
            <el-radio-button value="png">PNG</el-radio-button>
            <el-radio-button value="jpg">JPG</el-radio-button>
            <el-radio-button value="svg">SVG</el-radio-button>
          </el-radio-group>
        </div>

        <div class="avatar-config-item">
          <label class="avatar-config-label">
            <el-icon><Grid /></el-icon>
            历史记录
          </label>
          <div class="avatar-history-grid">
            <div
              v-for="(avatar, index) in avatarHistory"
              :key="index"
              class="avatar-history-item"
              @click="selectHistoryAvatar(index)"
            >
              <div
                class="avatar-history-icon"
                :style="{ background: avatar.color }"
              >
                <img
                  v-if="avatar.canvasData"
                  :src="avatar.canvasData"
                  :alt="avatar.type"
                  class="avatar-history-img"
                />
                <div v-else :class="['avatar-type-' + avatar.type]"></div>
              </div>
              <div class="avatar-history-overlay">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="avatar-features-grid">
      <div
        v-for="feature in features"
        :key="feature.title"
        class="avatar-feature-item"
      >
        <div class="avatar-feature-icon" :style="{ background: feature.color }">
          <el-icon><component :is="feature.icon" /></el-icon>
        </div>
        <h4>{{ feature.title }}</h4>
        <p>{{ feature.desc }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import {
  UserFilled,
  Refresh,
  Download,
  Picture,
  FullScreen,
  Grid,
  Check,
  Lightning,
  MagicStick,
  Odometer,
  Brush,
  Star,
  StarFilled,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

interface Avatar {
  avatar: boolean;
  color: string;
  size: number;
  type: string;
  canvasData?: string;
  svgData?: string;
}

const config = reactive({
  avatarType: "human",
  avatarSize: 128,
  customAvatarSize: 128,
  avatarColor: "#00d4ff",
  avatarColorMode: "gradient",
  downloadFormat: "png" as "png" | "jpg" | "svg",
});

const currentAvatar = ref<Avatar>({
  avatar: true,
  color: "linear-gradient(135deg, #00d4ff, #9d00ff)",
  size: 128,
  type: "human",
  canvasData: "",
});

const canvasRef = ref<HTMLCanvasElement | null>(null);

const avatarHistory = ref<Avatar[]>([]);

const avatarSize = computed(() => {
  return config.avatarSize === 0 ? config.customAvatarSize : config.avatarSize;
});

// 渐变颜色列表
const gradientColors = [
  "linear-gradient(135deg, #00d4ff, #9d00ff)",
  "linear-gradient(135deg, #ff00cc, #3333ff)",
  "linear-gradient(135deg, #00ff88, #00d4ff)",
  "linear-gradient(135deg, #ff7875, #ff4d4f)",
  "linear-gradient(135deg, #ffc107, #ff5722)",
  "linear-gradient(135deg, #4caf50, #8bc34a)",
  "linear-gradient(135deg, #9c27b0, #673ab7)",
  "linear-gradient(135deg, #3f51b5, #2196f3)",
];

const features = ref([
  {
    title: "多种头像类型",
    desc: "支持人物、宠物、衣服、物品等多种类型的随机头像",
    icon: MagicStick,
    color: "linear-gradient(135deg, #00d4ff, #9d00ff)",
  },
  {
    title: "快速生成",
    desc: "一键生成，无需等待，立即获得独特头像",
    icon: Lightning,
    color: "linear-gradient(135deg, #ff00cc, #3333ff)",
  },
  {
    title: "自定义尺寸",
    desc: "支持32px-512px任意尺寸，灵活选择",
    icon: Odometer,
    color: "linear-gradient(135deg, #00ff88, #00d4ff)",
  },
  {
    title: "丰富色彩",
    desc: "支持纯色和渐变色，满足不同设计需求",
    icon: Brush,
    color: "linear-gradient(135deg, #ff7875, #ff4d4f)",
  },
  {
    title: "历史记录",
    desc: "保存生成历史，方便回溯和管理",
    icon: Star,
    color: "linear-gradient(135deg, #9c27b0, #673ab7)",
  },
  {
    title: "一键下载",
    desc: "支持PNG、JPG、SVG多种格式下载，满足不同使用场景",
    icon: Download,
    color: "linear-gradient(135deg, #3f51b5, #2196f3)",
  },
]);

function getRandomColor(): string {
  if (config.avatarColorMode === "gradient") {
    return gradientColors[Math.floor(Math.random() * gradientColors.length)];
  }
  return config.avatarColor;
}

function getActualSize(): number {
  return config.avatarSize === 0 ? config.customAvatarSize : config.avatarSize;
}

function generateAvatar(): void {
  const color = getRandomColor();
  const size = getActualSize();
  const type = config.avatarType;

  // 使用高分辨率Canvas，提高图像清晰度
  const scale = 2; // 缩放因子
  const highResSize = size * scale;

  // 创建高分辨率Canvas并绘制头像
  const canvas = document.createElement("canvas");
  canvas.width = highResSize;
  canvas.height = highResSize;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    ElMessage.error("无法创建画布上下文");
    return;
  }

  // 设置Canvas的CSS尺寸
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  // 设置绘图上下文的缩放
  ctx.scale(scale, scale);

  // 绘制背景
  drawBackground(ctx, size, color);

  // 根据类型绘制不同的头像
  switch (type) {
    case "human":
      drawHuman(ctx, size);
      break;
    case "pet":
      drawPet(ctx, size);
      break;
    case "clothing":
      drawClothing(ctx, size);
      break;
    case "object":
      drawObject(ctx, size);
      break;
  }

  // 获取Canvas数据
  const canvasData = canvas.toDataURL("image/png");
  // 生成SVG数据
  const svgData = generateSVG(size);

  const newAvatar: Avatar = {
    avatar: true,
    color,
    size,
    type,
    canvasData,
    svgData,
  };

  if (currentAvatar.value.avatar) {
    avatarHistory.value.unshift({ ...currentAvatar.value });
    if (avatarHistory.value.length > 12) {
      avatarHistory.value.pop();
    }
  }

  currentAvatar.value = newAvatar;
}

// 绘制背景
function drawBackground(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
): void {
  if (color.startsWith("linear-gradient")) {
    // 解析渐变色
    const gradient = parseGradient(ctx, color, size);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = color;
  }
  ctx.fillRect(0, 0, size, size);
}

// 解析渐变色
function parseGradient(
  ctx: CanvasRenderingContext2D,
  gradientStr: string,
  size: number,
): CanvasGradient | string {
  const match = gradientStr.match(
    /linear-gradient\((\d+)deg,\s*(#[0-9a-fA-F]{6}),\s*(#[0-9a-fA-F]{6})\)/,
  );
  if (match) {
    const angle = parseInt(match[1]);
    const color1 = match[2];
    const color2 = match[3];

    // 计算渐变方向
    const rad = ((angle - 90) * Math.PI) / 180;
    const x1 = size / 2 + (Math.cos(rad) * size) / 2;
    const y1 = size / 2 + (Math.sin(rad) * size) / 2;
    const x2 = size / 2 - (Math.cos(rad) * size) / 2;
    const y2 = size / 2 - (Math.sin(rad) * size) / 2;

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
  }
  return gradientStr;
}

// 绘制人物头像
function drawHuman(ctx: CanvasRenderingContext2D, size: number): void {
  const centerX = size / 2;
  const centerY = size / 2;
  const headRadius = size * 0.25;

  // 随机生成人物特征
  const skinColors = [
    "#FFDBAC",
    "#F1C27D",
    "#E0AC69",
    "#8D5524",
    "#C68642",
    "#A0522D",
    "#CD853F",
  ];
  const hairColors = [
    "#000000",
    "#4A4A4A",
    "#8B4513",
    "#D2691E",
    "#FFD700",
    "#708090",
    "#FF69B4",
    "#8A2BE2",
    "#1E90FF",
    "#32CD32",
  ];
  const eyeColors = [
    "#4B0082",
    "#008000",
    "#8B4513",
    "#0000FF",
    "#808080",
    "#FF6347",
    "#FFD700",
    "#FF1493",
    "#00CED1",
  ];
  const hairStyles = [
    "short",
    "medium",
    "long",
    "curly",
    "bald",
    "spiky",
    "ponytail",
    "braids",
    "afro",
    "mohawk",
    "bun",
    "fauxhawk",
    "sidepart",
    "pompadour",
    "undercut",
  ];
  const expressions = [
    "smile",
    "neutral",
    "surprised",
    "sad",
    "angry",
    "wink",
    "laugh",
    "confused",
    "disgusted",
    "fearful",
  ];
  const accessories = [
    "none",
    "glasses",
    "hat",
    "headband",
    "earrings",
    "necklace",
    "beard",
    "mustache",
  ];

  const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)];
  const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];
  const eyeColor = eyeColors[Math.floor(Math.random() * eyeColors.length)];
  const hairStyle = hairStyles[Math.floor(Math.random() * hairStyles.length)];
  const expression =
    expressions[Math.floor(Math.random() * expressions.length)];
  const accessory = accessories[Math.floor(Math.random() * accessories.length)];

  // 绘制脸部
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // 绘制头发
  if (hairStyle !== "bald") {
    ctx.fillStyle = hairColor;
    switch (hairStyle) {
      case "short":
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY - headRadius * 0.3,
          headRadius * 1.1,
          Math.PI,
          0,
        );
        ctx.fill();
        break;
      case "medium":
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY - headRadius * 0.4,
          headRadius * 1.2,
          Math.PI,
          0,
        );
        ctx.fill();
        break;
      case "long":
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY - headRadius * 0.5,
          headRadius * 1.3,
          Math.PI,
          0,
        );
        ctx.fill();
        ctx.fillRect(
          centerX - headRadius * 1.1,
          centerY + headRadius * 0.2,
          headRadius * 2.2,
          headRadius * 0.8,
        );
        break;
      case "curly":
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY - headRadius * 0.4,
          headRadius * 1.25,
          Math.PI,
          0,
        );
        ctx.fill();
        // 添加卷发效果
        for (let i = 0; i < 8; i++) {
          const angle = ((Math.PI * 2) / 8) * i;
          const x = centerX + Math.cos(angle) * headRadius * 0.8;
          const y =
            centerY - headRadius * 0.3 + Math.sin(angle) * headRadius * 0.4;
          ctx.beginPath();
          ctx.arc(x, y, headRadius * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case "spiky":
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - headRadius * 1.5);
        ctx.lineTo(centerX - headRadius * 1.2, centerY - headRadius * 0.5);
        ctx.lineTo(centerX - headRadius * 0.8, centerY - headRadius * 1.2);
        ctx.lineTo(centerX - headRadius * 0.4, centerY - headRadius * 0.5);
        ctx.lineTo(centerX, centerY - headRadius * 1.3);
        ctx.lineTo(centerX + headRadius * 0.4, centerY - headRadius * 0.5);
        ctx.lineTo(centerX + headRadius * 0.8, centerY - headRadius * 1.2);
        ctx.lineTo(centerX + headRadius * 1.2, centerY - headRadius * 0.5);
        ctx.closePath();
        ctx.fill();
        break;
      case "ponytail":
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY - headRadius * 0.3,
          headRadius * 1.1,
          Math.PI,
          0,
        );
        ctx.fill();
        // 马尾
        ctx.fillRect(
          centerX - headRadius * 0.15,
          centerY + headRadius * 0.2,
          headRadius * 0.3,
          headRadius * 1.2,
        );
        break;
      case "braids":
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY - headRadius * 0.3,
          headRadius * 1.1,
          Math.PI,
          0,
        );
        ctx.fill();
        // 辫子
        for (let i = -1; i <= 1; i += 2) {
          ctx.fillRect(
            centerX + i * headRadius * 0.3,
            centerY + headRadius * 0.2,
            headRadius * 0.2,
            headRadius * 1.0,
          );
        }
        break;
      case "afro":
        ctx.beginPath();
        ctx.arc(centerX, centerY, headRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        // 添加卷发效果
        for (let i = 0; i < 12; i++) {
          const angle = ((Math.PI * 2) / 12) * i;
          const x = centerX + Math.cos(angle) * headRadius * 1.3;
          const y = centerY + Math.sin(angle) * headRadius * 1.3;
          ctx.beginPath();
          ctx.arc(x, y, headRadius * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case "mohawk":
        // 两侧头发
        ctx.fillRect(
          centerX - headRadius * 1.1,
          centerY - headRadius * 0.5,
          headRadius * 0.4,
          headRadius * 1.8,
        );
        ctx.fillRect(
          centerX + headRadius * 0.7,
          centerY - headRadius * 0.5,
          headRadius * 0.4,
          headRadius * 1.8,
        );
        // 中间 Mohawk
        ctx.beginPath();
        ctx.moveTo(centerX - headRadius * 0.4, centerY - headRadius * 1.5);
        ctx.lineTo(centerX + headRadius * 0.4, centerY - headRadius * 1.5);
        ctx.lineTo(centerX + headRadius * 0.3, centerY + headRadius * 0.5);
        ctx.lineTo(centerX - headRadius * 0.3, centerY + headRadius * 0.5);
        ctx.closePath();
        ctx.fill();
        break;
      case "bun":
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY - headRadius * 0.3,
          headRadius * 1.1,
          Math.PI,
          0,
        );
        ctx.fill();
        // 发髻
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY - headRadius * 0.8,
          headRadius * 0.5,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        break;
      case "fauxhawk":
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - headRadius * 1.2);
        ctx.lineTo(centerX - headRadius * 0.8, centerY - headRadius * 0.3);
        ctx.lineTo(centerX - headRadius * 0.6, centerY - headRadius * 0.8);
        ctx.lineTo(centerX + headRadius * 0.6, centerY - headRadius * 0.8);
        ctx.lineTo(centerX + headRadius * 0.8, centerY - headRadius * 0.3);
        ctx.closePath();
        ctx.fill();
        break;
      case "sidepart":
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY - headRadius * 0.3,
          headRadius * 1.1,
          Math.PI,
          0,
        );
        ctx.fill();
        // 侧分线
        ctx.strokeStyle = skinColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - headRadius * 0.8);
        ctx.lineTo(centerX + headRadius * 0.8, centerY + headRadius * 0.3);
        ctx.stroke();
        break;
      case "pompadour":
        ctx.beginPath();
        ctx.moveTo(centerX - headRadius * 1.1, centerY - headRadius * 0.2);
        ctx.lineTo(centerX - headRadius * 0.8, centerY - headRadius * 1.2);
        ctx.lineTo(centerX + headRadius * 0.8, centerY - headRadius * 1.2);
        ctx.lineTo(centerX + headRadius * 1.1, centerY - headRadius * 0.2);
        ctx.lineTo(centerX + headRadius * 1.1, centerY + headRadius * 0.3);
        ctx.lineTo(centerX - headRadius * 1.1, centerY + headRadius * 0.3);
        ctx.closePath();
        ctx.fill();
        break;
      case "undercut":
        // 顶部头发
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY - headRadius * 0.5,
          headRadius * 0.9,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        // 侧边剃光效果
        ctx.fillRect(
          centerX - headRadius * 1.1,
          centerY - headRadius * 0.2,
          headRadius * 0.4,
          headRadius * 1.4,
        );
        ctx.fillRect(
          centerX + headRadius * 0.7,
          centerY - headRadius * 0.2,
          headRadius * 0.4,
          headRadius * 1.4,
        );
        break;
    }
  }

  // 绘制眉毛
  ctx.strokeStyle = hairColor;
  ctx.lineWidth = 2;
  switch (expression) {
    case "angry":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.4, centerY - headRadius * 0.1);
      ctx.lineTo(centerX - headRadius * 0.1, centerY - headRadius * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.4, centerY - headRadius * 0.1);
      ctx.lineTo(centerX + headRadius * 0.1, centerY - headRadius * 0.3);
      ctx.stroke();
      break;
    case "sad":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.4, centerY - headRadius * 0.3);
      ctx.lineTo(centerX - headRadius * 0.1, centerY - headRadius * 0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.4, centerY - headRadius * 0.3);
      ctx.lineTo(centerX + headRadius * 0.1, centerY - headRadius * 0.1);
      ctx.stroke();
      break;
    case "confused":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.4, centerY - headRadius * 0.2);
      ctx.lineTo(centerX - headRadius * 0.1, centerY - headRadius * 0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.4, centerY - headRadius * 0.2);
      ctx.lineTo(centerX + headRadius * 0.1, centerY - headRadius * 0.1);
      ctx.stroke();
      break;
    case "fearful":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.4, centerY - headRadius * 0.1);
      ctx.lineTo(centerX - headRadius * 0.1, centerY - headRadius * 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.4, centerY - headRadius * 0.1);
      ctx.lineTo(centerX + headRadius * 0.1, centerY - headRadius * 0.2);
      ctx.stroke();
      break;
    default:
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.4, centerY - headRadius * 0.2);
      ctx.lineTo(centerX - headRadius * 0.1, centerY - headRadius * 0.25);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.4, centerY - headRadius * 0.2);
      ctx.lineTo(centerX + headRadius * 0.1, centerY - headRadius * 0.25);
      ctx.stroke();
      break;
  }

  // 绘制眼睛
  const eyeRadius = headRadius * 0.15;
  const eyeOffsetX = headRadius * 0.35;
  const eyeOffsetY = -headRadius * 0.1;

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  if (expression === "wink") {
    // 眨眼效果
    ctx.arc(
      centerX - eyeOffsetX,
      centerY + eyeOffsetY,
      eyeRadius,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // 另一只眼睛闭起来
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.ellipse(
      centerX + eyeOffsetX,
      centerY + eyeOffsetY,
      eyeRadius,
      eyeRadius * 0.3,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.strokeStyle = hairColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX + eyeOffsetX - eyeRadius, centerY + eyeOffsetY);
    ctx.lineTo(centerX + eyeOffsetX + eyeRadius, centerY + eyeOffsetY);
    ctx.stroke();
  } else {
    ctx.arc(
      centerX - eyeOffsetX,
      centerY + eyeOffsetY,
      eyeRadius,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      centerX + eyeOffsetX,
      centerY + eyeOffsetY,
      eyeRadius,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(
      centerX - eyeOffsetX,
      centerY + eyeOffsetY,
      eyeRadius * 0.5,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      centerX + eyeOffsetX,
      centerY + eyeOffsetY,
      eyeRadius * 0.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // 绘制高光
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(
      centerX - eyeOffsetX - eyeRadius * 0.2,
      centerY + eyeOffsetY - eyeRadius * 0.2,
      eyeRadius * 0.2,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      centerX + eyeOffsetX - eyeRadius * 0.2,
      centerY + eyeOffsetY - eyeRadius * 0.2,
      eyeRadius * 0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // 绘制嘴巴
  ctx.strokeStyle = "#8B4513";
  ctx.lineWidth = 2;
  switch (expression) {
    case "smile":
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.3,
        headRadius * 0.25,
        0,
        Math.PI,
      );
      ctx.stroke();
      break;
    case "neutral":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.25, centerY + headRadius * 0.3);
      ctx.lineTo(centerX + headRadius * 0.25, centerY + headRadius * 0.3);
      ctx.stroke();
      break;
    case "surprised":
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.3,
        headRadius * 0.15,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      break;
    case "sad":
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.4,
        headRadius * 0.25,
        Math.PI,
        0,
      );
      ctx.stroke();
      break;
    case "angry":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.25, centerY + headRadius * 0.3);
      ctx.lineTo(centerX, centerY + headRadius * 0.4);
      ctx.lineTo(centerX + headRadius * 0.25, centerY + headRadius * 0.3);
      ctx.stroke();
      break;
    case "wink":
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.3,
        headRadius * 0.2,
        0,
        Math.PI,
      );
      ctx.stroke();
      break;
    case "laugh":
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.35,
        headRadius * 0.3,
        0,
        Math.PI,
      );
      ctx.stroke();
      // 绘制牙齿
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.35,
        headRadius * 0.2,
        0,
        Math.PI,
      );
      ctx.fill();
      break;
    case "confused":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.2, centerY + headRadius * 0.3);
      ctx.lineTo(centerX, centerY + headRadius * 0.4);
      ctx.lineTo(centerX + headRadius * 0.2, centerY + headRadius * 0.3);
      ctx.stroke();
      break;
    case "disgusted":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.25, centerY + headRadius * 0.3);
      ctx.lineTo(centerX, centerY + headRadius * 0.2);
      ctx.lineTo(centerX + headRadius * 0.25, centerY + headRadius * 0.3);
      ctx.stroke();
      break;
    case "fearful":
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.35,
        headRadius * 0.15,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      break;
  }

  // 绘制耳朵
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(
    centerX - headRadius * 0.9,
    centerY,
    headRadius * 0.2,
    0,
    Math.PI * 2,
  );
  ctx.arc(
    centerX + headRadius * 0.9,
    centerY,
    headRadius * 0.2,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // 绘制鼻子
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + headRadius * 0.1);
  ctx.lineTo(centerX - headRadius * 0.1, centerY + headRadius * 0.25);
  ctx.lineTo(centerX + headRadius * 0.1, centerY + headRadius * 0.25);
  ctx.closePath();
  ctx.fill();

  // 绘制配饰
  switch (accessory) {
    case "glasses":
      // 眼镜
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      // 镜片
      ctx.beginPath();
      ctx.ellipse(
        centerX - headRadius * 0.35,
        centerY + eyeOffsetY,
        headRadius * 0.2,
        headRadius * 0.25,
        0,
        0,
        Math.PI * 2,
      );
      ctx.ellipse(
        centerX + headRadius * 0.35,
        centerY + eyeOffsetY,
        headRadius * 0.2,
        headRadius * 0.25,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      // 鼻梁
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.2, centerY + eyeOffsetY);
      ctx.lineTo(centerX + headRadius * 0.2, centerY + eyeOffsetY);
      ctx.stroke();
      // 镜腿
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.55, centerY + eyeOffsetY);
      ctx.lineTo(centerX - headRadius * 0.7, centerY + headRadius * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.55, centerY + eyeOffsetY);
      ctx.lineTo(centerX + headRadius * 0.7, centerY + headRadius * 0.3);
      ctx.stroke();
      break;
    case "hat":
      // 帽子
      ctx.fillStyle = hairColors[Math.floor(Math.random() * hairColors.length)];
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY - headRadius * 0.6,
        headRadius * 1.3,
        0,
        Math.PI,
      );
      ctx.fill();
      ctx.fillRect(
        centerX - headRadius * 1.3,
        centerY - headRadius * 0.6,
        headRadius * 2.6,
        headRadius * 0.3,
      );
      break;
    case "headband":
      // 发带
      ctx.fillStyle = hairColors[Math.floor(Math.random() * hairColors.length)];
      ctx.fillRect(
        centerX - headRadius * 1.2,
        centerY - headRadius * 0.4,
        headRadius * 2.4,
        headRadius * 0.15,
      );
      break;
    case "earrings":
      // 绘制耳环
      ctx.fillStyle = "#FFD700";
      // 左侧耳环
      ctx.beginPath();
      ctx.arc(
        centerX - headRadius * 0.9,
        centerY + headRadius * 0.3,
        headRadius * 0.1,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      // 右侧耳环
      ctx.beginPath();
      ctx.arc(
        centerX + headRadius * 0.9,
        centerY + headRadius * 0.3,
        headRadius * 0.1,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    case "necklace":
      // 绘制项链
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.8,
        headRadius * 0.5,
        0,
        Math.PI,
      );
      ctx.stroke();
      // 吊坠
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.8,
        headRadius * 0.1,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    case "beard":
      // 绘制胡子
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.5,
        headRadius * 0.4,
        0,
        Math.PI,
      );
      ctx.fill();
      break;
    case "mustache":
      // 绘制胡子
      ctx.fillStyle = hairColor;
      // 左侧胡子
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.3, centerY + headRadius * 0.3);
      ctx.lineTo(centerX - headRadius * 0.1, centerY + headRadius * 0.4);
      ctx.lineTo(centerX - headRadius * 0.3, centerY + headRadius * 0.4);
      ctx.closePath();
      ctx.fill();
      // 右侧胡子
      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.3, centerY + headRadius * 0.3);
      ctx.lineTo(centerX + headRadius * 0.1, centerY + headRadius * 0.4);
      ctx.lineTo(centerX + headRadius * 0.3, centerY + headRadius * 0.4);
      ctx.closePath();
      ctx.fill();
      break;
  }
}

// 绘制宠物头像
function drawPet(ctx: CanvasRenderingContext2D, size: number): void {
  const centerX = size / 2;
  const centerY = size / 2;
  const headRadius = size * 0.25;

  // 随机生成宠物特征
  const furColors = [
    "#8B4513",
    "#D2691E",
    "#F4A460",
    "#000000",
    "#FFFFFF",
    "#4B0082",
    "#008000",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#F7DC6F",
    "#9370DB",
    "#FF6347",
    "#32CD32",
    "#1E90FF",
  ];
  const petTypes = [
    "cat",
    "dog",
    "rabbit",
    "fox",
    "panda",
    "hamster",
    "owl",
    "bear",
    "koala",
    "squirrel",
    "deer",
    "penguin",
  ];
  const expressions = [
    "happy",
    "neutral",
    "sleepy",
    "excited",
    "surprised",
    "angry",
    "sad",
    "confused",
    "curious",
    "playful",
  ];
  const accessories = [
    "none",
    "collar",
    "hat",
    "glasses",
    "bandana",
    "bowtie",
    "sunglasses",
    "scarf",
  ];

  const furColor = furColors[Math.floor(Math.random() * furColors.length)];
  const petType = petTypes[Math.floor(Math.random() * petTypes.length)];
  const expression =
    expressions[Math.floor(Math.random() * expressions.length)];
  const accessory = accessories[Math.floor(Math.random() * accessories.length)];

  // 绘制头部
  ctx.fillStyle = furColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // 绘制耳朵
  switch (petType) {
    case "cat":
      // 猫耳朵
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.8, centerY - headRadius * 0.5);
      ctx.lineTo(centerX - headRadius * 1.3, centerY - headRadius * 1.4);
      ctx.lineTo(centerX - headRadius * 0.3, centerY - headRadius * 0.8);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.8, centerY - headRadius * 0.5);
      ctx.lineTo(centerX + headRadius * 1.3, centerY - headRadius * 1.4);
      ctx.lineTo(centerX + headRadius * 0.3, centerY - headRadius * 0.8);
      ctx.closePath();
      ctx.fill();
      break;
    case "dog":
      // 狗耳朵
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.8, centerY - headRadius * 0.3);
      ctx.lineTo(centerX - headRadius * 1.2, centerY - headRadius * 0.8);
      ctx.lineTo(centerX - headRadius * 0.3, centerY - headRadius * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.8, centerY - headRadius * 0.3);
      ctx.lineTo(centerX + headRadius * 1.2, centerY - headRadius * 0.8);
      ctx.lineTo(centerX + headRadius * 0.3, centerY - headRadius * 0.6);
      ctx.closePath();
      ctx.fill();
      break;
    case "rabbit":
      // 兔子耳朵
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.6, centerY - headRadius * 0.4);
      ctx.lineTo(centerX - headRadius * 0.8, centerY - headRadius * 1.6);
      ctx.lineTo(centerX - headRadius * 0.4, centerY - headRadius * 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.6, centerY - headRadius * 0.4);
      ctx.lineTo(centerX + headRadius * 0.8, centerY - headRadius * 1.6);
      ctx.lineTo(centerX + headRadius * 0.4, centerY - headRadius * 0.4);
      ctx.closePath();
      ctx.fill();
      break;
    case "fox":
      // 狐狸耳朵
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.7, centerY - headRadius * 0.4);
      ctx.lineTo(centerX - headRadius * 1.2, centerY - headRadius * 1.3);
      ctx.lineTo(centerX - headRadius * 0.3, centerY - headRadius * 0.7);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.7, centerY - headRadius * 0.4);
      ctx.lineTo(centerX + headRadius * 1.2, centerY - headRadius * 1.3);
      ctx.lineTo(centerX + headRadius * 0.3, centerY - headRadius * 0.7);
      ctx.closePath();
      ctx.fill();
      // 狐狸尾巴
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 1.2,
        headRadius * 0.8,
        0,
        Math.PI,
      );
      ctx.fill();
      break;
    case "panda":
      // 熊猫耳朵
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(
        centerX - headRadius * 0.6,
        centerY - headRadius * 0.5,
        headRadius * 0.4,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        centerX + headRadius * 0.6,
        centerY - headRadius * 0.5,
        headRadius * 0.4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      // 熊猫脸部
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
      ctx.fill();
      // 熊猫眼睛
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.ellipse(
        centerX - headRadius * 0.3,
        centerY - headRadius * 0.1,
        headRadius * 0.25,
        headRadius * 0.35,
        0,
        0,
        Math.PI * 2,
      );
      ctx.ellipse(
        centerX + headRadius * 0.3,
        centerY - headRadius * 0.1,
        headRadius * 0.25,
        headRadius * 0.35,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      // 恢复毛色
      ctx.fillStyle = furColor;
      break;
    case "hamster":
      // 仓鼠耳朵
      ctx.beginPath();
      ctx.arc(
        centerX - headRadius * 0.6,
        centerY - headRadius * 0.5,
        headRadius * 0.2,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        centerX + headRadius * 0.6,
        centerY - headRadius * 0.5,
        headRadius * 0.2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      // 仓鼠脸颊
      ctx.fillStyle = "#FFDAB9";
      ctx.beginPath();
      ctx.arc(
        centerX - headRadius * 0.5,
        centerY + headRadius * 0.2,
        headRadius * 0.25,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        centerX + headRadius * 0.5,
        centerY + headRadius * 0.2,
        headRadius * 0.25,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      // 恢复毛色
      ctx.fillStyle = furColor;
      break;
    case "owl":
      // 猫头鹰耳朵
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.7, centerY - headRadius * 0.8);
      ctx.lineTo(centerX - headRadius * 0.9, centerY - headRadius * 1.3);
      ctx.lineTo(centerX - headRadius * 0.5, centerY - headRadius * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.7, centerY - headRadius * 0.8);
      ctx.lineTo(centerX + headRadius * 0.9, centerY - headRadius * 1.3);
      ctx.lineTo(centerX + headRadius * 0.5, centerY - headRadius * 0.8);
      ctx.closePath();
      ctx.fill();
      // 猫头鹰脸部
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(centerX, centerY, headRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();
      // 恢复毛色
      ctx.fillStyle = furColor;
      break;
    case "bear":
      // 熊耳朵
      ctx.beginPath();
      ctx.arc(
        centerX - headRadius * 0.6,
        centerY - headRadius * 0.7,
        headRadius * 0.3,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        centerX + headRadius * 0.6,
        centerY - headRadius * 0.7,
        headRadius * 0.3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    case "koala":
      // 考拉耳朵
      ctx.fillStyle = "#8B4513";
      ctx.beginPath();
      ctx.arc(
        centerX - headRadius * 0.6,
        centerY - headRadius * 0.6,
        headRadius * 0.3,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        centerX + headRadius * 0.6,
        centerY - headRadius * 0.6,
        headRadius * 0.3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      // 考拉脸部
      ctx.fillStyle = "#E0AC69";
      ctx.beginPath();
      ctx.arc(centerX, centerY, headRadius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      // 恢复毛色
      ctx.fillStyle = furColor;
      break;
    case "squirrel":
      // 松鼠耳朵
      ctx.beginPath();
      ctx.arc(
        centerX - headRadius * 0.6,
        centerY - headRadius * 0.6,
        headRadius * 0.25,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        centerX + headRadius * 0.6,
        centerY - headRadius * 0.6,
        headRadius * 0.25,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      // 松鼠尾巴
      ctx.beginPath();
      ctx.arc(
        centerX + headRadius * 1.2,
        centerY,
        headRadius * 0.8,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    case "deer":
      // 鹿耳朵
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.7, centerY - headRadius * 0.5);
      ctx.lineTo(centerX - headRadius * 1.0, centerY - headRadius * 1.0);
      ctx.lineTo(centerX - headRadius * 0.4, centerY - headRadius * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.7, centerY - headRadius * 0.5);
      ctx.lineTo(centerX + headRadius * 1.0, centerY - headRadius * 1.0);
      ctx.lineTo(centerX + headRadius * 0.4, centerY - headRadius * 0.7);
      ctx.closePath();
      ctx.fill();
      // 鹿角
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.3, centerY - headRadius * 1.0);
      ctx.lineTo(centerX - headRadius * 0.6, centerY - headRadius * 1.3);
      ctx.lineTo(centerX - headRadius * 0.4, centerY - headRadius * 1.1);
      ctx.lineTo(centerX - headRadius * 0.7, centerY - headRadius * 1.4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.3, centerY - headRadius * 1.0);
      ctx.lineTo(centerX + headRadius * 0.6, centerY - headRadius * 1.3);
      ctx.lineTo(centerX + headRadius * 0.4, centerY - headRadius * 1.1);
      ctx.lineTo(centerX + headRadius * 0.7, centerY - headRadius * 1.4);
      ctx.closePath();
      ctx.fill();
      break;
    case "penguin":
      // 企鹅头部
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
      ctx.fill();
      // 企鹅脸部
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.2,
        headRadius * 0.8,
        0,
        Math.PI,
      );
      ctx.fill();
      // 企鹅嘴巴
      ctx.fillStyle = "#FF6B6B";
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.2, centerY + headRadius * 0.3);
      ctx.lineTo(centerX, centerY + headRadius * 0.5);
      ctx.lineTo(centerX + headRadius * 0.2, centerY + headRadius * 0.3);
      ctx.closePath();
      ctx.fill();
      // 恢复毛色
      ctx.fillStyle = furColor;
      break;
  }

  // 绘制眼睛
  ctx.fillStyle = "#FFFFFF";
  const eyeRadius = headRadius * 0.15;
  const eyeOffsetX = headRadius * 0.3;
  const eyeOffsetY = -headRadius * 0.1;

  if (petType !== "panda") {
    ctx.beginPath();
    ctx.arc(
      centerX - eyeOffsetX,
      centerY + eyeOffsetY,
      eyeRadius,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      centerX + eyeOffsetX,
      centerY + eyeOffsetY,
      eyeRadius,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // 根据表情绘制不同的眼睛
  ctx.fillStyle = "#000000";
  switch (expression) {
    case "happy":
      // 开心的眼睛
      if (petType !== "panda") {
        ctx.beginPath();
        ctx.arc(
          centerX - eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.6,
          0,
          Math.PI * 2,
        );
        ctx.arc(
          centerX + eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.6,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else {
        // 熊猫开心的眼睛
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(
          centerX - headRadius * 0.3,
          centerY - headRadius * 0.1,
          headRadius * 0.1,
          0,
          Math.PI * 2,
        );
        ctx.arc(
          centerX + headRadius * 0.3,
          centerY - headRadius * 0.1,
          headRadius * 0.1,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    case "neutral":
      // 中性的眼睛
      if (petType !== "panda") {
        ctx.fillRect(
          centerX - eyeOffsetX - eyeRadius * 0.4,
          centerY + eyeOffsetY - eyeRadius * 0.2,
          eyeRadius * 0.8,
          eyeRadius * 0.4,
        );
        ctx.fillRect(
          centerX + eyeOffsetX - eyeRadius * 0.4,
          centerY + eyeOffsetY - eyeRadius * 0.2,
          eyeRadius * 0.8,
          eyeRadius * 0.4,
        );
      } else {
        // 熊猫中性的眼睛
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(
          centerX - headRadius * 0.3 - headRadius * 0.1,
          centerY - headRadius * 0.1 - headRadius * 0.05,
          headRadius * 0.2,
          headRadius * 0.1,
        );
        ctx.fillRect(
          centerX + headRadius * 0.3 - headRadius * 0.1,
          centerY - headRadius * 0.1 - headRadius * 0.05,
          headRadius * 0.2,
          headRadius * 0.1,
        );
      }
      break;
    case "sleepy":
      // 困倦的眼睛
      if (petType !== "panda") {
        ctx.beginPath();
        ctx.ellipse(
          centerX - eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.6,
          eyeRadius * 0.2,
          Math.PI / 4,
          0,
          Math.PI * 2,
        );
        ctx.ellipse(
          centerX + eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.6,
          eyeRadius * 0.2,
          -Math.PI / 4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else {
        // 熊猫困倦的眼睛
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.ellipse(
          centerX - headRadius * 0.3,
          centerY - headRadius * 0.1,
          headRadius * 0.15,
          headRadius * 0.05,
          Math.PI / 4,
          0,
          Math.PI * 2,
        );
        ctx.ellipse(
          centerX + headRadius * 0.3,
          centerY - headRadius * 0.1,
          headRadius * 0.15,
          headRadius * 0.05,
          -Math.PI / 4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    case "excited":
      // 兴奋的眼睛
      if (petType !== "panda") {
        ctx.beginPath();
        ctx.arc(
          centerX - eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.7,
          0,
          Math.PI * 2,
        );
        ctx.arc(
          centerX + eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.7,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        // 高光
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(
          centerX - eyeOffsetX - eyeRadius * 0.2,
          centerY + eyeOffsetY - eyeRadius * 0.2,
          eyeRadius * 0.3,
          0,
          Math.PI * 2,
        );
        ctx.arc(
          centerX + eyeOffsetX - eyeRadius * 0.2,
          centerY + eyeOffsetY - eyeRadius * 0.2,
          eyeRadius * 0.3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    case "surprised":
      // 惊讶的眼睛
      if (petType !== "panda") {
        ctx.beginPath();
        ctx.arc(
          centerX - eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.8,
          0,
          Math.PI * 2,
        );
        ctx.arc(
          centerX + eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.8,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        // 高光
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(
          centerX - eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.4,
          0,
          Math.PI * 2,
        );
        ctx.arc(
          centerX + eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    case "angry":
      // 生气的眼睛
      if (petType !== "panda") {
        ctx.beginPath();
        ctx.ellipse(
          centerX - eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.6,
          eyeRadius * 0.8,
          Math.PI / 2,
          0,
          Math.PI * 2,
        );
        ctx.ellipse(
          centerX + eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.6,
          eyeRadius * 0.8,
          Math.PI / 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    case "sad":
      // 悲伤的眼睛
      if (petType !== "panda") {
        ctx.beginPath();
        ctx.ellipse(
          centerX - eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.6,
          eyeRadius * 0.8,
          -Math.PI / 2,
          0,
          Math.PI * 2,
        );
        ctx.ellipse(
          centerX + eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.6,
          eyeRadius * 0.8,
          -Math.PI / 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    case "confused":
      // 困惑的眼睛
      if (petType !== "panda") {
        ctx.beginPath();
        ctx.ellipse(
          centerX - eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.6,
          eyeRadius * 0.6,
          Math.PI / 4,
          0,
          Math.PI * 2,
        );
        ctx.ellipse(
          centerX + eyeOffsetX,
          centerY + eyeOffsetY,
          eyeRadius * 0.6,
          eyeRadius * 0.6,
          -Math.PI / 4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    case "curious":
      // 好奇的眼睛
      if (petType !== "panda") {
        ctx.beginPath();
        ctx.arc(
          centerX - eyeOffsetX,
          centerY + eyeOffsetY - eyeRadius * 0.2,
          eyeRadius * 0.7,
          0,
          Math.PI * 2,
        );
        ctx.arc(
          centerX + eyeOffsetX,
          centerY + eyeOffsetY - eyeRadius * 0.2,
          eyeRadius * 0.7,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        // 高光
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(
          centerX - eyeOffsetX - eyeRadius * 0.2,
          centerY + eyeOffsetY - eyeRadius * 0.4,
          eyeRadius * 0.3,
          0,
          Math.PI * 2,
        );
        ctx.arc(
          centerX + eyeOffsetX - eyeRadius * 0.2,
          centerY + eyeOffsetY - eyeRadius * 0.4,
          eyeRadius * 0.3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    case "playful":
      // 顽皮的眼睛
      if (petType !== "panda") {
        ctx.beginPath();
        ctx.arc(
          centerX - eyeOffsetX,
          centerY + eyeOffsetY - eyeRadius * 0.1,
          eyeRadius * 0.6,
          0,
          Math.PI * 2,
        );
        ctx.arc(
          centerX + eyeOffsetX,
          centerY + eyeOffsetY + eyeRadius * 0.1,
          eyeRadius * 0.6,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
  }

  // 绘制鼻子
  ctx.fillStyle = petType === "panda" ? "#000000" : "#FF69B4";
  ctx.beginPath();
  ctx.arc(
    centerX,
    centerY + headRadius * 0.2,
    headRadius * 0.15,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // 绘制嘴巴
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  switch (expression) {
    case "happy":
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.35,
        headRadius * 0.2,
        0,
        Math.PI,
      );
      ctx.stroke();
      break;
    case "neutral":
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + headRadius * 0.35);
      ctx.lineTo(centerX - headRadius * 0.15, centerY + headRadius * 0.45);
      ctx.moveTo(centerX, centerY + headRadius * 0.35);
      ctx.lineTo(centerX + headRadius * 0.15, centerY + headRadius * 0.45);
      ctx.stroke();
      break;
    case "sleepy":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.1, centerY + headRadius * 0.35);
      ctx.lineTo(centerX + headRadius * 0.1, centerY + headRadius * 0.35);
      ctx.stroke();
      break;
    case "excited":
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.4,
        headRadius * 0.25,
        0,
        Math.PI,
      );
      ctx.stroke();
      break;
    case "surprised":
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.35,
        headRadius * 0.15,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      break;
    case "angry":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.2, centerY + headRadius * 0.3);
      ctx.lineTo(centerX, centerY + headRadius * 0.4);
      ctx.lineTo(centerX + headRadius * 0.2, centerY + headRadius * 0.3);
      ctx.stroke();
      break;
    case "sad":
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.4,
        headRadius * 0.2,
        Math.PI,
        Math.PI * 2,
      );
      ctx.stroke();
      break;
    case "confused":
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + headRadius * 0.35);
      ctx.lineTo(centerX - headRadius * 0.1, centerY + headRadius * 0.4);
      ctx.lineTo(centerX + headRadius * 0.1, centerY + headRadius * 0.4);
      ctx.stroke();
      // 问号
      ctx.beginPath();
      ctx.arc(
        centerX + headRadius * 0.3,
        centerY + headRadius * 0.5,
        headRadius * 0.08,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.3, centerY + headRadius * 0.5);
      ctx.lineTo(centerX + headRadius * 0.3, centerY + headRadius * 0.65);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.3, centerY + headRadius * 0.65);
      ctx.lineTo(centerX + headRadius * 0.25, centerY + headRadius * 0.6);
      ctx.stroke();
      break;
    case "curious":
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.35,
        headRadius * 0.15,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      break;
    case "playful":
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.4,
        headRadius * 0.25,
        0,
        Math.PI,
      );
      ctx.stroke();
      // 舌头
      ctx.fillStyle = "#FF6B6B";
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.45,
        headRadius * 0.15,
        0,
        Math.PI,
      );
      ctx.fill();
      break;
  }

  // 绘制胡须（猫、兔子和狐狸）
  if (petType === "cat" || petType === "rabbit" || petType === "fox") {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      for (let j = 0; j < 2; j++) {
        const angle = (i * Math.PI) / 12 + (j * Math.PI) / 24;
        ctx.beginPath();
        ctx.moveTo(centerX + i * headRadius * 0.1, centerY + headRadius * 0.25);
        ctx.lineTo(
          centerX + i * headRadius * 0.35,
          centerY + headRadius * 0.25 + Math.sin(angle) * headRadius * 0.25,
        );
        ctx.stroke();
      }
    }
  }

  // 绘制耳朵内部
  ctx.fillStyle = "#FFE4C4";
  switch (petType) {
    case "cat":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.7, centerY - headRadius * 0.6);
      ctx.lineTo(centerX - headRadius * 1.1, centerY - headRadius * 1.2);
      ctx.lineTo(centerX - headRadius * 0.4, centerY - headRadius * 0.7);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.7, centerY - headRadius * 0.6);
      ctx.lineTo(centerX + headRadius * 1.1, centerY - headRadius * 1.2);
      ctx.lineTo(centerX + headRadius * 0.4, centerY - headRadius * 0.7);
      ctx.closePath();
      ctx.fill();
      break;
    case "dog":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.7, centerY - headRadius * 0.4);
      ctx.lineTo(centerX - headRadius * 1.0, centerY - headRadius * 0.7);
      ctx.lineTo(centerX - headRadius * 0.4, centerY - headRadius * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.7, centerY - headRadius * 0.4);
      ctx.lineTo(centerX + headRadius * 1.0, centerY - headRadius * 0.7);
      ctx.lineTo(centerX + headRadius * 0.4, centerY - headRadius * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    case "rabbit":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.55, centerY - headRadius * 0.5);
      ctx.lineTo(centerX - headRadius * 0.7, centerY - headRadius * 1.4);
      ctx.lineTo(centerX - headRadius * 0.45, centerY - headRadius * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.55, centerY - headRadius * 0.5);
      ctx.lineTo(centerX + headRadius * 0.7, centerY - headRadius * 1.4);
      ctx.lineTo(centerX + headRadius * 0.45, centerY - headRadius * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    case "fox":
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.6, centerY - headRadius * 0.5);
      ctx.lineTo(centerX - headRadius * 1.0, centerY - headRadius * 1.1);
      ctx.lineTo(centerX - headRadius * 0.4, centerY - headRadius * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX + headRadius * 0.6, centerY - headRadius * 0.5);
      ctx.lineTo(centerX + headRadius * 1.0, centerY - headRadius * 1.1);
      ctx.lineTo(centerX + headRadius * 0.4, centerY - headRadius * 0.6);
      ctx.closePath();
      ctx.fill();
      break;
    case "hamster":
      ctx.beginPath();
      ctx.arc(
        centerX - headRadius * 0.6,
        centerY - headRadius * 0.5,
        headRadius * 0.1,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        centerX + headRadius * 0.6,
        centerY - headRadius * 0.5,
        headRadius * 0.1,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
  }

  // 绘制配饰
  switch (accessory) {
    case "collar":
      // 项圈
      ctx.fillStyle = furColors[Math.floor(Math.random() * furColors.length)];
      ctx.fillRect(
        centerX - headRadius * 1.2,
        centerY + headRadius * 0.8,
        headRadius * 2.4,
        headRadius * 0.15,
      );
      // 项圈铃铛
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY + headRadius * 0.95,
        headRadius * 0.12,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    case "hat":
      // 帽子
      ctx.fillStyle = furColors[Math.floor(Math.random() * furColors.length)];
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY - headRadius * 0.6,
        headRadius * 1.1,
        0,
        Math.PI,
      );
      ctx.fill();
      ctx.fillRect(
        centerX - headRadius * 1.1,
        centerY - headRadius * 0.6,
        headRadius * 2.2,
        headRadius * 0.25,
      );
      break;
    case "glasses":
      // 眼镜
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      // 镜片
      ctx.beginPath();
      ctx.ellipse(
        centerX - eyeOffsetX,
        centerY + eyeOffsetY,
        eyeRadius * 1.2,
        eyeRadius * 1.5,
        0,
        0,
        Math.PI * 2,
      );
      ctx.ellipse(
        centerX + eyeOffsetX,
        centerY + eyeOffsetY,
        eyeRadius * 1.2,
        eyeRadius * 1.5,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      // 鼻梁
      ctx.beginPath();
      ctx.moveTo(centerX - eyeOffsetX * 0.7, centerY + eyeOffsetY);
      ctx.lineTo(centerX + eyeOffsetX * 0.7, centerY + eyeOffsetY);
      ctx.stroke();
      // 镜腿
      ctx.beginPath();
      ctx.moveTo(centerX - eyeOffsetX * 1.5, centerY + eyeOffsetY);
      ctx.lineTo(centerX - headRadius * 0.8, centerY + headRadius * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + eyeOffsetX * 1.5, centerY + eyeOffsetY);
      ctx.lineTo(centerX + headRadius * 0.8, centerY + headRadius * 0.3);
      ctx.stroke();
      break;
  }
}

// 绘制衣服
function drawClothing(ctx: CanvasRenderingContext2D, size: number): void {
  const centerX = size / 2;
  const centerY = size / 2;

  // 随机生成衣服颜色
  const clothingColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
    "#FF9FF3",
    "#54A0FF",
    "#5F27CD",
    "#00D2D3",
    "#10AC84",
    "#FF9F43",
    "#EE5A24",
    "#006266",
  ];
  const clothingColor =
    clothingColors[Math.floor(Math.random() * clothingColors.length)];
  const secondaryColor =
    clothingColors[Math.floor(Math.random() * clothingColors.length)];

  // 随机选择衣服款式
  const clothingStyles = [
    "tshirt",
    "hoodie",
    "dress",
    "jacket",
    "sweater",
    "blouse",
    "shirt",
    "coat",
    "vest",
    "suit",
  ];
  const clothingStyle =
    clothingStyles[Math.floor(Math.random() * clothingStyles.length)];

  // 绘制衣服主体
  ctx.fillStyle = clothingColor;
  switch (clothingStyle) {
    case "tshirt":
      // T恤
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size * 0.2);
      ctx.lineTo(centerX - size * 0.3, centerY - size * 0.1);
      ctx.lineTo(centerX - size * 0.35, centerY + size * 0.3);
      ctx.lineTo(centerX - size * 0.2, centerY + size * 0.35);
      ctx.lineTo(centerX + size * 0.2, centerY + size * 0.35);
      ctx.lineTo(centerX + size * 0.35, centerY + size * 0.3);
      ctx.lineTo(centerX + size * 0.3, centerY - size * 0.1);
      ctx.closePath();
      ctx.fill();
      break;
    case "hoodie":
      // 连帽衫
      ctx.fillRect(
        centerX - size * 0.25,
        centerY - size * 0.25,
        size * 0.5,
        size * 0.45,
      );
      // 帽子
      ctx.beginPath();
      ctx.arc(centerX, centerY - size * 0.35, size * 0.25, 0, Math.PI);
      ctx.fill();
      ctx.fillRect(
        centerX - size * 0.25,
        centerY - size * 0.35,
        size * 0.5,
        size * 0.1,
      );
      break;
    case "dress":
      // 连衣裙
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size * 0.2);
      ctx.lineTo(centerX - size * 0.25, centerY - size * 0.1);
      ctx.lineTo(centerX - size * 0.3, centerY + size * 0.3);
      ctx.lineTo(centerX, centerY + size * 0.4);
      ctx.lineTo(centerX + size * 0.3, centerY + size * 0.3);
      ctx.lineTo(centerX + size * 0.25, centerY - size * 0.1);
      ctx.closePath();
      ctx.fill();
      break;
    case "jacket":
      // 夹克
      ctx.fillRect(
        centerX - size * 0.25,
        centerY - size * 0.2,
        size * 0.5,
        size * 0.4,
      );
      // 领子
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(
        centerX - size * 0.15,
        centerY - size * 0.25,
        size * 0.3,
        size * 0.05,
      );
      ctx.fillStyle = clothingColor;
      break;
    case "sweater":
      // 毛衣
      ctx.fillRect(
        centerX - size * 0.25,
        centerY - size * 0.2,
        size * 0.5,
        size * 0.4,
      );
      // 领口
      ctx.beginPath();
      ctx.arc(centerX, centerY - size * 0.2, size * 0.1, 0, Math.PI);
      ctx.fillStyle = secondaryColor;
      ctx.fill();
      ctx.fillStyle = clothingColor;
      break;
    case "blouse":
      // 衬衫
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size * 0.2);
      ctx.lineTo(centerX - size * 0.25, centerY - size * 0.1);
      ctx.lineTo(centerX - size * 0.3, centerY + size * 0.3);
      ctx.lineTo(centerX - size * 0.15, centerY + size * 0.35);
      ctx.lineTo(centerX + size * 0.15, centerY + size * 0.35);
      ctx.lineTo(centerX + size * 0.3, centerY + size * 0.3);
      ctx.lineTo(centerX + size * 0.25, centerY - size * 0.1);
      ctx.closePath();
      ctx.fill();
      // 领子
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(
        centerX - size * 0.15,
        centerY - size * 0.25,
        size * 0.3,
        size * 0.05,
      );
      ctx.fillStyle = clothingColor;
      break;
    case "shirt":
      // 男士衬衫
      ctx.fillRect(
        centerX - size * 0.25,
        centerY - size * 0.2,
        size * 0.5,
        size * 0.4,
      );
      // 领子
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.15, centerY - size * 0.25);
      ctx.lineTo(centerX, centerY - size * 0.3);
      ctx.lineTo(centerX + size * 0.15, centerY - size * 0.25);
      ctx.closePath();
      ctx.fill();
      // 纽扣
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY - size * 0.1 + i * size * 0.1,
          size * 0.02,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.fillStyle = clothingColor;
      break;
    case "coat":
      // 外套
      ctx.fillRect(
        centerX - size * 0.28,
        centerY - size * 0.25,
        size * 0.56,
        size * 0.5,
      );
      // 领子
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(
        centerX - size * 0.18,
        centerY - size * 0.3,
        size * 0.36,
        size * 0.05,
      );
      // 口袋
      ctx.fillRect(
        centerX - size * 0.15,
        centerY + size * 0.1,
        size * 0.12,
        size * 0.15,
      );
      ctx.fillRect(
        centerX + size * 0.03,
        centerY + size * 0.1,
        size * 0.12,
        size * 0.15,
      );
      ctx.fillStyle = clothingColor;
      break;
    case "vest":
      // 背心
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size * 0.25);
      ctx.lineTo(centerX - size * 0.25, centerY - size * 0.15);
      ctx.lineTo(centerX - size * 0.3, centerY + size * 0.25);
      ctx.lineTo(centerX, centerY + size * 0.35);
      ctx.lineTo(centerX + size * 0.3, centerY + size * 0.25);
      ctx.lineTo(centerX + size * 0.25, centerY - size * 0.15);
      ctx.closePath();
      ctx.fill();
      // 纽扣
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY - size * 0.15 + i * size * 0.12,
          size * 0.02,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    case "suit":
      // 西装
      ctx.fillRect(
        centerX - size * 0.25,
        centerY - size * 0.2,
        size * 0.5,
        size * 0.4,
      );
      // 领子
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.15, centerY - size * 0.25);
      ctx.lineTo(centerX, centerY - size * 0.3);
      ctx.lineTo(centerX + size * 0.15, centerY - size * 0.25);
      ctx.closePath();
      ctx.fill();
      // 口袋
      ctx.fillRect(
        centerX - size * 0.12,
        centerY + size * 0.15,
        size * 0.1,
        size * 0.05,
      );
      ctx.fillStyle = clothingColor;
      break;
  }

  // 绘制袖子
  ctx.fillStyle = clothingColor;
  switch (clothingStyle) {
    case "tshirt":
    case "hoodie":
    case "sweater":
      // 短袖
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.25, centerY - size * 0.1);
      ctx.lineTo(centerX - size * 0.4, centerY - size * 0.05);
      ctx.lineTo(centerX - size * 0.4, centerY + size * 0.15);
      ctx.lineTo(centerX - size * 0.25, centerY + size * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(centerX + size * 0.25, centerY - size * 0.1);
      ctx.lineTo(centerX + size * 0.4, centerY - size * 0.05);
      ctx.lineTo(centerX + size * 0.4, centerY + size * 0.15);
      ctx.lineTo(centerX + size * 0.25, centerY + size * 0.1);
      ctx.closePath();
      ctx.fill();
      break;
    case "jacket":
      // 长袖
      ctx.fillRect(
        centerX - size * 0.35,
        centerY - size * 0.15,
        size * 0.15,
        size * 0.35,
      );
      ctx.fillRect(
        centerX + size * 0.2,
        centerY - size * 0.15,
        size * 0.15,
        size * 0.35,
      );
      break;
    case "dress":
      // 无袖
      break;
  }

  // 绘制装饰图案
  const patternType = Math.floor(Math.random() * 8);
  switch (patternType) {
    case 0: // 条纹
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(
          centerX - size * 0.25,
          centerY - size * 0.15 + i * size * 0.08,
          size * 0.5,
          size * 0.02,
        );
      }
      break;
    case 1: // 圆点
      ctx.fillStyle = secondaryColor;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          ctx.beginPath();
          ctx.arc(
            centerX - size * 0.2 + j * size * 0.13,
            centerY - size * 0.1 + i * size * 0.1,
            size * 0.03,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
      break;
    case 2: // 方块
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(
        centerX - size * 0.15,
        centerY - size * 0.05,
        size * 0.3,
        size * 0.15,
      );
      break;
    case 3: // 波浪线
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = size * 0.02;
      ctx.beginPath();
      for (
        let x = centerX - size * 0.25;
        x < centerX + size * 0.25;
        x += size * 0.05
      ) {
        const y = centerY + Math.sin((x - centerX) * 0.1) * size * 0.05;
        if (x === centerX - size * 0.25) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      break;
    case 4: // 心形
      ctx.fillStyle = secondaryColor;
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(centerX + i * size * 0.1, centerY);
        ctx.bezierCurveTo(
          centerX + i * size * 0.15,
          centerY - size * 0.1,
          centerX,
          centerY - size * 0.15,
          centerX,
          centerY - size * 0.05,
        );
        ctx.bezierCurveTo(
          centerX,
          centerY - size * 0.15,
          centerX - i * size * 0.15,
          centerY - size * 0.1,
          centerX - i * size * 0.1,
          centerY,
        );
        ctx.closePath();
        ctx.fill();
      }
      break;
    case 5: // 星星
      ctx.fillStyle = secondaryColor;
      function drawStar(x: number, y: number, radius: number) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const xPos = x + Math.cos(angle) * radius;
          const yPos = y + Math.sin(angle) * radius;
          if (i === 0) {
            ctx.moveTo(xPos, yPos);
          } else {
            ctx.lineTo(xPos, yPos);
          }
        }
        ctx.closePath();
        ctx.fill();
      }
      drawStar(centerX, centerY, size * 0.1);
      break;
  }

  // 绘制纽扣（如果适用）
  if (clothingStyle === "jacket" || clothingStyle === "sweater") {
    ctx.fillStyle = secondaryColor;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY - size * 0.1 + i * size * 0.15,
        size * 0.03,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
}

// 绘制物品
function drawObject(ctx: CanvasRenderingContext2D, size: number): void {
  const centerX = size / 2;
  const centerY = size / 2;

  // 随机选择物品类型
  const objectTypes = [
    "book",
    "camera",
    "coffee",
    "gift",
    "music",
    "phone",
    "watch",
    "star",
    "heart",
    "flower",
    "pencil",
    "glasses",
    "hat",
    "umbrella",
    "bicycle",
    "car",
    "airplane",
    "rocket",
    "football",
    "basketball",
  ];
  const objectType =
    objectTypes[Math.floor(Math.random() * objectTypes.length)];

  // 随机生成颜色
  const colors = [
    "#E74C3C",
    "#3498DB",
    "#2ECC71",
    "#F39C12",
    "#9B59B6",
    "#1ABC9C",
    "#34495E",
    "#E67E22",
    "#95A5A6",
    "#3498DB",
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const secondaryColor = colors[Math.floor(Math.random() * colors.length)];

  ctx.fillStyle = color;

  switch (objectType) {
    case "book":
      // 绘制书本
      ctx.fillRect(
        centerX - size * 0.2,
        centerY - size * 0.25,
        size * 0.4,
        size * 0.5,
      );
      // 书脊
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(
        centerX - size * 0.2,
        centerY - size * 0.25,
        size * 0.05,
        size * 0.5,
      );
      // 书页
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(
        centerX - size * 0.15,
        centerY - size * 0.24,
        size * 0.3,
        size * 0.48,
      );
      // 文字
      ctx.fillStyle = "#333";
      ctx.font = `${size * 0.05}px Arial`;
      ctx.fillText("BOOK", centerX - size * 0.08, centerY + size * 0.05);
      break;
    case "camera":
      // 绘制相机
      ctx.fillRect(
        centerX - size * 0.25,
        centerY - size * 0.15,
        size * 0.5,
        size * 0.3,
      );
      // 镜头
      ctx.fillStyle = "#34495E";
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ECF0F1";
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#34495E";
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
      // 按钮
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.arc(
        centerX + size * 0.15,
        centerY - size * 0.05,
        size * 0.03,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    case "coffee":
      // 绘制咖啡杯
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY + size * 0.1, size * 0.15, 0, Math.PI);
      ctx.lineTo(centerX - size * 0.15, centerY - size * 0.1);
      ctx.lineTo(centerX + size * 0.15, centerY - size * 0.1);
      ctx.closePath();
      ctx.fill();
      // 杯柄
      ctx.beginPath();
      ctx.arc(
        centerX + size * 0.15,
        centerY + size * 0.05,
        size * 0.08,
        Math.PI * 0.25,
        Math.PI * 1.75,
      );
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = size * 0.03;
      ctx.stroke();
      // 咖啡
      ctx.fillStyle = "#8B4513";
      ctx.beginPath();
      ctx.arc(centerX, centerY + size * 0.05, size * 0.12, 0, Math.PI);
      ctx.fill();
      // 蒸汽
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = size * 0.01;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(
          centerX - size * 0.05 + i * size * 0.05,
          centerY - size * 0.1,
        );
        ctx.bezierCurveTo(
          centerX - size * 0.05 + i * size * 0.05,
          centerY - size * 0.2,
          centerX + size * 0.05 + i * size * 0.05,
          centerY - size * 0.25,
          centerX + size * 0.05 + i * size * 0.05,
          centerY - size * 0.3,
        );
        ctx.stroke();
      }
      break;
    case "gift":
      // 绘制礼物盒
      ctx.fillRect(
        centerX - size * 0.2,
        centerY - size * 0.15,
        size * 0.4,
        size * 0.35,
      );
      // 丝带
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(
        centerX - size * 0.02,
        centerY - size * 0.15,
        size * 0.04,
        size * 0.35,
      );
      ctx.fillRect(
        centerX - size * 0.2,
        centerY - size * 0.02,
        size * 0.4,
        size * 0.04,
      );
      // 蝴蝶结
      ctx.beginPath();
      ctx.arc(
        centerX - size * 0.05,
        centerY - size * 0.15,
        size * 0.05,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        centerX + size * 0.05,
        centerY - size * 0.15,
        size * 0.05,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillRect(
        centerX - size * 0.03,
        centerY - size * 0.15,
        size * 0.06,
        size * 0.08,
      );
      break;
    case "music":
      // 绘制音符
      ctx.beginPath();
      ctx.arc(
        centerX - size * 0.1,
        centerY + size * 0.1,
        size * 0.08,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillRect(
        centerX - size * 0.1,
        centerY - size * 0.25,
        size * 0.04,
        size * 0.35,
      );
      ctx.beginPath();
      ctx.arc(
        centerX + size * 0.1,
        centerY + size * 0.05,
        size * 0.06,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillRect(
        centerX + size * 0.1,
        centerY - size * 0.25,
        size * 0.04,
        size * 0.3,
      );
      ctx.fillRect(
        centerX - size * 0.1,
        centerY - size * 0.25,
        size * 0.2,
        size * 0.04,
      );
      // 五线谱
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = size * 0.01;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(
          centerX - size * 0.2,
          centerY - size * 0.15 + i * size * 0.08,
        );
        ctx.lineTo(
          centerX + size * 0.2,
          centerY - size * 0.15 + i * size * 0.08,
        );
        ctx.stroke();
      }
      break;
    case "phone":
      // 绘制手机
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(
        centerX - size * 0.15,
        centerY - size * 0.25,
        size * 0.3,
        size * 0.5,
      );
      // 屏幕
      ctx.fillStyle = "#000";
      ctx.fillRect(
        centerX - size * 0.13,
        centerY - size * 0.22,
        size * 0.26,
        size * 0.42,
      );
      // 摄像头
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(centerX, centerY - size * 0.23, size * 0.02, 0, Math.PI * 2);
      ctx.fill();
      // 按钮
      ctx.fillStyle = "#333";
      ctx.fillRect(
        centerX - size * 0.05,
        centerY + size * 0.23,
        size * 0.1,
        size * 0.03,
      );
      break;
    case "watch":
      // 绘制手表
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      // 表盘
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.18, 0, Math.PI * 2);
      ctx.fill();
      // 指针
      ctx.strokeStyle = "#000";
      ctx.lineWidth = size * 0.01;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX, centerY - size * 0.12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + size * 0.1, centerY);
      ctx.stroke();
      // 表冠
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.arc(centerX + size * 0.2, centerY, size * 0.02, 0, Math.PI * 2);
      ctx.fill();
      // 表带
      ctx.fillRect(
        centerX - size * 0.1,
        centerY - size * 0.2,
        size * 0.2,
        size * 0.1,
      );
      ctx.fillRect(
        centerX - size * 0.1,
        centerY + size * 0.1,
        size * 0.2,
        size * 0.1,
      );
      break;
    case "star":
      // 绘制星星
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * size * 0.2;
        const y = centerY + Math.sin(angle) * size * 0.2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      // 星星光芒
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 0.01;
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const x1 = centerX + Math.cos(angle) * size * 0.2;
        const y1 = centerY + Math.sin(angle) * size * 0.2;
        const x2 = centerX + Math.cos(angle) * size * 0.25;
        const y2 = centerY + Math.sin(angle) * size * 0.25;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      break;
    case "heart":
      // 绘制心形
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size * 0.1);
      ctx.bezierCurveTo(
        centerX + size * 0.2,
        centerY - size * 0.3,
        centerX + size * 0.2,
        centerY + size * 0.1,
        centerX,
        centerY + size * 0.2,
      );
      ctx.bezierCurveTo(
        centerX - size * 0.2,
        centerY + size * 0.1,
        centerX - size * 0.2,
        centerY - size * 0.3,
        centerX,
        centerY - size * 0.1,
      );
      ctx.closePath();
      ctx.fill();
      // 心形高光
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.05, centerY - size * 0.05);
      ctx.bezierCurveTo(
        centerX + size * 0.05,
        centerY - size * 0.15,
        centerX + size * 0.05,
        centerY + size * 0.05,
        centerX - size * 0.05,
        centerY + size * 0.1,
      );
      ctx.bezierCurveTo(
        centerX - size * 0.1,
        centerY + size * 0.05,
        centerX - size * 0.1,
        centerY - size * 0.15,
        centerX - size * 0.05,
        centerY - size * 0.05,
      );
      ctx.closePath();
      ctx.fill();
      break;
    case "flower":
      // 绘制花朵
      ctx.fillStyle = secondaryColor;
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const x = centerX + Math.cos(angle) * size * 0.15;
        const y = centerY + Math.sin(angle) * size * 0.15;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
      // 花心
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
      // 花茎
      ctx.strokeStyle = "#27AE60";
      ctx.lineWidth = size * 0.02;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + size * 0.15);
      ctx.lineTo(centerX, centerY + size * 0.25);
      ctx.stroke();
      // 叶子
      ctx.fillStyle = "#27AE60";
      ctx.beginPath();
      ctx.ellipse(
        centerX - size * 0.05,
        centerY + size * 0.2,
        size * 0.04,
        size * 0.08,
        -Math.PI / 4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        centerX + size * 0.05,
        centerY + size * 0.22,
        size * 0.04,
        size * 0.08,
        Math.PI / 4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    case "pencil":
      // 绘制铅笔
      ctx.fillStyle = color;
      ctx.fillRect(
        centerX - size * 0.05,
        centerY - size * 0.25,
        size * 0.1,
        size * 0.4,
      );
      // 笔尖
      ctx.fillStyle = "#708090";
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.05, centerY - size * 0.25);
      ctx.lineTo(centerX, centerY - size * 0.35);
      ctx.lineTo(centerX + size * 0.05, centerY - size * 0.25);
      ctx.closePath();
      ctx.fill();
      // 橡皮擦
      ctx.fillStyle = "#FFB6C1";
      ctx.fillRect(
        centerX - size * 0.05,
        centerY + size * 0.15,
        size * 0.1,
        size * 0.05,
      );
      break;
    case "glasses":
      // 绘制眼镜
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 0.03;
      // 镜片
      ctx.beginPath();
      ctx.ellipse(
        centerX - size * 0.15,
        centerY,
        size * 0.12,
        size * 0.15,
        0,
        0,
        Math.PI * 2,
      );
      ctx.ellipse(
        centerX + size * 0.15,
        centerY,
        size * 0.12,
        size * 0.15,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      // 鼻梁
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.08, centerY);
      ctx.lineTo(centerX + size * 0.08, centerY);
      ctx.stroke();
      // 镜腿
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.27, centerY);
      ctx.lineTo(centerX - size * 0.35, centerY + size * 0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + size * 0.27, centerY);
      ctx.lineTo(centerX + size * 0.35, centerY + size * 0.1);
      ctx.stroke();
      break;
    case "hat":
      // 绘制帽子
      ctx.fillStyle = color;
      // 帽檐
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.25, 0, Math.PI);
      ctx.fill();
      // 帽身
      ctx.fillRect(
        centerX - size * 0.15,
        centerY - size * 0.2,
        size * 0.3,
        size * 0.2,
      );
      break;
    case "umbrella":
      // 绘制雨伞
      ctx.fillStyle = color;
      // 伞面
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.2, 0, Math.PI);
      ctx.fill();
      // 伞柄
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = size * 0.02;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX, centerY + size * 0.3);
      ctx.stroke();
      break;
    case "bicycle":
      // 绘制自行车
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 0.03;
      // 车轮
      ctx.beginPath();
      ctx.arc(
        centerX - size * 0.15,
        centerY + size * 0.1,
        size * 0.12,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        centerX + size * 0.15,
        centerY + size * 0.1,
        size * 0.12,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      // 车架
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.15, centerY + size * 0.1);
      ctx.lineTo(centerX, centerY - size * 0.1);
      ctx.lineTo(centerX + size * 0.15, centerY + size * 0.1);
      ctx.stroke();
      break;
    case "car":
      // 绘制汽车
      ctx.fillStyle = color;
      // 车身
      ctx.fillRect(
        centerX - size * 0.2,
        centerY - size * 0.05,
        size * 0.4,
        size * 0.1,
      );
      // 车顶
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.15, centerY - size * 0.05);
      ctx.lineTo(centerX - size * 0.1, centerY - size * 0.15);
      ctx.lineTo(centerX + size * 0.1, centerY - size * 0.15);
      ctx.lineTo(centerX + size * 0.15, centerY - size * 0.05);
      ctx.closePath();
      ctx.fill();
      // 车轮
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(
        centerX - size * 0.15,
        centerY + size * 0.05,
        size * 0.05,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        centerX + size * 0.15,
        centerY + size * 0.05,
        size * 0.05,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    case "airplane":
      // 绘制飞机
      ctx.fillStyle = color;
      // 机身
      ctx.fillRect(centerX - size * 0.15, centerY, size * 0.3, size * 0.05);
      // 机翼
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.1, centerY);
      ctx.lineTo(centerX - size * 0.2, centerY + size * 0.15);
      ctx.lineTo(centerX, centerY + size * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(centerX + size * 0.1, centerY);
      ctx.lineTo(centerX + size * 0.2, centerY + size * 0.15);
      ctx.lineTo(centerX, centerY + size * 0.15);
      ctx.closePath();
      ctx.fill();
      // 尾翼
      ctx.beginPath();
      ctx.moveTo(centerX + size * 0.15, centerY);
      ctx.lineTo(centerX + size * 0.2, centerY - size * 0.1);
      ctx.lineTo(centerX + size * 0.1, centerY - size * 0.1);
      ctx.closePath();
      ctx.fill();
      break;
    case "rocket":
      // 绘制火箭
      ctx.fillStyle = color;
      // 箭身
      ctx.fillRect(
        centerX - size * 0.05,
        centerY - size * 0.2,
        size * 0.1,
        size * 0.3,
      );
      // 箭头
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.1, centerY - size * 0.2);
      ctx.lineTo(centerX, centerY - size * 0.3);
      ctx.lineTo(centerX + size * 0.1, centerY - size * 0.2);
      ctx.closePath();
      ctx.fill();
      // 尾翼
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.05, centerY + size * 0.1);
      ctx.lineTo(centerX - size * 0.15, centerY + size * 0.2);
      ctx.lineTo(centerX - size * 0.05, centerY + size * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(centerX + size * 0.05, centerY + size * 0.1);
      ctx.lineTo(centerX + size * 0.15, centerY + size * 0.2);
      ctx.lineTo(centerX + size * 0.05, centerY + size * 0.15);
      ctx.closePath();
      ctx.fill();
      break;
    case "football":
      // 绘制足球
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      // 黑色条纹
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.2, 0, Math.PI);
      ctx.fill();
      ctx.fillRect(
        centerX - size * 0.2,
        centerY - size * 0.05,
        size * 0.4,
        size * 0.1,
      );
      break;
    case "basketball":
      // 绘制篮球
      ctx.fillStyle = "#FF6B6B";
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      // 黑色线条
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = size * 0.02;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.2, centerY);
      ctx.lineTo(centerX + size * 0.2, centerY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size * 0.2);
      ctx.lineTo(centerX, centerY + size * 0.2);
      ctx.stroke();
      break;
  }
}

function selectHistoryAvatar(index: number): void {
  const avatar = avatarHistory.value[index];
  avatarHistory.value.splice(index, 1);
  avatarHistory.value.unshift({ ...currentAvatar.value });
  currentAvatar.value = avatar;
}

async function downloadAvatar(): Promise<void> {
  if (!currentAvatar.value.avatar) return;

  try {
    const size = getActualSize();
    const format = config.downloadFormat;

    if (currentAvatar.value.canvasData) {
      // 使用已有的Canvas数据
      if (format === "svg" && currentAvatar.value.svgData) {
        // 使用保存的SVG数据
        downloadFile(
          currentAvatar.value.svgData,
          `avatar-${currentAvatar.value.type}-${Date.now()}-${size}x${size}.svg`,
        );
      } else if (format === "svg") {
        // 生成SVG格式（备用）
        const svgData = generateSVG(size);
        downloadFile(
          svgData,
          `avatar-${currentAvatar.value.type}-${Date.now()}-${size}x${size}.svg`,
        );
      } else {
        // PNG或JPG格式
        const canvas = await createCanvasFromData(
          currentAvatar.value.canvasData,
          size,
        );
        const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
        const dataUrl = canvas.toDataURL(mimeType, 0.9);
        downloadFile(
          dataUrl,
          `avatar-${currentAvatar.value.type}-${Date.now()}-${size}x${size}.${format}`,
        );
      }
    } else {
      // 重新生成头像并下载
      // 使用高分辨率Canvas，提高图像清晰度
      const scale = 2; // 缩放因子
      const highResSize = size * scale;

      const canvas = document.createElement("canvas");
      canvas.width = highResSize;
      canvas.height = highResSize;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("无法创建画布上下文");
      }

      // 设置绘图上下文的缩放
      ctx.scale(scale, scale);

      // 绘制背景
      drawBackground(ctx, size, currentAvatar.value.color);

      // 根据头像类型绘制
      switch (currentAvatar.value.type) {
        case "human":
          drawHuman(ctx, size);
          break;
        case "pet":
          drawPet(ctx, size);
          break;
        case "clothing":
          drawClothing(ctx, size);
          break;
        case "object":
          drawObject(ctx, size);
          break;
      }

      if (format === "svg") {
        const svgData = generateSVG(size);
        downloadFile(
          svgData,
          `avatar-${currentAvatar.value.type}-${Date.now()}-${size}x${size}.svg`,
        );
      } else {
        const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
        const dataUrl = canvas.toDataURL(mimeType, 0.9);
        downloadFile(
          dataUrl,
          `avatar-${currentAvatar.value.type}-${Date.now()}-${size}x${size}.${format}`,
        );
      }
    }
  } catch (error) {
    console.error("下载头像失败:", error);
    ElMessage.error("头像下载失败");
  }
}

// 从Canvas数据创建Canvas元素
async function createCanvasFromData(
  dataUrl: string,
  size: number,
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法创建画布上下文"));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error("无法加载图片"));
    img.src = dataUrl;
  });
}

// 生成SVG格式
function generateSVG(size: number): string {
  const type = currentAvatar.value.type;
  const color = currentAvatar.value.color;

  let svgContent = "";

  // SVG背景
  if (color.startsWith("linear-gradient")) {
    const match = color.match(
      /linear-gradient\((\d+)deg,\s*(#[0-9a-fA-F]{6}),\s*(#[0-9a-fA-F]{6})\)/,
    );
    if (match) {
      const color1 = match[2];
      const color2 = match[3];
      svgContent += `<defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1}"/>
          <stop offset="100%" style="stop-color:${color2}"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#bgGradient)"/>`;
    } else {
      svgContent += `<rect width="${size}" height="${size}" fill="${color}"/>`;
    }
  } else {
    svgContent += `<rect width="${size}" height="${size}" fill="${color}"/>`;
  }

  // 根据类型添加SVG内容
  const centerX = size / 2;
  const centerY = size / 2;

  switch (type) {
    case "human":
      svgContent += generateHumanSVG(centerX, centerY, size);
      break;
    case "pet":
      svgContent += generatePetSVG(centerX, centerY, size);
      break;
    case "clothing":
      svgContent += generateClothingSVG(centerX, centerY, size);
      break;
    case "object":
      svgContent += generateObjectSVG(centerX, centerY, size);
      break;
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${svgContent}</svg>`,
  )}`;
}

// 生成人物SVG
function generateHumanSVG(cx: number, cy: number, size: number): string {
  const headRadius = size * 0.25;
  const skinColors = [
    "#FFDBAC",
    "#F1C27D",
    "#E0AC69",
    "#8D5524",
    "#C68642",
    "#A0522D",
    "#CD853F",
  ];
  const hairColors = [
    "#000000",
    "#4A4A4A",
    "#8B4513",
    "#D2691E",
    "#FFD700",
    "#708090",
    "#FF69B4",
    "#8A2BE2",
    "#1E90FF",
    "#32CD32",
  ];
  const eyeColors = [
    "#4B0082",
    "#008000",
    "#8B4513",
    "#0000FF",
    "#808080",
    "#FF6347",
    "#FFD700",
    "#FF1493",
    "#00CED1",
  ];
  const hairStyles = [
    "short",
    "medium",
    "long",
    "curly",
    "bald",
    "spiky",
    "ponytail",
    "braids",
  ];
  const expressions = ["smile", "neutral", "surprised", "sad", "angry", "wink"];
  const accessories = ["none", "glasses", "hat", "headband"];

  const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)];
  const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];
  const eyeColor = eyeColors[Math.floor(Math.random() * eyeColors.length)];
  const hairStyle = hairStyles[Math.floor(Math.random() * hairStyles.length)];
  const expression =
    expressions[Math.floor(Math.random() * expressions.length)];
  const accessory = accessories[Math.floor(Math.random() * accessories.length)];

  let svg = `
    <!-- 头部 -->
    <circle cx="${cx}" cy="${cy}" r="${headRadius}" fill="${skinColor}"/>
  `;

  // 头发
  switch (hairStyle) {
    case "short":
      svg += `
        <path d="M ${cx - headRadius * 1.1} ${cy - headRadius * 0.3} A ${headRadius * 1.1} ${headRadius * 1.1} 0 0 1 ${cx + headRadius * 1.1} ${cy - headRadius * 0.3} L ${cx + headRadius * 0.9} ${cy + headRadius * 0.1} L ${cx - headRadius * 0.9} ${cy + headRadius * 0.1} Z" fill="${hairColor}"/>
      `;
      break;
    case "medium":
      svg += `
        <path d="M ${cx - headRadius * 1.1} ${cy - headRadius * 0.4} A ${headRadius * 1.1} ${headRadius * 1.1} 0 0 1 ${cx + headRadius * 1.1} ${cy - headRadius * 0.4} L ${cx + headRadius * 1} ${cy + headRadius * 0.5} L ${cx - headRadius * 1} ${cy + headRadius * 0.5} Z" fill="${hairColor}"/>
      `;
      break;
    case "long":
      svg += `
        <path d="M ${cx - headRadius * 1.1} ${cy - headRadius * 0.5} A ${headRadius * 1.1} ${headRadius * 1.1} 0 0 1 ${cx + headRadius * 1.1} ${cy - headRadius * 0.5} L ${cx + headRadius * 1.2} ${cy + headRadius * 1} L ${cx - headRadius * 1.2} ${cy + headRadius * 1} Z" fill="${hairColor}"/>
      `;
      break;
    case "curly":
      svg += `
        <path d="M ${cx - headRadius * 1.2} ${cy - headRadius * 0.4} A ${headRadius * 1.2} ${headRadius * 1.2} 0 0 1 ${cx + headRadius * 1.2} ${cy - headRadius * 0.4} L ${cx + headRadius * 1.1} ${cy + headRadius * 0.3} L ${cx - headRadius * 1.1} ${cy + headRadius * 0.3} Z" fill="${hairColor}"/>
        <circle cx="${cx - headRadius * 0.8}" cy="${cy - headRadius * 0.3}" r="${headRadius * 0.2}" fill="${hairColor}"/>
        <circle cx="${cx + headRadius * 0.8}" cy="${cy - headRadius * 0.3}" r="${headRadius * 0.2}" fill="${hairColor}"/>
        <circle cx="${cx}" cy="${cy - headRadius * 0.5}" r="${headRadius * 0.2}" fill="${hairColor}"/>
      `;
      break;
    case "bald":
      // 光头，不绘制头发
      break;
    case "spiky":
      svg += `
        <path d="M ${cx - headRadius * 1.1} ${cy - headRadius * 0.3} A ${headRadius * 1.1} ${headRadius * 1.1} 0 0 1 ${cx + headRadius * 1.1} ${cy - headRadius * 0.3} L ${cx + headRadius * 0.9} ${cy + headRadius * 0.1} L ${cx - headRadius * 0.9} ${cy + headRadius * 0.1} Z" fill="${hairColor}"/>
        <polygon points="${cx},${cy - headRadius * 0.6} ${cx - headRadius * 0.2},${cy - headRadius * 0.3} ${cx + headRadius * 0.2},${cy - headRadius * 0.3}" fill="${hairColor}"/>
        <polygon points="${cx - headRadius * 0.5},${cy - headRadius * 0.6} ${cx - headRadius * 0.7},${cy - headRadius * 0.3} ${cx - headRadius * 0.3},${cy - headRadius * 0.3}" fill="${hairColor}"/>
        <polygon points="${cx + headRadius * 0.5},${cy - headRadius * 0.6} ${cx + headRadius * 0.7},${cy - headRadius * 0.3} ${cx + headRadius * 0.3},${cy - headRadius * 0.3}" fill="${hairColor}"/>
      `;
      break;
    case "ponytail":
      svg += `
        <path d="M ${cx - headRadius * 1.1} ${cy - headRadius * 0.4} A ${headRadius * 1.1} ${headRadius * 1.1} 0 0 1 ${cx + headRadius * 1.1} ${cy - headRadius * 0.4} L ${cx + headRadius * 0.8} ${cy + headRadius * 0.2} L ${cx - headRadius * 0.8} ${cy + headRadius * 0.2} Z" fill="${hairColor}"/>
        <rect x="${cx - headRadius * 0.1}" y="${cy + headRadius * 0.2}" width="${headRadius * 0.2}" height="${headRadius * 0.8}" fill="${hairColor}"/>
        <circle cx="${cx}" cy="${cy + headRadius * 1}" r="${headRadius * 0.2}" fill="${hairColor}"/>
      `;
      break;
    case "braids":
      svg += `
        <path d="M ${cx - headRadius * 1.1} ${cy - headRadius * 0.4} A ${headRadius * 1.1} ${headRadius * 1.1} 0 0 1 ${cx + headRadius * 1.1} ${cy - headRadius * 0.4} L ${cx + headRadius * 0.8} ${cy + headRadius * 0.2} L ${cx - headRadius * 0.8} ${cy + headRadius * 0.2} Z" fill="${hairColor}"/>
        <rect x="${cx - headRadius * 0.3}" y="${cy + headRadius * 0.2}" width="${headRadius * 0.15}" height="${headRadius * 0.8}" fill="${hairColor}"/>
        <rect x="${cx + headRadius * 0.15}" y="${cy + headRadius * 0.2}" width="${headRadius * 0.15}" height="${headRadius * 0.8}" fill="${hairColor}"/>
      `;
      break;
  }

  // 眉毛
  svg += `
    <path d="M ${cx - headRadius * 0.45} ${cy - headRadius * 0.25} Q ${cx - headRadius * 0.3} ${cy - headRadius * 0.35} ${cx - headRadius * 0.15} ${cy - headRadius * 0.25}" stroke="#333" stroke-width="${headRadius * 0.05}" fill="none"/>
    <path d="M ${cx + headRadius * 0.45} ${cy - headRadius * 0.25} Q ${cx + headRadius * 0.3} ${cy - headRadius * 0.35} ${cx + headRadius * 0.15} ${cy - headRadius * 0.25}" stroke="#333" stroke-width="${headRadius * 0.05}" fill="none"/>
  `;

  // 眼睛
  svg += `
    <circle cx="${cx - headRadius * 0.35}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.15}" fill="#FFFFFF"/>
    <circle cx="${cx + headRadius * 0.35}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.15}" fill="#FFFFFF"/>
  `;

  // 不同表情的眼睛
  if (expression === "wink") {
    svg += `
      <circle cx="${cx - headRadius * 0.35}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.075}" fill="${eyeColor}"/>
      <path d="M ${cx + headRadius * 0.2} ${cy - headRadius * 0.1} Q ${cx + headRadius * 0.35} ${cy - headRadius * 0.15} ${cx + headRadius * 0.5} ${cy - headRadius * 0.1}" stroke="${eyeColor}" stroke-width="${headRadius * 0.05}" fill="none"/>
    `;
  } else if (expression === "surprised") {
    svg += `
      <circle cx="${cx - headRadius * 0.35}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.1}" fill="${eyeColor}"/>
      <circle cx="${cx + headRadius * 0.35}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.1}" fill="${eyeColor}"/>
    `;
  } else if (expression === "angry") {
    svg += `
      <ellipse cx="${cx - headRadius * 0.35}" cy="${cy - headRadius * 0.05}" rx="${headRadius * 0.075}" ry="${headRadius * 0.05}" fill="${eyeColor}" transform="rotate(10, ${cx - headRadius * 0.35}, ${cy - headRadius * 0.05})"/>
      <ellipse cx="${cx + headRadius * 0.35}" cy="${cy - headRadius * 0.05}" rx="${headRadius * 0.075}" ry="${headRadius * 0.05}" fill="${eyeColor}" transform="rotate(-10, ${cx + headRadius * 0.35}, ${cy - headRadius * 0.05})"/>
    `;
  } else {
    svg += `
      <circle cx="${cx - headRadius * 0.35}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.075}" fill="${eyeColor}"/>
      <circle cx="${cx + headRadius * 0.35}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.075}" fill="${eyeColor}"/>
    `;
  }

  // 嘴巴
  if (expression === "smile") {
    svg += `
      <path d="M ${cx - headRadius * 0.3} ${cy + headRadius * 0.3} Q ${cx} ${cy + headRadius * 0.5} ${cx + headRadius * 0.3} ${cy + headRadius * 0.3}" stroke="#8B4513" stroke-width="${headRadius * 0.05}" fill="none"/>
    `;
  } else if (expression === "sad") {
    svg += `
      <path d="M ${cx - headRadius * 0.3} ${cy + headRadius * 0.4} Q ${cx} ${cy + headRadius * 0.2} ${cx + headRadius * 0.3} ${cy + headRadius * 0.4}" stroke="#8B4513" stroke-width="${headRadius * 0.05}" fill="none"/>
    `;
  } else if (expression === "surprised") {
    svg += `
      <circle cx="${cx}" cy="${cy + headRadius * 0.3}" r="${headRadius * 0.1}" fill="#8B4513"/>
    `;
  } else if (expression === "angry") {
    svg += `
      <path d="M ${cx - headRadius * 0.3} ${cy + headRadius * 0.3} Q ${cx} ${cy + headRadius * 0.4} ${cx + headRadius * 0.3} ${cy + headRadius * 0.3}" stroke="#8B4513" stroke-width="${headRadius * 0.05}" fill="none"/>
    `;
  } else {
    svg += `
      <path d="M ${cx - headRadius * 0.25} ${cy + headRadius * 0.3} L ${cx + headRadius * 0.25} ${cy + headRadius * 0.3}" stroke="#8B4513" stroke-width="${headRadius * 0.05}" fill="none"/>
    `;
  }

  // 耳朵
  svg += `
    <circle cx="${cx - headRadius * 1.1}" cy="${cy + headRadius * 0.1}" r="${headRadius * 0.2}" fill="${skinColor}"/>
    <circle cx="${cx + headRadius * 1.1}" cy="${cy + headRadius * 0.1}" r="${headRadius * 0.2}" fill="${skinColor}"/>
  `;

  // 鼻子
  svg += `
    <path d="M ${cx} ${cy + headRadius * 0.05} L ${cx - headRadius * 0.1} ${cy + headRadius * 0.2} L ${cx + headRadius * 0.1} ${cy + headRadius * 0.2} Z" fill="${skinColor}" stroke="rgba(0,0,0,0.1)" stroke-width="${headRadius * 0.02}"/>
  `;

  // 配饰
  if (accessory === "glasses") {
    svg += `
      <path d="M ${cx - headRadius * 0.5} ${cy - headRadius * 0.1} A ${headRadius * 0.25} ${headRadius * 0.25} 0 0 0 ${cx - headRadius * 0.25} ${cy - headRadius * 0.2} L ${cx + headRadius * 0.25} ${cy - headRadius * 0.2} A ${headRadius * 0.25} ${headRadius * 0.25} 0 0 0 ${cx + headRadius * 0.5} ${cy - headRadius * 0.1}" stroke="#333" stroke-width="${headRadius * 0.03}" fill="none"/>
      <rect x="${cx - headRadius * 0.25}" y="${cy - headRadius * 0.22}" width="${headRadius * 0.5}" height="${headRadius * 0.02}" fill="#333"/>
    `;
  } else if (accessory === "hat") {
    svg += `
      <path d="M ${cx - headRadius * 1.2} ${cy - headRadius * 0.6} A ${headRadius * 1.2} ${headRadius * 0.5} 0 0 1 ${cx + headRadius * 1.2} ${cy - headRadius * 0.6} L ${cx + headRadius * 1} ${cy - headRadius * 0.3} L ${cx - headRadius * 1} ${cy - headRadius * 0.3} Z" fill="#3498DB"/>
    `;
  } else if (accessory === "headband") {
    svg += `
      <rect x="${cx - headRadius * 1.1}" y="${cy - headRadius * 0.4}" width="${headRadius * 2.2}" height="${headRadius * 0.1}" fill="#FF69B4"/>
    `;
  }

  return svg;
}

// 生成宠物SVG
function generatePetSVG(cx: number, cy: number, size: number): string {
  const headRadius = size * 0.25;
  const furColors = [
    "#8B4513",
    "#D2691E",
    "#F4A460",
    "#000000",
    "#FFFFFF",
    "#4B0082",
    "#008000",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#F7DC6F",
  ];
  const petTypes = ["cat", "dog", "rabbit", "fox", "panda", "hamster"];
  const expressions = [
    "happy",
    "neutral",
    "sleepy",
    "excited",
    "surprised",
    "angry",
  ];
  const accessories = ["none", "collar", "hat", "glasses"];

  const furColor = furColors[Math.floor(Math.random() * furColors.length)];
  const petType = petTypes[Math.floor(Math.random() * petTypes.length)];
  const expression =
    expressions[Math.floor(Math.random() * expressions.length)];
  const accessory = accessories[Math.floor(Math.random() * accessories.length)];

  let svg = `
    <!-- 头部 -->
    <circle cx="${cx}" cy="${cy}" r="${headRadius}" fill="${furColor}"/>
  `;

  // 耳朵
  switch (petType) {
    case "cat":
      svg += `
        <polygon points="${cx - headRadius * 0.8},${cy - headRadius * 0.5} ${cx - headRadius * 1.2},${cy - headRadius * 1.2} ${cx - headRadius * 0.3},${cy - headRadius * 0.8}" fill="${furColor}"/>
        <polygon points="${cx + headRadius * 0.8},${cy - headRadius * 0.5} ${cx + headRadius * 1.2},${cy - headRadius * 1.2} ${cx + headRadius * 0.3},${cy - headRadius * 0.8}" fill="${furColor}"/>
        <!-- 耳朵内部 -->
        <polygon points="${cx - headRadius * 0.7},${cy - headRadius * 0.6} ${cx - headRadius * 1.1},${cy - headRadius * 1.1} ${cx - headRadius * 0.4},${cy - headRadius * 0.7}" fill="#FFE4E1"/>
        <polygon points="${cx + headRadius * 0.7},${cy - headRadius * 0.6} ${cx + headRadius * 1.1},${cy - headRadius * 1.1} ${cx + headRadius * 0.4},${cy - headRadius * 0.7}" fill="#FFE4E1"/>
      `;
      break;
    case "dog":
      svg += `
        <polygon points="${cx - headRadius * 0.7},${cy - headRadius * 0.4} ${cx - headRadius * 1},${cy - headRadius * 0.8} ${cx - headRadius * 0.3},${cy - headRadius * 0.6}" fill="${furColor}"/>
        <polygon points="${cx + headRadius * 0.7},${cy - headRadius * 0.4} ${cx + headRadius * 1},${cy - headRadius * 0.8} ${cx + headRadius * 0.3},${cy - headRadius * 0.6}" fill="${furColor}"/>
      `;
      break;
    case "rabbit":
      svg += `
        <ellipse cx="${cx - headRadius * 0.7}" cy="${cy - headRadius * 0.6}" rx="${headRadius * 0.3}" ry="${headRadius * 0.6}" fill="${furColor}" transform="rotate(-30, ${cx - headRadius * 0.7}, ${cy - headRadius * 0.6})"/>
        <ellipse cx="${cx + headRadius * 0.7}" cy="${cy - headRadius * 0.6}" rx="${headRadius * 0.3}" ry="${headRadius * 0.6}" fill="${furColor}" transform="rotate(30, ${cx + headRadius * 0.7}, ${cy - headRadius * 0.6})"/>
        <!-- 耳朵内部 -->
        <ellipse cx="${cx - headRadius * 0.7}" cy="${cy - headRadius * 0.6}" rx="${headRadius * 0.15}" ry="${headRadius * 0.3}" fill="#FFE4E1" transform="rotate(-30, ${cx - headRadius * 0.7}, ${cy - headRadius * 0.6})"/>
        <ellipse cx="${cx + headRadius * 0.7}" cy="${cy - headRadius * 0.6}" rx="${headRadius * 0.15}" ry="${headRadius * 0.3}" fill="#FFE4E1" transform="rotate(30, ${cx + headRadius * 0.7}, ${cy - headRadius * 0.6})"/>
      `;
      break;
    case "fox":
      svg += `
        <polygon points="${cx - headRadius * 0.8},${cy - headRadius * 0.5} ${cx - headRadius * 1.2},${cy - headRadius * 1.1} ${cx - headRadius * 0.3},${cy - headRadius * 0.8}" fill="${furColor}"/>
        <polygon points="${cx + headRadius * 0.8},${cy - headRadius * 0.5} ${cx + headRadius * 1.2},${cy - headRadius * 1.1} ${cx + headRadius * 0.3},${cy - headRadius * 0.8}" fill="${furColor}"/>
        <!-- 耳朵内部 -->
        <polygon points="${cx - headRadius * 0.7},${cy - headRadius * 0.6} ${cx - headRadius * 1.1},${cy - headRadius * 1} ${cx - headRadius * 0.4},${cy - headRadius * 0.7}" fill="#FFE4E1"/>
        <polygon points="${cx + headRadius * 0.7},${cy - headRadius * 0.6} ${cx + headRadius * 1.1},${cy - headRadius * 1} ${cx + headRadius * 0.4},${cy - headRadius * 0.7}" fill="#FFE4E1"/>
      `;
      break;
    case "panda":
      svg += `
        <circle cx="${cx - headRadius * 0.6}" cy="${cy - headRadius * 0.4}" r="${headRadius * 0.25}" fill="${furColor}"/>
        <circle cx="${cx + headRadius * 0.6}" cy="${cy - headRadius * 0.4}" r="${headRadius * 0.25}" fill="${furColor}"/>
        <!-- 黑眼圈 -->
        <ellipse cx="${cx - headRadius * 0.3}" cy="${cy - headRadius * 0.1}" rx="${headRadius * 0.15}" ry="${headRadius * 0.2}" fill="#000000"/>
        <ellipse cx="${cx + headRadius * 0.3}" cy="${cy - headRadius * 0.1}" rx="${headRadius * 0.15}" ry="${headRadius * 0.2}" fill="#000000"/>
      `;
      break;
    case "hamster":
      svg += `
        <circle cx="${cx - headRadius * 0.5}" cy="${cy - headRadius * 0.3}" r="${headRadius * 0.2}" fill="${furColor}"/>
        <circle cx="${cx + headRadius * 0.5}" cy="${cy - headRadius * 0.3}" r="${headRadius * 0.2}" fill="${furColor}"/>
      `;
      break;
  }

  // 眼睛（如果不是熊猫）
  if (petType !== "panda") {
    if (expression === "sleepy") {
      svg += `
        <path d="M ${cx - headRadius * 0.4} ${cy - headRadius * 0.1} L ${cx - headRadius * 0.2} ${cy - headRadius * 0.1}" stroke="#000000" stroke-width="${headRadius * 0.05}" fill="none"/>
        <path d="M ${cx + headRadius * 0.4} ${cy - headRadius * 0.1} L ${cx + headRadius * 0.2} ${cy - headRadius * 0.1}" stroke="#000000" stroke-width="${headRadius * 0.05}" fill="none"/>
      `;
    } else if (expression === "excited" || expression === "surprised") {
      svg += `
        <circle cx="${cx - headRadius * 0.3}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.15}" fill="#FFFFFF"/>
        <circle cx="${cx + headRadius * 0.3}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.15}" fill="#FFFFFF"/>
        <circle cx="${cx - headRadius * 0.3}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.07}" fill="#000000"/>
        <circle cx="${cx + headRadius * 0.3}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.07}" fill="#000000"/>
      `;
    } else if (expression === "angry") {
      svg += `
        <path d="M ${cx - headRadius * 0.4} ${cy - headRadius * 0.05} L ${cx - headRadius * 0.2} ${cy - headRadius * 0.15}" stroke="#000000" stroke-width="${headRadius * 0.05}" fill="none"/>
        <path d="M ${cx + headRadius * 0.4} ${cy - headRadius * 0.05} L ${cx + headRadius * 0.2} ${cy - headRadius * 0.15}" stroke="#000000" stroke-width="${headRadius * 0.05}" fill="none"/>
      `;
    } else {
      svg += `
        <circle cx="${cx - headRadius * 0.3}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.12}" fill="#000000"/>
        <circle cx="${cx + headRadius * 0.3}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.12}" fill="#000000"/>
      `;
    }
  } else {
    // 熊猫的眼睛已经在上面绘制了
    svg += `
      <circle cx="${cx - headRadius * 0.3}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.05}" fill="#FFFFFF"/>
      <circle cx="${cx + headRadius * 0.3}" cy="${cy - headRadius * 0.1}" r="${headRadius * 0.05}" fill="#FFFFFF"/>
    `;
  }

  // 鼻子
  svg += `
    <circle cx="${cx}" cy="${cy + headRadius * 0.2}" r="${headRadius * 0.15}" fill="#FF69B4"/>
  `;

  // 嘴巴
  if (expression === "happy") {
    svg += `
      <path d="M ${cx} ${cy + headRadius * 0.35} Q ${cx - headRadius * 0.2} ${cy + headRadius * 0.45} ${cx - headRadius * 0.15} ${cy + headRadius * 0.35} M ${cx} ${cy + headRadius * 0.35} Q ${cx + headRadius * 0.2} ${cy + headRadius * 0.45} ${cx + headRadius * 0.15} ${cy + headRadius * 0.35}" stroke="#000000" stroke-width="${headRadius * 0.03}" fill="none"/>
    `;
  } else if (expression === "angry") {
    svg += `
      <path d="M ${cx - headRadius * 0.15} ${cy + headRadius * 0.35} Q ${cx} ${cy + headRadius * 0.45} ${cx + headRadius * 0.15} ${cy + headRadius * 0.35}" stroke="#000000" stroke-width="${headRadius * 0.03}" fill="none"/>
    `;
  } else {
    svg += `
      <path d="M ${cx} ${cy + headRadius * 0.35} L ${cx - headRadius * 0.15} ${cy + headRadius * 0.45} M ${cx} ${cy + headRadius * 0.35} L ${cx + headRadius * 0.15} ${cy + headRadius * 0.45}" stroke="#000000" stroke-width="${headRadius * 0.03}" fill="none"/>
    `;
  }

  // 胡须（猫和狐狸）
  if (petType === "cat" || petType === "fox") {
    svg += `
      <path d="M ${cx - headRadius * 0.2} ${cy + headRadius * 0.15} L ${cx - headRadius * 0.4} ${cy + headRadius * 0.1} M ${cx - headRadius * 0.2} ${cy + headRadius * 0.2} L ${cx - headRadius * 0.4} ${cy + headRadius * 0.2} M ${cx - headRadius * 0.2} ${cy + headRadius * 0.25} L ${cx - headRadius * 0.4} ${cy + headRadius * 0.3} M ${cx + headRadius * 0.2} ${cy + headRadius * 0.15} L ${cx + headRadius * 0.4} ${cy + headRadius * 0.1} M ${cx + headRadius * 0.2} ${cy + headRadius * 0.2} L ${cx + headRadius * 0.4} ${cy + headRadius * 0.2} M ${cx + headRadius * 0.2} ${cy + headRadius * 0.25} L ${cx + headRadius * 0.4} ${cy + headRadius * 0.3}" stroke="#000000" stroke-width="${headRadius * 0.01}" fill="none"/>
    `;
  }

  // 配饰
  if (accessory === "collar") {
    svg += `
      <rect x="${cx - headRadius * 0.7}" y="${cy + headRadius * 0.4}" width="${headRadius * 1.4}" height="${headRadius * 0.1}" fill="#FF6B6B"/>
      <circle cx="${cx}" cy="${cy + headRadius * 0.45}" r="${headRadius * 0.05}" fill="#FFFFFF"/>
    `;
  } else if (accessory === "hat") {
    svg += `
      <path d="M ${cx - headRadius * 0.8} ${cy - headRadius * 0.6} A ${headRadius * 0.8} ${headRadius * 0.3} 0 0 1 ${cx + headRadius * 0.8} ${cy - headRadius * 0.6} L ${cx + headRadius * 0.7} ${cy - headRadius * 0.3} L ${cx - headRadius * 0.7} ${cy - headRadius * 0.3} Z" fill="#3498DB"/>
    `;
  } else if (accessory === "glasses") {
    svg += `
      <path d="M ${cx - headRadius * 0.4} ${cy - headRadius * 0.1} A ${headRadius * 0.2} ${headRadius * 0.2} 0 0 0 ${cx - headRadius * 0.2} ${cy - headRadius * 0.2} L ${cx + headRadius * 0.2} ${cy - headRadius * 0.2} A ${headRadius * 0.2} ${headRadius * 0.2} 0 0 0 ${cx + headRadius * 0.4} ${cy - headRadius * 0.1}" stroke="#333" stroke-width="${headRadius * 0.03}" fill="none"/>
      <rect x="${cx - headRadius * 0.2}" y="${cy - headRadius * 0.22}" width="${headRadius * 0.4}" height="${headRadius * 0.02}" fill="#333"/>
    `;
  }

  return svg;
}

// 生成衣服SVG
function generateClothingSVG(cx: number, cy: number, size: number): string {
  const clothingColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
    "#FF9FF3",
    "#54A0FF",
    "#5F27CD",
    "#00D2D3",
    "#10AC84",
    "#FF9F43",
    "#EE5A24",
    "#006266",
  ];
  const clothingStyles = ["tshirt", "hoodie", "dress", "jacket", "sweater"];
  const patternTypes = [
    "none",
    "stripes",
    "dots",
    "checks",
    "waves",
    "hearts",
    "stars",
  ];

  const clothingColor =
    clothingColors[Math.floor(Math.random() * clothingColors.length)];
  const secondaryColor =
    clothingColors[Math.floor(Math.random() * clothingColors.length)];
  const clothingStyle =
    clothingStyles[Math.floor(Math.random() * clothingStyles.length)];
  const patternType =
    patternTypes[Math.floor(Math.random() * patternTypes.length)];

  let svg = ``;

  switch (clothingStyle) {
    case "tshirt":
      // 绘制T恤主体
      svg += `
        <path d="M ${cx - size * 0.3} ${cy - size * 0.1} L ${cx - size * 0.15} ${cy - size * 0.2} L ${cx + size * 0.15} ${cy - size * 0.2} L ${cx + size * 0.3} ${cy - size * 0.1} L ${cx + size * 0.3} ${cy + size * 0.3} L ${cx - size * 0.3} ${cy + size * 0.3} Z" fill="${clothingColor}"/>
        <!-- 袖子 -->
        <path d="M ${cx - size * 0.3} ${cy - size * 0.1} L ${cx - size * 0.45} ${cy + size * 0.1} L ${cx - size * 0.35} ${cy + size * 0.2} L ${cx - size * 0.3} ${cy + size * 0.1} Z" fill="${clothingColor}"/>
        <path d="M ${cx + size * 0.3} ${cy - size * 0.1} L ${cx + size * 0.45} ${cy + size * 0.1} L ${cx + size * 0.35} ${cy + size * 0.2} L ${cx + size * 0.3} ${cy + size * 0.1} Z" fill="${clothingColor}"/>
      `;
      break;
    case "hoodie":
      // 绘制连帽衫主体
      svg += `
        <!-- 帽子 -->
        <path d="M ${cx - size * 0.25} ${cy - size * 0.3} L ${cx - size * 0.15} ${cy - size * 0.4} L ${cx + size * 0.15} ${cy - size * 0.4} L ${cx + size * 0.25} ${cy - size * 0.3} L ${cx + size * 0.25} ${cy - size * 0.2} L ${cx - size * 0.25} ${cy - size * 0.2} Z" fill="${clothingColor}"/>
        <!-- 主体 -->
        <path d="M ${cx - size * 0.3} ${cy - size * 0.2} L ${cx - size * 0.3} ${cy + size * 0.3} L ${cx + size * 0.3} ${cy + size * 0.3} L ${cx + size * 0.3} ${cy - size * 0.2} Z" fill="${clothingColor}"/>
        <!-- 袖子 -->
        <path d="M ${cx - size * 0.3} ${cy - size * 0.1} L ${cx - size * 0.45} ${cy + size * 0.1} L ${cx - size * 0.35} ${cy + size * 0.2} L ${cx - size * 0.3} ${cy + size * 0.1} Z" fill="${clothingColor}"/>
        <path d="M ${cx + size * 0.3} ${cy - size * 0.1} L ${cx + size * 0.45} ${cy + size * 0.1} L ${cx + size * 0.35} ${cy + size * 0.2} L ${cx + size * 0.3} ${cy + size * 0.1} Z" fill="${clothingColor}"/>
      `;
      break;
    case "dress":
      // 绘制连衣裙
      svg += `
        <!-- 上半部分 -->
        <path d="M ${cx - size * 0.25} ${cy - size * 0.15} L ${cx - size * 0.15} ${cy - size * 0.25} L ${cx + size * 0.15} ${cy - size * 0.25} L ${cx + size * 0.25} ${cy - size * 0.15} L ${cx + size * 0.25} ${cy + size * 0.1} L ${cx - size * 0.25} ${cy + size * 0.1} Z" fill="${clothingColor}"/>
        <!-- 下半部分 -->
        <path d="M ${cx - size * 0.25} ${cy + size * 0.1} L ${cx} ${cy + size * 0.4} L ${cx + size * 0.25} ${cy + size * 0.1} Z" fill="${clothingColor}"/>
      `;
      break;
    case "jacket":
      // 绘制夹克
      svg += `
        <!-- 主体 -->
        <path d="M ${cx - size * 0.3} ${cy - size * 0.15} L ${cx - size * 0.3} ${cy + size * 0.3} L ${cx + size * 0.3} ${cy + size * 0.3} L ${cx + size * 0.3} ${cy - size * 0.15} Z" fill="${clothingColor}"/>
        <!-- 领子 -->
        <path d="M ${cx - size * 0.2} ${cy - size * 0.15} L ${cx} ${cy - size * 0.3} L ${cx + size * 0.2} ${cy - size * 0.15}" stroke="${secondaryColor}" stroke-width="${size * 0.02}" fill="none"/>
        <!-- 袖子 -->
        <path d="M ${cx - size * 0.3} ${cy - size * 0.1} L ${cx - size * 0.45} ${cy + size * 0.1} L ${cx - size * 0.35} ${cy + size * 0.2} L ${cx - size * 0.3} ${cy + size * 0.1} Z" fill="${clothingColor}"/>
        <path d="M ${cx + size * 0.3} ${cy - size * 0.1} L ${cx + size * 0.45} ${cy + size * 0.1} L ${cx + size * 0.35} ${cy + size * 0.2} L ${cx + size * 0.3} ${cy + size * 0.1} Z" fill="${clothingColor}"/>
        <!-- 纽扣 -->
        <circle cx="${cx}" cy="${cy}" r="${size * 0.03}" fill="${secondaryColor}"/>
        <circle cx="${cx}" cy="${cy + size * 0.15}" r="${size * 0.03}" fill="${secondaryColor}"/>
      `;
      break;
    case "sweater":
      // 绘制毛衣
      svg += `
        <!-- 主体 -->
        <path d="M ${cx - size * 0.3} ${cy - size * 0.2} L ${cx - size * 0.3} ${cy + size * 0.3} L ${cx + size * 0.3} ${cy + size * 0.3} L ${cx + size * 0.3} ${cy - size * 0.2} Z" fill="${clothingColor}"/>
        <!-- 领口 -->
        <circle cx="${cx}" cy="${cy - size * 0.2}" r="${size * 0.1}" fill="${secondaryColor}"/>
        <!-- 袖子 -->
        <path d="M ${cx - size * 0.3} ${cy - size * 0.1} L ${cx - size * 0.45} ${cy + size * 0.1} L ${cx - size * 0.35} ${cy + size * 0.2} L ${cx - size * 0.3} ${cy + size * 0.1} Z" fill="${clothingColor}"/>
        <path d="M ${cx + size * 0.3} ${cy - size * 0.1} L ${cx + size * 0.45} ${cy + size * 0.1} L ${cx + size * 0.35} ${cy + size * 0.2} L ${cx + size * 0.3} ${cy + size * 0.1} Z" fill="${clothingColor}"/>
      `;
      break;
  }

  // 添加图案
  if (patternType === "stripes") {
    // 水平条纹
    for (let i = -5; i <= 5; i++) {
      const y = cy - size * 0.2 + i * size * 0.05;
      svg += `
        <rect x="${cx - size * 0.4}" y="${y}" width="${size * 0.8}" height="${size * 0.02}" fill="${secondaryColor}" opacity="0.5"/>
      `;
    }
  } else if (patternType === "dots") {
    // 圆点
    for (let i = -4; i <= 4; i++) {
      for (let j = -4; j <= 4; j++) {
        const x = cx - size * 0.3 + i * size * 0.15;
        const y = cy - size * 0.2 + j * size * 0.15;
        svg += `
          <circle cx="${x}" cy="${y}" r="${size * 0.03}" fill="${secondaryColor}" opacity="0.5"/>
        `;
      }
    }
  } else if (patternType === "checks") {
    // 方块
    for (let i = -4; i <= 4; i++) {
      for (let j = -4; j <= 4; j++) {
        if ((i + j) % 2 === 0) {
          const x = cx - size * 0.3 + i * size * 0.1;
          const y = cy - size * 0.2 + j * size * 0.1;
          svg += `
            <rect x="${x}" y="${y}" width="${size * 0.1}" height="${size * 0.1}" fill="${secondaryColor}" opacity="0.3"/>
          `;
        }
      }
    }
  } else if (patternType === "waves") {
    // 波浪线
    svg += `
      <path d="M ${cx - size * 0.3} ${cy} Q ${cx - size * 0.2} ${cy - size * 0.1} ${cx - size * 0.1} ${cy} Q ${cx} ${cy + size * 0.1} ${cx + size * 0.1} ${cy} Q ${cx + size * 0.2} ${cy - size * 0.1} ${cx + size * 0.3} ${cy}" stroke="${secondaryColor}" stroke-width="${size * 0.02}" fill="none" opacity="0.7"/>
      <path d="M ${cx - size * 0.3} ${cy + size * 0.15} Q ${cx - size * 0.2} ${cy + size * 0.05} ${cx - size * 0.1} ${cy + size * 0.15} Q ${cx} ${cy + size * 0.25} ${cx + size * 0.1} ${cy + size * 0.15} Q ${cx + size * 0.2} ${cy + size * 0.05} ${cx + size * 0.3} ${cy + size * 0.15}" stroke="${secondaryColor}" stroke-width="${size * 0.02}" fill="none" opacity="0.7"/>
      <path d="M ${cx - size * 0.3} ${cy - size * 0.15} Q ${cx - size * 0.2} ${cy - size * 0.25} ${cx - size * 0.1} ${cy - size * 0.15} Q ${cx} ${cy - size * 0.05} ${cx + size * 0.1} ${cy - size * 0.15} Q ${cx + size * 0.2} ${cy - size * 0.25} ${cx + size * 0.3} ${cy - size * 0.15}" stroke="${secondaryColor}" stroke-width="${size * 0.02}" fill="none" opacity="0.7"/>
    `;
  } else if (patternType === "hearts") {
    // 心形
    for (let i = -3; i <= 3; i++) {
      for (let j = -2; j <= 2; j++) {
        const x = cx - size * 0.3 + i * size * 0.2;
        const y = cy - size * 0.1 + j * size * 0.2;
        svg += `
          <path d="M ${x} ${y - size * 0.05} Q ${x + size * 0.05} ${y - size * 0.15} ${x + size * 0.1} ${y - size * 0.05} Q ${x + size * 0.1} ${y + size * 0.05} ${x} ${y + size * 0.1} Q ${x - size * 0.1} ${y + size * 0.05} ${x - size * 0.1} ${y - size * 0.05} Q ${x - size * 0.05} ${y - size * 0.15} ${x} ${y - size * 0.05}" fill="${secondaryColor}" opacity="0.5"/>
        `;
      }
    }
  } else if (patternType === "stars") {
    // 星星
    for (let i = -3; i <= 3; i++) {
      for (let j = -2; j <= 2; j++) {
        const x = cx - size * 0.3 + i * size * 0.2;
        const y = cy - size * 0.1 + j * size * 0.2;
        svg += `
          <polygon points="${x},${y - size * 0.06} ${x + size * 0.02},${y - size * 0.02} ${x + size * 0.06},${y - size * 0.02} ${x + size * 0.03},${y + size * 0.02} ${x + size * 0.04},${y + size * 0.06} ${x},${y + size * 0.04} ${x - size * 0.04},${y + size * 0.06} ${x - size * 0.03},${y + size * 0.02} ${x - size * 0.06},${y - size * 0.02} ${x - size * 0.02},${y - size * 0.02}" fill="${secondaryColor}" opacity="0.5"/>
        `;
      }
    }
  }

  return svg;
}

// 生成物品SVG
function generateObjectSVG(cx: number, cy: number, size: number): string {
  const objectTypes = [
    "book",
    "camera",
    "coffee",
    "gift",
    "music",
    "phone",
    "watch",
    "star",
    "heart",
    "flower",
  ];
  const colors = [
    "#E74C3C",
    "#3498DB",
    "#2ECC71",
    "#F39C12",
    "#9B59B6",
    "#1ABC9C",
    "#34495E",
    "#E67E22",
    "#95A5A6",
    "#3498DB",
  ];

  const objectType =
    objectTypes[Math.floor(Math.random() * objectTypes.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const secondaryColor = colors[Math.floor(Math.random() * colors.length)];

  let svg = ``;

  switch (objectType) {
    case "book":
      // 绘制书本
      svg += `
        <rect x="${cx - size * 0.2}" y="${cy - size * 0.25}" width="${size * 0.4}" height="${size * 0.5}" fill="${color}"/>
        <!-- 书脊 -->
        <rect x="${cx - size * 0.2}" y="${cy - size * 0.25}" width="${size * 0.05}" height="${size * 0.5}" fill="${secondaryColor}"/>
        <!-- 书页 -->
        <rect x="${cx - size * 0.15}" y="${cy - size * 0.24}" width="${size * 0.3}" height="${size * 0.48}" fill="#FFFFFF"/>
        <!-- 文字 -->
        <text x="${cx}" y="${cy + size * 0.05}" font-family="Arial" font-size="${size * 0.05}" text-anchor="middle" fill="#333">BOOK</text>
      `;
      break;
    case "camera":
      // 绘制相机
      svg += `
        <rect x="${cx - size * 0.25}" y="${cy - size * 0.15}" width="${size * 0.5}" height="${size * 0.3}" fill="${color}"/>
        <!-- 镜头 -->
        <circle cx="${cx}" cy="${cy}" r="${size * 0.12}" fill="#34495E"/>
        <circle cx="${cx}" cy="${cy}" r="${size * 0.08}" fill="#ECF0F1"/>
        <circle cx="${cx}" cy="${cy}" r="${size * 0.04}" fill="#34495E"/>
        <!-- 按钮 -->
        <circle cx="${cx + size * 0.15}" cy="${cy - size * 0.05}" r="${size * 0.03}" fill="${secondaryColor}"/>
      `;
      break;
    case "coffee":
      // 绘制咖啡杯
      svg += `
        <!-- 杯子 -->
        <path d="M ${cx - size * 0.15} ${cy - size * 0.1} L ${cx + size * 0.15} ${cy - size * 0.1} L ${cx + size * 0.15} ${cy + size * 0.25} A ${size * 0.15} ${size * 0.15} 0 0 1 ${cx - size * 0.15} ${cy + size * 0.25} Z" fill="${secondaryColor}"/>
        <!-- 杯柄 -->
        <path d="M ${cx + size * 0.15} ${cy + size * 0.05} A ${size * 0.08} ${size * 0.08} 0 0 1 ${cx + size * 0.23} ${cy + size * 0.13} A ${size * 0.08} ${size * 0.08} 0 0 1 ${cx + size * 0.15} ${cy + size * 0.21}" stroke="${secondaryColor}" stroke-width="${size * 0.03}" fill="none"/>
        <!-- 咖啡 -->
        <path d="M ${cx - size * 0.12} ${cy + size * 0.15} A ${size * 0.12} ${size * 0.12} 0 0 1 ${cx + size * 0.12} ${cy + size * 0.15}" fill="#8B4513"/>
        <!-- 蒸汽 -->
        <path d="M ${cx - size * 0.05} ${cy - size * 0.1} Q ${cx - size * 0.05} ${cy - size * 0.2} ${cx} ${cy - size * 0.25} Q ${cx + size * 0.05} ${cy - size * 0.3} ${cx + size * 0.05} ${cy - size * 0.3}" stroke="rgba(255, 255, 255, 0.7)" stroke-width="${size * 0.01}" fill="none"/>
        <path d="M ${cx - size * 0.02} ${cy - size * 0.12} Q ${cx - size * 0.02} ${cy - size * 0.22} ${cx + size * 0.03} ${cy - size * 0.27} Q ${cx + size * 0.08} ${cy - size * 0.32} ${cx + size * 0.08} ${cy - size * 0.32}" stroke="rgba(255, 255, 255, 0.7)" stroke-width="${size * 0.01}" fill="none"/>
        <path d="M ${cx + size * 0.02} ${cy - size * 0.1} Q ${cx + size * 0.02} ${cy - size * 0.2} ${cx + size * 0.07} ${cy - size * 0.25} Q ${cx + size * 0.12} ${cy - size * 0.3} ${cx + size * 0.12} ${cy - size * 0.3}" stroke="rgba(255, 255, 255, 0.7)" stroke-width="${size * 0.01}" fill="none"/>
      `;
      break;
    case "gift":
      // 绘制礼物盒
      svg += `
        <rect x="${cx - size * 0.2}" y="${cy - size * 0.15}" width="${size * 0.4}" height="${size * 0.35}" fill="${color}"/>
        <!-- 丝带 -->
        <rect x="${cx - size * 0.02}" y="${cy - size * 0.15}" width="${size * 0.04}" height="${size * 0.35}" fill="${secondaryColor}"/>
        <rect x="${cx - size * 0.2}" y="${cy - size * 0.02}" width="${size * 0.4}" height="${size * 0.04}" fill="${secondaryColor}"/>
        <!-- 蝴蝶结 -->
        <circle cx="${cx - size * 0.05}" cy="${cy - size * 0.15}" r="${size * 0.05}" fill="${secondaryColor}"/>
        <circle cx="${cx + size * 0.05}" cy="${cy - size * 0.15}" r="${size * 0.05}" fill="${secondaryColor}"/>
        <rect x="${cx - size * 0.03}" y="${cy - size * 0.15}" width="${size * 0.06}" height="${size * 0.08}" fill="${secondaryColor}"/>
      `;
      break;
    case "music":
      // 绘制音符
      svg += `
        <circle cx="${cx - size * 0.1}" cy="${cy + size * 0.1}" r="${size * 0.08}" fill="${color}"/>
        <rect x="${cx - size * 0.1}" y="${cy - size * 0.25}" width="${size * 0.04}" height="${size * 0.35}" fill="${color}"/>
        <circle cx="${cx + size * 0.1}" cy="${cy + size * 0.05}" r="${size * 0.06}" fill="${color}"/>
        <rect x="${cx + size * 0.1}" y="${cy - size * 0.25}" width="${size * 0.04}" height="${size * 0.3}" fill="${color}"/>
        <rect x="${cx - size * 0.1}" y="${cy - size * 0.25}" width="${size * 0.2}" height="${size * 0.04}" fill="${color}"/>
        <!-- 五线谱 -->
        <path d="M ${cx - size * 0.2} ${cy - size * 0.15} L ${cx + size * 0.2} ${cy - size * 0.15}" stroke="${secondaryColor}" stroke-width="${size * 0.01}" fill="none"/>
        <path d="M ${cx - size * 0.2} ${cy - size * 0.07} L ${cx + size * 0.2} ${cy - size * 0.07}" stroke="${secondaryColor}" stroke-width="${size * 0.01}" fill="none"/>
        <path d="M ${cx - size * 0.2} ${cy + size * 0.01} L ${cx + size * 0.2} ${cy + size * 0.01}" stroke="${secondaryColor}" stroke-width="${size * 0.01}" fill="none"/>
        <path d="M ${cx - size * 0.2} ${cy + size * 0.09} L ${cx + size * 0.2} ${cy + size * 0.09}" stroke="${secondaryColor}" stroke-width="${size * 0.01}" fill="none"/>
        <path d="M ${cx - size * 0.2} ${cy + size * 0.17} L ${cx + size * 0.2} ${cy + size * 0.17}" stroke="${secondaryColor}" stroke-width="${size * 0.01}" fill="none"/>
      `;
      break;
    case "phone":
      // 绘制手机
      svg += `
        <rect x="${cx - size * 0.15}" y="${cy - size * 0.25}" width="${size * 0.3}" height="${size * 0.5}" fill="${secondaryColor}"/>
        <!-- 屏幕 -->
        <rect x="${cx - size * 0.13}" y="${cy - size * 0.22}" width="${size * 0.26}" height="${size * 0.42}" fill="#000"/>
        <!-- 摄像头 -->
        <circle cx="${cx}" cy="${cy - size * 0.23}" r="${size * 0.02}" fill="#333"/>
        <!-- 按钮 -->
        <rect x="${cx - size * 0.05}" y="${cy + size * 0.23}" width="${size * 0.1}" height="${size * 0.03}" fill="#333"/>
      `;
      break;
    case "watch":
      // 绘制手表
      svg += `
        <circle cx="${cx}" cy="${cy}" r="${size * 0.2}" fill="${secondaryColor}"/>
        <!-- 表盘 -->
        <circle cx="${cx}" cy="${cy}" r="${size * 0.18}" fill="#FFFFFF"/>
        <!-- 指针 -->
        <path d="M ${cx} ${cy} L ${cx} ${cy - size * 0.12}" stroke="#000" stroke-width="${size * 0.01}" fill="none"/>
        <path d="M ${cx} ${cy} L ${cx + size * 0.1} ${cy}" stroke="#000" stroke-width="${size * 0.01}" fill="none"/>
        <!-- 表冠 -->
        <circle cx="${cx + size * 0.2}" cy="${cy}" r="${size * 0.02}" fill="${secondaryColor}"/>
        <!-- 表带 -->
        <rect x="${cx - size * 0.1}" y="${cy - size * 0.2}" width="${size * 0.2}" height="${size * 0.1}" fill="${secondaryColor}"/>
        <rect x="${cx - size * 0.1}" y="${cy + size * 0.1}" width="${size * 0.2}" height="${size * 0.1}" fill="${secondaryColor}"/>
      `;
      break;
    case "star":
      // 绘制星星
      svg += `
        <polygon points="${cx},${cy - size * 0.2} ${cx + size * 0.06},${cy - size * 0.06} ${cx + size * 0.2},${cy - size * 0.06} ${cx + size * 0.1},${cy + size * 0.06} ${cx + size * 0.14},${cy + size * 0.2} ${cx},${cy + size * 0.12} ${cx - size * 0.14},${cy + size * 0.2} ${cx - size * 0.1},${cy + size * 0.06} ${cx - size * 0.2},${cy - size * 0.06} ${cx - size * 0.06},${cy - size * 0.06}" fill="${color}"/>
        <!-- 星星光芒 -->
        <path d="M ${cx},${cy - size * 0.2} L ${cx},${cy - size * 0.25}" stroke="${color}" stroke-width="${size * 0.01}" fill="none"/>
        <path d="M ${cx + size * 0.2},${cy - size * 0.06} L ${cx + size * 0.25},${cy - size * 0.08}" stroke="${color}" stroke-width="${size * 0.01}" fill="none"/>
        <path d="M ${cx + size * 0.14},${cy + size * 0.2} L ${cx + size * 0.17},${cy + size * 0.25}" stroke="${color}" stroke-width="${size * 0.01}" fill="none"/>
        <path d="M ${cx - size * 0.14},${cy + size * 0.2} L ${cx - size * 0.17},${cy + size * 0.25}" stroke="${color}" stroke-width="${size * 0.01}" fill="none"/>
        <path d="M ${cx - size * 0.2},${cy - size * 0.06} L ${cx - size * 0.25},${cy - size * 0.08}" stroke="${color}" stroke-width="${size * 0.01}" fill="none"/>
      `;
      break;
    case "heart":
      // 绘制心形
      svg += `
        <path d="M ${cx} ${cy - size * 0.1} Q ${cx + size * 0.2} ${cy - size * 0.3} ${cx + size * 0.2} ${cy + size * 0.1} Q ${cx + size * 0.2} ${cy + size * 0.2} ${cx} ${cy + size * 0.2} Q ${cx - size * 0.2} ${cy + size * 0.2} ${cx - size * 0.2} ${cy + size * 0.1} Q ${cx - size * 0.2} ${cy - size * 0.3} ${cx} ${cy - size * 0.1}" fill="${color}"/>
        <!-- 心形高光 -->
        <path d="M ${cx - size * 0.05} ${cy - size * 0.05} Q ${cx + size * 0.05} ${cy - size * 0.15} ${cx + size * 0.05} ${cy + size * 0.05} Q ${cx + size * 0.05} ${cy + size * 0.1} ${cx - size * 0.05} ${cy + size * 0.1} Q ${cx - size * 0.1} ${cy + size * 0.05} ${cx - size * 0.1} ${cy - size * 0.15} Q ${cx - size * 0.05} ${cy - size * 0.05} ${cx - size * 0.05} ${cy - size * 0.05}" fill="rgba(255, 255, 255, 0.3)"/>
      `;
      break;
    case "flower":
      // 绘制花朵
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const x = cx + Math.cos(angle) * size * 0.15;
        const y = cy + Math.sin(angle) * size * 0.15;
        svg += `
          <circle cx="${x}" cy="${y}" r="${size * 0.08}" fill="${secondaryColor}"/>
        `;
      }
      // 花心
      svg += `
        <circle cx="${cx}" cy="${cy}" r="${size * 0.06}" fill="${color}"/>
        <!-- 花茎 -->
        <path d="M ${cx} ${cy + size * 0.15} L ${cx} ${cy + size * 0.25}" stroke="#27AE60" stroke-width="${size * 0.02}" fill="none"/>
        <!-- 叶子 -->
        <ellipse cx="${cx - size * 0.05}" cy="${cy + size * 0.2}" rx="${size * 0.04}" ry="${size * 0.08}" fill="#27AE60" transform="rotate(-45, ${cx - size * 0.05}, ${cy + size * 0.2})"/>
        <ellipse cx="${cx + size * 0.05}" cy="${cy + size * 0.22}" rx="${size * 0.04}" ry="${size * 0.08}" fill="#27AE60" transform="rotate(45, ${cx + size * 0.05}, ${cy + size * 0.22})"/>
      `;
      break;
  }

  return svg;
}

// 下载文件
function downloadFile(data: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = data;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

generateAvatar();
</script>

<style scoped>
.random-avatar-view {
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

.avatar-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 48px;
}

.avatar-display-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.avatar-preview {
  position: relative;
}

.avatar-frame {
  position: relative;
  width: 280px;
  height: 280px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.avatar-glow {
  position: absolute;
  inset: 0;
  opacity: 0.3;
  filter: blur(20px);
  z-index: 0;
}

.avatar-content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: avatarIn 0.5s ease-out;
}

@keyframes avatarIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.avatar-placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.avatar-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 80%;
  height: 80%;
  object-fit: cover;
  border-radius: 8px;
}

.avatar-type-human {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
}

.avatar-type-pet {
  width: 180px;
  height: 180px;
  position: relative;
}

.avatar-type-pet::before {
  content: "";
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.avatar-type-pet::after {
  content: "";
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  top: 20%;
  left: 30%;
  box-shadow: 60px 0 0 rgba(255, 255, 255, 0.8);
}

.avatar-type-clothing {
  width: 180px;
  height: 180px;
  position: relative;
}

.avatar-type-clothing::before {
  content: "";
  position: absolute;
  width: 90px;
  height: 90px;
  background: rgba(255, 255, 255, 0.8);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.avatar-type-clothing::after {
  content: "";
  position: absolute;
  width: 90px;
  height: 30px;
  background: rgba(255, 255, 255, 0.8);
  top: 40%;
  left: 50%;
  transform: translateX(-50%);
  clip-path: polygon(0 100%, 50% 0, 100% 100%);
}

.avatar-type-object {
  width: 180px;
  height: 180px;
  background: rgba(255, 255, 255, 0.8);
}

.avatar-actions {
  display: flex;
  gap: 16px;
}

.generate-btn {
  background: linear-gradient(135deg, #00d4ff, #9d00ff);
  border: none;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
}

.download-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.download-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.4);
  transform: translateY(-2px);
}

.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.avatar-config-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.avatar-config-item {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.avatar-config-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.avatar-config-label .el-icon {
  color: #00d4ff;
}

.avatar-style-group,
.avatar-size-group,
.color-mode-group,
.download-format-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.avatar-size-config,
.avatar-color-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-size-input {
  width: 100%;
}

.color-picker {
  width: 100%;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: none;
}

:deep(.el-input-number .el-input__wrapper:hover) {
  border-color: rgba(0, 212, 255, 0.4);
}

:deep(.el-input-number .el-input__wrapper.is-focus) {
  border-color: #00d4ff;
  box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.1);
}

:deep(.el-radio-button__inner) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  padding: 8px 16px;
}

:deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #00d4ff, #9d00ff);
  border-color: transparent;
  color: #fff;
}

:deep(.el-radio-button__inner:hover) {
  color: #00d4ff;
  border-color: rgba(0, 212, 255, 0.4);
}

:deep(.el-color-picker__trigger) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

:deep(.el-color-picker__trigger:hover) {
  border-color: rgba(0, 212, 255, 0.4);
}

.avatar-history-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.avatar-history-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.avatar-history-item:hover {
  transform: scale(1.05);
  border-color: rgba(0, 212, 255, 0.5);
}

.avatar-history-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.avatar-history-img {
  width: 80%;
  height: 80%;
  object-fit: cover;
  border-radius: 4px;
}

.avatar-history-icon .avatar-type-human {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
}

.avatar-history-icon .avatar-type-pet {
  width: 40px;
  height: 40px;
  position: relative;
}

.avatar-history-icon .avatar-type-pet::before {
  content: "";
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.avatar-history-icon .avatar-type-pet::after {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  top: 20%;
  left: 30%;
  box-shadow: 12px 0 0 rgba(255, 255, 255, 0.8);
}

.avatar-history-icon .avatar-type-clothing {
  width: 40px;
  height: 40px;
  position: relative;
}

.avatar-history-icon .avatar-type-clothing::before {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.8);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.avatar-history-icon .avatar-type-clothing::after {
  content: "";
  position: absolute;
  width: 20px;
  height: 8px;
  background: rgba(255, 255, 255, 0.8);
  top: 40%;
  left: 50%;
  transform: translateX(-50%);
  clip-path: polygon(0 100%, 50% 0, 100% 100%);
}

.avatar-history-icon .avatar-type-object {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.8);
}

.avatar-history-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 212, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-history-item:hover .avatar-history-overlay {
  opacity: 1;
}

.avatar-history-overlay .el-icon {
  font-size: 28px;
  color: #fff;
}

.avatar-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.avatar-feature-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.avatar-feature-item:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-4px);
  border-color: rgba(0, 212, 255, 0.2);
}

.avatar-feature-icon {
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

.avatar-feature-item h4 {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.avatar-feature-item p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}

@media (max-width: 1024px) {
  .avatar-container {
    grid-template-columns: 1fr;
  }

  .avatar-history-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .avatar-history-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .avatar-actions {
    flex-direction: column;
    width: 100%;
  }

  .generate-btn,
  .download-btn {
    width: 100%;
  }
}
</style>
