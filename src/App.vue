<template>
  <div class="app">
    <Editor v-model="state" :formData="formData"></Editor>
  </div>
</template>

<script>
import data from "./data.json";
import { ref } from "@vue/reactivity";
import Editor from "./packages/editor.jsx";
import{registerConfig as config} from './utils/editor-config.jsx'
import { provide } from 'vue';


export default {
  components: {
    Editor,
  },
  setup() {
    const state = ref(data);//state.value
    provide('config',config)//将组件的配置直接传入
    const formData =ref({
      username:'jkjk',
      password:135
        })
    return {
      state,
      formData
    };
  },
};
</script>

<style lang="scss">
.app {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
}
</style>
