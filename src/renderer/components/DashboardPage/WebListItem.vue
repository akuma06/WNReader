<template>
    <button type="button" class="website-item" @click="onSelected">
        <img :src="website.icon" width='124' :alt="website.name" />
        <h3 :style="website.style.name">{{website.name}}</h3>
    </button>
</template>

<script lang="ts">
import Vue from 'vue'
import { WebsiteLoader } from '../../lib/Website'

export default Vue.extend({
  name: 'WebsiteListItem',
  props: {
    website: {
      type: Object as () => WebsiteLoader
    }
  },
  methods: {
    onSelected () {
      this.$emit('selected', this.website)
    }
  }
})
</script>

<style lang="scss" scoped>
.website-item {
  display: block;
  background: rgba(64, 185, 255, 0);
  transition: background-color .2s linear;
  padding: 0.5em;
  cursor: pointer;
  border: none;
  &:hover {
      background-color: rgba(64, 185, 255, 0.74)
  }
  h3 {
    text-align: center;
    margin: 0;
    font-size: 16px;
    margin-top: -20px;
    background-color: rgba(64, 185, 255, 0.74);
    position: relative;
    z-index: 2;
    color: white;
  }
}
</style>
