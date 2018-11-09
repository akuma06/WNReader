import Vue from 'vue'
import Router from 'vue-router'
import Meta from 'vue-meta'

Vue.use(Router)
Vue.use(Meta)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'dashboard-page',
      component: require('@/components/DashboardPage').default
    },
    {
      path: '/website/:website',
      name: 'website-page',
      component: require('@/components/WebsitePage').default
    },
    {
      path: '/novel/:website/:novel',
      name: 'novel-page',
      component: require('@/components/NovelPage').default
    },
    {
      path: '/reader/:website/:novel/:chapter',
      name: 'reader-page',
      component: require('@/components/ReaderPage').default
    },
    {
      path: '/settings',
      name: 'settings-page',
      component: require('@/components/SettingsPage').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
