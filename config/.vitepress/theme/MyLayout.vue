<script setup>
import DefaultTheme from "vitepress/theme";
import HomeHeroImage from "./components/Home/HomeHeroImage.vue";
import HomeHeroInfo from "./components/Home/HomeHeroInfo.vue";
import HomeHeroInfoAfter from "./components/Home/HomeHeroInfoAfter.vue";
import HomeHeroInfoBefore from "./components/Home/HomeHeroInfoBefore.vue";
import HomeHeroBefore from "./components/Home/HomeHeroBefore.vue";
import HomeHeroActionsAfter from "./components/Home/HomeHeroActionsAfter.vue";
import HomeHeroAfter from "./components/Home/HomeHeroAfter.vue";
import HomeFeaturesBefore from "./components/Home/HomeFeaturesBefore.vue";
import HomeFeaturesAfter from "./components/Home/HomeFeaturesAfter.vue";
import AsideTop from "./components/Doc/AsideTop.vue";
import AsideBottom from "./components/Doc/AsideBottom.vue";
import AsideAdsBefore from "./components/Doc/AsideAdsBefore.vue";
import AsideAdsAfter from "./components/Doc/AsideAdsAfter.vue";
import AsideOutlineBefore from "./components/Doc/AsideOutlineBefore.vue";
import AsideOutlineAfter from "./components/Doc/AsideOutlineAfter.vue";
import DocTop from "./components/Doc/DocTop.vue";
import DocBottom from "./components/Doc/DocBottom.vue";
import DocFooterBefore from "./components/Doc/DocFooterBefore.vue";
import DocBefore from "./components/Doc/DocBefore.vue";
import DocAfter from "./components/Doc/DocAfter.vue";
import SidebarNavBefore from "./components/Doc/SidebarNavBefore.vue";
import SidebarNavAfter from "./components/Doc/SidebarNavAfter.vue";
import PageTop from "./components/Page/PageTop.vue";
import PageBottom from "./components/Page/PageBottom.vue";
import NotFound from "./components/NotFound.vue";
import LayoutTop from "./components/Global/LayoutTop.vue";
import LayoutBottom from "./components/Global/LayoutBottom.vue";
import NavBarTitleBefore from "./components/Global/NavBarTitleBefore.vue";
import NavBarTitleAfter from "./components/Global/NavBarTitleAfter.vue";
import NavBarContentBefore from "./components/Global/NavBarContentBefore.vue";
import NavBarContentAfter from "./components/Global/NavBarContentAfter.vue";
import NavScreenContentBefore from "./components/Global/NavScreenContentBefore.vue";
import NavScreenContentAfter from "./components/Global/NavScreenContentAfter.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <!-- always -->
    <template #layout-top><LayoutTop /></template>
    <template #layout-bottom><LayoutBottom /></template>
    <template #nav-bar-title-before><NavBarTitleBefore /></template>
    <template #nav-bar-title-after><NavBarTitleAfter /></template>
    <template #nav-bar-content-before><NavBarContentBefore /></template>
    <template #nav-bar-content-after><NavBarContentAfter /></template>
    <template #nav-screen-content-before><NavScreenContentBefore /></template>
    <template #nav-screen-content-after><NavScreenContentAfter /></template>

    <!-- in case of 404 -->
    <template #not-found><NotFound /></template>

    <!-- when layout: 'page' -->
    <template #page-top><PageTop /></template>
    <template #page-bottom><PageBottom /></template>

    <!-- when layout: 'home' -->
    <template #home-hero-before><HomeHeroBefore /></template>
    <template #home-hero-info-before><HomeHeroInfoBefore /></template>
    <template #home-hero-info><HomeHeroInfo /></template>
    <template #home-hero-info-after><HomeHeroInfoAfter /></template>
    <template #home-hero-actions-after><HomeHeroActionsAfter /></template>
    <template #home-hero-image><HomeHeroImage /></template>
    <template #home-hero-after><HomeHeroAfter /></template>
    <template #home-features-before><HomeFeaturesBefore /></template>
    <template #home-features-after><HomeFeaturesAfter /></template>

    <!-- when layout: 'doc' (default) -->
    <template #doc-top><DocTop /></template>
    <template #doc-bottom><DocBottom /></template>
    <template #doc-footer-before><DocFooterBefore /></template>
    <template #doc-before><DocBefore /></template>
    <template #doc-after><DocAfter /></template>
    <template #sidebar-nav-before><SidebarNavBefore /></template>
    <template #sidebar-nav-after><SidebarNavAfter /></template>
    <template #aside-top><AsideTop /></template>
    <template #aside-bottom><AsideBottom /></template>
    <template #aside-outline-before><AsideOutlineBefore /></template>
    <template #aside-outline-after><AsideOutlineAfter /></template>
    <template #aside-ads-before><AsideAdsBefore /></template>
    <template #aside-ads-after><AsideAdsAfter /></template>
  </Layout>
</template>
