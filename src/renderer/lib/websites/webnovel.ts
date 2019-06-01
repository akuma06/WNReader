import { WebsiteLoader, NovelResponse, WebsiteStyle, NoDataGivenException } from '../Website'
import { Novel, Chapter, Comment } from '../Database'
import Axios from 'axios'
import Novels from '../Novels'
import Chapters from '../Chapters'

type WNTagResponse = {
  tagId: number
  tagName: string
}

type WNNovelResponse = {
  authorName: string
  bookId: string
  bookName: string
  bookType: number
  categoryName: string
  coverUpdateTime: string
  tagInfo: WNTagResponse[]
  totalScore: string
  type: number
}

type WebNovelBasicResponse < T > = {
  code: number
  data: T
  msg: string
}

type WebNovelListResponse = WebNovelBasicResponse<{
  categoryId: number
  isLast: number
  items: WNNovelResponse[]
  orderBy: string
  status: string | null
  total: number
}>

enum WNBoolean {
  False = 0,
  True
}

type WNChapterItemResponse = {
  chapterId: string
  chapterIndex: number
  chapterName: string
  isAuth: WNBoolean
  isVip: WNBoolean
  publishTime: string
}

type WNVolumeResponse = {
  chapterItems: WNChapterItemResponse[]
  volumeId: number
  volumeName: string
}

type WNChapterListResponse = WebNovelBasicResponse<{
  bookInfo: {
    authorName: string
    bookId: string
    bookName: string
    bookType: number
    totalChapterNum: number
  }
  curReadChapter: string
  volumeItems: WNVolumeResponse[]
}>

type WNItem = {
  id?: number
  name: string
  userId?: string
}

type WNUserResponse = {
  SS: number
  UUT: number
  availableEnergy: number
  availablePower: number
  avatar: string
  emailStatus: number
  guid: string
  isCheckin: number
  mt: number
  nickName: string
  penName: string
  role: number
  status: number
  totalEnergy: number
  totalPower: number
  userLevel: number
  userName: string
}

type WNBookInfoResponse = WebNovelBasicResponse<{
  bookInfo: {
    actionStatus: number
    advActionUrl: string
    advText: string
    ageGroup: string
    authorName: string
    bookId: string
    bookName: string
    bookType: number
    categoryId: number
    categoryName: string
    chapterNum: number
    coverUpdateTime: string
    description: string
    editorItems: WNItem[]
    energyNum: number
    feverLink: string
    firstChapterId: string
    frequencyUnit: string
    giftNum: number
    groupItems: WNItem[]
    inLibrary: boolean
    language: Array<{
      text: string
      url: string
    }>
    notes: any[]
    picM: string
    powerRank: number
    promiseFrequencyUnit: string
    promiseUpdateFrequency: number
    pvNum: string
    readToChapterId: string
    readToChapterIndex: string
    topFanItems: Array<{
      userId: number
      UUT: number
    }>
    totalScore: string
    translatorItems: WNItem[]
    updateFrequency: number
    voteType: number
    voters: number
  }
  curReadChapter: string
  user: WNUserResponse
}>

type WNChapterResponse = WebNovelBasicResponse<{
  bookInfo: {
    actionStatus: number
    authorItems: WNItem[]
    bookId: string
    bookName: string
    coverUpdateTime: string
    editorItems: WNItem[]
    giftNum: number
    groupItems: WNItem[]
    patreonLink: string
    reviewTotal: number
    totalChapterNum: number
    totalPreChapterNum: number
    translatorItems: WNItem[]
    type: number
  }
  chapterInfo: {
    SSPrice: number
    chapterId: string
    chapterIndex: number
    chapterName: string
    chapterReviewItems: {
      [key: string]: string
    }
    content: string
    discountInfo: null
    editorItems: WNItem[]
    firstChapterId: string
    firstChapterIndex: number
    isAuth: number
    isRichFormat: number
    isVip: number
    nextChapterId: string
    orderIndex: number
    originalPrice: any
    preChapterId: string
    reviewTotal: number
    transRating: any
    translatorItems: WNItem[]
  }
}>

export interface BadgeInfo {
  badgeId: number
  badgeType: string
  badgeName: string
  maxGrade: number
  achievedMaxGrade: number
  achievedTime: string
  achievedGradeGoal: string
  baseUrl: string
  updateTime: number
}

type ChapterReviewItemsEntity = {
  id: string
  content: string
  userId: number
  userName: string
  role: number
  penName: string
  updateTime: string
  avatar: string
  likeNums: number
  pUserId: number
  pUserName: string
  pUserImg: string
  pUserRole: number
  pPenName: string
  pContent: string
  status: number
  pStatus: number
  spoiler: number
  pSpoiler: number
  liked: number
  commentType: number
  grade: number
  badgeInfo: BadgeInfo
  UUT: number
  pUUT?: number | null
}

