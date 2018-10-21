import Dexie from 'dexie'

export type Novel = {
  id?: number
  website: string
  title: string
  description: string
  url: string
  cover: string
  bookmarked: boolean
  lastRead?: Chapter
  lastUpdate: Date
}

export type Chapter = {
  id?: number
  novel: number
  title: string
  url: string
  content: string
  next?: string
  prev?: string
  lastPosition?: number
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
