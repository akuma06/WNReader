import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteLoader, NovelResponse, WebsiteStyle } from '../Website'
import { Novel, Chapter, Comment, db } from '../Database'
import Novels from '../Novels'
import Chapters from '../Chapters'
import slugify from 'slugify'
import { getFeedEntries } from '../helpers/Wordpress'

/**
 * It seems we can't detect the novels easily on the website, better to do an array
 */
const fixedNovels: Partial<Novel>[] = [
  {
    title: 'Alice Tale in Phantasmagoria',
    url: 'https://nakedsingularitytrans.wordpress.com/category/alice-tale/feed/',
    cover: 'https://krytykal.org/wp-content/uploads/2014/10/Alice-300x425.jpg',
    description: `<p>Arisugawa Akito suddenly finds himself in another world and another body, namely the one of the game character he just created, a female named Alice. This was not the work of virtual reality technology.</p>
    <p>Join him as he struggles with the world, his new body and the puppies after his life as the dream of being the strongest feels suddenly far away…. as does being a man.</p>`
  },
  {
    title: 'I, a Demon Lord, Took a Slave Elf as My Wife, but How Do I Love Her?',
    url: 'https://nakedsingularitytrans.wordpress.com/category/elf-slave/',
    cover: `https://cdn.novelupdates.com/images/2017/11/I-the-Demon-Lord-Took-a-Slave-Elf-as-my-Wife-but-how-do-I-Love-Her.jpg`,
    description: `<p>Zagan is feared as an evil mage, he is awkward and has a sharp tongue, and once again had to put down thieves that encroached on his territory when he was researching that morning. In a dark auction, he finds a white slave elf, Nephie, who holds a peerless beauty.</p>
    <p>Falling in love with her at first sight, he uses his fortune to buy her, but as poor as he is socially, he doesn’t understand how to connect with her. Thus, the clumsy cohabitation of the mage that can’t convey his love, and the slave that pines for her master but doesn’t understand how to bring it up, begins.</p>`
  }
]

export default class NakedSingularity implements WebsiteLoader {
  public get name (): string { return 'Naked Singularity Trans' }
  public get slug (): string { return 'nakedsingularitytrans' }
  public get url (): string { return 'https://nakedsingularitytrans.wordpress.com' }
  public get icon (): string { return 'https://s1.wp.com/i/favicon.ico' }
  public style: WebsiteStyle = {
    iconHeader: { backgroundColor: 'white' }
  }

  public async getNovels (): Promise<Novel[]> {
    const novels = new Novels()
    fixedNovels.forEach(novel => novels.add(novel.title || '', this.slug, novel.url || '', novel.description, novel.cover))
    return novels.get()
  }

  public async getNovel (novel: Novel): Promise<NovelResponse> {
    console.assert(novel.id !== undefined, 'Novel id is not defined')
    const items = await getFeedEntries({ url: novel.url })
    const chapters = new Chapters()
    if (items.length > 0) {
      novel.lastUpdate = new Date()
      items.forEach(chapter => chapters.add(chapter.title, novel.id!, chapter.link))
    }
    return { novel, chapters: chapters.get() }
  }

  public async getChapter (novel: Novel, chapter: Chapter): Promise<Chapter> {
    const result = await axios.get(chapter.url)
    let content = ''
    if (result.status === 200) {
      const $ = cheerio.load(result.data)
      const contentHTML = $('.entry-content').html()
      if (contentHTML !== null) {
        content = contentHTML
      }
      if (chapter.title === '') {
        chapter.title = $('.entry-title').text()
        chapter.slug = slugify(chapter.title)
      }
    }
    chapter.content = content
    return chapter
  }

  public async getComments (novel: Novel, chapter: Chapter): Promise<Comment[]> {
    return []
  }
}
