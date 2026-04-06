// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import MyLayout from "./MyLayout.vue";
import "./styles/style.scss";
import "./styles/custom.scss";

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(MyLayout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },
  enhanceApp({ app: _app, router: _router, siteData: _siteData }) {
    // ...
  },
} satisfies Theme;
