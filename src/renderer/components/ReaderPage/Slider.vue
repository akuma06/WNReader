<template>
    <div class="slider" ref="slider">
        <div class="read" :title="width.toFixed(2)+'%'" :style="'width:'+width+'%'"></div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Chapter } from '../../lib/Database'
export default Vue.extend({
  name: 'ReaderSliderVue',
  props: {
    chapters: {
      type: Array as () => Chapter[]
    },
    current: {
      type: Object as () => Chapter | null
    }
  },
  computed: {
    width (): number {
      if (this.current === null) {
        return 0
      }
      let i = 0
      this.chapters.every(chapter => {
        i++
        return (this.current !== null) && this.current.id !== chapter.id
      })
      return (i === 0) ? 0 : (i / this.chapters.length) * 100
    }
  }
})
</script>

<style lang="scss" scoped>
.slider {
  width: 100%;
  height: 5px;
  background-color: rgb(236, 236, 236);
  margin:0;
  padding: 0;
  .read {
    height:100%;
    background: linear-gradient(to right, rgb(163, 28, 241) 60%, rgb(145, 28, 241))
  }
}
</style>
