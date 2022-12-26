<template>
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
        <div v-for="(item, key) in toastList" :key="key" :id="key"
             class="toast align-items-center text-bg-primary border-0" role="alert" aria-live="assertive"
             aria-atomic="true" :class="item.backgroundColor">
            <div class="d-flex">
                <div class="toast-body">{{ item.content }}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
                        aria-label="Close"></button>
            </div>
        </div>
    </div>
</template>

<script setup>
import {defineExpose, onUpdated, ref} from "vue";
import {Toast} from "bootstrap";
import {generateUid} from "@/service/Utile";

defineExpose({addNotify});
const toastList = ref({});

function addNotify(content, backgroundColor) {
    let uid = generateUid();
    toastList.value[uid] = {
        content: content,
        backgroundColor: backgroundColor,
        isShow: false
    };
    const toastLiveExample = document.getElementById(uid)
    if (toastLiveExample) {
        const toast = new Toast(toastLiveExample);
        toast.show();
    }
}

onUpdated(() => {
    console.log("onUpdated");
    for (let listKey in toastList.value) {
        const toastLiveExample = document.getElementById(listKey)
        const toast = new Toast(toastLiveExample, {autohide: true, delay: 3000});
        if (toastLiveExample) {
            if (toastList.value[listKey].isShow === false) {
                toastList.value[listKey].isShow = true;
                toast.show();
                window.setTimeout(() => {
                    delete toastList.value[listKey];
                }, 4000);
            }
        }
    }
});
</script>

<style scoped>
.features {
    text-align: center;
    color: #2c3e50;
}
</style>
