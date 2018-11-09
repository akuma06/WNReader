import { db, Novel, Chapter, Comment } from './Database'

export type WebsiteStyle = {
  readonly name?: Partial<CSSStyleDeclaration>
  readonly header?: Partial<CSSStyleDeclaration>
  readonly iconHeader?: Partial<CSSStyleDeclaration>
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

    public async loadNovels (): Promise<Novel[]> {
      try {
        const novelsRequest = await this.website.getNovels()
        const novelsPromise = novelsRequest.map((novel: Novel): Promise<Novel> => Promise.resolve(db.novels.get({ title: novel.title, website: this.website.slug }))
          .then((result: Novel | undefined): Promise<number> | number => {
            if (result === undefined) {
              novel.lastUpdate = new Date()
              novel.website = this.website.slug
              return db.novels.add(novel)
            } else if (result.id !== undefined) {
              novel.description = (result.description !== '') ? result.description : novel.description
              novel.bookmarked = result.bookmarked
              novel.cover = (result.cover !== '') ? result.cover : novel.cover
              db.novels.update(result.id, novel)
              return result.id
            } else {
              throw Error('Id du résultat non défini')
            }
          }).then((id: number): Novel => {
            if (novel.id === undefined) {
              novel.id = id
            }
            return novel
          })
        )
        this.novels = await Promise.all(novelsPromise)
      } catch (e) {
        console.error(e)
        this.novels = []
      }
      if (this.novels.length === 0) {
        this.novels = await db.novels.where({ website: this.website.slug }).toArray()
      }
      return this.novels
    }

    public async loadNovel (novelId: number, refresh: boolean = false): Promise<NovelResponse> {
      const novel = await db.novels.get(novelId)
      if (novel === undefined) {
        throw Error('Impossible de trouver le novel')
      }
      const shouldRefresh = refresh || (novel.lastUpdate.getTime() + 300 * 1000) < new Date().getTime()
      const chapters = await db.chapters.where({ novel: novelId }).toArray()
      let novelResponse: NovelResponse = { novel, chapters }
      if (shouldRefresh || chapters.length === 0) {
        try {
          novelResponse = await this.website.getNovel(novel)
          if (novelResponse.novel.id !== undefined) {
            db.novels.update(novelResponse.novel.id, novelResponse.novel)
          }
          novelResponse.chapters = await Promise.all(novelResponse.chapters.map((chapter: Chapter): Promise<Chapter> => Promise.resolve(db.chapters.get({ title: chapter.title, novel: novelId })).then((result: Chapter | undefined): Promise<number> | number => {
            if (result === undefined) {
              chapter.novel = novelId
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

      if (shouldRefresh || chapterResponse.chapter.content === '') {
        chapterResponse.chapter = await this.website.getChapter(novel, chapterResponse.chapter)
        chapterResponse.chapter.lastUpdate = new Date()
        db.chapters.put(chapterResponse.chapter)
      }
      return chapterResponse
    }

    public async loadComments (novel: Novel, chapter: Chapter): Promise<Comment[]> {
      return this.website.getComments(novel, chapter)
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
}
