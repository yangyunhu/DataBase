<template>
  <div class="main-layout">
    <div class="tech-bg">
      <div class="grid-overlay"></div>
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
      <div class="glow-orb orb-3"></div>
      <div class="corner-decoration top-left"></div>
      <div class="corner-decoration top-right"></div>
      <div class="corner-decoration bottom-left"></div>
      <div class="corner-decoration bottom-right"></div>
    </div>

    <header class="header">
      <div class="header-left">
        <router-link to="/" class="logo">
          <div class="logo-icon-container">
            <div class="logo-pulse-ring"></div>
            <div class="logo-pulse-ring ring-2"></div>
            <div class="logo-core">
              <span class="logo-char">词</span>
            </div>
          </div>
          <div class="logo-text-wrapper">
            <span class="logo-text">词元</span>
            <span class="logo-subtitle">AI TOOLS PLATFORM</span>
          </div>
        </router-link>
      </div>

      <nav class="nav-menu">
        <!-- 主要功能 -->
        <router-link
          v-for="item in mainMenuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
          :data-label="item.label"
        >
          <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
          <span class="nav-label">{{ item.label }}</span>
          <div class="nav-indicator"></div>
        </router-link>

        <!-- 更多功能下拉菜单 -->
        <el-dropdown
          class="more-dropdown"
          trigger="click"
          placement="bottom-end"
        >
          <div class="nav-item more-item" :class="{ active: isMoreMenuActive }">
            <el-icon class="nav-icon"><MoreFilled /></el-icon>
            <span class="nav-label">更多</span>
            <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            <div class="nav-indicator"></div>
          </div>
          <template #dropdown>
            <el-dropdown-menu class="more-dropdown-menu">
              <el-dropdown-item
                v-for="item in moreMenuItems"
                :key="item.path"
                :class="{ active: $route.path === item.path }"
                @click="$router.push(item.path)"
              >
                <el-icon class="menu-item-icon"
                  ><component :is="item.icon"
                /></el-icon>
                <span class="menu-item-label">{{ item.label }}</span>
                <div class="menu-item-glow"></div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </nav>
    </header>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="footer">
      <div class="footer-content">
        <div class="footer-left">
          <span class="copyright">© 2024 词元</span>
          <span class="divider">|</span>
          <span class="slogan">安全 · 高效 · 便捷</span>
        </div>
        <div class="footer-right">
          <span class="version">v1.0.0</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw, computed } from "vue";
import { useRoute } from "vue-router";
import {
  HomeFilled,
  Film,
  Document,
  DataLine,
  UserFilled,
  Search,
  Brush,
  Stamp,
  Picture,
  MoreFilled,
  ArrowDown,
  Monitor,
} from "@element-plus/icons-vue";

const route = useRoute();

// 主要功能（显示在导航栏）
const mainMenuItems = ref([
  { path: "/", label: "首页", icon: markRaw(HomeFilled) },
  { path: "/video", label: "视频提取", icon: markRaw(Film) },
  { path: "/document", label: "PDF转Word", icon: markRaw(Document) },
  { path: "/word-to-pdf", label: "Word转PDF", icon: markRaw(Document) },
  { path: "/image-to-text", label: "图片文字提取", icon: markRaw(Picture) },
  { path: "/translation", label: "中英文翻译", icon: markRaw(DataLine) },
  { path: "/visualization", label: "数据可视化", icon: markRaw(DataLine) },
]);

// 更多功能（放在下拉菜单中）
const moreMenuItems = ref([
  { path: "/avatar", label: "随机头像", icon: markRaw(UserFilled) },
  { path: "/search", label: "搜索直达", icon: markRaw(Search) },
  { path: "/color", label: "取色库", icon: markRaw(Brush) },
  { path: "/signature", label: "电子签章", icon: markRaw(Stamp) },
  { path: "/performance", label: "系统监控", icon: markRaw(Monitor) },
]);

// 检查"更多"菜单是否处于激活状态
const isMoreMenuActive = computed(() => {
  return moreMenuItems.value.some((item) => route.path === item.path);
});
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2e 100%);
  overflow-x: hidden;
}

