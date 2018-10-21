<template>
  <div v-if="chapter !== null" class="reader">
    <div class="header" :class="{ show: showHeader, hide: !showHeader }" ref="readerHeader" @mouseover="handleOverHeader" @mouseout="enableFade = true">
      <router-link :to="{ name: 'novel-page', params: { novel: novel.id.toString(), website: websiteModel.website.slug }}">
        <img src="@/assets/logo.png" />
      </router-link>
      <h1>{{ chapter.title }}</h1>
    </div>
    <div class="main" ref="readerContent" @scroll="handleScroll" @mousewheel="handleWheel">
      <div class="content" v-html="chapter.content"></div> 
      <div class="side">
        <ul>
          <li>
            <a href="#" @click.prevent="handleComments">
              <font-awesome-icon icon="comment" />
            </a>
          </li>
          <li>
            <a href="#" @click.prevent="handleFullscreen">
              <font-awesome-icon icon="external-link-alt" />
            </a>
          </li>
        </ul>
      </div>
      <div class="comments" :class="{ show: showComments }">
        <comment-vue v-for="(comment, i) in comments" :key="'comm' + i" :comment="comment" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Chapter, Novel, db, Comment } from '../lib/Database'
import Website from '../lib/Website'
import websites from '../lib/websites'
import CommentVue from './ReaderPage/Comment.vue'

type ReaderPageData = {
  chapter: Chapter | null
  novel: Novel | null
  websiteModel: Website | null
  comments: Comment[]
  showComments: boolean
  enableFade: boolean
  showHeader: boolean
}

let timeoutAnim: NodeJS.Timer | null = null
let timeoutFade: NodeJS.Timer | null = null

export default Vue.extend({
  name: 'ReaderPage',
  components: {
    CommentVue
  },
  data (): ReaderPageData {
    const websiteLoader = websites[this.$route.params.website]
    return {
      chapter: null,
      novel: null,
      websiteModel: (websiteLoader !== undefined) ? new Website({ website: websiteLoader }) : null,
      comments: [],
      showComments: false,
      enableFade: true,
      showHeader: true
    }
  },
  methods: {
    nextChapter () {
      if (this.websiteModel !== null && this.chapter !== null) {
        this.websiteModel.nextChapter(this.chapter)
          .then(chapterResponse => {
            this.chapter = chapterResponse.chapter
            this.checkPosition()
          })
      }
    },
    prevChapter () {
      if (this.websiteModel !== null && this.chapter !== null) {
        this.websiteModel.prevChapter(this.chapter)
          .then(chapterResponse => {
            this.chapter = chapterResponse.chapter
            this.checkPosition()
          })
      }
    },
    handleKeyDown (e: KeyboardEvent) {
      if (this.websiteModel !== null && this.chapter !== null) {
        switch (e.which) {
          case 38:
            this.hidedown(e)
            break
          case 40:
            this.hideup(e)
            break
        }
      }
    },
    handleKeyUp (e: KeyboardEvent) {
      if (this.websiteModel !== null && this.chapter !== null) {
        switch (e.which) {
          case 39:
            this.nextChapter()
            break
          case 37:
            this.prevChapter()
            break
          case 13:
            this.handleFullscreen(true)
            break
          case 27:
            this.handleFullscreen(false)
            break
          case 38:
            this.hidedown(e, true)
            break
          case 40:
            this.hideup(e, true)
            break
        }
      }
    },
    handleWheel (e: MouseWheelEvent) {
      if (timeoutAnim !== null) {
        clearTimeout(timeoutAnim)
      }
      if (e.wheelDelta > 0) {
        this.hidedown()
        timeoutAnim = setTimeout(() => this.hidedown(undefined, true), 200)
      } else if (e.wheelDelta < 0) {
        this.hideup()
        timeoutAnim = setTimeout(() => this.hideup(undefined, true), 200)
      }
    },
    checkPosition () {
      const reader = this.$refs['readerContent'] as HTMLDivElement
      if (this.chapter !== null && this.chapter.lastPosition !== undefined && reader) {
        reader.scrollTop = this.chapter.lastPosition
      } else if (reader) {
        reader.scrollTop = 0
      }
    },
    handleScroll () {
      const reader = this.$refs['readerContent'] as HTMLDivElement
      if (this.chapter !== null && this.chapter.id && reader && this.novel && this.novel.id) {
        if (reader.scrollHeight <= (reader.scrollTop + 1.3 * reader.offsetHeight) || reader.scrollTop <= 0.3 * reader.offsetHeight) {
          this.chapter.lastPosition = undefined
        } else this.chapter.lastPosition = reader.scrollTop
        this.novel.lastRead = this.chapter
        db.chapters.update(this.chapter.id, this.chapter)
        db.novels.update(this.novel.id, this.novel)
      }
    },
    handleComments () {
      this.showComments = !this.showComments
    },
    handleFullscreen (fs?: boolean) {
      if (fs === undefined) {
        fs = !this.$electron.remote.getCurrentWindow().isFullScreen()
      }
      this.$electron.remote.getCurrentWindow().setFullScreen(fs)
      this.fadeInHeader()
    },
    handleOverHeader () {
      if (timeoutFade) {
        clearTimeout(timeoutFade)
      }
      this.enableFade = false
    },
    hideup (e?: UIEvent, reset?: boolean) {
      const reader = this.$refs['readerContent'] as HTMLDivElement
      if (reader) {
        let divContent = reader.querySelector('.content') as HTMLDivElement
        if (divContent) {
          if (reset) {
            divContent.style.position = null
            divContent.style.top = null
            return
          }
          if (reader.scrollHeight <= (reader.scrollTop + reader.offsetHeight + 1)) {
            if (e !== undefined) e.preventDefault()
            divContent.style.position = 'relative'
            var pos = (divContent.style.top && divContent.style.top.replace('px', '') !== '') ? parseFloat(divContent.style.top.replace('px', '')) : -1
            pos = (pos >= 0) ? -1 : pos
            if (-pos > reader.offsetHeight) {
              this.nextChapter()
            } else {
              pos -= -0.2 * pos
              divContent.style.top = pos + 'px'
            }
          }
        }
      }
    },
    hidedown (e?: UIEvent, reset?: boolean) {
      const reader = this.$refs['readerContent'] as HTMLDivElement
      if (reader) {
        let divContent = reader.querySelector('.content') as HTMLDivElement
        if (divContent) {
          if (reset) {
            divContent.style.position = null
            divContent.style.top = null
            return
          }
          if (reader.scrollTop === 0) {
            if (e !== undefined) e.preventDefault()
            divContent.style.position = 'relative'
            var pos = (divContent.style.top && divContent.style.top.replace('px', '') !== '') ? parseFloat(divContent.style.top.replace('px', '')) : 1
            pos = (pos <= 0) ? 1 : pos
            if (pos > reader.offsetHeight) {
              this.prevChapter()
            } else {
              pos += 0.2 * pos
              divContent.style.top = pos + 'px'
            }
          }
        }
      }
    },
    fadeInHeader () {
      const readerHeader = this.$refs['readerHeader'] as HTMLDivElement
      if (readerHeader) {
        if (timeoutFade) {
          clearTimeout(timeoutFade)
        }
        if (this.enableFade) {
          this.showHeader = true
          timeoutFade = setTimeout(() => {
            this.showHeader = false
          }, 4000)
        }
      }
    }
  },
  watch: {
    chapter (newChapter: Chapter | null, oldChapter: Chapter | null) {
      if (newChapter !== null && this.novel && this.websiteModel !== null) {
        this.websiteModel.loadComments(this.novel, newChapter).then(comments => {
          console.log(comments)
          this.comments = comments
        })
      }
    }
  },
  created () {
    if (this.websiteModel !== null) {
      const { novel, chapter } = this.$route.params
      this.websiteModel.loadChapter(parseInt(novel), parseInt(chapter)).then(chapterResponse => {
        this.novel = chapterResponse.novel
        this.chapter = chapterResponse.chapter
        this.checkPosition()
        this.fadeInHeader()
        return chapterResponse
      })
      document.addEventListener('keyup', this.handleKeyUp)
      document.addEventListener('keydown', this.handleKeyDown)
      document.addEventListener('mousemove', this.fadeInHeader)
      document.addEventListener('touchstart', this.fadeInHeader)
    }
  }
})
</script>

