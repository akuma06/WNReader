import { Wordpress } from '../helpers/Wordpress'

export default class Pumlated extends Wordpress {
  public get name (): string { return 'Pumlated' }
  public get slug (): string { return 'pumlated' }
  public get url (): string { return 'https://pumlated.wordpress.com' }
  public useFeed = true

  public findDescription ($: CheerioStatic) {
    return $.html($('.entry-content > p:not(:has(img))').first().prev().nextUntil('h2,h3'))
  }
}
