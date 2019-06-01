import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteLoader, NovelResponse, WebsiteStyle, NoDataGivenException } from '../Website'
import { Novel, Chapter, Comment, db } from '../Database'
import Novels from '../Novels'
import Chapters from '../Chapters'

export interface SearchNovelData {
  abbreviation: string
  chapterCount: number
  coverUrl: string
  id: number
  language: string
  name: string
  slug: string
  status: number
  synopsis: string
  tags: string[]
  timeCreated: number
}

export interface SearchResponse {
  items: SearchNovelData[]
  result: boolean
  total: number
}

export default class WuxiaWorld implements WebsiteLoader {
  public get name (): string { return 'WuxiaWorld' }
  public get slug (): string { return 'wuxiaworld' }
  public get url (): string { return 'https://www.wuxiaworld.com' }
  public get icon (): string { return 'https://www.wuxiaworld.com/safari-pinned-tab.svg' }
  public style: WebsiteStyle = {
    name: { color: 'white', backgroundColor: '#2a2929' },
    iconHeader: { borderColor: '#2a2929', backgroundColor: 'white' },
    header: { backgroundColor: '#2a2929', color: 'white' },
    buttonHeader: { color: 'white', borderColor: 'white' }
  }

  public async getNovels (): Promise<Novel[]> {
    const novels = new Novels()
    try {
      const json = await axios.post(`${this.url}/api/novels/search`,
      {
        active: null,
        count: 300,
        searchAfter: 0,
        sortAsc: true,
        sortType: "Name",
        tags: [],
        title: ""
      })
      if (json.status === 200) {
        const result = json.data as SearchResponse
        if (result.result) {
          for (const item of result.items) {
            novels.add(item.name, this.slug, item.slug, item.synopsis, item.coverUrl, item.tags)
          }
        }
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
      const result = await axios.get(`${this.url}/novel/${novel.url}`)
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        novel.lastUpdate = new Date()
        $('#accordion .chapter-item a').each((i, el) => {
          const url = ($(el).attr('href').match(this.url) !== null) ? $(el).attr('href') : this.url + $(el).attr('href')
          chapters.add($(el).text(), novel.id!, url)
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
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        const contentHTML = $('.p-15 .fr-view').first().html()
        if (contentHTML !== null) {
          chapter.content = contentHTML
        }
      }
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
