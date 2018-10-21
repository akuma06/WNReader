import Vue from 'vue'
import axios from 'axios'
import VueAxios from 'vue-axios'

import App from './App.vue'
import router from './router'
import './fontawesome'
import store from './store'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.use(VueAxios, axios)
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
