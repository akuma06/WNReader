import { Chapter } from './Database'
import slugify from 'slugify'

export default class Chapters {
    private index: Map<string, number> = new Map()
    private chapters: Chapter[] = []

    constructor (chapters?: Chapter[]) {
      if (chapters !== undefined) {
        chapters.forEach(chapter => {
          if (chapter.slug === '') {
            chapter.slug = slugify(chapter.title)
          }
          const { slug } = chapter
          this.index.set(slug, this.chapters.length)
          this.chapters.push(chapter)
        })
      }
    }

    public add (title: string, novel: number, url: string, content: string = ''): string {
      const slug = slugify(title)
      const currentIndex = this.chapters.length
      this.index.set(slug, currentIndex)
      if (currentIndex > 0) {
        this.chapters[currentIndex - 1].next = slug
      }
      this.chapters.push({
        title,
        slug: slugify(title),
        novel,
        url,
        content,
        prev: (currentIndex > 0) ? this.chapters[currentIndex - 1].slug : '',
        next: '',
        lastUpdate: new Date()
      })
      return slug
    }

    public remove (slug: string): boolean {
      const idx = this.index.get(slug)
      if (idx !== undefined) {
        this.chapters.splice(idx, 1)
        return this.index.delete(slug)
      }
      return false
    }

    get (): Chapter[] {
      return this.chapters
    }
}
