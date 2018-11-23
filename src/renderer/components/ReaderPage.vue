<template>
  <div v-if="chapter !== null" class="reader">
    <div class="header" :class="{ show: showHeader, hide: !showHeader }" ref="readerHeader" @mouseover="handleOverHeader" @mouseout="enableFade = true">
      <div class="left">
        <router-link :to="{ name: 'novel-page', params: { novel: novel.id.toString(), website: websiteModel.website.slug }}" :title="novel.title">
          <img src="@/assets/logo.png" />
        </router-link>
        <h1>{{ chapter.title }}</h1>
      </div>
      <div class="tools">
        <a
          href="#"
          @click.prevent="handleBookmark"
          :title="$t('Add_to_bookmarks')"
          :class="{ enabled: (novel.bookmarked === Bookmarked.Yes) }"
        >
          <font-awesome-icon icon="bookmark" />
        </a>
      </div>
    </div>
    <div class="main" ref="readerContent" @scroll="handleScroll" @mousewheel="handleWheel">
      <div class="content" ref="content">
        <h1 class="chapter-title" v-show="!this.loading && chapter.title !== ''">{{ chapter.title }}</h1>
        <div class="chapter-content" v-if="!this.loading && chapter.content !== '' " v-html="chapter.content" @click.prevent="handleContentClick"></div>
        <div class="chapter-content" v-else-if="!this.loading && chapter.content === '' ">
          <p style="text-align:center;">
            {{ 'Network_Error' }}<br>
            <a href="#" @click.prevent="reload" v-text="$t('Try_Again')"></a>
          </p>
        </div>
        <div class="chapter-content" v-else v-text="$t('Loading')"></div>
      </div>
      <div class="side">
        <ul>
          <li>
            <a href="#" @click.prevent="handlePanel(Panels.Comments)" :title="$t('Show_Comments')">
              <font-awesome-icon icon="comment" />
            </a>
          </li>
          <li>
            <a href="#" @click.prevent="handlePanel(Panels.Chapters)" :title="$t('Chapter_List')">
              <font-awesome-icon icon="list" />
            </a>
          </li>
          <li>
            <a href="#" @click.prevent="handleFullscreen()" :title="$t('Fullscreen')">
              <font-awesome-icon icon="expand" />
            </a>
          </li>
          <li class="separator"></li>
          <li>
            <a href="#" @click.prevent="handleSettings" :title="$t('Settings')">
              <font-awesome-icon icon="cog" />
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div class="panel comments" ref="comments" :class="{ show: showPanel === Panels.Comments }">
      <comment-vue v-for="(comment, i) in comments" :key="'comm' + i" :comment="comment" />
    </div>
    <div class="panel chapterlist" ref="chapterlist" :class="{ show: showPanel === Panels.Chapters }">
      <a
        href="#"
        v-for="(c, i) in chapters"
        :key="'chapter_' + i"
        :class="{ selected: c.id === chapter.id }"
        @click.prevent="handleChapterItem(c)">
        <span>{{ c.title }}</span>
      </a>
    </div>
    <div ref="search" class="search-container" v-show="enableSearch">
      <search-vue :container="$refs['content']" @close="enableSearch = false" :shown="enableSearch" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Chapter, Novel, db, Comment, Bookmarked } from '../lib/Database'
import Website from '../lib/Website'
import websites from '../lib/websites'
import CommentVue from './ReaderPage/Comment.vue'
import SearchVue from './ReaderPage/Search.vue'

enum Panels {
  None = 1,
  Comments,
  Chapters,
}

type ReaderPageData = {
  chapter: Chapter | null
  chapters: Chapter[]
  novel: Novel | null
  websiteModel: Website | null
  comments: Comment[]
  showPanel: Panels
  enableFade: boolean
  showHeader: boolean
  enableSearch: boolean
  loading: boolean
  Panels: typeof Panels
  Bookmarked: typeof Bookmarked
}

let timeoutAnim: NodeJS.Timer | null = null
let timeoutFade: NodeJS.Timer | null = null

