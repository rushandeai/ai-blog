import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "如山的笔记",
  description: "学 AI，写代码，读闲书",
  base: '/',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'GitHub', link: 'https://github.com/rushandeai' },
    ],
    sidebar: [
      {
        text: '实战记录',
        items: [
          { text: '手写 RAG 全链路', link: '/rag-full-pipeline' },
          { text: '混合检索 vs 纯向量', link: '/hybrid-search' },
          { text: 'LLM-as-Judge 评估', link: '/llm-as-judge' },
          { text: '中文 RAG 四大坑', link: '/rag-pitfalls' },
          { text: 'Embedding 模型选型', link: '/embedding-model-selection' },
          { text: 'ChromaDB 使用小记', link: '/chromadb-notes' },
          { text: '怎么写好提示词', link: '/prompt-engineering' },
        ]
      },
      {
        text: '学习笔记',
        collapsed: true,
        items: [
          { text: '模型推理', link: '/model-inference-notes' },
          { text: 'Agent 和框架', link: '/agent-framework-notes' },
          { text: '向量数据库和检索', link: '/vector-db-notes' },
          { text: 'AI 安全与全栈', link: '/ai-security-notes' },
          { text: 'System Prompt', link: '/system-prompt' },
          { text: 'Few-shot + CoT', link: '/few-shot-cot' },
          { text: 'SSE 流式输出', link: '/sse-streaming' },
          { text: 'FastAPI Async', link: '/fastapi-async' },
          { text: '语义缓存', link: '/semantic-caching' },
          { text: 'Prompt Injection', link: '/prompt-injection' },
          { text: 'Agent 是什么', link: '/agent-intro' },
        ]
      },
      {
        text: '读书与杂谈',
        collapsed: true,
        items: [
          { text: '《Why Nations Fail》', link: '/why-nations-fail' },
          { text: '训练前额叶皮质', link: '/prefrontal-cortex' },
          { text: '不抱怨', link: '/no-complaining' },
          { text: '我的英语学习日常', link: '/english-daily' },
          { text: '英语连读笔记', link: '/english-liaison' },
          { text: '几句一直提醒自己的话', link: '/reminders' },
          { text: '关于冥想', link: '/meditation' },
          { text: '为什么读英文原著', link: '/why-read-english' },
          { text: '怎么写日记', link: '/on-journaling' },
        ]
      },
      {
        text: '写作中',
        collapsed: true,
        items: [
          { text: 'Agent 手写 ReAct', link: '/agent-react' },
        ]
      },
      {
        text: '参考',
        collapsed: true,
        items: [
          { text: 'RAG 技术选型速查', link: '/rag-selection-guide' },
          { text: 'RAG 项目源码', link: 'https://github.com/rushandeai/rag-project' },
          { text: '英语教学 AI 工具', link: 'https://github.com/rushandeai/english-learning-companion' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/rushandeai' }
    ],
  }
})
