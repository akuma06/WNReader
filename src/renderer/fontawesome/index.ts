import { library } from '@fortawesome/fontawesome-svg-core'
import { faComment, faArrowLeft, faHome, faExternalLinkAlt, faList } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import Vue from 'vue'

library.add(faComment, faArrowLeft, faHome, faExternalLinkAlt, faList)

export default Vue.component('font-awesome-icon', FontAwesomeIcon)
