<template>
  <div v-if="isHome" class="layout-bottom">
    <template v-for="(item, idx) in linkList" :key="idx">
      <a class="link" :href="item.url" :title="item.tip" target="_blank" rel="noreferrer noopener">
        {{ item.label }}
      </a>
      <span v-if="idx < linkList.length - 1" class="separator">|</span>
    </template>
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
    label: "网站地图",
    tip: "网站地图",
    url: "https://docs.verysites.com/sitemap.xml",
  },
  {
    label: "官网首页",
    tip: "官网首页",
    url: "https://www.verysites.com/",
  },
  {
    label: "关于我们",
    tip: "关于我们",
    url: "https://www.verysites.com/about",
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
  .separator {
    color: var(--vp-c-text-2);
    margin: 0 4px;
  }
}
</style>
