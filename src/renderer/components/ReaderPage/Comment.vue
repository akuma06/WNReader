<template>
  <div class="comment-item">
    <div class="comment-header">
      <h3>
        <img v-if="comment.avatar" :src="comment.avatar" :alt="comment.username" :title="comment.username" />
        <span>{{ comment.username }}</span>
      </h3>
    </div>
    <div class="comment-content" v-html="comment.content"></div>
    <div class="comment-footer">
      <div class="comment-likes" v-if="comment.likes" v-html="comment.likes"></div>
      <div class="comment-date">{{ comment.date }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { Comment } from '../../lib/Database'

@Component
export default class CommentVue extends Vue {
  @Prop(Object) comment!: Comment
}
</script>

<style lang="scss" scoped>
.comment-item {
  border-bottom: 1px solid grey;
  .comment-header {
    h3 {
      img {
        height: 44px;
        width: 44px;
        margin-right: 5px;
        vertical-align: middle;
      }
    }
  }
  .comment-footer {
    display: flex;
    .comment-date {
      text-align: right;
    }
  }
}
</style>
