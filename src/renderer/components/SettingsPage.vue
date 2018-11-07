<template>
  <div class="page">
    <div class="header">
      <a href="#" @click.prevent="goBack" class="back">
        <font-awesome-icon icon="arrow-left" size="lg" />
      </a>
      <h1><font-awesome-icon icon="cog" size="lg" />&nbsp;Paramètres</h1>
    </div>
    <div class="content">
      <p>
        Il y a actuellement {{ novels.length }} novels stockés dans la base de donnée.<br />
        <button @click="flushCache">Vider le cacher</button>
        <button @click="eraseDatabase">Effacer la base de données</button>
      </p>
      <hr>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Novel, db } from '../lib/Database'

type SettingsPageData = {
  novels: Novel[]
}

export default Vue.extend({
  name: 'SettingsPage',
  data (): SettingsPageData {
    return {
      novels: []
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
          title: 'Cache',
          text: 'Le cache a bien été vidé !'
        })
        btn.disabled = false
      })
    },
    eraseDatabase (e: UIEvent) {
      const btn = e.target as HTMLButtonElement
      btn.disabled = true
      if (confirm('En nettoyant la base de données, vous perdrez toutes les données concernant vos positions de lectures et vos favoris.\nVoulez-vous continuer ?')) {
        const promises = [
          db.novels.clear(),
          db.chapters.clear()
        ]
        Promise.all(promises).then(_ => {
          this.$notify({
            group: 'main',
            title: 'Cache',
            text: 'La base de données a bien été effacé !'
          })
          db.novels.toArray().then(novels => {
            this.novels = novels
          })
          btn.disabled = false
        })
      }
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
