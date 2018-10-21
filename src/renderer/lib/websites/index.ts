import Ehmed from './ehmed'
import MachineSliced from './machinesliced'
import { WebsiteLoader } from '../Website'
import GravityTales from './gravitytales';

const websites: {
[websiteID: string]: WebsiteLoader
} = {
  [new Ehmed().slug]: new Ehmed(),
  [new GravityTales().slug]: new GravityTales(),
  [new MachineSliced().slug]: new MachineSliced()
}

export default websites
