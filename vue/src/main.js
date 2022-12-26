import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// import BootstrapVue3 from 'bootstrap-vue-3'
// import BootstrapVue from 'bootstrap-vue'
// import 'bootstrap/dist/css/bootstrap.css'
// import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'
// import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import "bootstrap"

const app = createApp(App)
// app.use(BootstrapVue)
// app.use(BootstrapVue3)
app.use(router)
app.mount('#app')
