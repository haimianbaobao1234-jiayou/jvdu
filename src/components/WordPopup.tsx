import type { WordInfo } from '../hooks/useDictionary'

interface WordPopupProps {
  wordInfo: WordInfo | null
  loading: boolean
  error: string | null
  onClose: () => void
}

export function WordPopup({ wordInfo, loading, error, onClose }: WordPopupProps) {
  return (
    <div className="word-popup-overlay" onClick={onClose}>
      <div className="word-popup" onClick={(e) => e.stopPropagation()}>
        {/* 加载中 */}
        {loading && (
          <div className="popup-loading">查询中...</div>
        )}

        {/* 错误 */}
        {error && !loading && (
          <div className="popup-error">
            <p className="popup-error-text">{error}</p>
          </div>
        )}

        {/* 单词详情 */}
        {wordInfo && !loading && (
          <>
            <div className="popup-word-row">
              <h3 className="popup-word">{wordInfo.word}</h3>
              {wordInfo.phonetic && (
                <span className="popup-phonetic">英 {wordInfo.phonetic}</span>
              )}
              {wordInfo.audioUrl && (
                <button
                  className="popup-audio-btn"
                  onClick={() => {
                    const audio = new Audio(wordInfo.audioUrl)
                    audio.play()
                  }}
                  title="英式发音"
                >
                  🔊
                </button>
              )}
            </div>

            <div className="popup-meanings">
              {wordInfo.meanings.map((m, i) => (
                <div key={i} className="popup-meaning-group">
                  <span className="popup-pos">{m.partOfSpeech}</span>
                  <ol className="popup-defs">
                    {m.definitions.map((def, j) => (
                      <li key={j}>
                        <span className="def-zh">{def.zh}</span>
                        {def.zh && <span className="def-sep"> · </span>}
                        <span className="def-en">{def.en}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 关闭按钮 */}
        <button className="popup-close-btn" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  )
}
