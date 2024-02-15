import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/tailwind.css'
import { Authentication } from './api/Auth'

console.log("voip-phonebook frontend.")
console.log("(c) 2024 Cameron Fleming")

export const auth = new Authentication();

const app = createApp(App)

app.use(router)

router.isReady().then(() => {
  app.mount('#app')
});
