import Ehmed from './ehmed'
import MachineSliced from './machinesliced'
import { WebsiteLoader } from '../Website'
import GravityTales from './gravitytales'
import SnowyCodex from './snowycodex'

const websites: {
[websiteID: string]: WebsiteLoader
} = {
  [new Ehmed().slug]: new Ehmed(),
  [new GravityTales().slug]: new GravityTales(),
  [new MachineSliced().slug]: new MachineSliced(),
  [new SnowyCodex().slug]: new SnowyCodex()
}

export default websites
