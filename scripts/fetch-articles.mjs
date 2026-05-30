/**
 * 句读 — 文章抓取与翻译脚本
 * 用法：node scripts/fetch-articles.mjs
 * 输出：data/articles.json（含句级翻译）
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import RssParser from 'rss-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(PROJECT_ROOT, 'data')
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public', 'data')
const OUTPUT_FILE = path.join(DATA_DIR, 'articles.json')
const PUBLIC_OUTPUT = path.join(PUBLIC_DATA_DIR, 'articles.json')

const parser = new RssParser()

// ====== RSS 源配置 ======
const RSS_SOURCES = [
  {
    url: 'https://learningenglish.voanews.com/api/z-kkrvywqj',
    level: 'cet4',
    source: 'VOA Special English',
  },
  {
    url: 'https://feeds.bbci.co.uk/learningenglish/rss.xml',
    level: 'cet6',
    source: 'BBC Learning English',
  },
  {
    url: 'https://www.npr.org/rss/rss.php?id=1001',
    level: 'ielts',
    source: 'NPR News',
  },
  {
    url: 'https://www.theguardian.com/international/rss',
    level: 'ielts',
    source: 'The Guardian',
  },
]

// ====== 工具函数 ======

/** 从 HTML 文本中提取纯文本 */
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** 按句子分割英文文本 */
function splitSentences(text) {
  // 在句号、问号、感叹号后分割，保留标点前的空格处理
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10) // 过滤太短的片段
  return sentences
}

/** 生成唯一 ID */
function generateId(source, title) {
  const base = `${source}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
  return base + '-' + Date.now().toString(36)
}

/** 调用 MyMemory 免费翻译 API */
async function translateText(text, from = 'en', to = 'zh-CN') {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.responseStatus === 200 || data.responseStatus === 403) {
      return data.responseData.translatedText
    }
    throw new Error(`翻译失败: ${data.responseStatus}`)
  } catch (err) {
    console.warn(`   ⚠ 翻译失败: ${err.message}`)
    return '[翻译失败]'
  }
}

// ====== 主流程 ======

async function main() {
  console.log('📰 句读 — 文章抓取开始\n')

  const allArticles = []

  for (const source of RSS_SOURCES) {
    console.log(`📡 抓取: ${source.source} (${source.level})`)
    try {
      const feed = await parser.parseURL(source.url)
      const items = (feed.items || []).slice(0, 5) // 每个源最多取 5 篇

      for (const item of items) {
        const rawText = stripHtml(item.content || item.contentSnippet || item.summary || '')
        if (!rawText || rawText.length < 100) continue

        const sentences = splitSentences(rawText)

        // 至少要有 3 个句子才保留
        if (sentences.length < 3) continue

        console.log(`   📄 "${item.title?.slice(0, 50)}..." (${sentences.length} 句)`)

        // 逐句翻译
        const sentenceData = []
        for (const en of sentences) {
          // 延迟避免 API 限流
          await new Promise((r) => setTimeout(r, 200))
          const zh = await translateText(en)
          sentenceData.push({ en, zh })
        }

        allArticles.push({
          id: generateId(source.source, item.title || ''),
          title: item.title || 'Untitled',
          source: source.source,
          sourceUrl: item.link || '',
          level: source.level,
          date: new Date(item.pubDate || Date.now()).toISOString().split('T')[0],
          sentences: sentenceData,
        })

        // 控制总量：最多 20 篇
        if (allArticles.length >= 20) break
      }

      if (allArticles.length >= 20) break
    } catch (err) {
      console.warn(`   ❌ 抓取失败: ${err.message}`)
    }
  }

  // 按日期降序排列
  allArticles.sort((a, b) => b.date.localeCompare(a.date))

  // 输出 JSON
  const output = {
    lastUpdated: new Date().toISOString().split('T')[0],
    articles: allArticles,
  }

  // 确保目录存在
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true })

  const json = JSON.stringify(output, null, 2)
  fs.writeFileSync(OUTPUT_FILE, json, 'utf-8')
  fs.writeFileSync(PUBLIC_OUTPUT, json, 'utf-8')

  console.log(`\n✅ 完成！共抓取 ${allArticles.length} 篇文章`)
  console.log(`   输出: ${OUTPUT_FILE}`)
  console.log(`   输出: ${PUBLIC_OUTPUT}`)
}

main().catch((err) => {
  console.error('❌ 脚本失败:', err)
  process.exit(1)
})
