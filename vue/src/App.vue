<template>
  <HeaderBar :viewTime="createTime"/>
  <LoginView/>
  <router-view/>
</template>

<script setup>
import HeaderBar from "@/components/HeaderBar";
import LoginView from "@/views/LoginView";
import {Toast} from 'bootstrap'
import {useRoute} from "vue-router";
import {onMounted, onUpdated, ref} from "vue";

const createTime = ref(0);
window.setInterval(() => {
  createTime.value += 1;
}, 1000);
console.log('setup');
console.log(useRoute());
onMounted(() => {
  const toastTrigger = document.getElementById('liveToastBtn')
  const toastLiveExample = document.getElementById('liveToast')
  if (toastTrigger) {
    toastTrigger.addEventListener('click', () => {
      const toast = new Toast(toastLiveExample)
      toast.show()
    })
  }
  // console.log('Mounted');
  // console.log(useRouter().currentRoute._value.name);
  // console.log(useRoute().path);
  // $(this.$refs.vuemodal).on("hidden.bs.modal",function () {
  //   $('#myInput').trigger('focus')
  // })
});
onUpdated(() => {
  // console.log('Updated');
  // console.log(location.pathname)
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
