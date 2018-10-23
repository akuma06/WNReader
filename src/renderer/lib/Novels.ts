import { Novel } from './Database'
import slugify from 'slugify'

export default class Novels {
    private novels: Map<string, Novel> = new Map()

    constructor (novels?: Novel[]) {
      if (novels !== undefined) {
        novels.forEach(novel => {
          if (novel.slug === '') {
            novel.slug = slugify(novel.title)
          }
          const { slug } = novel
          this.novels.set(slug, novel)
        })
      }
    }

    public add (title: string, website: string, url: string, description: string = '', cover: string = ''): string {
      const novel: Novel = {
        title,
        slug: slugify(title),
        website,
        url,
        description,
        cover,
        bookmarked: false,
        lastUpdate: new Date()
      }
      this.novels.set(novel.slug, novel)
      return novel.slug
    }

    public remove (slug: string): boolean {
      return this.novels.delete(slug)
    }

    get (): Novel[] {
      const novels: Novel[] = []
      this.novels.forEach(novel => novels.push(novel))
      return novels
    }
}
