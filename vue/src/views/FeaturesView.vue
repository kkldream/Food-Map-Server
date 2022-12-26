<template>
    <div class="features">
        <button @click="addNotify()" type="button" class="btn btn-primary" id="liveToastBtn">Show live
            toast
        </button>
        <button @click="show()" type="button" class="btn btn-primary">Show</button>
        <button @click="hide()" type="button" class="btn btn-primary">Hide</button>
        <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ...
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button @click="hide()" type="button" class="btn btn-primary">Save changes</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {inject, onMounted} from "vue";
import {Modal} from "bootstrap"

const addNotify = inject("addNotify");
let exampleModal;
let myModal;
onMounted(() => {
    exampleModal = document.getElementById('exampleModal');
    myModal = new Modal(exampleModal);
    exampleModal = document.getElementById('exampleModal');
    myModal = new Modal(exampleModal);
})

function show() {
    console.log("show")
    myModal.show();
    setTimeout(() => {
        console.log("hide")
        // var myModals = new Modal(document.getElementById('exampleModal'));
        hide();
    }, 3000)
}

function hide() {
    // const myModal = new Modal(document.getElementById('exampleModal'));
    myModal.hide();
}

</script>

<style scoped>
.features {
    text-align: center;
    color: #2c3e50;
}
</style>
