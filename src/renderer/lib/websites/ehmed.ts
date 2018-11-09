import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteLoader, NovelResponse, WebsiteStyle, NoDataGivenException } from '../Website'
import { Novel, Chapter, Comment } from '../Database'
import Novels from '../Novels'
import Chapters from '../Chapters'
import slugify from 'slugify'

export default class Ehmed implements WebsiteLoader {
  public get name (): string { return 'Ehmed' }
  public get slug (): string { return 'ehmed' }
  public get url (): string { return 'https://www.ehmed.xyz' }
  public get icon (): string { return 'https://www.ehmed.xyz/wp-content/uploads/2018/06/cropped-guy-anime-clipart-12-270x270.jpg' }
  public style: WebsiteStyle = {}

  public async getNovels (): Promise<Novel[]> {
    const novels = new Novels()
    try {
      const result = await axios.get(this.url + '/translated/')
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        $('.entry-content strong a').each((i, el): void => {
          const url = ($(el).attr('href').match(this.url) !== null) ? $(el).attr('href') : this.url + $(el).attr('href')
          const title = $(el).text()
          novels.add(title, this.slug, url)
        })
      }
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    return novels.get()
  }

  public async getNovel (novel: Novel): Promise<NovelResponse> {
    console.assert(novel.id !== undefined, 'Novel id is not defined')
    const chapters = new Chapters()
    try {
      const result = await axios.get(novel.url)
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        novel.description = $.html($($('.entry-content')
          .find('h2,h3')
          .toArray()
          .find((el: CheerioElement): boolean => $(el).text().match(/synopsis/i) !== null))
          .next()
          .nextUntil('hr'))
        novel.lastUpdate = new Date()

        $('.entry-content strong a').each((i, el): void => {
          const url = ($(el).attr('href').match(this.url) !== null) ? $(el).attr('href') : this.url + $(el).attr('href')
          const title = $(el).text()
          chapters.add(title, novel.id!, url)
        })
      }
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    return { novel, chapters: chapters.get() }
  }

  public async getChapter (novel: Novel, chapter: Chapter): Promise<Chapter> {
    try {
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
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    return chapter
  }

  public async getComments (novel: Novel, chapter: Chapter): Promise<Comment[]> {
    return []
  }
}