.tech-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.5;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
  animation: floatOrb 15s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.4), transparent);
  top: -250px;
  right: -150px;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(157, 0, 255, 0.3), transparent);
  bottom: 10%;
  left: -150px;
  animation-delay: -5s;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(0, 255, 136, 0.2), transparent);
  top: 40%;
  right: 5%;
  animation-delay: -10s;
}

@keyframes floatOrb {
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

/* 角落装饰 */
.corner-decoration {
  position: absolute;
  width: 60px;
  height: 60px;
  border: 2px solid rgba(0, 212, 255, 0.2);
}

.corner-decoration::before,
.corner-decoration::after {
  content: "";
  position: absolute;
  background: rgba(0, 212, 255, 0.5);
}

.corner-decoration::before {
  width: 20px;
  height: 2px;
}

.corner-decoration::after {
  width: 2px;
  height: 20px;
}

.corner-decoration.top-left {
  top: 20px;
  left: 20px;
  border-right: none;
  border-bottom: none;
}

.corner-decoration.top-left::before {
  top: 0;
  left: 0;
}
.corner-decoration.top-left::after {
  top: 0;
  left: 0;
}

.corner-decoration.top-right {
  top: 20px;
  right: 20px;
  border-left: none;
  border-bottom: none;
}

.corner-decoration.top-right::before {
  top: 0;
  right: 0;
}
.corner-decoration.top-right::after {
  top: 0;
  right: 0;
}

.corner-decoration.bottom-left {
  bottom: 20px;
  left: 20px;
  border-right: none;
  border-top: none;
}

.corner-decoration.bottom-left::before {
  bottom: 0;
  left: 0;
}
.corner-decoration.bottom-left::after {
  bottom: 0;
  left: 0;
}

.corner-decoration.bottom-right {
  bottom: 20px;
  right: 20px;
  border-left: none;
  border-top: none;
}

.corner-decoration.bottom-right::before {
  bottom: 0;
  right: 0;
}
.corner-decoration.bottom-right::after {
  bottom: 0;
  right: 0;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  height: 70px;
  background: rgba(10, 10, 30, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
}

.header-left {
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
}

/* Logo 脉冲光环设计 */
.logo-icon-container {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-core {
  position: relative;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #00d4ff, #9d00ff);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow:
    0 0 20px rgba(0, 212, 255, 0.4),
    0 0 40px rgba(157, 0, 255, 0.2);
}

.logo-char {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.logo-pulse-ring {
  position: absolute;
  width: 40px;
  height: 40px;
  border: 2px solid rgba(0, 212, 255, 0.6);
  border-radius: 12px;
  animation: pulseRing 2s ease-out infinite;
}

.logo-pulse-ring.ring-2 {
  animation-delay: 1s;
  border-color: rgba(157, 0, 255, 0.6);
}

@keyframes pulseRing {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

.logo-text-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.logo-text {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #00d4ff, #9d00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
}

.logo-subtitle {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 2px;
  font-weight: 500;
}

.nav-menu {
  display: flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.03);
  padding: 6px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-item::after {
  content: attr(data-label);
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1001;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.nav-item:hover::after {
  opacity: 1;
  visibility: visible;
}

.nav-item:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  color: #fff;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.15),
    rgba(157, 0, 255, 0.15)
  );
}

.nav-item.active .nav-indicator {
  opacity: 1;
  transform: scaleX(1);
}

.nav-icon {
  font-size: 18px;
  transition: transform 0.3s;
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

.nav-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, #00d4ff, #9d00ff);
  border-radius: 2px;
  opacity: 0;
  transition: all 0.3s;
}

.header-right {
  flex-shrink: 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 20px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #00ff88;
  border-radius: 50%;
  animation: statusPulse 2s ease-in-out infinite;
}

@keyframes statusPulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.4);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 0 4px rgba(0, 255, 136, 0);
  }
}

.status-text {
  font-size: 12px;
  color: #00ff88;
  font-weight: 500;
}

.main-content {
  position: relative;
  z-index: 10;
  padding: 110px 40px 40px;
  min-height: 100vh;
}

.footer {
  position: relative;
  z-index: 10;
  padding: 20px 40px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.copyright {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.divider {
  color: rgba(255, 255, 255, 0.2);
}

.slogan {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
}

.version {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 更多下拉菜单样式 */
.more-dropdown {
  display: flex;
  position: relative;
}

.more-item {
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.more-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 212, 255, 0.1),
    transparent
  );
  transition: left 0.6s;
  z-index: 1;
}

.more-item:hover::before {
  left: 100%;
}

.dropdown-arrow {
  font-size: 12px;
  margin-left: 4px;
  transition:
    transform 0.3s ease,
    color 0.3s ease;
  z-index: 2;
  position: relative;
}

.more-dropdown:hover .dropdown-arrow {
  transform: rotate(180deg) scale(1.1);
  color: #00d4ff;
}

/* 下拉菜单容器 */
.more-dropdown-menu {
  background: rgba(10, 10, 30, 0.98) !important;
  border: 1px solid rgba(0, 212, 255, 0.3) !important;
  border-radius: 16px !important;
  padding: 12px !important;
  min-width: 180px !important;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(0, 212, 255, 0.1),
    0 0 20px rgba(0, 212, 255, 0.05);
  backdrop-filter: blur(20px);
  animation: dropdownFadeIn 0.3s ease-out;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 下拉菜单项 */
.more-dropdown-menu .el-dropdown-item {
  position: relative;
  color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 12px !important;
  padding: 12px 18px !important;
  margin-bottom: 4px !important;
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  z-index: 1;
}

.more-dropdown-menu .el-dropdown-item:last-child {
  margin-bottom: 0 !important;
}

.more-dropdown-menu .el-dropdown-item::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.1), transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition:
    width 0.6s,
    height 0.6s;
  z-index: -1;
}

.more-dropdown-menu .el-dropdown-item:hover::before {
  width: 300px;
  height: 300px;
}

.more-dropdown-menu .el-dropdown-item:hover {
  background: rgba(0, 212, 255, 0.1) !important;
  color: #fff !important;
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.15);
}

