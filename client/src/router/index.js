import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isTokenExpired } from '@/api/index'

// 权限映射（与 shared/permissions.json 保持同步）
// 修改权限时需同时更新 server/middleware/auth.js 和 shared/permissions.json

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
      { path: 'report/fill/:id?', name: 'ReportFill', component: () => import('@/views/ReportFillView.vue'), meta: { perm: 'fill' } },
      { path: 'report/preview/:id', name: 'ReportPreview', component: () => import('@/views/ReportPreviewView.vue'), meta: { perm: 'generate' } },
      { path: 'report/detail/:id', name: 'ReportDetail', component: () => import('@/views/ReportDetailView.vue'), meta: { perm: 'query' } },
      { path: 'history', name: 'History', component: () => import('@/views/HistoryListView.vue'), meta: { perm: 'query' } },
      { path: 'admin/users', name: 'UserManage', component: () => import('@/views/UserManageView.vue'), meta: { perm: 'manage_user' } },
      { path: 'admin/logs', name: 'Logs', component: () => import('@/views/LogView.vue'), meta: { perm: 'view_log' } },
      { path: 'admin/templates', name: 'Templates', component: () => import('@/views/TemplateConfigView.vue'), meta: { perm: 'config' } },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 权限映射（与 shared/permissions.json 保持同步）
// 修改权限时需同时更新 server/middleware/auth.js 和 shared/permissions.json
const PERMISSIONS = {
  admin: ['fill', 'generate', 'export', 'query', 'manage_user', 'view_log', 'config'],
  manager: ['fill', 'generate', 'export', 'query'],
  viewer: ['export', 'query']
}

router.beforeEach((to, from, next) => {
  if (to.meta.public) return next()

  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) {
    return next('/login')
  }

  // 进入受保护页面前先做客户端 token 过期校验，
  // 避免带着过期 token 先渲染再闪跳到登录页
  const storedToken = localStorage.getItem('token')
  if (storedToken && isTokenExpired(storedToken)) {
    authStore.clearAuth()
    return next('/login')
  }

  // 权限检查
  if (to.meta.perm) {
    const userPerms = PERMISSIONS[authStore.userRole] || []
    if (!userPerms.includes(to.meta.perm)) {
      return next('/')
    }
  }

  next()
})

export default router
