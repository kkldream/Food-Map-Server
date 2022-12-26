<template>
  <div class="modal fade" id="staticBackdrop" data-bs-backdrop="true" data-bs-keyboard="false" tabindex="-1"
       aria-labelledby="staticBackdropLabel" aria-hidden="true" data-bs-show="true">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id="staticBackdropLabel">{{ title }}</h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="loginInputUsername" class="form-label">Username</label>
            <input v-model="loginInputUsernameText" type="text" class="form-control" id="loginInputUsername"
                   aria-describedby="emailHelp">
          </div>
          <div class="mb-3">
            <label for="loginInputPassword" class="form-label">Password</label>
            <input v-model="loginInputPasswordText" type="password" id="loginInputPassword" class="form-control"
                   aria-describedby="passwordHelpBlock">
          </div>
          <div v-if="showMode === 'signup'" class="mb-3">
            <label for="loginInputPasswordAgain" class="form-label">Password again</label>
            <input v-model="loginInputPasswordAgainText" type="password" id="loginInputPasswordAgain"
                   class="form-control"
                   aria-describedby="passwordHelpBlock">
          </div>
        </div>
        <div class="modal-footer">
          <span class="text-center text-danger me-auto">{{ loginInputText }}</span>
          <button @click="loginEvent('clear')" type="button" class="btn btn-secondary">Clear</button>
          <button v-if="showMode === 'login'" @click="loginEvent('login')" type="button" class="btn btn-primary">Login
          </button>
          <button v-if="showMode === 'signup'" @click="loginEvent('signup')" type="button" class="btn btn-primary">
            Sign-up
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {defineEmits, defineProps, onMounted, ref, toRefs, watch} from "vue";
import {Modal} from 'bootstrap'
import axios from 'axios';

const emit = defineEmits(['eventListener'])
const props = defineProps({
  showMode: String,
});
let {showMode} = toRefs(props);
const title = ref("");
const loginInputText = ref("");
const loginInputUsernameText = ref("");
const loginInputPasswordText = ref("");
const loginInputPasswordAgainText = ref("");

function loginEvent(event) {
  console.log(document.cookie)
  switch (event) {
    case "clear":
      loginInputUsernameText.value = "";
      loginInputPasswordText.value = "";
      loginInputPasswordAgainText.value = "";
      loginInputText.value = "";
      break;
    case "login": {
      let session_id ="asdasdasda"
      let config = {
        method: 'post',
        url: 'http://kkhomeserver.ddns.net:33000/api/user/login',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "username": loginInputUsernameText.value,
          "password": loginInputPasswordText.value,
          "deviceId": "web"
        }
      };
      axios(config)
          .then((response) => {
            loginInputText.value = "登入成功";
            console.log(JSON.stringify(response.data));
          })
          .catch((error) => {
            loginInputText.value = "登入失敗";
            console.log(error);
          });
      break;
    }
    case "signup":
      if (loginInputUsernameText.value !== "root" || loginInputPasswordText.value !== "aaa123") {
        loginInputText.value = "註冊失敗"
      }
      break;
  }
}

onMounted(() => {
  const myModal = document.getElementById("staticBackdrop");
  myModal.addEventListener('show.bs.modal', () => {
    emit('eventListener', "show");
  });
  // myModal.addEventListener('shown.bs.modal', () => {
  // });
  // myModal.addEventListener('hide.bs.modal', () => {
  // });
  myModal.addEventListener('hidden.bs.modal', () => {
    emit('eventListener', "hide");
  });
});

watch(showMode, (newValue, oldValue) => {
  console.log(`Client: ${newValue}`)
  const myModal = new Modal(document.getElementById("staticBackdrop"), {});
  switch (newValue) {
    case "hide":
      // myModal.hide();
      loginInputText.value = ""
      break;
    case "login":
      title.value = "Login";
      myModal.show();
      break;
    case "signup":
      title.value = "Sign-up";
      myModal.show();
      break;
  }
});
</script>
