import Dexie from 'dexie'
import slugify from 'slugify'

export type Chapter = {
  id?: number
  novel: number
  title: string
  slug: string
  url: string
  content: string
  next?: string // slug
  prev?: string // slug
  lastPosition?: number
  lastUpdate: Date
}

export enum Bookmarked {
  No = 0,
  Yes
}

export type Novel = {
  id?: number
  website: string
  title: string
  description: string
  url: string
  cover: string
  slug: string
  bookmarked: number
  lastRead?: Chapter
  lastUpdate: Date
}

export type Comment = {
  avatar?: string
  username: string
  content: string
  date: string
  like?: string
}

class NovelDB extends Dexie {
  public novels!: Dexie.Table<Novel, number>;

  public chapters!: Dexie.Table<Chapter, number>;

  public constructor () {
    super('NovelDB')
    this.version(4).stores({
      websites: '++id,slug',
      novels: '++id,website,title,url,slug,bookmarked,lastUpdate,[title+website]',
      chapters: '++id,novel,title,url,slug,lastUpdate,[title+novel]'
    }).upgrade(async (trans: any) => {
      await (trans.novels as Dexie.Table<Novel, number>).toCollection().modify(novel => {
        if (novel.slug === '') {
          novel.slug = slugify(novel.title)
        }
      })
      const chapters = await (trans.chapters as Dexie.Table<Chapter, number>).toArray()
      await Promise.all(chapters.map(chapter => Promise.resolve()
        .then(() => {
          if (chapter.next !== undefined) {
            return (trans.chapters as Dexie.Table<Chapter, number>).get({title: chapter.next })
          }
          return undefined
        })
        .then(nextChapter => {
          const slug = (chapter.slug !== '') ? chapter.slug : slugify(chapter.title)
          const toUpdate: Chapter[] = []
          if (nextChapter !== undefined) {
            nextChapter.prev = slug
            toUpdate.push(nextChapter)
            chapter.next = slugify(nextChapter.title)
          }
          chapter.slug = slug
          toUpdate.push(chapter)
          return (trans.chapters as Dexie.Table<Chapter, number>).bulkPut(toUpdate)
        })
        .then(_ => (trans.chapters as Dexie.Table<Chapter, number>).get(chapter.id!))
      ))
    })
    this.version(3).stores({
      websites: '++id,slug',
      novels: '++id,website,title,url,slug,bookmarked,lastUpdate,[title+website]',
      chapters: '++id,novel,title,url,slug,lastUpdate,[title+novel]'
    })
    this.version(2).stores({
      websites: '++id,slug',
      novels: '++id,website,title,url,bookmarked,lastUpdate,[title+website]',
      chapters: '++id,novel,title,url,lastUpdate,[title+novel]'
    })
    this.version(1).stores({
      websites: '++id,slug',
      novels: '++id,website,title,url,bookmarked,lastUpdate',
      chapters: '++id,novel,title,url,lastUpdate'
    })
  }
}

export const db = new NovelDB()
