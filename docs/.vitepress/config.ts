import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "AI Learning Notes",
  description: "我的 AI 学习笔记",
  base: '/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
    ],
    sidebar: [
      {
        text: '学习笔记',
        items: [
          { text: 'RAG 原理', link: '/rag' },
          { text: 'Transformer', link: '/transformer' },
          { text: '面试题', link: '/interview-qa' },
          { text: '流式输出', link: '/streaming' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/rushandeai/ai-blog' }
    ]
  }
})