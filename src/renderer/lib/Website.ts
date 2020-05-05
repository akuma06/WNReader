import { db, Novel, Chapter, Comment } from './Database'
import { getSettings } from './Settings';
(Symbol as any).asyncIterator = Symbol.asyncIterator || Symbol.for('Symbol.asyncIterator')

export type WebsiteStyle = {
  readonly name?: Partial<CSSStyleDeclaration>
  readonly header?: Partial<CSSStyleDeclaration>
  readonly iconDashboard?: Partial<CSSStyleDeclaration>
  readonly iconHeader?: Partial<CSSStyleDeclaration>
  readonly buttonHeader?: Partial<CSSStyleDeclaration>
}

export const NoDataGivenException = Error('No data given')

export interface WebsiteLoader {
  getNovels(): Promise<Novel[]>
  getNovel(novel: Novel): Promise<NovelResponse>
  getChapter(novel: Novel, chapter: Chapter): Promise<Chapter>
  getComments(novel: Novel, chapter: Chapter): Promise<Comment[]>
  readonly name: string
  readonly url: string
  readonly slug: string
  readonly icon: string
  readonly style: WebsiteStyle
  readonly novelsPerPage?: number
}

export type WebsiteParameters = {
  novel?: string
  website: WebsiteLoader
}

export interface NovelResponse {
  novel: Novel
  chapters: Chapter[]
}

export interface ChapterResponse {
  novel: Novel
  chapter: Chapter
  chapters: Chapter[]
}

export default class Website {
  public novelId: string;

  public website: WebsiteLoader;

  public novels: Array<Novel>;

  public constructor (parameters: WebsiteParameters) {
    this.novelId = parameters.novel || ''
    this.website = parameters.website
    this.novels = []
  }

  public get name () {
    return this.website.name
  }

  public async *loadNovels (): AsyncIterableIterator<Novel> {
    try {
      if (getSettings().offline) {
        throw Error('Offline mode')
      }
      console.time('getNovels')
      const novelsRequest = await this.website.getNovels()
      console.timeEnd('getNovels')
      if (novelsRequest.length === 0) {
        this.novels = await db.novels.where({ website: this.website.slug }).toArray()
        for (let novel of this.novels) {
          yield novel
        }
      } else {
        for (let novel of novelsRequest) {
          const novelDb = await db.novels.get({ title: novel.title, website: this.website.slug })
          novel.website = this.website.slug
          if (novelDb === undefined) {
            novel.lastUpdate = new Date()
            novel.id = await db.novels.add(novel)
          } else if (novelDb.id !== undefined) {
            novel.description = (novel.description === '' && novelDb.description !== '') ? novelDb.description : novel.description
            novel.bookmarked = novelDb.bookmarked
            novel.tags = (novel.tags.length === 0 && novelDb.tags.length > 0) ? novelDb.tags : novel.tags
            novel.cover = (novel.cover === '' && novelDb.cover !== '') ? novelDb.cover : novel.cover
            db.novels.update(novelDb.id, novel)
            novel.id = novelDb.id
          }
          this.novels.push(novel)
          yield novel
        }
      }
    } catch (e) {
      console.error(e)
      this.novels = await db.novels.where({ website: this.website.slug }).toArray()
      for (let novel of this.novels) {
        yield novel
      }
    }
  }

  public async loadNovel (novelId: number, refresh: boolean = false): Promise<NovelResponse> {
    const novel = await db.novels.get(novelId)
    if (novel === undefined) {
      throw Error('Impossible de trouver le novel')
    }
    const shouldRefresh = refresh || (novel.lastUpdate.getTime() + 300 * 1000) < new Date().getTime()
    const chapters = await db.chapters.where({ novel: novelId }).toArray()
    let novelResponse: NovelResponse = { novel, chapters }
    if (!getSettings().offline && (shouldRefresh || chapters.length === 0)) {
      try {
        console.time('getNovel')
        novelResponse = await this.website.getNovel(novel)
        console.timeEnd('getNovel')
        if (novelResponse.novel.id !== undefined) {
          db.novels.update(novelResponse.novel.id, novelResponse.novel)
        }
        novelResponse.chapters = await Promise.all(novelResponse.chapters.map((chapter: Chapter): Promise<Chapter> => Promise.resolve(db.chapters.get({ title: chapter.title, novel: novelId })).then((result: Chapter | undefined): Promise<number> | number => {
          chapter.novel = novelId
          if (result === undefined) {
            chapter.lastUpdate = new Date()
            return db.chapters.add(chapter)
          } else if (result.id !== undefined) {
            chapter.content = result.content
            db.chapters.update(result.id, chapter)
            return result.id
          } else {
            throw Error('Id du resultat non défini')
          }
        }).then((id: number): Chapter => {
          if (chapter.id === undefined) {
            chapter.id = id
          }
          return chapter
        })
        ))
      } catch (e) {
        console.error(e)
        novelResponse.chapters = []
      }
    }
    if (novelResponse.chapters.length === 0) {
      novelResponse.chapters = chapters
    }
    if (novelResponse.novel.cover === '') {
      novelResponse.novel.cover = require('../assets/book_icon.svg')
    }
    return novelResponse
  }

