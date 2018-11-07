import { WebsiteLoader, NovelResponse, WebsiteStyle } from "../Website";
import { Novel, Chapter, Comment } from "../Database";
import Axios from "axios";
import Novels from "../Novels";
import Chapters from "../Chapters";

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

type WebNovelBasicResponse<T> = {
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


export default class Webnovel implements WebsiteLoader {
  public get name (): string { return 'Webnovel' }
  public get slug (): string { return 'webnovel' }
  public get url (): string { return 'https://www.webnovel.com' }
  public get icon (): string { return 'https://m.webnovel.com/launcher-icon-4x.png' }
  public style: WebsiteStyle = {}

  private async fecthList (page: number = 1): Promise<WNNovelResponse[]> {
    const novels: WNNovelResponse[] = []
    const json = await Axios.get(`https://www.webnovel.com/apiajax/category/ajax?_csrfToken=&orderBy=4&pageIndex=${page}&category=0&tagName=&bookType=1`)
    if (json.status === 200) {
      const result = json.data as WebNovelListResponse
      if (result.msg === 'Success') {
        const { items, total } = result.data
        novels.push(...items)
        if (total > 0) {
          page++
          novels.push(...await this.fecthList(page))
        }
      }
    }
    return novels
  }

  private async fetchChapterList (novel: Novel): Promise<WNChapterListResponse | null> {
    const result = await Axios.get(`https://m.webnovel.com/ajax/chapter/getChapterListAjax?_csrfToken=&bookId=${novel.url}`)
    if (result.status === 200) {
      try {
        return result.data as WNChapterListResponse
      } catch (error) {
        console.error(error)
        return null
      }
    }
    return null
  }

  private async fetchBookInfo (novel: Novel): Promise<WNBookInfoResponse | null> {
    const result = await Axios.get(`https://m.webnovel.com/ajax/book/GetBookDetailPage?_csrfToken=&bookId=${novel.url}`)
    if (result.status === 200) {
      try {
        return result.data as WNBookInfoResponse
      } catch (error) {
        console.error(error)
        return null
      }
    }
    return null
  }
  private async fetchComments (novel: Novel, chapter: Chapter, page: number = 1, recycling: boolean = false): Promise<ChapterReviewItemsEntity[]> {
    const result = await Axios.get(`https://www.webnovel.com/apiajax/ChapterReview/GetChapterReviewsAjax?_csrfToken=&bookId=${novel.url}&chapterId=${chapter.url}&pageIndex=${page}&orderBy=1&_=`)
    const items: ChapterReviewItemsEntity[] = []
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
    return items
  }
  public async getNovels (): Promise<Novel[]> {
    const novels = new Novels()
    const novelsResponse = await this.fecthList(1)
    novelsResponse.forEach(novel => {
      novels.add(
        novel.bookName,
        this.slug,
        novel.bookId,
        '',
        `https://img.webnovel.com/bookcover/${novel.bookId}/300/300.jpg?coverUpdateTime=${novel.coverUpdateTime}`
      )
    })
    return novels.get()
  }
  async getNovel(novel: Novel): Promise<NovelResponse> {
    const chapters = new Chapters()
    const novelResponse = await this.fetchBookInfo(novel)
    if (novelResponse !== null) {
      novel.description = novelResponse.data.bookInfo.description
      novel.lastUpdate = new Date()
    }
    const chapterList = await this.fetchChapterList(novel)
    if (chapterList !== null) {
      chapterList.data.volumeItems.forEach(volume => {
        volume.chapterItems.forEach(chapter => {
          chapters.add(`Chapter ${chapter.chapterIndex}: ${chapter.chapterName}`, chapter.chapterIndex, chapter.chapterId)
        })
      })
    }
    const chaptersArr = chapters.get()
    return { chapters: chaptersArr, novel }
  }
  public async getChapter (novel: Novel, chapter: Chapter): Promise<Chapter> {
    const result = await Axios.get(`https://www.webnovel.com/apiajax/chapter/GetContent?_csrfToken=&bookId=${novel.url}&chapterId=${chapter.url}&_=`)
    if (result.status === 200) {
      try {
        const chapterResponse = result.data as WNChapterResponse
        chapter.content = chapterResponse.data.chapterInfo.content
      } catch (error) {
        console.error(error)
      }
    }
    return chapter
  }
  public async getComments (novel: Novel, chapter: Chapter): Promise<Comment[]> {
    const comments = (await this.fetchComments(novel, chapter, 1, true)).map((comment): Comment => {
      return {
        avatar: comment.avatar,
        username: comment.userName,
        content: comment.content,
        date: comment.updateTime,
      }
    })
    return comments
  }
}
