import { useState, useCallback } from 'react'

export interface WordInfo {
  word: string
  phonetic: string
  audioUrl: string
  meanings: Array<{
    partOfSpeech: string
    definitions: Array<{
      en: string
      zh: string
    }>
  }>
}

/** 翻译一段文本到中文 */
async function translateToChinese(text: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`
    )
    const data = await res.json()
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText
    }
    return ''
  } catch {
    return ''
  }
}

export function useDictionary() {
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const lookup = useCallback(async (word: string) => {
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

      // 优先英音：取第一个有音频的音标
      const phonetics = entry.phonetics || []
      const withAudio = phonetics.find((p: { audio?: string }) => p.audio)
      const anyPhonetic = phonetics.find((p: { text?: string }) => p.text)

      const phonetic = withAudio?.text || anyPhonetic?.text || entry.phonetic || ''
      const audioUrl = withAudio?.audio || ''

      // 提取释义并翻译为中文
      const meaningsRaw = (entry.meanings || []).slice(0, 3).map((m: {
        partOfSpeech: string
        definitions: Array<{ definition: string }>
      }) => ({
        partOfSpeech: m.partOfSpeech,
        definitions: m.definitions.slice(0, 3).map((d) => d.definition),
      }))

      // 收集所有英文释义，用 ||| 分隔批量翻译
      const allDefs: string[] = []
      meaningsRaw.forEach((m: { partOfSpeech: string; definitions: string[] }) => {
        m.definitions.forEach((d: string) => allDefs.push(d))
      })

      const zhCombined = await translateToChinese(allDefs.join(' ||| '))
      const zhDefs = zhCombined ? zhCombined.split(' ||| ').map((s: string) => s.trim()) : []

      // 组装结果
      let defIndex = 0
      const meanings = meaningsRaw.map((m: { partOfSpeech: string; definitions: string[] }) => ({
        partOfSpeech: m.partOfSpeech,
        definitions: m.definitions.map((en: string) => ({
          en,
          zh: zhDefs[defIndex++] || '',
        })),
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
