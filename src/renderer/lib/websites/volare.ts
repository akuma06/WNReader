import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteLoader, NovelResponse, WebsiteStyle, NoDataGivenException } from '../Website'
import { Novel, Chapter, Comment, db } from '../Database'
import Novels from '../Novels'
import Chapters from '../Chapters'
import WuxiaWorld, { SearchResponse } from './wuxiaworld';

export default class Volare extends WuxiaWorld implements WebsiteLoader {
  public get name (): string { return 'Volare' }
  public get slug (): string { return 'volare' }
  public get url (): string { return 'https://www.volarenovels.com' }
  public get icon (): string { return 'https://www.volarenovels.com/images/logo-no-text.svg' }
  public style: WebsiteStyle = {
    name: { color: 'white', backgroundColor: '#8e44ad' },
    iconDashboard: { backgroundColor: '#8e44ad' }, 
    iconHeader: { borderColor: '#8e44ad', backgroundColor: '#8e44ad' },
    header: { backgroundColor: '#8e44ad', color: 'white' },
    buttonHeader: { color: 'white', borderColor: 'white' }
  }

  public async getNovels (): Promise<Novel[]> {
    const novels = new Novels()
    try {
      const json = await axios.post(`${this.url}/api/novels/search`,
      {
        active: null,
        language: null,
        count: 300,
        searchAfter: null,
        sortAsc: true,
        sortType: "Name",
        tags: [],
        title: ""
      })
      if (json.status === 200) {
        const result = json.data as SearchResponse
        if (result.result) {
          for (const item of result.items) {
            const tags = (item.status === 2) ? ["Completed", ...item.tags] : item.tags
            const cover = (item.coverUrl !== null) ? item.coverUrl : ''
            novels.add(item.name, this.slug, item.slug, item.synopsis, cover, tags)
          }
        }
      }
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    return novels.get()
  }

  public async getChapter (novel: Novel, chapter: Chapter): Promise<Chapter> {
    try {
      const result = await axios.get(chapter.url)
      let content = ''
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        const contentHTML = $('.panel-body > .fr-view').first().html()
        if (contentHTML !== null) {
          content = contentHTML
        }
        if (chapter.title === '') {
          chapter.title = $('.panel-body > .caption').first().text()
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
