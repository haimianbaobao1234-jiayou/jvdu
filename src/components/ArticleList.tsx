import type { Article } from '../types'
import { useArticles } from '../hooks/useArticles'
import { CategoryTabs } from './CategoryTabs'
import { ArticleCard } from './ArticleCard'

interface ArticleListProps {
  onSelectArticle: (article: Article) => void
}

export function ArticleList({ onSelectArticle }: ArticleListProps) {
  const { articles, loading, error, filter, setFilter } = useArticles()

  if (loading) {
    return <div className="list-status">加载中...</div>
  }

  if (error) {
    return <div className="list-status list-error">加载失败：{error}</div>
  }

  return (
    <div className="article-list">
      <CategoryTabs current={filter} onChange={setFilter} />

      {articles.length === 0 ? (
        <div className="list-status">暂无文章</div>
      ) : (
        <div className="card-list">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onClick={() => onSelectArticle(article)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
