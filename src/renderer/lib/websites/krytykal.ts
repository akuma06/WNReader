import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteLoader, NovelResponse, WebsiteStyle } from '../Website'
import { Novel, Chapter, Comment } from '../Database'
import Novels from '../Novels'
import Chapters from '../Chapters'

export default class Krytykal implements WebsiteLoader {
  public get name (): string { return 'Krytyk\'s translations' }
  public get slug (): string { return 'krytykal' }
  public get url (): string { return 'https://krytykal.org' }
  public get icon (): string { return 'https://krytykal.org/wp-content/uploads/2015/02/favicon.ico' }
  public style: WebsiteStyle = {
    iconHeader: { backgroundColor: 'white' }
  }

  public async getNovels (): Promise<Novel[]> {
    const result = await axios.get(this.url)
    const novels = new Novels()
    if (result.status === 200) {
      const $ = cheerio.load(result.data)
      const indexes: string[] = await Promise
        .all($('.nav-menu > ul > li > a')
          .toArray()
          .filter(el => $(el).text().match(/(?:about|teasers|others)/i) === null)
          .map(el => Promise
            .resolve(axios.get($(el).attr('href')))
            .then(novelResult => {
              if (novelResult.status === 200) {
                const $ = cheerio.load(novelResult.data)
                let title = ''
                const link = novelResult.config.url || ''
                if ($('.entry-content p:not(.wp-caption-text)').first().find('> strong').length > 0) {
                  title = $('.entry-content p:not(.wp-caption-text)').first().find('> strong').first().text()
                } else {
                  title = $('.entry-content p:not(.wp-caption-text)').first().text()
                }
                title = title.replace(/["\n]/g, '').replace(/^([\w?!\- ]*[\w\-?!]+) *\(.+$/i, '$1')
                const description = $.html(
                  (
                    ($('#Story_Synopsis').text() !== '') ? $('#Story_Synopsis') : $('.entry-content > p > strong,.entry-content > h3 strong')
                  )
                    .closest('p,h3,h2')
                    .nextUntil('hr')
                    .each((_, p) => $(p).html($(p).text()))
                )
                const cover = $('.entry-content img').first().attr('src')
                return novels.add(title, this.slug, link, description, cover)
              }
              return ''
            })
          )
        )
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
      $('.entry-content h3').each((i, el) => {
        const titlePrefix = (($(el).text().match(/part/i) !== null) ? $(el).prevAll('h2').first().text() : $(el).text()).replace(/[[(][\w ]+[\])]/ig, '').replace(/\s+$/g, '')
        $(el).nextUntil('h3').filter('ul').find('li').each((_, c) => {
          const url = $(c).find('a').first().attr('href')
          const title = `${titlePrefix} - ${$(c).text()}`
          chapters.add(title, novel.id!, url)
        })
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
