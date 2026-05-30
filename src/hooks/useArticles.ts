import { useState, useEffect } from 'react'
import type { Article, ArticlesData, Level } from '../types'

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Level | 'all'>('all')

  // 加载文章数据
  useEffect(() => {
    fetch('./data/articles.json')
      .then((res) => {
        if (!res.ok) throw new Error('加载失败')
        return res.json() as Promise<ArticlesData>
      })
      .then((data) => {
        setArticles(data.articles)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // 按难度筛选
  const filtered = filter === 'all'
    ? articles
    : articles.filter((a) => a.level === filter)

  return { articles: filtered, allArticles: articles, loading, error, filter, setFilter }
}