export default Vue.extend({
  name: 'ReaderPage',
  components: {
    CommentVue,
    SearchVue
  },
  data (): ReaderPageData {
    const websiteLoader = websites[this.$route.params.website]
    return {
      chapter: null,
      chapters: [],
      novel: null,
      websiteModel: (websiteLoader !== undefined) ? new Website({ website: websiteLoader }) : null,
      comments: [],
      showPanel: Panels.None,
      enableFade: true,
      showHeader: true,
      loading: true,
      enableSearch: false,
      Panels,
      Bookmarked
    }
  },
  metaInfo () {
    const novel = (this as any).novel
    return {
      title: (novel !== null) ? this.$t('Reading_of', [novel.title]).toString() : this.$t('Reading').toString()
    }
  },
  methods: {
    handleChapterItem (c: Chapter) {
      if (this.websiteModel !== null && c.id !== undefined) {
        this.loading = true
        this.websiteModel.loadChapter(c.novel, c.id)
          .then(chapterResponse => {
            this.chapter = chapterResponse.chapter
            db.novels.update(c.novel, { lastRead: this.chapter })
            this.checkPosition()
            this.loading = false
          })
      }
    },
    nextChapter () {
      if (this.websiteModel !== null && this.chapter !== null && this.chapter.next !== '') {
        this.loading = true
        this.websiteModel.nextChapter(this.chapter)
          .then(chapterResponse => {
            this.chapter = chapterResponse.chapter
            this.checkPosition()
            this.loading = false
          })
      }
    },
    prevChapter () {
      if (this.websiteModel !== null && this.chapter !== null && this.chapter.prev !== '') {
        this.loading = true
        this.websiteModel.prevChapter(this.chapter)
          .then(chapterResponse => {
            this.chapter = chapterResponse.chapter
            this.checkPosition()
            this.loading = false
          })
      }
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
    handleKeyDown (e: KeyboardEvent) {
      if (this.websiteModel !== null && this.chapter !== null) {
        switch (e.which) {
          case 38:
            if (!this.loading && this.chapter.prev !== '') {
              this.hidedown(e)
            }
            break
          case 40:
            if (!this.loading && this.chapter.next !== '') {
              this.hideup(e)
            }
            break
        }
      }
    },
    handleKeyUp (e: KeyboardEvent) {
      if (this.websiteModel !== null && this.chapter !== null) {
        switch (e.code) {
          case 'ArrowRight':
            this.nextChapter()
            break
          case 'ArrowLeft':
            this.prevChapter()
            break
          case 'KeyF':
            if (e.ctrlKey) {
              this.enableSearch = true
            }
            break
          case 'Enter':
            this.handleFullscreen(true)
            break
          case 'Escape':
            this.handleFullscreen(false)
            break
          case 'ArrowUp':
            this.hidedown(e, true)
            break
          case 'ArrowDown':
            this.hideup(e, true)
            break
        }
      }
    },
    handleContentClick () {
      if (this.showPanel !== Panels.None) {
        this.showPanel = Panels.None
      }
    },
    handleWheel (e: MouseWheelEvent) {
      if (this.loading || this.chapter === null) {
        return
      }
      if (timeoutAnim !== null) {
        clearTimeout(timeoutAnim)
      }
      if (e.wheelDelta > 0 && this.chapter.prev !== '') {
        this.hidedown()
        timeoutAnim = setTimeout(() => this.hidedown(undefined, true), 200)
      } else if (e.wheelDelta < 0 && this.chapter.next !== '') {
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
        let lastPosition: number | undefined
        if (reader.scrollHeight <= (reader.scrollTop + 1.3 * reader.offsetHeight) || reader.scrollTop <= 0.3 * reader.offsetHeight) {
          lastPosition = undefined
        } else lastPosition = reader.scrollTop
        db.chapters.update(this.chapter.id, { lastPosition })
        db.novels.update(this.novel.id, { lastRead: this.chapter })
      }
    },
    handlePanel (panel: Panels) {
      if (this.showPanel === panel) {
        this.showPanel = Panels.None
      } else {
        this.showPanel = panel
        if (panel === Panels.Chapters) {
          const chapterListPanel = this.$refs['chapterlist'] as HTMLDivElement
          if (chapterListPanel) {
            const selected = chapterListPanel.querySelector('.selected') as HTMLAnchorElement
            if (selected) {
              setTimeout(() => selected.scrollIntoView({ block: 'nearest', inline: 'nearest' }), 300)
            }
          }
        }
      }
    },
    handleSettings () {
      this.$router.push({ name: 'settings-page' })
    },
    handleFullscreen (fs?: boolean) {
      if (fs === undefined) {
        this.$electron.remote.getCurrentWindow().setFullScreen(!this.$electron.remote.getCurrentWindow().isFullScreen())
      } else if (fs !== this.$electron.remote.getCurrentWindow().isFullScreen()) {
        this.$electron.remote.getCurrentWindow().setFullScreen(fs)
      }
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
    },
    reload () {
      if (this.websiteModel !== null) {
        this.loading = true
        const { novel, chapter } = this.$route.params
        this.websiteModel.loadChapter(parseInt(novel), parseInt(chapter)).then(chapterResponse => {
          this.novel = chapterResponse.novel
          this.chapter = chapterResponse.chapter
          this.chapters = chapterResponse.chapters
          this.loading = false
          return this.$nextTick()
        }).then(_ => {
          this.checkPosition()
          this.fadeInHeader()
        })
      }
    }
  },
  watch: {
    chapter (newChapter: Chapter | null, oldChapter: Chapter | null) {
      if (newChapter !== null && this.novel && this.websiteModel !== null) {
        this.enableSearch = false
        const chapterContent = this.$refs['content'] as HTMLDivElement
        if (chapterContent !== undefined) {
          let shell = require('electron').shell
          Array.from(chapterContent.querySelectorAll('a')).forEach(el => {
            el.addEventListener('click', function (event) {
              if (event.target && (event.target as Element).tagName === 'A' && (event.target as HTMLLinkElement).href.startsWith('http')) {
                event.preventDefault()
                shell.openExternal((event.target as HTMLLinkElement).href)
              }
            })
          })
        }
        this.websiteModel.loadComments(this.novel, newChapter).then(comments => {
          this.comments = comments
        })
      }
    }
  },
  created () {
    if (this.websiteModel !== null) {
      this.reload()
      document.addEventListener('keyup', this.handleKeyUp)
      document.addEventListener('keydown', this.handleKeyDown)
      document.addEventListener('mousemove', this.fadeInHeader)
      document.addEventListener('touchstart', this.fadeInHeader)
    }
  },
  beforeDestroy () {
      document.removeEventListener('keyup', this.handleKeyUp)
      document.removeEventListener('keydown', this.handleKeyDown)
      document.removeEventListener('mousemove', this.fadeInHeader)
      document.removeEventListener('touchstart', this.fadeInHeader)
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
    justify-content: space-between;
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
    .left {
      display: flex;
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
        border-radius: 5px;
        &.enabled {
          color: white;
          background-color: var(--biolet);
          border: 0;
        }
      }
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
      user-select: auto;
      .chapter-content {
        font-size: 24px;
        white-space: pre-line;
        /deep/ a {
          color: var(--biolet);
        }
        /deep/ img {
          display: block;
          margin: 10px 3px;
          width: 100%;
          height: auto;
        }
      }
      h1.chapter-title {
        border-bottom: 1px solid black;
        padding-bottom: 0.5em;
        text-align: center;
        margin-bottom: 0.5em;
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
          transition: background-color .2s linear;
          cursor: pointer;
          svg {
            width: 100%;
            height: 100%;
          }
          &:hover {
            background-color: rgb(61, 61, 61)
          }
          &.separator {
            border-bottom: 1px solid grey;
          }
        }
      }
    }
  }
  .panel {
    display: none;
    position: fixed;
    top: 0px;
    right: 40px;
    z-index: 2;
    height: 100%;
    background-color: white;
    width: 250px;
    box-shadow: -1px 0px 6px black;
    overflow: auto;
    &.show {
      display: block;
      animation: slideRight .2s ease;
    }
    &.comments {
      .comment-item {
        margin: 1em;
        &:first-child {
          margin-top: 35px;
        }
      }
    }
    &.chapterlist {
      a {
        color: black;
        display: block;
        border-bottom: 1px solid black;
        text-overflow: ellipsis;
        line-height: 30px;
        height: 40px;
        overflow: hidden;
        white-space: nowrap;
        span {
          padding: 5px 2px;
          display: inline-block;
          text-overflow: ellipsis;
        }
        &.selected {
          font-weight: bold;
          background-color: var(--biolet);
          color: white;
        }
      }
    }
  }
  .search-container {
    position: absolute;
    top: -1px;
    right: 125px;
    z-index: 4;
    padding: 5px 10px;
    background: lightgray;
    border: 1px solid var(--biolet);
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }
}
</style>
