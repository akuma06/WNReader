<template>
  <div class="search" @keyup.esc="closeEvent">
    <div class="search-box">
      <input type="text" :placeholder="$t('Search')" v-model="search" name="search" ref="searchField" @keyup.esc="closeEvent" @keyup.enter="handleNext"/>
      <button :disabled="!hasPrevious" class="previous" @click.prevent="handlePrevious">
        <font-awesome-icon icon="arrow-left" />
      </button>
      <button :disabled="!hasNext" class="next" @click.prevent="handleNext">
        <font-awesome-icon icon="arrow-right" />
      </button>
    </div>
    <span>{{ index }}/{{ elements.length }}</span>
  </div>
</template>

<script lang="ts">
import Vue, { VueConstructor } from 'vue'
import Mark from 'mark.js'
import { debounce } from 'lodash'

type SearchData = {
  hasNext: boolean
  hasPrevious: boolean
  search: string
  markInstance: Mark | null
  elements: Element[]
  current: number
}

export default Vue.extend({
  name: 'Search',
  props: {
    container: {
      type: HTMLElement
    },
    shown: {
      type: Boolean
    }
  },
  data (): SearchData {
    return {
      hasNext: false,
      hasPrevious: false,
      search: '',
      elements: [],
      current: 0,
      markInstance: null
    }
  },
  methods: {
    markText: debounce(function (this: SearchData, text: string) {
      if (this.markInstance !== null) {
        this.markInstance.unmark()
        this.elements = []
        this.current = 0
        this.markInstance.mark(text, {
          each: el => {
            this.elements.push(el)
          }
        })
        this.hasNext = this.elements.length > 0
      }
    }),
    closeEvent () {
      this.search = ''
      if (this.markInstance !== null) {
        this.markInstance.unmark()
      }
      this.$emit('close')
    },
    handleNext () {
      this.current = (this.current + 1 < this.elements.length) ? this.current + 1 : 0
    },
    handlePrevious () {
      this.current = (this.elements.length > 0) ? ((this.current - 1 > 0) ? this.current - 1 : this.elements.length - 1) : 0
    }
  },
  watch: {
    search (newSearch: string) {
      this.markText(newSearch)
    },
    shown (nextVal: boolean) {
      if (nextVal) {
        this.markInstance = new Mark(this.container)
        const searchField = this.$refs['searchField'] as HTMLInputElement
        if (searchField) {
          searchField.focus()
        }
      }
    },
    current (nextVal: number) {
      const el = this.elements[nextVal]
      if (el !== undefined) {
        el.scrollIntoView()
      }
      this.hasPrevious = nextVal > 0
      this.hasNext = nextVal < this.elements.length - 1
    }
  },
  computed: {
    index (): number {
      return (this.elements.length > 0) ? this.current + 1 : 0
    }
  }
})
</script>

<style lang="scss" scoped>
.search {
  display: flex;
  flex-direction: row;
  .search-box {
    display: flex;
    flex-direction: row;
    margin: 5px;
    input {
      flex: 3;
      border-radius: 0;
      border-bottom-left-radius: 5px;
      border-top-left-radius: 5px;
      border: 1px solid var(--biolet);
      border-right: 0;
    }
    button {
      flex: 1;
      padding: 2px;
      border-right-width: 0;
      border: 1px solid var(--biolet);
      color: var(--biolet);
      &:disabled {
        color: gray;
        border-color: gray;
      }
      &:last-child {
        border-bottom-right-radius: 5px;
        border-top-right-radius: 5px;
        border-right-width: 1px;
      }
    }
  }
  span {
    color: gray;
    padding: 7px;
  }
}
</style>
