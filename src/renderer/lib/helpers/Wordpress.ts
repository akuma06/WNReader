import * as cheerio from 'cheerio'
import Parser, { Items } from 'rss-parser'
import { WebsiteLoader, NovelResponse, WebsiteStyle, NoDataGivenException } from '../Website'
import { Novel, Chapter, Comment, db } from '../Database'
import Chapters from '../Chapters'
import slugify from 'slugify'
import Axios from 'axios'
import Novels from '../Novels'

type FeedEntriesRequest = {
  url?: string
  host?: string
  category?: string
  page?: number
  maxEntries?: number
}

function generateFeedURL (params: FeedEntriesRequest): string {
  let url = ''
  if (params.url !== undefined) {
    url = params.url
  } else if (params.host !== undefined) {
    url = params.host
    if (params.category !== undefined) {
      url += `/category/${params.category}`
    }
    url += '/feed/'
  }
  return url
}

async function getEntries (url: string, page: number = 1, maxEntries: number = 10): Promise<Items[]> {
  const items: Items[] = []
  try {
    const feed = await new Parser().parseURL(`${url}?paged=${page}`)
    if (feed.items.length === maxEntries) {
      page++
      items.push(...await getEntries(url, page))
    }
    feed.items.reverse()
    items.push(...feed.items)
  } catch (e) {
    console.error(e)
    return []
  }
  return items
}

export async function getFeedEntries (params: FeedEntriesRequest): Promise<Items[]> {
  const url = generateFeedURL(params)
  if (url !== '') {
    const items = await getEntries(url, params.page, params.maxEntries)
    return items
  }
  return []
}

export class Wordpress implements WebsiteLoader {
  public getNovelsFromMenu ($: CheerioStatic) {
    return $('.menu')
      .first()
      .find('li > a')
      .filter((i, el) => $(el).text().match(/(?:about|home|other|original|teaser)/i) === null)
  }
  public findCover ($: CheerioStatic) {
    return $('.entry-content img').first().attr('src')
  }
  public findDescription ($: CheerioStatic) {
    return $('.entry-content > p').text()
  }
  public findNovelTitle ($: CheerioStatic) {
    return $('.entry-title').text()
  }
  /**
   * findChapterTitle
   */
  public findChapterTitle ($: CheerioStatic) {
    return this.findNovelTitle($)
  }
  /**
   * findChapterContent
   */
  public findChapterContent ($: CheerioStatic) {
    return $('.entry-content').html()
  }
  public getCategory (url: string) {
    return url.replace(/\/$/, '').split('/').pop()
  }
  public async getNovels (): Promise<Novel[]> {
    const novels = new Novels()
    try {
      const result = await Axios.get(this.url)
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        await Promise.all(this.getNovelsFromMenu($).toArray().map(link => Promise.resolve().then(() => {
          const url = ($(link).attr('href').match(this.url) !== null) ? $(link).attr('href') : this.url + $(link).attr('href')
          return Axios.get(url)
        }).then(result => {
          if (result.status === 200 && result.config.url) {
            const $ = cheerio.load(result.data)
            const cover = this.findCover($)
            const description = this.findDescription($)
            const novelUrl = (this.useFeed) ? `${this.url}/category/${this.getCategory(result.config.url)}/feed/` : result.config.url
            const novelTitle = this.findNovelTitle($)

            return novels.add(novelTitle, this.slug, novelUrl, description, cover)
          }
          return ''
        })))
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
    const items = await getFeedEntries({ url: novel.url, maxEntries: this.nbEntries })
    if (items.length > 0) {
      novel.lastUpdate = new Date()
      items.forEach(chapter => chapters.add(chapter.title, novel.id!, chapter.link))
    } else {
      throw NoDataGivenException
    }
    return { novel, chapters: chapters.get() }
  }
  public async getChapter (novel: Novel, chapter: Chapter): Promise<Chapter> {
    try {
      const result = await Axios.get(chapter.url)
      let content = ''
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        const contentHTML = this.findChapterContent($)
        if (contentHTML !== null) {
          content = contentHTML
        }
        if (chapter.title === '') {
          chapter.title = this.findChapterTitle($)
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
    const comments: Comment[] = []
    try {
      const result = await Axios.get(`${chapter.url}`)
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        $('.comment-list  .comment-body').each((i, el): void => {
          comments.push({
            avatar: $(el).find('> .comment-meta > .comment-author img').attr('src'),
            username: $(el).find('> .comment-meta > .comment-author a').first().text(),
            content: $.html($(el).find('> .comment-content > p:not(.comment-likes)')),
            date: $(el).find('> .comment-meta > .comment-metadata').first().text()
          })
        })
      }
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    return comments
  }
  public get name (): string {
    return 'Wordpress.com Blog'
  }
  public get url (): string {
    return ''
  }
  public get slug (): string {
    return ''
  }
  public get icon (): string {
    return 'https://s1.wp.com/i/favicon.ico'
  }
  public useFeed: boolean = true
  public nbEntries: number = 10
  public style: WebsiteStyle = {};
}
