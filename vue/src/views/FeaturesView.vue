<template>
    <div class="features">
        <button @click="addNotify()" type="button" class="btn btn-primary" id="liveToastBtn">Show live
            toast
        </button>
    </div>
</template>

<script setup>
import {inject} from "vue";

const addNotify = inject("addNotify");

</script>

<style scoped>
.features {
    text-align: center;
    color: #2c3e50;
}
</style>
