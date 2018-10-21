<template>
    <button type="button" @click="onSelected" class="chapter-item" :class="{ reading: (novel.lastRead && novel.lastRead.id === chapter.id) }">
      {{chapter.title}}
      <span class="tag" v-if="novel.lastRead && novel.lastRead.id === chapter.id">reading</span>
    </button>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Emit } from 'vue-property-decorator'
import { Chapter, Novel } from '../../lib/Database'

@Component({})
export default class ChapterListItem extends Vue {
  @Prop(Object) chapter!: Chapter
  @Prop(Object) novel!: Novel

  @Emit('selected')
  onSelected () {
    return this.chapter
  }
}
</script>

<style lang="scss" scoped>
.chapter-item {
    background-color: aliceblue;
    color: cadetblue;
    width: 100%;
    display: block;
    margin: 0;
    padding: 0.5em;
    border: 0;
    &:nth-child() {
        background-color: aqua;
    }
    &.reading {
      background-color: var(--biolet);
      font-weight: 400;
      color: white;
      padding: 1em;
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
