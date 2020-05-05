import Ehmed from './ehmed'
import MachineSliced from './machinesliced'
import { WebsiteLoader } from '../Website'
import GravityTales from './gravitytales'
import SnowyCodex from './snowycodex'
import YinTranslation from './yintranslation'
import Krytykal from './krytykal'
import NakedSingularity from './nakedsingularitytrans'
import Pumlated from './pumlated'
import Webnovel from './webnovel'
import ReadLightNovel from './readligthnovel'
import Volare from './volare'
import LightNovelsTranslations from './lightnovelstranslations'
import RadiantTranslations from './radianttranslations'
import BcatTranslations from './bcatranslation'
import WuxiaWorld from './wuxiaworld'

const websites: {
[websiteID: string]: WebsiteLoader
} = {
  [new BcatTranslations().slug]: new BcatTranslations(),
  [new Ehmed().slug]: new Ehmed(),
  [new GravityTales().slug]: new GravityTales(),
  [new Krytykal().slug]: new Krytykal(),
  [new LightNovelsTranslations().slug]: new LightNovelsTranslations(),
  [new MachineSliced().slug]: new MachineSliced(),
  [new NakedSingularity().slug]: new NakedSingularity(),
  [new Pumlated().slug]: new Pumlated(),
  [new RadiantTranslations().slug]: new RadiantTranslations(),
  [new ReadLightNovel().slug]: new ReadLightNovel(),
  [new SnowyCodex().slug]: new SnowyCodex(),
  [new Volare().slug]: new Volare(),
  [new Webnovel().slug]: new Webnovel(),
  [new WuxiaWorld().slug]: new WuxiaWorld(),
  [new YinTranslation().slug]: new YinTranslation()
}

export default websites