.more-dropdown-menu .el-dropdown-item.active {
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.2),
    rgba(157, 0, 255, 0.2)
  ) !important;
  color: #fff !important;
  border: 1px solid rgba(0, 212, 255, 0.3) !important;
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.2);
}

/* 菜单项图标 */
.menu-item-icon {
  font-size: 20px !important;
  transition:
    transform 0.3s ease,
    color 0.3s ease;
  flex-shrink: 0;
}

.more-dropdown-menu .el-dropdown-item:hover .menu-item-icon {
  transform: scale(1.2) rotate(5deg);
  color: #00d4ff;
}

/* 菜单项文字 */
.menu-item-label {
  transition: color 0.3s ease;
  flex-grow: 1;
}

/* 菜单项发光效果 */
.menu-item-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 40px;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 212, 255, 0.2),
    transparent
  );
  transform: translateX(100%);
  transition: transform 0.6s ease;
  pointer-events: none;
}

.more-dropdown-menu .el-dropdown-item:hover .menu-item-glow {
  transform: translateX(-100%);
}

/* 弹窗箭头样式 */
.more-dropdown-menu .el-popper__arrow::before {
  background: rgba(10, 10, 30, 0.98) !important;
  border: 1px solid rgba(0, 212, 255, 0.3) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 点击效果 */
.more-dropdown-menu .el-dropdown-item:active {
  transform: translateX(8px) scale(0.98);
  transition: transform 0.1s;
}

/* 导航项激活状态 */
.more-item.active .dropdown-arrow {
  color: #00d4ff;
  transform: rotate(180deg);
}

.more-item.active {
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.15),
    rgba(157, 0, 255, 0.15)
  );
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
}

@media (max-width: 1200px) {
  .nav-label {
    display: none;
  }

  .nav-item {
    padding: 10px 12px;
  }

  .nav-item::after {
    display: block;
  }
}

@media (max-width: 1024px) {
  .header {
    padding: 0 20px;
  }

  .nav-item {
    padding: 10px 14px;
  }

  .nav-item::after {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 8px;
    white-space: nowrap;
  }

  .main-content {
    padding: 20px;
  }

  .header-right {
    display: none;
  }

  .corner-decoration {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 768px) {
  .logo-subtitle {
    display: none;
  }

  .footer-content {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>
