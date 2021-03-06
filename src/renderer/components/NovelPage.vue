<template>
  <div class="novel" v-if="novel !== null" @scroll="handleScroll">
    <div class="novel-header" ref="novelHeader" :style="websiteModel.website.style.header">
      <router-link :to="{ name: 'website-page', params: { website: novel.website }}" :style="websiteModel.website.style.header" class="back" :title="$t('Back')">
        <font-awesome-icon icon="arrow-left" size="lg" />
      </router-link>
      <img :src="novel.cover" :alt="novel.title" :style="websiteModel.website.style.iconHeader" />
      <h1 :title="novel.title">{{novel.title}}</h1>
      <div class="tools">
        <a
          href="#"
          @click.prevent="handleContinue"
          :title="$t('Continue_Reading')"
          v-show="novel.lastRead"
          :style="websiteModel.website.style.buttonHeader"
        >
          <font-awesome-icon icon="book-reader" />&nbsp;{{ $t('Continue') }}
        </a>
        <a
          href="#"
          @click.prevent="handleBookmark"
          :title="$t('Add_to_bookmarks')"
          :class="{ enabled: (novel.bookmarked === Bookmarked.Yes) }"
          :style="websiteModel.website.style.buttonHeader"
        >
          <font-awesome-icon icon="bookmark" />
        </a>
        <a
          href="#"
          @click.prevent="resetChapters"
          :title="$t('Refresh')"
          :style="websiteModel.website.style.buttonHeader"
        >
          <font-awesome-icon icon="sync-alt" />
        </a>
        <a
          href="#"
          @click.prevent="saveNovel"
          :title="$t('Save')"
          :style="websiteModel.website.style.buttonHeader"
        >
          <font-awesome-icon icon="save" />
        </a>
      </div>
    </div>
    <div class="synopsis" v-html="novel.description">
    </div>
    <div class="chapters-list" v-if="!loading && chapters.length > 0">
      <chapter-list-item
      v-for="chapter in chapters"
      :key="chapter.id + chapter.title"
      :chapter="chapter"
      :novel="novel"
      @focus="onFocus"
      @selected="onSelected" />
    </div>
    <div class="chapters-list" v-else-if="!loading && chapters.length === 0">
      <p style="text-align:center;">
        {{ $t('Network_Error') }}<br>
        <a href="#" @click.prevent="reload">{{ $t('Try_Again') }}</a>
      </p>
    </div>
    <facebook-loader v-else />
    <settings-button />
  </div>
  <div class="card" v-else-if="novel === null && !loading">
    <p>
      {{ $t('Network_Error') }}
    </p>
      <router-link :to="{ name: 'website-page', params: { website: websiteModel.website.slug }}" :title="$t('Back')">
        {{ $t('Back') }}
      </router-link>
       - 
      <a href="#" @click.prevent="reload">{{ $t('Try_Again') }}</a>
  </div>
  <facebook-loader v-else />
</template>

<script lang="ts">
import Vue from 'vue'
import { FacebookLoader } from 'vue-content-loader'
import ChapterListItem from './NovelPage/ChapterListItem.vue'
import SettingsButton from './SettingsButton.vue'
import { Novel, Chapter, Bookmarked, db } from '../lib/Database'
import Website from '../lib/Website'
import websites from '../lib/websites'

type NovelPageData = {
  novel: Novel | null
  chapters: Chapter[]
  loading: boolean
  websiteModel: Website | null
  Bookmarked: typeof Bookmarked
  lastFocus: HTMLButtonElement | null
  saving: boolean
}

export default Vue.extend({
  name: 'NovelPage',
  components: {
    ChapterListItem,
    FacebookLoader,
    SettingsButton
  },
  data (): NovelPageData {
    const websiteLoader = websites[this.$route.params.website]
    return {
      novel: null,
      chapters: [],
      loading: true,
      websiteModel: (websiteLoader !== undefined) ? new Website({ website: websiteLoader }) : null,
      Bookmarked,
      lastFocus: null,
      saving: false
    }
  },
  metaInfo () {
    const novel = (this as any).novel
    return {
      title: (novel !== null) ? this.$t('Chapters_of', [novel.title]).toString() : this.$t('Chapters').toString()
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
    },
    onFocus (e: FocusEvent) {
      const btn = e.target as HTMLButtonElement
      this.lastFocus = btn
    },
    handleKeys (e: KeyboardEvent) {
      switch (e.code) {
        case 'ArrowUp':
          e.preventDefault()
          if (this.lastFocus !== null && this.lastFocus.previousElementSibling !== null) {
            (this.lastFocus.previousElementSibling as HTMLButtonElement).focus()
          } else {
            (document.querySelector('.chapters-list button:last-child') as HTMLButtonElement).focus()
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (this.lastFocus !== null && this.lastFocus.nextElementSibling !== null) {
            (this.lastFocus.nextElementSibling as HTMLButtonElement).focus()
          } else {
            (document.querySelector('.chapters-list button:first-child') as HTMLButtonElement).focus()
          }
          break
      }
    },
    reload () {
      if (this.websiteModel !== null) {
        this.loading = true
        console.time('novelData')
        this.websiteModel.loadNovel(parseInt(this.$route.params.novel))
          .then(novelResponse => {
            this.loading = false
            this.novel = novelResponse.novel
            this.chapters = novelResponse.chapters
            console.timeEnd('novelData')
            return novelResponse
          }).catch(e => {
            this.loading = false
            console.error(e)
          })
      }
    },
    resetChapters () {
      if (this.novel !== null && this.novel.id !== undefined) {
        if (!navigator.onLine && !confirm(this.$t('Network_Disconnected_Continue').toString())) {
          return
        }
        db.chapters.where({ novel: this.novel.id }).delete()
        this.reload()
      }
    },
    saveNovel () {
      if (this.websiteModel !== null && this.novel !== null && !this.saving) {
        this.saving = true
        this.$notify({
          group: 'main',
          title: this.$t('Saving_Chapters').toString(),
          duration: -1
        })
        this.websiteModel.cacheNovel(this.novel, chapter => {
          this.$notify({
            group: 'main',
            title: this.$t('Chapter_Saved', [ chapter.title ]).toString(),
            duration: 500
          })
        }, () => {
          this.$notify({
            group: 'main',
            clean: true
          })
          this.$notify({
            group: 'main',
            title: this.$t('Chapters_Saved').toString(),
            type: 'success'
          })
          this.saving = false
        })
      }
    }
  },
  created () {
    this.reload()
    document.addEventListener('keydown', this.handleKeys)
  },
  beforeDestroy () {
    if (this.saving) {
      this.$notify({
        group: 'main',
        clean: true
      })
      this.$notify({
        group: 'main',
        title: this.$t('Saving_interrupted').toString(),
        type: 'error'
      })
    }
    document.removeEventListener('keydown', this.handleKeys)
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
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: space-between;
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
      max-width: min-content;
      overflow: hidden;
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
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      flex-basis: 0;
      flex-grow: 20;
      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif
    }
    .tools {
      align-self: center;
      padding-right: 2em;
      white-space: nowrap;
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
    background-color: white;
    padding: 0 0.5em;
  }
}
.card a {
  color: var(--biolet);
}
</style>
