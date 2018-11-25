<template>
  <div class="page">
    <div class="header">
      <a href="#" @click.prevent="goBack" class="back" :title="$t('Back')">
        <font-awesome-icon icon="arrow-left" size="lg" />
      </a>
      <h1><font-awesome-icon icon="cog" size="lg" />&nbsp;{{ $t('Settings') }}</h1>
    </div>
    <div class="content">
      <p>
        {{ $t('number_of_entries_msg', [novels.length]) }}<br />
        <button @click="flushCache">{{ $t('Empty_Cache') }}</button>
        <button @click="eraseDatabase">{{ $t('Erase_DB') }}</button>
      </p>
      <p>
        {{ $t('Choose_language') }}
        <select v-model="savedSettings.lang">
          <option :key="'langs_' + lang[0]" v-for="lang in langsAvailable" :value="lang[0]">{{ lang.join(' - ') }}</option>
        </select>
      </p>
      <p>
        <label>
          <input type="checkbox" name="offline" v-model="savedSettings.offline" />
          {{ $t('Offline_mode') }}
        </label>
      </p>
      <hr>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Novel, db } from '../lib/Database'
import { SaveSettings, getSettings } from '../lib/Settings'
import { langs } from '../i18n'

type SettingsPageData = {
  novels: Novel[]
  langs: typeof langs
  savedSettings: SaveSettings
}

export default Vue.extend({
  name: 'SettingsPage',
  data (): SettingsPageData {
    return {
      novels: [],
      langs,
      savedSettings: getSettings()
    }
  },
  metaInfo () {
    return {
      title: this.$t('Settings').toString()
    }
  },
  methods: {
    goBack () {
      window.history.length > 1
        ? this.$router.go(-1)
        : this.$router.push('/')
    },
    flushCache (e: UIEvent) {
      const btn = e.target as HTMLButtonElement
      btn.disabled = true
      const promises = [
        db.novels.toCollection().modify({ lastUpdate: new Date(new Date().getTime() - 8.64E7) }),
        db.chapters.toCollection().modify({ lastUpdate: new Date(new Date().getTime() - 8.64E7) })
      ]
      Promise.all(promises).then(_ => {
        this.$notify({
          group: 'main',
          title: this.$t('Cache').toString(),
          text: this.$t('cache_empty_msg').toString()
        })
        btn.disabled = false
      })
    },
    eraseDatabase (e: UIEvent) {
      const btn = e.target as HTMLButtonElement
      btn.disabled = true
      if (confirm(this.$t('erase_db_msg').toString())) {
        const promises = [
          db.novels.clear(),
          db.chapters.clear()
        ]
        Promise.all(promises).then(_ => {
          this.$notify({
            group: 'main',
            title: this.$t('DB').toString(),
            text: this.$t('erased_db_msg').toString()
          })
          db.novels.toArray().then(novels => {
            this.novels = novels
          })
          btn.disabled = false
        })
      }
    }
  },
  watch: {
    savedSettings: {
      handler (newSettings: SaveSettings, prevSettings: SaveSettings) {
        localStorage.setItem('savedSettings', JSON.stringify(newSettings))
        this.$i18n.locale = newSettings.lang
      },
      deep: true
    }
  },
  computed: {
    langsAvailable (): [string, string][] {
      return Array.from(this.langs)
    }
  },
  created () {
    db.novels.toArray().then(novels => {
      this.novels = novels
    })
  }
})
</script>

<style lang="scss" scoped>
.page {
  height: 100%;
  overflow: auto;
  .header {
    display: flex;
    flex-direction: row;
    margin-top: 120px;
    background: white;
    height: 45px;
    position: sticky;
    top: 0px;
    z-index: 3;
    .back {
      color: black;
      margin: 0 15px;
      svg {
        height: 45px;
        widows: 45px;
      }
    }
    h1 {
      padding: 5px;
      font-size: 25px;
      margin: 0;
      line-height: 35px;
      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif
    }
  }
  .content {
    display: flex;
    flex-direction: column;
    background-color: var(--blackbg);
    padding: 2em;
    color: white;
  }
}
</style>
