import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteLoader, NovelResponse, WebsiteStyle, NoDataGivenException } from '../Website'
import { Novel, Chapter, Comment } from '../Database'
import Novels from '../Novels'
import Chapters from '../Chapters'
import slugify from 'slugify'

export default class BcatTranslations implements WebsiteLoader {
  public get name (): string { return 'Bcat00 Translations' }
  public get slug (): string { return 'bcatranslation' }
  public get url (): string { return 'https://bcatranslation.com' }
  public get icon (): string { return 'https://bcatranslation.com/wp-content/uploads/2018/05/cropped-cropped-doraemon-192x192.jpg' }
  public style: WebsiteStyle = {}

  public async getNovels (): Promise<Novel[]> {
    const novels = new Novels()
    try {
      const result = await axios.get(this.url)
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        $('#menu-menu > li').eq(2).find('ul > li > a').each((i, el): void => {
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
        novel.description = $('.entry-content').text().replace(/table of content[^]+$/ig, '')
        novel.lastUpdate = new Date()

        const links = $('.entry-content a').toArray()
        for (let el of links) {
          if ($(el).text().match(/chapter|prologue|volume|ch\.|vol/i) !== null) {
            const url = ($(el).attr('href').match(this.url) !== null) ? $(el).attr('href') : this.url + $(el).attr('href')
            const title = $(el).text()
            chapters.add(title, novel.id!, url)
          } else if ($(el).text().match(/index/i) !== null) {
            const indexUrl = ($(el).attr('href').match(this.url) !== null) ? $(el).attr('href') : this.url + $(el).attr('href')
            const index = await axios.get(indexUrl)
            if (index.status === 200) {
              const $ = cheerio.load(index.data)
              $('.entry-content a').each((i, el) => {
                if ($(el).text().match(/chapter|prologue|volume|ch\.|vol/i) !== null) {
                  const url = ($(el).attr('href').match(this.url) !== null) ? $(el).attr('href') : this.url + $(el).attr('href')
                  const title = $(el).text()
                  chapters.add(title, novel.id!, url)
                }
              })
            }
          }
        }
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
        $('.comment-list li').each((i, el): void => {
          comments.push({
            avatar: $(el).find('> .comment-body > .comment-meta > .comment-author > img').first().attr('src'),
            username: $(el).find('> .comment-body > .comment-meta > .comment-author > .fn').first().text(),
            content: $(el).find('> .comment-body > .comment-content').first().html() || '',
            date: $(el).find('> .comment-body > .comment-meta > .comment-metadata').first().text()
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
