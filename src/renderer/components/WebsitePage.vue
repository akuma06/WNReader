<template>
  <div class="website" v-if="website !== null" @scroll="handleScroll">
    <div class="website-img" ref="websiteHeader" :style="website.style.header">
      <router-link :to="{ name: 'dashboard-page' }" class="home" :style="website.style.header">
        <font-awesome-icon icon="home" size="lg" />
      </router-link>
      <img :src="website.icon" :alt="website.name" :style="website.style.iconHeader" />
      <h1>{{ website.name }}</h1>
    </div>
    <div class="novels-list">
      <novel-list-item
      v-for="novel in novels"
      :key="novel.title"
      :novel="novel"
      @selected="onSelected"></novel-list-item>
    </div>
  </div>
  <facebook-loader v-else></facebook-loader>
</template>

<script lang="ts">
import Vue from 'vue'
import { FacebookLoader } from 'vue-content-loader'
import websites from '../lib/websites'
import Website, { WebsiteLoader } from '../lib/Website'
import { Novel } from '../lib/Database'
import NovelListItem from './WebsitePage/NovelListItem.vue'

type WebsiteData = {
  websiteModel: Website | null
  novels: Novel[]
}
export default Vue.extend({
  name: 'WebsitePage',
  components: {
    NovelListItem,
    FacebookLoader
  },
  data (): WebsiteData {
    const websiteLoader = websites[this.$route.params.website]
    return {
      websiteModel: (websiteLoader !== undefined) ? new Website({ website: websiteLoader }) : null,
      novels: []
    }
  },
  methods: {
    onSelected (novel: Novel) {
      if (novel !== null && novel.id !== undefined) this.$router.push({name: 'novel-page', params: { novel: novel.id.toString(), website: novel.website }})
    },
    handleScroll (e: UIEvent) {
      const websiteHeader = this.$refs['websiteHeader'] as HTMLDivElement
      if (websiteHeader) {
        const cover = websiteHeader.querySelector('img') as HTMLImageElement
        const container = e.target as HTMLDivElement
        if (cover && container) {
          cover.classList.toggle('sticky', container.scrollTop > 100)
        }
      }
    }
  },
  computed: {
    novelList (): Novel[] {
      return this.novels
    },
    website (): WebsiteLoader | null {
      if (this.websiteModel !== null) {
        return this.websiteModel.website
      }
      return null
    }
  },
  created () {
    if (this.websiteModel !== null) {
      this.websiteModel.loadNovels().then(data => {
        this.novels = data
        return data
      }).catch(console.log.bind(console))
    }
  }
})
</script>

<style lang="scss" scoped>
.website {
  height: 100%;
  overflow: auto;
  .website-img {
    display: flex;
    flex-direction: row;
    margin-top: 120px;
    background: white;
    height: 45px;
    position: sticky;
    top: 0px;
    z-index: 3;
    .home {
      color: black;
      margin: 0 15px;
      svg {
        height: 45px;
        widows: 45px;
      }
    }
    img {
      height: 150px;
      border: 5px solid white;
      position: relative;
      top: -115px;
      transition: height .2s, top .2s, width .2s, border-width .2s, border-radius .2s;
      &.sticky {
        height: 45px;
        border-radius: 2em;
        top: 0px;
        width: 45px;
        border-width: 0;
      }
    }
    h1 {
      padding: 5px;
      font-size: 25px;
      margin: 0;
      line-height: 35px;
      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif
    }
  }
  .novels-list {
    display: flex;
    flex-direction: row;
    background-color: var(--blackbg);
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