type WNCommentResponse = WebNovelBasicResponse<{
  info: {
    bookId: string
    bookName: string
    chapterId: string
    chapterIndex: number
    chapterName: string
    replyNums: number
  }
  chapterReviewItems: ChapterReviewItemsEntity[]
}>

export default class Webnovel implements WebsiteLoader {
  public get name (): string { return 'Webnovel' }
  public get slug (): string { return 'webnovel' }
  public get url (): string { return 'https://www.webnovel.com' }
  public get icon (): string { return 'https://m.webnovel.com/launcher-icon-4x.png' }
  public style: WebsiteStyle = {
    name: { color: 'white', backgroundColor: '#3b66f5' },
    header: { backgroundColor: '#3b66f5', color: 'white' },
    buttonHeader: { color: 'white', borderColor: 'white' }
  }

  private async fecthList (page: number = 1): Promise<Novel[]> {
    const novels = new Novels()
    try {
      const json = await Axios.get(`https://www.webnovel.com/apiajax/category/ajax?_csrfToken=&orderBy=4&pageIndex=${page}&category=0&tagName=&bookType=1`)
      if (json.status === 200) {
        const result = json.data as WebNovelListResponse
        if (result.msg === 'Success') {
          const { items } = result.data
          items.forEach(novel => {
            novels.add(
              novel.bookName,
              this.slug,
              novel.bookId,
              '',
              `https://img.webnovel.com/bookcover/${novel.bookId}/300/300.jpg?coverUpdateTime=${novel.coverUpdateTime}`,
              novel.tagInfo.map(tag => tag.tagName)
            )
          })
          if (items.length > 0) {
            page++
            novels.push(...await this.fecthList(page))
          }
        }
      }
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    return novels.get()
  }

  private async fetchChapterList (novel: Novel): Promise<WNChapterListResponse | null> {
    try {
      const result = await Axios.get(`https://m.webnovel.com/ajax/chapter/getChapterListAjax?_csrfToken=&bookId=${novel.url}`)
      if (result.status === 200) {
        return result.data as WNChapterListResponse
      }
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    return null
  }

  private async fetchBookInfo (novel: Novel): Promise<Novel> {
    try {
      const result = await Axios.get(`https://m.webnovel.com/ajax/book/GetBookDetailPage?_csrfToken=&bookId=${novel.url}`)
      if (result.status === 200) {
        const response = result.data as WNBookInfoResponse
        novel.description = response.data.bookInfo.description
        novel.lastUpdate = new Date()
        return novel
      }
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    return novel
  }
  private async fetchComments (novel: Novel, chapter: Chapter, page: number = 1, recycling: boolean = false): Promise<ChapterReviewItemsEntity[]> {
    const items: ChapterReviewItemsEntity[] = []
    try {
      const result = await Axios.get(`https://www.webnovel.com/apiajax/ChapterReview/GetChapterReviewsAjax?_csrfToken=&bookId=${novel.url}&chapterId=${chapter.url}&pageIndex=${page}&orderBy=1&_=`)
      if (result.status === 200) {
        const commentResponse = result.data as WNCommentResponse
        if (commentResponse.data.chapterReviewItems.length > 0) {
          page++
          items.push(...commentResponse.data.chapterReviewItems)
          if (!recycling) {
            items.push(...await this.fetchComments(novel, chapter, page))
          }
        }
      }
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    return items
  }
  public async getNovels (): Promise<Novel[]> {
    return this.fecthList(1)
  }
  public async getNovel (novel: Novel): Promise<NovelResponse> {
    const chapters = new Chapters()
    let novelResponse = novel
    try {
      novelResponse = await this.fetchBookInfo(novel)
      const chapterList = await this.fetchChapterList(novel)
      if (chapterList !== null) {
        chapterList.data.volumeItems.forEach(volume => {
          volume.chapterItems.forEach(chapter => {
            chapters.add(`Chapter ${chapter.chapterIndex}: ${chapter.chapterName}`, chapter.chapterIndex, chapter.chapterId)
          })
        })
      }
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    const chaptersArr = chapters.get()
    return { chapters: chaptersArr, novel: novelResponse }
  }
  public async getChapter (novel: Novel, chapter: Chapter): Promise<Chapter> {
    try {
      const result = await Axios.get(`https://www.webnovel.com/apiajax/chapter/GetContent?_csrfToken=&bookId=${novel.url}&chapterId=${chapter.url}&_=`)
      if (result.status === 200) {
        const chapterResponse = result.data as WNChapterResponse
        chapter.content = chapterResponse.data.chapterInfo.content
      }
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
    return chapter
  }
  public async getComments (novel: Novel, chapter: Chapter): Promise<Comment[]> {
    try {
      return (await this.fetchComments(novel, chapter, 1, true)).map((comment): Comment => {
        return {
          avatar: `https:${comment.avatar}`,
          username: comment.userName,
          content: comment.content,
          date: comment.updateTime
        }
      })
    } catch (e) {
      console.error(e)
      throw NoDataGivenException
    }
  }
}
