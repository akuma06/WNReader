<template>
  <div class="container">
    <div class="card">
      <div class="title">
        <h1>Sites Web</h1>
        <span class="search">
          <input type="text" v-model="filterWebsite" name="search" placeholder="Filtrer" />
          <font-awesome-icon icon="search" />
        </span>
      </div>
      <div class="website-list">
        <website-list-item v-for="(website, key) in filteredWebsites"
          :key="key"
          :website="website"
          @selected="onClick"
        />
      </div>
    </div>
    <div class="card biolet">
      <h1>Favoris</h1>
      <div class="bookmark-list" v-if="novels.length > 0">
        <novel-list-item
          v-for="(novel, key) in novels"
          :novel="novel"
          @selected="handleNovel"
          :key="'nvbook_' + key"
        />
      </div>
      <p v-else>Aucun novels dans vos favoris</p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import WebsiteListItem from './DashboardPage/WebListItem.vue'
import NovelListItem from './WebsitePage/NovelListItem.vue'
import websites from '../lib/websites'
import { WebsiteLoader } from '../lib/Website'
import { Novel, db, Bookmarked } from '../lib/Database'

type DashboardPageData = {
  websites: typeof websites
  novels: Novel[]
  filterWebsite: string
}

export default Vue.extend({
  name: 'DashboardPage',
  components: {
    WebsiteListItem,
    NovelListItem
  },
  methods: {
    onClick (website: WebsiteLoader) {
      this.$router.push({name: 'website-page', params: { website: website.slug }})
    },
    handleNovel (novel: Novel) {
      if (novel !== null && novel.id !== undefined) this.$router.push({name: 'novel-page', params: { novel: novel.id.toString(), website: novel.website }})
    }
  },
  data (): DashboardPageData {
    return {
      websites,
      novels: [],
      filterWebsite: ''
    }
  },
  computed: {
    filteredWebsites (): typeof websites {
      if (this.filterWebsite === '') {
        return websites
      }
      const filtered: typeof websites = {}
      Object.keys(websites)
        .filter(key => key.match(new RegExp(this.filterWebsite, 'i')) !== null)
        .forEach(key => { filtered[key] = websites[key] })
      return filtered
    }
  },
  created () {
    db.novels.where({ bookmarked: Bookmarked.Yes }).toArray().then(novels => {
      this.novels = novels
    })
  }
})
</script>

<style lang="scss" scoped>
.container {
  width: 60%;
  height: 100%;
  margin: auto;
  padding: 0px 10px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
  .card {
    padding: 1em;
    background: white;
    box-shadow: 3px 2px 5px darkgrey;
    margin-top: 15px;
    &:last-child {
      margin-bottom: 15px;
    } 
    h1 {
      color: var(--biolet)
    }
    &.biolet {
      background-color: var(--biolet);
      h1 {
        color: white;
      } 
    }
  }
  .title {
    display: flex;
    flex-direction: row;
    align-items: center;
    .search {
      display: flex;
      align-items: center;
      flex-direction: row;
      margin-left: 20px;
      color: gray;
      input {
        border: 1px solid lightgray;
        border-radius: 15px;
        padding: 0px 1.5em 0px 10px;
        background: none;
        height: 100%;
        display: inline-block;
        position: relative;
        z-index: 2;
        font-size: 1.5em;
        width: 50%;
        transition: border-color .2s;
        &:focus {
          outline: none;
          border-color: var(--biolet);
          box-shadow: 0px 0px 10px var(--biolet);  
        }
      }
      svg {
        position: relative;
        left: -1.5em;
        z-index: 0;
      }
    }
  }
  .website-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .bookmark-list {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar {
      display: none;
    }
    button {
      flex-grow: 0;
      flex-shrink: 0;
    }
  }
}
</style>