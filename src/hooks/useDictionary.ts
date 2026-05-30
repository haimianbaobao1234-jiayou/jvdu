import { useState, useCallback } from 'react'

export interface WordInfo {
  word: string
  phonetic: string
  audioUrl: string
  meanings: Array<{
    partOfSpeech: string
    definitions: string[]
  }>
}

export function useDictionary() {
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const lookup = useCallback(async (word: string) => {
    // 清理单词（去除标点符号）
    const clean = word.replace(/[^a-zA-Z'-]/g, '')
    if (!clean || clean.length < 2) return

    setLoading(true)
    setError(null)
    setIsOpen(true)

    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`
      )
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`未找到 "${clean}" 的释义`)
        }
        throw new Error('查询失败，请稍后重试')
      }

      const data = await res.json()
      const entry = data[0]

      // 提取音标
      const phonetic =
        entry.phonetic ||
        entry.phonetics?.find((p: { text?: string }) => p.text)?.text ||
        ''

      // 提取发音音频
      const audioUrl =
        entry.phonetics?.find((p: { audio?: string }) => p.audio)?.audio || ''

      // 提取释义（取前 3 个词性）
      const meanings = (entry.meanings || []).slice(0, 3).map((m: {
        partOfSpeech: string
        definitions: Array<{ definition: string }>
      }) => ({
        partOfSpeech: m.partOfSpeech,
        definitions: m.definitions.slice(0, 3).map((d) => d.definition),
      }))

      setWordInfo({ word: entry.word, phonetic, audioUrl, meanings })
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败')
      setWordInfo(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setWordInfo(null)
    setError(null)
  }, [])

  return { wordInfo, loading, error, isOpen, lookup, close }
}
