/**
 * 句读 — 文章抓取与翻译脚本 (v2)
 * 用法：node scripts/fetch-articles.mjs
 * 输出：data/articles.json（含句级翻译）
 *
 * 改进：
 * - 每个源多个备用 RSS URL
 * - 自定义 User-Agent 避免被拒
 * - 超时处理
 * - 安全保护：抓取太少时不覆盖旧数据
 * - 新文章优先追加到已有数据
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(PROJECT_ROOT, 'data')
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public', 'data')
const OUTPUT_FILE = path.join(DATA_DIR, 'articles.json')
const PUBLIC_OUTPUT = path.join(PUBLIC_DATA_DIR, 'articles.json')

// ====== RSS 源配置（每个源有多个备用 URL） ======
const RSS_SOURCES = [
  // CET4 — 简单英语
  {
    urls: [
      'https://learningenglish.voanews.com/api/z-kkrvywqj',
    ],
    level: 'cet4',
    source: 'VOA Learning English',
  },
  {
    urls: [
      'https://feeds.bbci.co.uk/news/world/rss.xml',
    ],
    level: 'cet6',
    source: 'BBC News World',
  },
  {
    urls: [
      'https://feeds.npr.org/1001/rss.xml',
      'https://www.npr.org/rss/rss.php?id=1001',
    ],
    level: 'ielts',
    source: 'NPR News',
  },
  {
    urls: [
      'https://www.theguardian.com/world/rss',
    ],
    level: 'ielts',
    source: 'The Guardian World',
  },
]

// ====== 工具函数 ======

/** 用 fetch 获取 RSS XML 文本（带超时和请求头） */
async function fetchRSS(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000) // 15秒超时

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JvduReader/1.0; +https://github.com/haimianbaobao1234-jiayou/jvdu)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const text = await res.text()
    clearTimeout(timeout)
    return text
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

/** 解析 RSS XML 文本，提取条目 */
function parseRSSXML(xmlText) {
  const items = []

  // 匹配 <item>...</item> 块
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1]

    const title = extractTag(block, 'title')
    const link = extractTag(block, 'link')
    const description = extractTag(block, 'description')
    const pubDate = extractTag(block, 'pubDate')
    const contentEncoded = extractTag(block, 'content:encoded') || extractTag(block, 'content')

    // 优先使用 content:encoded，其次 description
    const rawContent = contentEncoded || description || ''

    if (title && rawContent) {
      items.push({ title, link, description: rawContent, pubDate })
    }
  }

  // 如果没匹配到 <item>，尝试 <entry>（Atom 格式）
  if (items.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi
    while ((match = entryRegex.exec(xmlText)) !== null) {
      const block = match[1]
      const title = extractTag(block, 'title')
      const link = extractLinkHref(block) || extractTag(block, 'link')
      const summary = extractTag(block, 'summary') || extractTag(block, 'content')
      const published = extractTag(block, 'published') || extractTag(block, 'updated')

      if (title && summary) {
        items.push({ title, link, description: summary, pubDate: published })
      }
    }
  }

  return items
}

function extractTag(text, tag) {
  // 尝试 <tag>...</tag>
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = text.match(regex)
  if (match) return stripCDATA(match[1].trim())
  return ''
}

function extractLinkHref(text) {
  const match = text.match(/<link[^>]*href="([^"]*)"/i)
  return match ? match[1] : ''
}

function stripCDATA(str) {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
}

/** 从 HTML 文本中提取纯文本 */
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 按句子分割英文文本 */
function splitSentences(text) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length < 500) // 过滤太短和太长的片段
  return sentences
}

