import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'dashboard-page',
      component: require('@/components/DashboardPage').default
    },
    {
      path: '/website',
      name: 'website-page',
      component: require('@/components/WebsitePage').default
    },
    {
      path: '/novel',
      name: 'novel-page',
      component: require('@/components/NovelPage').default
    },
    {
      path: '/reader',
      name: 'reader-page',
      component: require('@/components/ReaderPage').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
