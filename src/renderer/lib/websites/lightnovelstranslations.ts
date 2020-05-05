import axios from 'axios'
import * as cheerio from 'cheerio'
import { WebsiteLoader, NovelResponse, WebsiteStyle, NoDataGivenException } from '../Website'
import { Novel, Chapter, Comment, db } from '../Database'
import Novels from '../Novels'
import Chapters from '../Chapters'
import { Wordpress, getFeedEntries, getEntries } from '../helpers/Wordpress'
import slugify from 'slugify'
import { sanitize } from '../helpers/sanitizer'

export default class LightNovelsTranslations extends Wordpress implements WebsiteLoader {
  public get name (): string { return 'Light Novels Translations' }
  public get slug (): string { return 'lightnovelstranslations' }
  public get url (): string { return 'https://lightnovelstranslations.com/' }
  public get icon (): string { return 'https://lightnovelstranslations.com/wp-content/uploads/2017/02/favicon.png' }
  public overrideChapterTitle = true
  public useFeed = false
  public style: WebsiteStyle = {
    name: { color: 'white', backgroundColor: '#3A3B3D' },
    iconHeader: { borderColor: '#3A3B3D' },
    header: { backgroundColor: '#3A3B3D', color: 'white' },
    buttonHeader: { color: 'white', borderColor: 'white' }
  }

  public async getNovel (novel: Novel): Promise<NovelResponse> {
    console.assert(novel.id !== undefined, 'Novel id is not defined')
    const chapters = new Chapters()
    const result = await axios.get(novel.url)
    if (result.status === 200) {
      const $ = cheerio.load(result.data)
      const option = $('#categories-2 option').filter((i, el) => {
        return $(el).text().replace(/\([0-9]+\)$/, '').trim().split(' ').every(name => novel.title.match(new RegExp(name, 'i')) !== null)
      }).first().attr('value')
      if (option !== '') {
        const url = `${this.url}/feed?cat=${option}&`
        const items = await getEntries(url, 1, this.nbEntries)
        if (items.length > 0) {
          novel.lastUpdate = new Date()
          await Promise.all(items.map(chapter => Promise.resolve(axios.get(chapter.link)).then(result => {
            console.log(chapter.link)
            if (result.status === 200) {
              const $ = cheerio.load(result.data)
              const links = $('.entry-content a').filter((i, el) => $(el).attr('href').match(novel.url) !== null).toArray()
              if (links.length === 1) {
                chapters.add(chapter.title, novel.id!, links[0].attribs['href'])
              } else {
                links.forEach((link, i) => {
                  chapters.add(chapter.title + ' p' + i, novel.id!, link.attribs['href'])
                })
              }
            }
          })))
        } else {
          throw NoDataGivenException
        }
      }
    } else {
      throw NoDataGivenException
    }
    return { novel, chapters: chapters.get() }
  }

  public async getComments (novel: Novel, chapter: Chapter): Promise<Comment[]> {
    const comments: Comment[] = []
    try {
      const result = await axios.get(`${chapter.url}`)
      if (result.status === 200) {
        const $ = cheerio.load(result.data)
        $('.commentlist  .comment').each((i, el): void => {
          comments.push({
            avatar: $(el).find('> div > .comment-author > .avatar-container img').attr('src'),
            username: $(el).find('> div > .comment-author > .comment-details > cite').first().text(),
            content: $.html($(el).find('> div > .comment-body > p')),
            date: $(el).find('> div > .comment-author > .comment-details > .comment-meta').first().text()
          })
        })
      }
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    return comments
  }
  public async getChapter (novel: Novel, chapter: Chapter): Promise<Chapter> {
    try {
      const result = await axios.get(chapter.url)
      let content = ''
      if (result.status === 200) {
        const $ = cheerio.load(sanitize(result.data))
        const contentHTML = this.findChapterContent($)
        if (contentHTML !== null) {
          content = contentHTML
        }
        if (this.overrideChapterTitle || chapter.title === '') {
          chapter.title = this.findChapterTitle($)
          chapter.slug = slugify(chapter.title)
        }
        const next = $('.entry-content .alignright a').first().attr('href')
        const prev = $('.entry-content .alignleft a').first().attr('href')
        if (next !== undefined && next !== '') {
          if (chapter.next !== undefined) {
            db.chapters.get({ slug: chapter.next }).then(nextChapter => {
              if (nextChapter !== undefined && nextChapter.url !== next) {
                db.chapters.update(nextChapter.id!, { prev: next })
              }
            })
          }
          chapter.next = next
        }
        if (prev !== undefined && prev !== '') {
          if (chapter.prev !== undefined) {
            db.chapters.get({ slug: chapter.prev }).then(prevChapter => {
              if (prevChapter !== undefined && prevChapter.url !== prev) {
                db.chapters.update(prevChapter.id!, { next: prev })
              }
            })
          }
          chapter.prev = prev
        }
      }
      chapter.content = content
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    return chapter
  }

  public getNovelsFromMenu ($: CheerioStatic) {
    return $('#prime_nav > li')
      .eq(1)
      .find('li > a')
      .filter((i, el) => $(el).attr('href').match(/#$/) === null && $(el).text().match(/(?:about|home|other|original|teaser|illustration)/i) === null)
  }
}