/** 生成唯一 ID */
function generateId(source, title) {
  const base = `${source}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 60)
  return base + '-' + Date.now().toString(36)
}

/** 调用 MyMemory 免费翻译 API */
async function translateText(text, from = 'en', to = 'zh-CN') {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'JvduReader/1.0',
      },
    })
    clearTimeout(timeout)

    const data = await res.json()

    if (data.responseStatus === 200) {
      return data.responseData.translatedText
    }
    // MyMemory 有时返回 403 但仍然有翻译结果
    if (data.responseStatus === 403 && data.responseData?.translatedText) {
      return data.responseData.translatedText
    }
    throw new Error(`翻译API返回状态: ${data.responseStatus}`)
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      console.warn(`   ⚠ 翻译超时: "${text.slice(0, 30)}..."`)
    } else {
      console.warn(`   ⚠ 翻译失败: ${err.message}`)
    }
    return '[翻译失败]'
  }
}

// ====== 主流程 ======

async function main() {
  console.log('📰 句读 — 文章抓取开始 (v2)\n')
  console.log(`⏰ 时间: ${new Date().toISOString()}\n`)

  // 加载已有文章数据
  let existingArticles = []
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'))
      existingArticles = existing.articles || []
      console.log(`📂 已加载 ${existingArticles.length} 篇旧文章`)
    } catch (e) {
      console.log('📂 旧数据读取失败，将从头开始')
    }
  }

  const existingIds = new Set(existingArticles.map((a) => a.id))
  const newArticles = []

  for (const source of RSS_SOURCES) {
    console.log(`\n📡 抓取: ${source.source} (${source.level})`)

    let feedItems = null

    // 尝试每个备用 URL
    for (const url of source.urls) {
      try {
        console.log(`   🔗 尝试: ${url}`)
        const xmlText = await fetchRSS(url)
        feedItems = parseRSSXML(xmlText)

        if (feedItems.length > 0) {
          console.log(`   ✅ 成功获取 ${feedItems.length} 条`)
          break
        } else {
          console.log(`   ⚠ 该 URL 返回了 0 条有效内容，尝试下一个...`)
          feedItems = null
        }
      } catch (err) {
        console.warn(`   ❌ 失败: ${err.message}`)
        feedItems = null
      }
    }

    if (!feedItems || feedItems.length === 0) {
      console.log(`   🚫 ${source.source} 所有 URL 均失败，跳过此源`)
      continue
    }

    // 每个源最多取 5 篇
    const items = feedItems.slice(0, 5)

    for (const item of items) {
      const rawText = stripHtml(item.description || '')
      if (!rawText || rawText.length < 100) {
        console.log(`   ⏭ 跳过（内容太短）: "${(item.title || '').slice(0, 50)}"`)
        continue
      }

      const sentences = splitSentences(rawText)
      if (sentences.length < 3) {
        console.log(`   ⏭ 跳过（句子不够 ${sentences.length}<3）: "${(item.title || '').slice(0, 50)}"`)
        continue
      }

      // 去重检查
      const newId = generateId(source.source, item.title || '')
      if (existingIds.has(newId)) {
        console.log(`   ⏭ 跳过（重复）: "${(item.title || '').slice(0, 50)}"`)
        continue
      }

      console.log(`   📄 "${(item.title || '').slice(0, 50)}" (${sentences.length} 句)`)

      // 逐句翻译
      const sentenceData = []
      for (let i = 0; i < sentences.length; i++) {
        const en = sentences[i]
        // 延迟避免 API 限流
        if (i > 0) {
          await new Promise((r) => setTimeout(r, 250))
        }
        const zh = await translateText(en)
        sentenceData.push({ en, zh })
      }

      newArticles.push({
        id: newId,
        title: item.title || 'Untitled',
        source: source.source,
        sourceUrl: item.link || '',
        level: source.level,
        date: (item.pubDate
          ? new Date(item.pubDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]),
        sentences: sentenceData,
      })

      existingIds.add(newId)

      // 控制总量：新旧合计最多 20 篇
      if (existingArticles.length + newArticles.length >= 20) break
    }

    if (existingArticles.length + newArticles.length >= 20) break
  }

  // ====== 安全检查 ======
  const totalArticles = existingArticles.length + newArticles.length

  if (newArticles.length === 0) {
    console.log('\n⚠️  没抓到任何新文章！')
    if (existingArticles.length === 0) {
      console.log('❌ 致命错误：没有任何文章数据，写入失败')
      console.log('   请检查：')
      console.log('   1. GitHub Actions 网络是否能访问 RSS 源')
      console.log('   2. RSS 源 URL 是否仍然有效')
      console.log('   3. 是否需要添加新的 RSS 源')
      process.exit(1)
    } else {
      console.log(`✅ 保留旧数据（${existingArticles.length} 篇），仅更新日期`)
      // 保留旧数据但更新时间戳
      const output = {
        lastUpdated: new Date().toISOString().split('T')[0],
        articles: existingArticles,
      }
      writeOutput(output)
      return
    }
  }

  // 合并并排序：新文章在前
  const allArticles = [...newArticles, ...existingArticles]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20)

  const output = {
    lastUpdated: new Date().toISOString().split('T')[0],
    articles: allArticles,
  }

  writeOutput(output)
  console.log(`\n✅ 完成！新增 ${newArticles.length} 篇，总计 ${allArticles.length} 篇`)
}

function writeOutput(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true })

  const json = JSON.stringify(data, null, 2)
  fs.writeFileSync(OUTPUT_FILE, json, 'utf-8')
  fs.writeFileSync(PUBLIC_OUTPUT, json, 'utf-8')

  console.log(`   输出: ${OUTPUT_FILE}`)
  console.log(`   输出: ${PUBLIC_OUTPUT}`)
}

main().catch((err) => {
  console.error('❌ 脚本失败:', err)
  process.exit(1)
})
