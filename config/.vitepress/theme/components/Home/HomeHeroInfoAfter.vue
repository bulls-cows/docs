<template>
  <div class="home-hero-info-after">
    <div v-for="(tagline, idx) in taglines" :key="idx" class="tag-line">
      {{ tagline }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useData } from "vitepress";
import { computed } from "vue";
const { page } = useData();

const taglines = computed<string[]>(() => {
  return (page.value.frontmatter.hero?.tagline || "").split("\n");
});
</script>

<style lang="scss" scoped>
.home-hero-info-after {
  margin-top: 20px;
  .tag-line {
    font-size: 16px;
    line-height: 2;
  }
}
</style>
