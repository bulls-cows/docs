<template>
  <div v-if="isHome" class="layout-bottom">
    <a
      v-for="(item, idx) in linkList"
      :key="idx"
      class="link"
      :href="item.url"
      :title="item.tip"
      target="_blank"
      rel="noreferrer noopener"
    >
      {{ item.label }}
    </a>
  </div>
</template>

<script lang="ts" setup>
import { useData } from "vitepress";
import { computed } from "vue";
const { page } = useData();

const isHome = computed(() => {
  return page.value.frontmatter.layout === "home";
});

interface ILink {
  url: string;
  label: string;
  tip: string;
}
const linkList: ILink[] = [
  {
    label: "sitemap",
    tip: "牛气腾腾的网站地图",
    url: "https://docs.verysites.com/sitemap.xml",
  },
];
</script>

<style lang="scss" scoped>
.layout-bottom {
  position: relative;
  z-index: calc(var(--vp-z-index-footer) + 1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  padding-bottom: 32px;
  margin-top: -32px;
  .link {
    white-space: nowrap;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
