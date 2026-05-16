import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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

// 路由守卫
router.beforeEach((to, from, next) => {
  if (to.meta.public) return next()

  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) {
    return next('/login')
  }

  // 权限检查
  if (to.meta.perm) {
    const PERMISSIONS = {
      admin: ['fill', 'generate', 'export', 'query', 'manage_user', 'view_log', 'config'],
      manager: ['fill', 'generate', 'export', 'query'],
      viewer: ['export', 'query']
    }
    const userPerms = PERMISSIONS[authStore.userRole] || []
    if (!userPerms.includes(to.meta.perm)) {
      return next('/')
    }
  }

  next()
})

export default router
