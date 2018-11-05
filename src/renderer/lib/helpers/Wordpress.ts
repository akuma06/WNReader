import Parser, { Items } from 'rss-parser';

type FeedEntriesRequest = {
  url?: string
  host?: string
  category?: string
  page?: number
}

function generateFeedURL (params: FeedEntriesRequest): string {
  let url = ''
  if (params.url !== undefined) {
    url = params.url
  } else if (params.host !== undefined) {
    url = params.host
    if (params.category !== undefined) {
      url += `/category/${params.category}`
    }
    url += '/feed/'
  }
  return url
}

async function getEntries(url: string, page: number = 1) {
  const items: Items[] = []
  try {
    const feed = await new Parser().parseURL(`${url}?paged=${page}`)
    if (feed.items.length > 0) {
      page++
      items.push(...await getEntries(url, page))
      feed.items.reverse()
      items.push(...feed.items)
    }
  } catch (e) {
    return []
  }
  return items
}

export async function getFeedEntries (params: FeedEntriesRequest): Promise<Items[]> {
  const url = generateFeedURL(params)
  if (url !== '') {
    const items = await getEntries(url, params.page)
    return items
  }
  return []
}
