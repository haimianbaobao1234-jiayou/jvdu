import type { Article } from '../types'
import { LEVEL_LABELS } from '../types'
import { useDictionary } from '../hooks/useDictionary'
import { WordPopup } from './WordPopup'

interface ArticleReaderProps {
  article: Article
  onBack: () => void
}

export function ArticleReader({ article, onBack }: ArticleReaderProps) {
  const { wordInfo, loading, error, isOpen: popupOpen, lookup, close } = useDictionary()

  const handleWordClick = (e: React.MouseEvent, word: string) => {
    e.stopPropagation()
    lookup(word)
  }

  return (
    <div className="reader">
      {/* 顶部导航 */}
      <div className="reader-top">
        <button className="back-btn" onClick={onBack}>
          ← 返回
        </button>
      </div>

      {/* 文章头部 */}
      <div className="reader-header">
        <h1 className="reader-title">{article.title}</h1>
        <div className="reader-meta">
          <span>{article.source}</span>
          <span className="meta-dot">·</span>
          <span>{article.date}</span>
          <span className="meta-dot">·</span>
          <span className="reader-level">{LEVEL_LABELS[article.level]}</span>
        </div>
      </div>

      <div className="reader-divider" />

      {/* 文章内容 */}
      <div className="reader-content">
        {article.sentences.map((sentence, index) => {
          const words = sentence.en.split(/(\s+)/).filter(Boolean)

          return (
            <div key={index} className="sentence-block">
              <p className="sentence-en">
                {words.map((token, wi) => {
                  if (/^\s+$/.test(token)) {
                    return <span key={wi}>{token}</span>
                  }
                  return (
                    <span
                      key={wi}
                      className="clickable-word"
                      onClick={(e) => handleWordClick(e, token)}
                      title="点击查词"
                    >
                      {token}
                    </span>
                  )
                })}
              </p>
              <p className="sentence-zh">{sentence.zh}</p>
            </div>
          )
        })}
      </div>

      <div className="reader-hint">
        💡 点击单词查词典
      </div>

      {/* 单词弹窗 */}
      {popupOpen && (
        <WordPopup
          wordInfo={wordInfo}
          loading={loading}
          error={error}
          onClose={close}
        />
      )}
    </div>
  )
}
