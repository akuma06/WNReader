import { library } from '@fortawesome/fontawesome-svg-core'
import { faComment, faArrowLeft, faHome, faExpand, faList, faBookmark, faCog, faBookReader, faArrowRight, faSearch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import Vue from 'vue'

library.add(
  faComment,
  faArrowLeft,
  faArrowRight,
  faHome,
  faSearch,
  faExpand,
  faList,
  faBookmark,
  faCog,
  faBookReader
)

export default Vue.component('font-awesome-icon', FontAwesomeIcon)
