<template>
  <div class="container">
    <h1>Sites Web</h1>
    <div class="website-list">
      <website-list-item v-for="(website, key) in websites"
        :key="key"
        :website="website"
        @selected="onClick"
      />
    </div>
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
      novels: []
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
  margin: auto;
  padding: 1em;
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