<style lang="scss" scoped>
@keyframes slideRight {
  from {
    right: 20px;
    opacity: 0.6;
  }

  to {
    right: 40px;
    opacity: 1;
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
.reader {
  display: flex;
  flex-direction: column;
  height: 100%;
  .header {
    width: 100%;
    display: flex;
    flex-direction: row;
    padding: 5px;
    position: fixed;
    top: 0px;
    left: 0px;
    z-index: 4;
    background-color: white;
    color: black;
    font-family: 'Nunito Sans','SF Pro Text','SF Pro Icons',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif;
    transition: opacity 1s;
    &.show {
      opacity: 1;
      animation: fadeIn .2s ease;
    }
    &.hide {
      opacity: 0;
      animation: fadeOut .2s ease;
    }
    img {
      height: 25px;
      width: 25px;
      margin: 0 10px;
    }
    h1 {
      font-size: 18px;
      font-weight: bold;
      line-height: 25px;
      padding: 0;
      margin: 0;
    }
  }
  .main {
    height: 100%;
    overflow: auto;
    min-width: 740px;
    font-family: Merriweather, serif;
    font-weight: 400;
    overflow-wrap: break-word;
    text-align: justify;
    .content {
      width: 60%;
      min-width: 700px;
      max-width: 1200px;
      padding: 2.5em;
      margin: auto;
      background-color: white;
      font-size: 24px;
    }
    .comments {
      display: none;
      position: fixed;
      top: 0px;
      right: 40px;
      z-index: 2;
      height: 100%;
      background-color: white;
      width: 200px;
      padding: 1em;
      box-shadow: -1px 0px 6px black;
      &.show {
        display: block;
        animation: slideRight .2s ease;
      }
    }
    .side {
      width: 40px;
      height: 100%;
      background-color: var(--blackbg);
      position: fixed;
      right: 0;
      top: 0;  
      display: flex;
      flex-direction: column;
      justify-content: center;
      z-index: 3;
      ul {
        list-style-type: none;
        margin: 0;
        padding: 0;
        li {
          color: white;
          padding: 5px;
          border-bottom: 1px solid grey;
          border-top: 1px solid grey;
          transition: background-color .2s linear;
          cursor: pointer;
          svg {
            width: 100%;
            height: 100%;
          }
          &:hover {
            background-color: rgb(61, 61, 61)
          }
        }
      }
    }
  }
}
</style>
