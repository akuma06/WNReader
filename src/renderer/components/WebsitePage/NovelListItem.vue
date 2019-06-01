<template>
    <button type="button" @click="onSelected" class="novel-item">
      <div class="cover-img" v-if="novel.cover !== ''">
        <img :src="novel.cover" :alt="novel.title" referrerpolicy="no-referrer" />
        <h3>{{novel.title}}</h3>
      </div>
      <div class="cover" :style="{backgroundColor: randombg}" v-else>
        <div class="cover-inner">
          <h3>{{novel.title}}</h3>
        </div>
      </div>
      <div class="description" v-html="novel.description"></div>
    </button>
</template>

<script lang="ts">
import Vue from 'vue'
import { Novel } from '../../lib/Database'

type NovelListItemData = {
  colors: string[]
}

export default Vue.extend({
  name: 'NovelListItem',
  data (): NovelListItemData {
    return {
      colors: ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D', '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC', '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399', '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933', '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF']
    }
  },
  props: {
    novel: {
      type: Object as () => Novel
    }
  },
  methods: {
    onSelected () {
      this.$emit('selected', this.novel)
    }
  },
  computed: {
    randombg (): string {
      return this.colors[Math.floor(Math.random() * this.colors.length)]
    }
  }
})
</script>

<style lang="scss" scoped>
@keyframes slidetop {
  from {
    margin-top: 20px;
    opacity: 0.6;
  }

  to {
    margin-top: 0px;
    opacity: 1;
  }
}

@keyframes slidedown {
  from {
    margin-top: 0px;
    opacity: 1;
  }

  to {
    margin-top: 20px;
    opacity: 0.6;
  }
}

.novel-item {
  --height: 200px;
  --width: 150px;
  display: block;
  background: var(--bluebg);
  transition: background-color .2s linear;
  padding: 0.5em;
  cursor: pointer;
  border: none;
  padding: 0;
  margin: 1em;
  height: var(--height);
  width: var(--width);
  overflow: hidden;
  &:hover {
      background-color: rgba(64, 185, 255, 0.74);
      .description {
        background-color: rgba(64, 185, 255, 0.74);
        display:  block;
        margin-top: 0;
        opacity: 1;
        animation: slidetop .2s linear;
      }
  }
  .cover-img {
    height: var(--height);
    width: var(--width);
    img {
      width: 100%;
      height: 100%;
      display: block;
    }
    h3 {
      text-align: center;
      font-size: 16px;
      color: white;
      text-shadow: 0px 0px 9px black;
      padding: 0 5px;
      position: relative;
      bottom: 50px;
      transform: translate(0%,-50%);
    }
  }
  .cover {
    width: calc(var(--width) - 20px);
    height: calc(var(--height) - 20px);
    padding: 10px;
    .cover-inner {
      display: flex;
      flex-direction: column;
      justify-content: center;
      border: 1px solid white;
      height: 100%;
      h3 {
        text-align: center;
        font-size: 16px;
        color: white;
        text-shadow: 0px 0px 9px black;
        padding: 5px;
      }
    }
  }
  .description {
    display: none;
    position: relative;
    bottom: var(--height);
    opacity: 0.6;
    margin-top: 20px;
    height: calc(var(--height) - 8px);
    animation: slidedown 1s linear;
    display: none;
    padding: 4px;
    overflow: hidden;
    font-weight: 400;
    color: white;
    text-shadow: 0px 0px 8px black;
    & /deep/ * {
      margin: 0;
    }
  }
}
</style>
