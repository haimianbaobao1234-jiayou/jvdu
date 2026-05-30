/** 文章难度等级 */
export type Level = 'cet4' | 'cet6' | 'ielts'

/** 难度等级的中文标签 */
export const LEVEL_LABELS: Record<Level, string> = {
  cet4: '四级',
  cet6: '六级',
  ielts: '雅思',
}

/** 难度等级对应的颜色 */
export const LEVEL_COLORS: Record<Level, string> = {
  cet4: '#7EC8A0',
  cet6: '#7EB8D4',
  ielts: '#D4A0B0',
}

/** 单句（英文原文 + 中文翻译） */
export interface Sentence {
  en: string
  zh: string
}

/** 文章 */
export interface Article {
  id: string
  title: string
  source: string
  sourceUrl: string
  level: Level
  date: string          // YYYY-MM-DD
  sentences: Sentence[]
}

/** 文章列表响应 */
export interface ArticlesData {
  lastUpdated: string
  articles: Article[]
}

/** 单词查询结果（Free Dictionary API 返回） */
export interface DictionaryEntry {
  word: string
  phonetic?: string
  phonetics: Array<{
    text?: string
    audio?: string
  }>
  meanings: Array<{
    partOfSpeech: string
    definitions: Array<{
      definition: string
      example?: string
    }>
  }>
}

/** 应用视图 */
export type View = 'list' | 'reader'
