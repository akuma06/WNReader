import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteLoader, NovelResponse, WebsiteStyle, NoDataGivenException } from '../Website'
import { Novel, Chapter, Comment, db } from '../Database'
import Novels from '../Novels'
import Chapters from '../Chapters'
import slugify from 'slugify'

export default class SnowyCodex implements WebsiteLoader {
  public get name (): string { return 'Snowy Codex' }
  public get slug (): string { return 'snowycodex' }
  public get url (): string { return 'http://snowycodex.com' }
  public get icon (): string { return 'https://i2.wp.com/snowycodex.com/wp-content/uploads/2017/02/Logo.png' }
  public style: WebsiteStyle = {
    name: { color: '#630000', backgroundColor: '#ffeedd' },
    header: { color: '#630000', backgroundColor: '#ffeedd' },
    iconHeader: { borderColor: '#ffeedd', backgroundColor: '#ffeedd' }
  }

  public async getNovels (): Promise<Novel[]> {
    const novels = new Novels()
    try {
      const result = await axios.get(this.url + '/translations/novels/')
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        $('.entry-content h2 a').each((i, el): void => {
          const url = ($(el).attr('href').match(this.url) !== null) ? $(el).attr('href') : this.url + $(el).attr('href')
          const description = $.html($(el).parent().next().nextUntil('hr,div'))
          const title = $(el).text()
          if (title !== '*') {
            const slug = novels.add(title, this.slug, url, description)
            axios.get(url).then(result => {
              if (result.status === 200) {
                const $ = cheerio.load(result.data)
                db.novels.get({ slug }).then(novel => {
                  if (novel !== undefined && novel.id) {
                    db.novels.update(novel.id, { cover: $('.entry-content img').first().attr('src') })
                  }
                })
              }
            })
          }
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
        novel.cover = $('.entry-content img').first().attr('src')
        novel.lastUpdate = new Date()

        $('.entry-content a').each((i, el): void => {
          if ($(el).attr('href').match(novel.url) !== null) {
            chapters.add($(el).text(), novel.id!, $(el).attr('href'), '')
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
