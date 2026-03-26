<template>
  <div class="home-hero-info">
    <h1 class="title">{{ title }}</h1>
  </div>
</template>

<script lang="ts" setup>
import { useData } from "vitepress";
import { computed } from "vue";
const { page } = useData();

const title = computed(() => {
  return page.value.frontmatter.hero?.name || "";
});
</script>

<style lang="scss" scoped>
.home-hero-info {
  .title {
    font-size: 46px;
    line-height: 1.5;
    font-weight: 400;
    margin-top: 15px;
    @media screen and (max-width: 570px) {
      font-size: 36px;
    }
    @media screen and (max-width: 450px) {
      font-size: 32px;
    }
    @media screen and (max-width: 450px) {
      font-size: 26px;
    }
    @media screen and (max-width: 340px) {
      font-size: 22px;
      font-weight: bold;
    }
  }
}
</style>
