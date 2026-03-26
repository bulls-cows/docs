<template>
  <div class="home-hero-image">
    <img class="img" :src="heroImageSrc" :alt="heroImageAlt" />
  </div>
</template>

<script setup lang="ts">
import { useData } from "vitepress";
import { computed } from "vue";
const { page } = useData();

const heroImageSrc = computed(() => {
  return page.value.frontmatter.hero?.image?.src || "";
});

const heroImageAlt = computed(() => {
  return page.value.frontmatter.hero?.image?.alt || "";
});
</script>

<style lang="scss" scoped>
.home-hero-image {
  position: relative;
  z-index: 0;
  .img {
    width: 260px;
    height: auto;
  }
}
</style>
