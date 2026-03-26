<template>
  <div class="doc-before"></div>
</template>

<script lang="ts" setup>
</script>

<style lang="scss" scoped>
.doc-before {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  user-select: none;
  cursor: pointer;
  width: 100%;
  height: auto;
  padding: 15px;
  background-color: var(--vp-c-bg);
  text-align: center;
  font-weight: normal;
  white-space: normal;
  word-break: break-all;
  &:hover {
    text-decoration: underline;
  }
  :deep(.single-text) {
    color: #ff0000;
    font-weight: normal;
  }
}
</style>
