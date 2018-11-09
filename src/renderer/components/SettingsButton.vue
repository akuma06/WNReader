<template>
  <button @click.prevent="handleClick" class="fab-settings" :title="$t('Settings')">
    <font-awesome-icon icon='cog' />
  </button>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'SettingsButton',
  methods: {
    handleClick () {
      this.$router.push({ name: 'settings-page' })
    }
  }
})
</script>

<style lang="scss" scoped>
.fab-settings {
  position: fixed;
  bottom: 20px;
  right: 40px;
  z-index: 5;
  height: 40px;
  width: 40px;
  border-radius: 20px;
  background: var(--biolet);
  color: white;
  border: 0;
  cursor: pointer;
  transition: opacity .2s;
  &:hover {
    opacity: .8;
  }
  svg {
    height: 80%;
    width: 80%;
  }
}
</style>
