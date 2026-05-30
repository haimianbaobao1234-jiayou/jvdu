import type { Article } from '../types'
import { LEVEL_LABELS } from '../types'

interface ArticleCardProps {
  article: Article
  onClick: () => void
}

/** 估算阅读时间（按每分钟 150 词） */
function estimateReadTime(article: Article): number {
  const wordCount = article.sentences.reduce(
    (sum, s) => sum + s.en.split(/\s+/).length, 0
  )
  return Math.max(1, Math.round(wordCount / 150))
}

export function ArticleCard({ article, onClick }: ArticleCardProps) {
  const readTime = estimateReadTime(article)

  return (
    <article className="article-card" onClick={onClick}>
      <h3 className="card-title">{article.title}</h3>
      <div className="card-meta">
        <span className="card-source">{article.source}</span>
        <span className="card-dot">·</span>
        <span className="card-date">{article.date}</span>
        <span className="card-dot">·</span>
        <span className="card-level">{LEVEL_LABELS[article.level]}</span>
        <span className="card-dot">·</span>
        <span className="card-time">{readTime} 分钟阅读</span>
      </div>
    </article>
  )
}
