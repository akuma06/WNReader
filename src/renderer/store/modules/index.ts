/**
 * The file enables `@/store/index.ts` to import all vuex modules
 * in a one-shot manner. There should not be any reason to edit this file.
 */

const files = require.context('.', false, /\.js$/)
const modules: {
[key: string]: any
} = {}

files.keys().forEach((key: string): void => {
  if (key === './index.ts') return
  modules[key.replace(/(\.\/|\.js)/g, '')] = files(key).default
})

export default modules
