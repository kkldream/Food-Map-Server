<template>
    <div class="modal fade" id="staticBackdrop" data-bs-backdrop="true" data-bs-keyboard="false" tabindex="-1"
         aria-labelledby="staticBackdropLabel" aria-hidden="true" data-bs-show="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="staticBackdropLabel">{{
                            showMode === "login" ? "Login" : "Sign-up"
                        }}</h1>
                    <button @click="actionView('hide')" type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div v-if="showMode === 'login'">
                        <div class="mb-3">
                            <label for="loginInputUsername" class="form-label">Username</label>
                            <input v-model="loginInputUsernameText" type="text" class="form-control"
                                   id="loginInputUsername" aria-describedby="emailHelp">
                        </div>
                        <div class="mb-3">
                            <label for="loginInputPassword" class="form-label">Password</label>
                            <input v-model="loginInputPasswordText" type="password" id="loginInputPassword"
                                   class="form-control"
                                   aria-describedby="passwordHelpBlock">
                        </div>
                        <div class="mb-0 form-check">
                            <input v-model="loginInputCheck" type="checkbox" class="form-check-input"
                                   id="loginInputCheck">
                            <label class="form-check-label" for="loginInputCheck">Check me out</label>
                        </div>
                    </div>
                    <div v-if="showMode === 'signup'">
                        <div class="mb-3">
                            <label for="signupInputUsername" class="form-label">Username</label>
                            <input v-model="loginInputUsernameText" type="text" class="form-control"
                                   id="signupInputUsername" aria-describedby="emailHelp">
                        </div>
                        <div class="mb-3">
                            <label for="signupInputPassword" class="form-label">Password</label>
                            <input v-model="loginInputPasswordText" type="password" id="signupInputPassword"
                                   class="form-control"
                                   aria-describedby="passwordHelpBlock">
                        </div>
                        <div class="mb-3">
                            <label for="signupInputPasswordAgain" class="form-label">Password again</label>
                            <input v-model="loginInputPasswordAgainText" type="password" id="signupInputPasswordAgain"
                                   class="form-control"
                                   aria-describedby="passwordHelpBlock">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button @click="loginEvent('clear')" type="button" class="btn btn-secondary">Clear</button>
                    <button v-if="showMode === 'login'" @click="loginEvent('login')" type="button"
                            class="btn btn-primary">Login
                    </button>
                    <button v-if="showMode === 'signup'" @click="loginEvent('signup')" type="button"
                            class="btn btn-primary">Sign-up
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {defineExpose, inject, onMounted, ref} from "vue";
import {Modal} from 'bootstrap'
import {callLoginApi} from "@/service/ApiService";

defineExpose({
    actionView
})

const showMode = ref("");
const loginInputUsernameText = ref("");
const loginInputPasswordText = ref("");
const loginInputPasswordAgainText = ref("");
const loginInputCheck = ref(false);

const addNotify = inject("addNotify");
let myModal;

onMounted(() => {
    let staticBackdrop = document.getElementById('staticBackdrop');
    myModal = new Modal(staticBackdrop);
    staticBackdrop.addEventListener('hidden.bs.modal', (event) => {
        loginInputPasswordAgainText.value = "";
    })
})

async function loginEvent(event) {
    switch (event) {
        case "clear":
            loginInputUsernameText.value = "";
            loginInputPasswordText.value = "";
            loginInputPasswordAgainText.value = "";
            loginInputCheck.value = false;
            break;
        case "login":
            if (loginInputUsernameText.value === "" || loginInputPasswordText.value === "") {
                addNotify("輸入資料有誤", "danger");
                break;
            }
            try {
                let res = await callLoginApi(
                    loginInputUsernameText.value,
                    loginInputPasswordText.value,
                    "web"
                );
                switch (res.status) {
                    case 0:
                        addNotify("登入成功", "success");
                        actionView("hide");
                        break;
                    case 1:
                        addNotify("帳號密碼錯誤", "danger");
                        break;
                    case 3:
                        addNotify("帳號不存在", "danger");
                        break;
                }
            } catch (err) {
                console.error(err);
                addNotify("異常錯誤", "danger");
            }
            break;
        case "signup":
            addNotify("註冊功能未實作", "warning");
            break;
    }
}

function actionView(mode) {
    switch (mode) {
        case "hide":
            myModal.hide();
            break;
        case "login":
            showMode.value = "login"
            myModal.show();
            break;
        case "signup":
            showMode.value = "signup"
            myModal.show();
            break;
    }
}
</script>
