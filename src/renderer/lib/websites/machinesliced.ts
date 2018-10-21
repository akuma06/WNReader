import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteLoader, NovelResponse } from '../Website'
import { Novel, Chapter, Comment } from '../Database'

export default class MachineSliced implements WebsiteLoader {
  public get name (): string { return 'MachineSliced' }
  public get slug (): string { return 'machinesliced' }
  public get url (): string { return 'http://www.machineslicedbread.xyz/' }
  public get icon (): string { return 'http://www.machineslicedbread.xyz/wp-content/uploads/2015/11/cropped-sample-31576ff908bae4a26cdb26084bec6096-192x192.jpg?x56551' }

  public async getNovels (): Promise<Novel[]> {
    const result = await axios.get(this.url)
    const novels: Novel[] = []
    if (result.status === 200) {
      const $ = cheerio.load(result.data)
      $('.entry-content li a').each((i, el): void => {
        if ($(el).attr('href').match(this.url) !== null) {
          novels.push({
            website: this.slug,
            title: $(el).text(),
            url: $(el).attr('href'),
            cover: '',
            description: '',
            bookmarked: false,
            lastUpdate: new Date()
          })
        }
      })
    }
    return novels
  }
  public async getNovel (novel: Novel): Promise<NovelResponse> {
    console.assert(novel.id !== undefined, 'Novel id is not defined')
    const result = await axios.get(novel.url)
    const chapters: Chapter[] = []
    if (result.status === 200) {
      const $ = cheerio.load(result.data)
      $('.entry-content a').each((i, el): void => {
        if ($(el).attr('href').match(this.url) !== null) {
          const title = $(el).text()
          let prev = ''
          let index = chapters.length - 1
          if (index > 0) {
            chapters[index].next = title
            prev = chapters[index].title
          }
          chapters.push({
            title,
            content: '',
            lastUpdate: new Date(),
            novel: novel.id!,
            prev,
            url: $(el).attr('href')
          })
        }
      })
    }
    return { novel, chapters }
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
      chapter.title = $('.entry-title').text()
    }
    chapter.content = content
    return chapter
  }

  public async getComments (novel: Novel, chapter: Chapter): Promise<Comment[]> {
    return []
  }
}
