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
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import WebsiteListItem from './DashboardPage/WebListItem.vue'
import websites from '../lib/websites'
import { WebsiteLoader } from '../lib/Website'

export default Vue.extend({
  name: 'DashboardPage',
  components: {
    WebsiteListItem
  },
  methods: {
    onClick (website: WebsiteLoader) {
      this.$router.push({name: 'website-page', params: { website: website.slug }})
    }
  },
  data () {
    return {
      websites
    }
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
}
</style>