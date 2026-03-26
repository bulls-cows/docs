<template>
  <span v-for="(t, idx) in textList" :key="idx" class="single-text">{{
    t
  }}</span>
</template>

<script lang="ts" setup>
interface IProps {
  text: string;
}
const props = defineProps<IProps>();

const textList: string[] = props.text.split("");
</script>
