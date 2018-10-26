import Vue from 'vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import Notifications from 'vue-notification'

import App from './App.vue'
import router from './router'
import './fontawesome'
import store from './store'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.use(VueAxios, axios)

Vue.use(Notifications)
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
