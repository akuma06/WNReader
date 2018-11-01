import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteLoader, NovelResponse, WebsiteStyle } from '../Website'
import { Novel, Chapter, Comment } from '../Database'
import Novels from '../Novels'
import Chapters from '../Chapters'

export default class YinTranslation implements WebsiteLoader {
  public get name (): string { return 'Yin Translation' }
  public get slug (): string { return 'yintranslation' }
  public get url (): string { return 'https://yintranslations.com' }
  public get icon (): string { return 'https://i2.wp.com/yintranslations.com/wp-content/uploads/2018/07/cropped-Favicon.png' }
  public style: WebsiteStyle = {
    iconHeader: { backgroundColor: 'white' }
  }

  public async getNovels (): Promise<Novel[]> {
    const result = await axios.get(`${this.url}/web-novel-translations/`)
    const novels = new Novels()
    if (result.status === 200) {
      const $ = cheerio.load(result.data)
      $('.entry-content h3').each((i, el) => {
        const link = $('#menu-item-848 a').toArray().find(e => $(e).text() === $(el).text())
        const url = ($(link).attr('href').match(this.url) !== null) ? $(link).attr('href') : this.url + $(el).attr('href')
        novels.add($(el).text(), this.slug, url)
      })
    }
    return novels.get()
  }

  public async getNovel (novel: Novel): Promise<NovelResponse> {
    console.assert(novel.id !== undefined, 'Novel id is not defined')
    const result = await axios.get(novel.url)
    const chapters = new Chapters()
    if (result.status === 200) {
      const $ = cheerio.load(result.data)
      novel.cover = $('.entry-content img').first().attr('src')
      novel.lastUpdate = new Date()
      $('.entry-content a').each((i, el) => {
        if ($(el).attr('href').match(this.url) !== null) {
          const url = ($(el).attr('href').match(this.url) !== null) ? $(el).attr('href') : this.url + $(el).attr('href')
          chapters.add(`Chapter ${chapters.length + 1}`, novel.id!, url)
        }
      })
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
      if (chapter.next === undefined || chapter.prev === undefined) {
        $('.entry-content a').each((i, el): void => {
          if (chapter.next === undefined && $(el).text().match(/next/i) !== null) {
            chapter.next = $(el).attr('href')
          }
          if (chapter.prev === undefined && $(el).text().match(/prev/i) !== null) {
            chapter.prev = $(el).attr('href')
          }
        })
      }
    }
    chapter.content = content
    return chapter
  }

  public async getComments (novel: Novel, chapter: Chapter): Promise<Comment[]> {
    return []
  }
}
