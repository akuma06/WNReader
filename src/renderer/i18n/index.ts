import { readdirSync } from 'fs'
import { basename, parse } from 'path'
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import { getSettings } from '../lib/Settings'

Vue.use(VueI18n)

type keyvalue = {
  [key: string]: string
}

const messages: {
[lang: string]: keyvalue
} = {}

const availableLangs: Map<string, string> = new Map()

readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename(__filename)) && (file.slice(-5) === '.json')
  })
  .forEach(file => {
    // eslint-disable-next-line
    const message = require(`./${file}`)
    const lg = parse(file).name
    messages[lg] = message
    availableLangs.set(lg, (message as keyvalue)['lang'])
  })

console.log(messages)

const i18n = new VueI18n({
  locale: getSettings().lang, // set locale
  fallbackLocale: 'en',
  messages // set locale messages
})

export const langs = availableLangs
export default i18n
