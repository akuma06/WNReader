import Ehmed from './ehmed'
import MachineSliced from './machinesliced'
import { WebsiteLoader } from '../Website'
import GravityTales from './gravitytales'
import SnowyCodex from './snowycodex'
import YinTranslation from './yintranslation';
import Krytykal from './krytykal';

const websites: {
[websiteID: string]: WebsiteLoader
} = {
  [new Ehmed().slug]: new Ehmed(),
  [new GravityTales().slug]: new GravityTales(),
  [new MachineSliced().slug]: new MachineSliced(),
  [new YinTranslation().slug]: new YinTranslation(),
  [new Krytykal().slug]: new Krytykal(),
  [new SnowyCodex().slug]: new SnowyCodex()
}

export default websites
