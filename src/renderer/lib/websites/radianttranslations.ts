import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteLoader, NovelResponse, WebsiteStyle, NoDataGivenException } from '../Website'
import { Novel, Chapter, Comment } from '../Database'
import Novels from '../Novels'
import Chapters from '../Chapters'
import slugify from 'slugify'

export default class RadiantTranslations implements WebsiteLoader {
  public get name (): string { return 'Radiant Translations' }
  public get slug (): string { return 'radianttranslations' }
  public get url (): string { return 'http://www.radianttranslations.com' }
  public get icon (): string { return require('../../assets/icon_books.png') }
  public style: WebsiteStyle = {}

  public async getNovels (): Promise<Novel[]> {
    const novels = new Novels()
    try {
      const result = await axios.get(this.url + '/novel/')
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        $('.entry-content a').each((i, el): void => {
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
        novel.cover = $('.entry-content img').eq(0).attr('src')
        const tags: CheerioElement[] = []
        novel.description = $('.entry-content').text().replace(/Chapter.+/g, '')
        novel.lastUpdate = new Date()

        $('.entry-content a').each((i, el): void => {
          if ($(el).text().match(/chapter|prologue|volume|ch\.|vol/i) !== null) {
            const url = ($(el).attr('href').match(this.url) !== null) ? $(el).attr('href') : this.url + $(el).attr('href')
            const title = $(el).text()
            chapters.add(title, novel.id!, url)
          }
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
        const contentHTML = $.html($('.entry-content > *:not(.code-block)'))
        if (contentHTML !== null) {
          content = contentHTML
        }

        if (chapter.title === '') {
          chapter.title = $('.entry-title').text()
          chapter.slug = slugify(chapter.title)
        }
        if (chapter.next === undefined) {
          const next = $('.entry-content a').filter((i, el) => $(el).text().match(/next/i) !== null)
          if (next.length > 0) {
            chapter.next = next.attr('href')
          }
        }
        if (chapter.prev === undefined) {
          const prev = $('.entry-content a').filter((i, el) => $(el).text().match(/prev/i) !== null)
          if (prev.length > 0) {
            chapter.prev = prev.attr('href')
          }
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
    const comments: Comment[] = []
    try {
      const result = await axios.get(`${chapter.url}`)
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        $('.x-comments-list li').each((i, el): void => {
          comments.push({
            avatar: $(el).find('> .x-comment-img img').first().attr('src'),
            username: $(el).find('> article > .x-comment-header > .x-comment-author').first().text(),
            content: $(el).find('> article > .x-comment-content').first().html() || '',
            date: $(el).find('> article > .x-comment-header > div > .x-comment-time').first().text()
          })
        })
      }
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    return comments
  }
}
