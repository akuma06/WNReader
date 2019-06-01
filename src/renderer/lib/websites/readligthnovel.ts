import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteLoader, NovelResponse, WebsiteStyle, NoDataGivenException } from '../Website'
import { Novel, Chapter, Comment } from '../Database'
import Novels from '../Novels'
import Chapters from '../Chapters'

export default class ReadLightNovel implements WebsiteLoader {
  public get name (): string { return 'Read Light Novel' }
  public get slug (): string { return 'readlightnovel' }
  public get url (): string { return 'https://www.readlightnovel.org/' }
  public get icon (): string { return 'https://www.readlightnovel.org/favicon.ico' }
  public get novelsPerPage (): number {
    return 50
  }

  public style: WebsiteStyle = {
    iconHeader: { backgroundColor: 'white' },
    header: { backgroundColor: '#ee294d', color: 'white' },
    name: { backgroundColor: '#ee294d', color: 'white' },
    buttonHeader: { color: 'white', borderColor: 'white' }
  }

  public async getNovels (): Promise<Novel[]> {
    const novels = new Novels()
    try {
      const result = await axios.get(`${this.url}/novel-list`)
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        $('.list-by-word-body ul li').each((i, el): void => {
          const link = $(el).find('a')
          const url = (link.attr('href').match(this.url) !== null) ? link.attr('href') : this.url + link.attr('href')
          const src = $(el).find('.pop-cover img').attr('src')
          novels.add($(el).text(), this.slug, url, '', src)
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
        novel.description = $.html($('.novel-right .novel-detail-body').first()
          .children())
        novel.lastUpdate = new Date()
        $('.chapters .panel').each((i, el) => {
          const volume = $(el).find('.panel-title').text()
          $(el).find('.chapter-chs a').each((_, c) => {
            const url = $(c).attr('href')
            const title = $(c).text()
            chapters.add(`${volume} - ${title}`, novel.id!, url)
          })
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
        const contentHTML = $('.desc').html()
        if (contentHTML !== null) {
          content = contentHTML
        }
        if (chapter.next === undefined && $('.chapter-actions .next').length > 0) {
          chapter.next = $('.chapter-actions .prev').first().attr('href')
        }
        if (chapter.prev === undefined && $('.chapter-actions .next').length > 0) {
          chapter.prev = $('.chapter-actions .prev').first().attr('href')
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
    return comments
  }
}
