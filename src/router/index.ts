import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Layout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue')
        },
        {
          path: 'video',
          name: 'video',
          component: () => import(/* webpackChunkName: "video-extract" */ '../views/VideoExtractView.vue')
        },
        {
          path: 'document',
          name: 'document',
          component: () => import(/* webpackChunkName: "document-convert" */ '../views/DocumentConvertView.vue')
        },
        {
          path: 'visualization',
          name: 'visualization',
          component: () => import(/* webpackChunkName: "visualization" */ '../views/VisualizationView.vue')
        },
        {
          path: 'avatar',
          name: 'avatar',
          component: () => import(/* webpackChunkName: "random-avatar" */ '../views/RandomAvatarView.vue')
        },
        {
          path: 'search',
          name: 'search',
          component: () => import(/* webpackChunkName: "search-direct" */ '../views/SearchDirectView.vue')
        },
        {
          path: 'color',
          name: 'color',
          component: () => import(/* webpackChunkName: "color-picker" */ '../views/ColorPickerView.vue')
        },
        {
          path: 'signature',
          name: 'signature',
          component: () => import(/* webpackChunkName: "electronic-signature" */ '../views/ElectronicSignatureView.vue')
        },
        {
          path: 'word-to-pdf',
          name: 'word-to-pdf',
          component: () => import(/* webpackChunkName: "word-to-pdf" */ '../views/WordToPdfView.vue')
        },
        {
          path: 'image-to-text',
          name: 'image-to-text',
          component: () => import(/* webpackChunkName: "image-to-text" */ '../views/ImageToText.vue')
        },
        {
          path: 'translation',
          name: 'translation',
          component: () => import(/* webpackChunkName: "translation" */ '../views/TranslationView.vue')
        },
        {
          path: 'performance',
          name: 'performance',
          component: () => import(/* webpackChunkName: "performance" */ '../views/PerformanceMonitorView.vue')
        }
      ]
    }
  ]
})

// 预加载常用路由组件
router.beforeEach((to, from, next) => {
  // 预加载常用的路由组件
  const preloadRoutes = ['video', 'document', 'translation', 'word-to-pdf'];
  
  if (to.path === '/') {
    // 当用户访问首页时，预加载常用组件
    preloadRoutes.forEach(route => {
      router.resolve({ path: `/${route}` });
    });
  }
  
  next();
});

export default router
