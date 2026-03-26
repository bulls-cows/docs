<template>
  <div class="home-hero-info-before">
    <h2 class="title">{{ text }}</h2>
  </div>
</template>

<script lang="ts" setup>
import { useData } from "vitepress";
import { computed } from "vue";
const { page } = useData();

const text = computed(() => {
  return page.value.frontmatter.hero?.text || "";
});
</script>

<style lang="scss" scoped>
.home-hero-info-before {
  .title {
    display: block;
    font-size: 16px;
    opacity: 0.8;
  }
}
</style>
