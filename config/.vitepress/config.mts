import { defineConfig } from "vitepress";

const base = ''

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "..\\docs",
  cacheDir: "..\\node_modules\\.cache",
  outDir: "..\\dist",
  lastUpdated: true,
  vite: {
    assetsInclude: ["**/*.awebp"],
    server: {
      strictPort: false,
      host: "0.0.0.0",
      open: true,
    },
    build: {
      emptyOutDir: true,
    },
    publicDir: "..\\public",
  },
  base: `${base}/`,
  title: "牛气腾腾",
  description: "与热爱不期而遇",
  lang: "zh-CN",
  head: [["link", { rel: "icon", href: `${base}/earth.svg` }]],
  markdown: {
    lineNumbers: true,
    math: true,
    toc: { level: [2, 3, 4, 5] },
    languageAlias: {
      mysql: "sql",
      svg: "html",
    },
  },
  sitemap: {
    hostname: `https://docs.verysites.com`,
    lastmodDateOnly: true,
    transformItems: (items) => {
      items.forEach((item) => {
        // 首页
        if (item.url === "") {
          item.changefreq = "weekly";
          item.priority = 1;
          return;
        }
        // 目录页
        if (item.url.endsWith("/")) {
          item.changefreq = "monthly";
          item.priority = 0.8;
          return;
        }
        // 文章页
        if (item.url.endsWith(".html")) {
          item.changefreq = "monthly";
          item.priority = 0.7;
          return;
        }
        // 其他页面
        item.changefreq = "monthly";
        item.priority = 0.5;
      });
      return items;
    },
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: `${base}/logo.svg`,
    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索",
            buttonAriaLabel: "搜索",
          },
          modal: {
            displayDetails: "显示详细列表",
            resetButtonTitle: "重置搜索",
            backButtonTitle: "关闭搜索",
            noResultsText: "没有结果",
            footer: {
              selectText: "选择",
              selectKeyAriaLabel: "输入",
              navigateText: "导航",
              navigateUpKeyAriaLabel: "上箭头",
              navigateDownKeyAriaLabel: "下箭头",
              closeText: "关闭",
              closeKeyAriaLabel: "esc",
            },
          },
        },
      },
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ],

    footer: {
      message: "天上的神明与星辰，人间的艺术和真纯，我们所敬畏和热爱的，莫过于此。",
      copyright: `Copyright © 2009-${new Date().getFullYear()} Yakima Teng. All rights reserved.`,
    },

    // 文章翻页
    docFooter: {
      prev: "上一篇",
      next: "下一篇",
    },

    // 移动端 - 外观
    darkModeSwitchLabel: "外观",
    darkModeSwitchTitle: "切换到暗黑模式",
    lightModeSwitchTitle: "切换到亮色模式",

    // 移动端 - 返回顶部
    returnToTopLabel: "返回顶部",

    // 移动端 - menu
    sidebarMenuLabel: "菜单",

    lastUpdated: {
      text: "最近更新时间",
    },

    outline: {
      label: "目录",
      level: [2, 3],
    },

    externalLinkIcon: true,
  },
});
