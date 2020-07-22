import * as firebase from 'firebase'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import VeeValidate from 'vee-validate';
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { store } from './store' // automatically find ./store/index


Vue.use(VeeValidate);
// Install BootstrapVue
Vue.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin)
Vue.config.productionTip = false


// Vue.use(VeeValidate)


new Vue({
  router,
  store,
  vuetify,
  render: function (h) { return h(App) },
  created(){
    firebase.initializeApp({
      apiKey: 'AIzaSyCP9jwDxfUZFewPpqNTB0qEAJx6rVQayS0',
      authDomain: 'uofthub.firebaseapp.com',
      databaseURL: 'https://uofthub.firebaseio.com',
      projectId: 'uofthub',
      storageBucket: 'uofthub.appspot.com'
    })
  }
}).$mount('#app')
