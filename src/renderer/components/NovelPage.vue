<template>
  <div class="novel" v-if="novel !== null" @scroll="handleScroll">
    <div class="novel-header" ref="novelHeader" :style="websiteModel.website.style.header">
      <router-link :to="{ name: 'website-page', params: { website: novel.website }}" :style="websiteModel.website.style.header" class="back">
        <font-awesome-icon icon="arrow-left" size="lg" />
      </router-link>
      <img :src="novel.cover" :alt="novel.title" :style="websiteModel.website.style.iconHeader" />
      <h1>{{novel.title}}</h1>
    </div>
    <div class="synopsis" v-html="novel.description">
    </div>
    <div class="chapters-list">
      <chapter-list-item
      v-for="chapter in chapters"
      :key="chapter.title"
      :chapter="chapter"
      :novel="novel"
      @selected="onSelected" />
    </div>
  </div>
  <facebook-loader v-else />
</template>

<script lang="ts">
import Vue from 'vue'
import { FacebookLoader } from 'vue-content-loader'
import ChapterListItem from './NovelPage/ChapterListItem.vue'
import { Novel, Chapter } from '../lib/Database'
import Website from '../lib/Website'
import websites from '../lib/websites'

type NovelPageData = {
  novel: Novel | null
  chapters: Chapter[]
  websiteModel: Website | null
}

export default Vue.extend({
  name: 'NovelPage',
  components: {
    ChapterListItem,
    FacebookLoader
  },
  data (): NovelPageData {
    const websiteLoader = websites[this.$route.params.website]
    return {
      novel: null,
      chapters: [],
      websiteModel: (websiteLoader !== undefined) ? new Website({ website: websiteLoader }) : null
    }
  },
  methods: {
    onSelected (chapter: Chapter) {
      if (chapter !== null && chapter.id !== undefined && this.websiteModel !== null) { this.$router.push({ name: 'reader-page', params: { novel: chapter.novel.toString(), chapter: chapter.id.toString(), website: this.websiteModel.website.slug } }) }
    },
    handleScroll (e: UIEvent) {
      const novelHeader = this.$refs['novelHeader'] as HTMLDivElement
      if (novelHeader) {
        const cover = novelHeader.querySelector('img') as HTMLImageElement
        const container = e.target as HTMLDivElement
        if (cover && container) {
          cover.classList.toggle('sticky', container.scrollTop > 100)
        }
      }
    }
  },
  created () {
    if (this.websiteModel !== null) {
      this.websiteModel.loadNovel(parseInt(this.$route.params.novel))
        .then(novelResponse => {
          this.novel = novelResponse.novel
          this.chapters = novelResponse.chapters
          return novelResponse
        }).catch(console.log.bind(console))
    }
  }
})
</script>

<style lang="scss" scoped>
.novel {
  margin: auto;
  height: 100%;
  overflow: auto;
  .novel-header {
    display: flex;
    flex-direction: row;
    margin-top: 120px;
    background: white;
    height: 45px;
    position: sticky;
    top: 0px;
    z-index: 3;
    .back {
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
  .synopsis {
    background-color: var(--blackbg);
    padding: 1em 2em;
    color: white;
    font-style: italic;
    font-size: 18px;
  }
  .chapters-list {
    background-color: var(--blackbg);
  }
}
</style>
