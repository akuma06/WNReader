import { Chapter } from './Database'
import slugify from 'slugify'

export default class Chapters {
    private index: Map<string, number> = new Map()
    private chapters: Chapter[] = []

    public constructor (chapters?: Chapter[]) {
      if (chapters !== undefined) {
        chapters.forEach((chapter: Chapter): void => {
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
      const slug = `novel_${novel}_${slugify(title)}`
      const currentIndex = this.chapters.length
      this.index.set(slug, currentIndex)
      if (currentIndex > 0) {
        this.chapters[currentIndex - 1].next = slug
      }
      this.chapters.push({
        title,
        slug: slug,
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

    public get (): Chapter[] {
      return this.chapters
    }

    public get length (): number {
      return this.chapters.length
    }
}
