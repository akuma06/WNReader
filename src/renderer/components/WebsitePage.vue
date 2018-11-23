<template>
  <div class="website" @scroll="handleScroll">
    <div class="website-img" ref="websiteHeader" :style="website.style.header">
      <router-link :to="{ name: 'dashboard-page' }" class="home" :style="website.style.header" :title="$t('Dashboard')">
        <font-awesome-icon icon="home" size="lg" />
      </router-link>
      <img :src="website.icon" :alt="website.name" :style="website.style.iconHeader" />
      <h1>{{ website.name }}</h1>
      <div class="search">
        <div class="search-input">
          <div class="tags" v-show="selectedTags.length > 0">
            <span class="tag" v-for="(tag, i) in selectedTags" @click="removeTag(tag)" :key="'tag_'+i" v-text="tag"></span>
          </div>
          <input type="text" v-model="filterNovels" name="search" :disabled="novels.length === 0" @keydown.delete="handleSearchDelete" @focus="searchFocus = true" @blur="searchFocus = false" :placeholder="$t('Filter')" />
        </div>
        <font-awesome-icon icon="search" />
        <div class="dropdown-tags" v-show="dropdownTags.length > 0 && (searchFocus || (!searchFocus && drpOver))" @mouseover="drpOver = true" @mouseout="drpOver = false">
          <a href="#" v-for="(tag,i) in dropdownTags" @click.prevent="handleTag(tag)" :key="'drptag_'+i" v-text="tag"></a>
        </div>
      </div>
    </div>
    <div class="novels-list" v-if="novels.length > 0 && !loading">
      <novel-list-item
      v-for="novel in filteredNovels"
      :key="novel.title"
      :novel="novel"
      @selected="onSelected"></novel-list-item>
    </div>
    <div class="novels-list" v-else-if="novels.length === 0 && !loading">
      <p style="text-align:center;">
        {{ 'Network_Error' }}<br>
        <a href="#" @click.prevent="reload" v-text="$t('Try_Again')"></a>
      </p>
    </div>
    <facebook-loader v-else></facebook-loader>
    <settings-button />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { FacebookLoader } from 'vue-content-loader'
import websites from '../lib/websites'
import Website, { WebsiteLoader } from '../lib/Website'
import { Novel, db } from '../lib/Database'
import NovelListItem from './WebsitePage/NovelListItem.vue'
import SettingsButton from './SettingsButton.vue'

type WebsiteData = {
  websiteModel: Website | null
  novels: Novel[]
  loading: boolean
  filterNovels: string
  tags: string[]
  selectedTags: string[]
  searchFocus: boolean
  drpOver: boolean
}
export default Vue.extend({
  name: 'WebsitePage',
  components: {
    NovelListItem,
    FacebookLoader,
    SettingsButton
  },
  data (): WebsiteData {
    const websiteLoader = websites[this.$route.params.website]
    return {
      websiteModel: (websiteLoader !== undefined) ? new Website({ website: websiteLoader }) : null,
      novels: [],
      loading: true,
      filterNovels: this.$route.params.filter || '',
      tags: [],
      selectedTags: [],
      searchFocus: false,
      drpOver: false
    }
  },
  metaInfo () {
    const website = (this as any).website
    return {
      title: (website !== null) ? this.$t('Novels_of', [website.name]).toString() : this.$t('Novels').toString()
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
    },
    reload () {
      if (this.websiteModel !== null) {
        const websiteModel = this.websiteModel
        this.loading = true
        websiteModel.loadNovels().then(data => {
          this.loading = false
          if (data.length > 0) {
            this.novels = data
          }
          return data
        }).then(data => {
          if (data.length > 0) {
            this.tags = [...new Set(data.map(novel => novel.tags).reduce((acc, tags) => acc.concat(tags, [])))]
          }
          return data
        }).catch(console.log.bind(console))
      }
    },
    handleTag (tag: string) {
      if (tag !== '') {
        this.selectedTags.push(tag)
        this.filterNovels = ''
      }
    },
    removeTag (tag: string) {
      if (tag !== '') {
        const ind = this.selectedTags.lastIndexOf(tag)
        if (ind !== null) {
          this.selectedTags.splice(this.selectedTags.lastIndexOf(tag), 1)
        }
      }
    },
    handleSearchDelete () {
      if (this.filterNovels === '' && this.selectedTags.length > 0) {
        this.selectedTags.pop()
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
    },
    filteredNovels (): Novel[] {
      if (this.filterNovels === '' && this.selectedTags.length === 0) {
        return this.novels
      }
      return this.novels.filter(novel => novel.title.match(new RegExp(this.filterNovels, 'i')) !== null && this.selectedTags.every(tag => novel.tags.lastIndexOf(tag) > -1))
    },
    dropdownTags (): string[] {
      if (this.tags.length === 0 || this.filterNovels === '') {
        return []
      }
      return this.tags.filter(tag => (this.selectedTags.lastIndexOf(tag) === -1 && tag.match(new RegExp(this.filterNovels, 'i')) !== null)).slice(0, 5)
    }
  },
  created () {
    this.reload()
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
    .search {
      display: flex;
      align-items: center;
      flex-direction: row;
      color: gray;
      position: absolute;
      right: 0;
      margin: auto;
      height: 100%;
      padding-left: 5px; 
      .search-input {
        border: 1px solid lightgray;
        border-radius: 15px;
        height: 70%;
        display: flex;
        align-items: center;
        overflow: hidden;
        input {
          padding: 0px 1.5em 0px 10px;
          border-radius: 15px;
          border: 0;
          background: none;
          height: 100%;
          display: inline-block;
          position: relative;
          z-index: 2;
          font-size: 1em;
          width: 100%;
          transition: border-color .2s;
          &:focus {
            outline: none;
          }
          &[disabled] {
            background: lightgray
          }
        }
        .tags {
          height: 90%;
          display: flex;
          flex-direction: row;
          .tag {
            background-color: var(--biolet);
            border-radius: 1em;
            display: block;
            height: 100%;
            font-size: 12px;
            color: white;
            line-height: 26px;
            padding: 0 5px;
            cursor: pointer;
            transition: opacity .2s;
            margin-left: 3px;
            white-space: nowrap;
            &:hover {
              opacity: .7;
            }
          }
        }
        &:focus-within {
          border-color: var(--biolet);
          box-shadow: 0px 0px 10px var(--biolet);  
        }
      }
      svg {
        position: relative;
        left: -1.5em;
        z-index: 0;
      }
      .dropdown-tags {
        position: absolute;
        top: 100%;
        right: 16px;
        z-index: 5;
        background-color: var(--biolet);
        width: 92%;
        a {
          display: block;
          padding: 3px 5px 0;
        }
      }
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
