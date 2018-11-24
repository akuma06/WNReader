<template>
    <button type="button" @focus="focus" tabindex="1" @click="onSelected" class="chapter-item" :class="{ reading: (novel.lastRead && novel.lastRead.id === chapter.id) }">
      <font-awesome-icon icon="book-reader" />
      {{chapter.title}}
      <span class="tag" v-show="chapter.content !== ''" :title="$t('Chapter_Saved', [chapter.title])">
        <font-awesome-icon icon="save"></font-awesome-icon>
      </span>
      <span class="tag" v-if="novel.lastRead && novel.lastRead.id === chapter.id" v-text="$t('reading')"></span>
    </button>
</template>

<script lang="ts">
import Vue from 'vue'
import { Chapter, Novel } from '../../lib/Database'

export default Vue.extend({
  name: 'ChapterListItem',
  props: {
    chapter: {
      type: Object as () => Chapter
    },
    novel: {
      type: Object as () => Novel
    }
  },
  methods: {
    onSelected () {
      this.$emit('selected', this.chapter)
    },
    focus (e: FocusEvent) {
      this.$emit('focus', e)
    }
  }
})
</script>

<style lang="scss" scoped>
.chapter-item {
  background-color: white;
  color: rgb(51, 51, 51);
  width: 100%;
  display: block;
  margin: 4px 0;
  padding: 0.5em;
  border: 0;
  box-shadow: 1px 1px 4px 1px darkgrey;
  text-align: left;
  svg {
    margin: 0 4px;
  }
  &.reading {
    background-color: var(--biolet);
    font-weight: 400;
    color: white;
    padding: 1em;
  }
  &:hover, &:focus {
    box-shadow: 1px 1px 8px 2px darkgrey;
    position: relative;
    z-index: 2;
    transform: scale(1.01, 1.01);
    font-weight: bold;
    outline: 0;
  }
  .tag {
    border-radius: 15px;
    border: 1px white solid;
    padding: 5px;
    font-weight: bold;
    margin-left: 30px;
  }
}
</style>
