<template>
  <div class="novel" v-if="novel !== null" @scroll="handleScroll">
    <div class="novel-header" ref="novelHeader" :style="websiteModel.website.style.header">
      <div class="left">
        <router-link :to="{ name: 'website-page', params: { website: novel.website }}" :style="websiteModel.website.style.header" class="back">
          <font-awesome-icon icon="arrow-left" size="lg" />
        </router-link>
        <img :src="novel.cover" :alt="novel.title" :style="websiteModel.website.style.iconHeader" />
        <h1>{{novel.title}}</h1>
      </div>
      <div class="tools">
        <a
          href="#"
          @click.prevent="handleContinue"
          title="Reprendre la lecture"
          v-show="novel.lastRead"
        >
          <font-awesome-icon icon="book-reader" />&nbsp;Reprendre
        </a>
        <a
          href="#"
          @click.prevent="handleBookmark"
          title="Ajouter aux favoris"
          :class="{ enabled: (novel.bookmarked === Bookmarked.Yes) }"
        >
          <font-awesome-icon icon="bookmark" />
        </a>
      </div>
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
import { Novel, Chapter, Bookmarked, db } from '../lib/Database'
import Website from '../lib/Website'
import websites from '../lib/websites'

type NovelPageData = {
  novel: Novel | null
  chapters: Chapter[]
  websiteModel: Website | null
  Bookmarked: typeof Bookmarked
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
      websiteModel: (websiteLoader !== undefined) ? new Website({ website: websiteLoader }) : null,
      Bookmarked
    }
  },
  methods: {
    onSelected (chapter: Chapter) {
      if (chapter !== null && chapter.id !== undefined && this.websiteModel !== null) { this.$router.push({ name: 'reader-page', params: { novel: chapter.novel.toString(), chapter: chapter.id.toString(), website: this.websiteModel.website.slug } }) }
    },
    handleBookmark () {
      if (this.novel && this.novel.id) {
        const isBookmarked = (this.novel.bookmarked === Bookmarked.Yes) ? Bookmarked.No : Bookmarked.Yes
        db.novels.update(this.novel.id, { bookmarked: isBookmarked })
          .then(_ => {
            if (this.novel) {
              this.novel.bookmarked = isBookmarked
            }
          })
      }
    },
    handleContinue () {
      if (this.novel && this.novel.lastRead && this.novel.lastRead.id && this.novel.id) {
        this.$router.push({ name: 'reader-page', params: { website: this.novel.website, novel: this.novel.id.toString(), chapter: this.novel.lastRead.id.toString() } })
      }
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
    justify-content: space-between;
    margin-top: 120px;
    background: white;
    height: 45px;
    position: sticky;
    top: 0px;
    z-index: 3;
    .left {
      display: flex;
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
    .tools {
      display: flex;
      align-content: flex-end;
      align-self: center;
      padding-right: 2em;
      a {
        color: var(--biolet);
        border: 1px solid var(--biolet);
        transition: border .2s, color .2s, background-color .2s;
        padding: 4px;
        margin-left: 4px;
        border-radius: 5px;
        &.enabled {
          color: white;
          background-color: var(--biolet);
          border: 0;
        }
      }
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
