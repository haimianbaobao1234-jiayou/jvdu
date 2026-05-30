# 技术规范 — 句读

## 技术栈清单

| 层 | 技术 | 版本 | 说明 |
|----|------|------|------|
| 框架 | React | 18.x | 函数组件 + Hooks |
| 语言 | TypeScript | 5.x | 类型安全 |
| 构建 | Vite | 6.x | 快速开发 + 生产打包 |
| PWA | Service Worker | - | 基础缓存策略 |
| 样式 | CSS Variables | - | 纯 CSS，无预处理/UI 框架 |
| 词典 API | Free Dictionary | - | `api.dictionaryapi.dev` |
| 翻译 | @vitalets/google-translate-api | - | 免费翻译 |
| 部署 | GitHub Pages | - | 免费静态托管 |
| CI/CD | GitHub Actions | - | 每日自动更新 |

## 项目结构

```
english-reader/
├── CLAUDE.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── index.html                    ← 入口 HTML
├── public/
│   ├── manifest.json             ← PWA 清单
│   ├── sw.js                     ← Service Worker
│   └── icons/                    ← PWA 图标（192x192, 512x512）
├── src/
│   ├── main.tsx                  ← React 入口
│   ├── App.tsx                   ← 根组件（路由）
│   ├── types/
│   │   └── index.ts              ← 所有 TS 类型定义
│   ├── styles/
│   │   └── theme.css             ← 主题 CSS 变量
│   ├── components/
│   │   ├── ArticleList.tsx       ← 文章列表页
│   │   ├── ArticleCard.tsx       ← 文章卡片
│   │   ├── ArticleReader.tsx     ← 阅读页面
│   │   ├── WordPopup.tsx         ← 单词弹窗
│   │   ├── ThemeToggle.tsx       ← 主题切换按钮
│   │   └── CategoryTabs.tsx      ← 分类标签栏
│   └── hooks/
│       ├── useArticles.ts        ← 文章数据 + 筛选
│       ├── useTheme.ts           ← 主题状态管理
│       └── useDictionary.ts      ← 词典 API 调用
├── scripts/
│   ├── fetch-rss.js              ← RSS 抓取
│   └── translate.js              ← 逐句翻译
├── data/
│   └── articles.json             ← 静态文章数据
├── docs/
│   ├── 01-requirements.md
│   ├── 02-tech-spec.md
│   ├── 03-design-spec.md
│   └── 04-execution-plan.md
├── dev-logs/
│   ├── template.md
│   └── YYYY-MM-DD.md
└── .github/
    └── workflows/
        └── update-articles.yml   ← 每日更新流水线
```

## 数据模型定义

```typescript
// 难度等级
type Level = 'cet4' | 'cet6' | 'ielts';

// 句子（英文 + 中文翻译）
interface Sentence {
  en: string;          // 英文原文
  zh: string;          // 中文翻译
}

// 文章
interface Article {
  id: string;          // 唯一标识
  title: string;       // 标题
  source: string;      // 来源（如 "VOA"）
  sourceUrl: string;   // 原文链接
  level: Level;        // 难度等级
  date: string;        // 发布日期（YYYY-MM-DD）
  sentences: Sentence[]; // 句子数组（按原文顺序）
}
```

## API 接口说明

### 文章数据加载
- **方式**：静态 JSON 文件（`/data/articles.json`）
- **格式**：`{ articles: Article[], lastUpdated: string }`
- **加载**：前端 fetch 后解析

### 单词查询
- **API**：`https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- **方法**：GET
- **返回**：JSON（音标、词性、释义、发音音频 URL）

### RSS 抓取（后端脚本）
- VOA Special English：`https://learningenglish.voanews.com/api/`
- BBC Learning English：`https://feeds.bbci.co.uk/learningenglish/`
- The Guardian：`https://www.theguardian.com/international/rss`
- NPR News：`https://feeds.npr.org/1001/rss.xml`

## 关键设计决策

1. **不用路由库**：应用只有两个视图（列表/阅读），用 state 切换即可，不引入 react-router
2. **不用 UI 框架**：纯 CSS + CSS Variables 实现主题，保持极简
3. **预翻译而非实时翻译**：在 GitHub Actions 中完成翻译，前端只展示静态数据
4. **单 JSON 文件**：所有文章存一个 `articles.json`，数据量小（60 天内约 100-200 篇），无需分页 API