  public async loadChapter (novelId: number, chapterId: number, refresh: boolean = false): Promise<ChapterResponse> {
    const novel = await db.novels.get(novelId)
    if (novel === undefined) {
      throw Error('Impossible de trouver le novel')
    }
    const chapter = await db.chapters.get(chapterId)
    if (chapter === undefined) {
      throw Error('Impossible de trouver le chapter')
    }
    const chapters = await db.chapters.where({ novel: novelId }).toArray()
    const shouldRefresh = refresh || (chapter.lastUpdate.getTime() + 300 * 1000) < new Date().getTime()
    const chapterResponse: ChapterResponse = { novel, chapter, chapters }

    if (!getSettings().offline && (shouldRefresh || chapterResponse.chapter.content === '')) {
      chapterResponse.chapter = await this.website.getChapter(novel, chapterResponse.chapter)
      chapterResponse.chapter.lastUpdate = new Date()
      db.chapters.put(chapterResponse.chapter)
    }
    return chapterResponse
  }

  public async loadComments (novel: Novel, chapter: Chapter): Promise<Comment[]> {
    if (!getSettings().offline) {
      return this.website.getComments(novel, chapter)
    }
    return []
  }

  public async nextChapter (current: Chapter): Promise<ChapterResponse> {
    if (current.next === undefined) {
      throw Error('No next chapter found')
    }
    const result = await db.chapters.where('title')
      .equals(current.next)
      .or('slug')
      .equals(current.next)
      .or('url')
      .equals(current.next).first()
    if (result === undefined) {
      if (current.next !== undefined && current.next.match('http')) {
        const newChapter = await db.chapters.put({ url: current.next, novel: current.novel, title: '', slug: '', content: '', lastUpdate: new Date(), prev: current.slug })
        return this.loadChapter(current.novel, newChapter, true)
      } else {
        throw Error('Next chapter not found')
      }
    }
    if (result.id === undefined) {
      throw Error('Next chapter id not set')
    }
    return this.loadChapter(current.novel, result.id)
  }

  public async prevChapter (current: Chapter): Promise<ChapterResponse> {
    if (current.prev === undefined) {
      throw Error('No previous chapter found')
    }
    const result = await db.chapters.where('title')
      .equals(current.prev)
      .or('slug')
      .equals(current.prev)
      .or('url')
      .equals(current.prev).first()
    if (result === undefined) {
      if (current.prev !== undefined && current.prev.match('http')) {
        const newChapter = await db.chapters.put({ url: current.prev, novel: current.novel, title: '', slug: '', content: '', lastUpdate: new Date(), next: current.slug })
        return this.loadChapter(current.novel, newChapter)
      } else {
        throw Error('Next chapter not found')
      }
    }
    if (result.id === undefined) {
      throw Error('Next chapter id not set')
    }
    return this.loadChapter(current.novel, result.id)
  }

  public async cacheNovel (novel: Novel, ondata: (chapter: Chapter, index: number, chapters: Chapter[]) => void, done: () => void) {
    if (novel.id !== undefined) {
      const { chapters } = await this.loadNovel(novel.id, true)
      let index = 0
      const cacheNext = (chapter?: Chapter) => {
        if (chapter !== undefined) {
          ondata(chapter, index, chapters)
        }
        if (index < chapters.length) {
          const { id } = chapters[index]
          index++
          if (id !== undefined && novel.id !== undefined) {
            this.loadChapter(novel.id, id).then(c => {
              cacheNext(c.chapter)
            }).catch(e => {
              console.error(e)
              cacheNext()
            })
          }
        } else {
          done()
        }
      }
      const observer = {
        load: this.loadChapter,
        data: {
          chapters,
          index: 0
        },
        next: cacheNext,
        destroy () {
          index = chapters.length
        }
      }
      observer.next()
      return () => {
        observer.destroy()
      }
    } else {
      throw Error('Novel id not found')
    }
  }
}
