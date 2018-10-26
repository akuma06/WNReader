import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteLoader, NovelResponse, WebsiteStyle } from '../Website'
import { Novel, Chapter, Comment } from '../Database'
import Novels from '../Novels'
import Chapters from '../Chapters'

export default class GravityTales implements WebsiteLoader {
  public get name (): string { return 'Gravity Tales' }
  public get slug (): string { return 'gravitytales' }
  public get url (): string { return 'http://gravitytales.com/' }
  public get icon (): string { return 'http://gravitytales.com/favicon.ico' }
  public style: WebsiteStyle = {
    iconHeader: { backgroundColor: 'white' }
  }

  public async getNovels (): Promise<Novel[]> {
    const result = await axios.get(this.url)
    const novels = new Novels()
    if (result.status === 200) {
      const $ = cheerio.load(result.data)
      $('.nav .dropdown-menu').first().find('a').each((i, el): void => {
        const url = ($(el).attr('href').match(this.url) !== null) ? $(el).attr('href') : this.url + $(el).attr('href')
        const slug = url.replace(/^.+\/novel\/(.+)$/i, '$1')
        novels.add($(el).text(), this.slug, url, '', `https://cdn.gravitytales.com/images/covers/${slug}.jpg`)
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
      novel.description = $.html($('.desc')
        .find('hr')
        .next()
        .nextAll())
      novel.cover = $('#coverImg').first().css('background-image').replace(/^url\("*([a-z0-9/:\-.]+)(?:\?[a-z=0-9]+)*"*\)$/i, '$1')
      novel.lastUpdate = new Date()
      const chaptersResult = await axios.get(`${novel.url}/chapters`)
      if (chaptersResult.status === 200) {
        const $ = cheerio.load(chaptersResult.data)
        $('tbody a').each((i, el): void => {
          const url = ($(el).attr('href').match(this.url) !== null) ? $(el).attr('href') : this.url + $(el).attr('href')
          chapters.add($(el).text(), novel.id!, url)
        })
      }
    }
    return { novel, chapters: chapters.get() }
  }

  public async getChapter (novel: Novel, chapter: Chapter): Promise<Chapter> {
    const result = await axios.get(chapter.url)
    let content = ''
    if (result.status === 200) {
      const $ = cheerio.load(result.data)
      const contentHTML = $('#chapterContent').html()
      if (contentHTML !== null) {
        content = contentHTML
      }
      if (chapter.next === undefined || chapter.prev === undefined) {
        $('.chapter-navigation a').each((i, el): void => {
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
    const result = await axios.get(`${chapter.url}/comments`)
    const comments: Comment[] = []
    if (result.status === 200) {
      const $ = cheerio.load(result.data)
      $('.comment-wrapper').each((i, el): void => {
        comments.push({
          avatar: '',
          username: $(el).find('p.comment-poster').first().text(),
          content: $(el).find('div.commentContent').first().html() || '',
          date: $(el).find('div.comment-info').first().text()
        })
      })
    }
    return comments
  }
}
