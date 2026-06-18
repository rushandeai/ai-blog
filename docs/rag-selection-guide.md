# RAG 技术选型速查表

> Embedding 模型怎么选、向量数据库用哪个、Agent 框架有什么区别。这篇整理常见选型问题，每项给默认推荐和一句话理由。

---

## Embedding 模型

| 模型 | 推荐场景 | 理由 |
|---|---|---|
| **BAAI/bge-small-zh-v1.5** | 🏆 中文 RAG 默认选择 | C-MTEB 前列，24MB，本地免费 |
| BAAI/bge-large-zh-v1.5 | 精度要求高 | 1.3GB，精度最高但更慢 |
| BAAI/bge-m3 | 多语言 + 混合检索 | 同时出 Dense + Sparse 向量，一套模型替代 Embedding + BM25 |
| OpenAI text-embedding-3 | 不想管模型部署 | 云端，效果好，按 token 计费 |
| all-MiniLM-L6-v2 | ❌ 不推荐中文场景 | 英文模型，中文语义理解差 |

**默认推荐**：`bge-small-zh-v1.5`。开发阶段免费，效果够用。

---

## 向量数据库

| 数据库 | 推荐场景 | 理由 |
|---|---|---|
| **ChromaDB** | 🏆 原型 / 小规模 | 零配置，Python 几行代码跑起来 |
| Milvus | 生产 / 亿级数据 | 分布式，腾讯/华为生态，深圳 AI 岗最常见 |
| Qdrant | 需要复杂过滤 | Rust 实现，payload 过滤能力最强 |
| FAISS | 算法选型 / 嵌入式 | Meta 出品，不是数据库是算法库，速度极快 |

**默认推荐**：原型用 ChromaDB，生产上 Milvus。

---

## Reranker（重排序模型）

| 模型 | 推荐场景 | 理由 |
|---|---|---|
| **BAAI/bge-reranker-v2-m3** | 🏆 生产默认 | 多语言，效果好 |
| BAAI/bge-reranker-base | 本地开发 | 1GB，比 v2-m3 小 |
| Cohere Rerank | 不想管模型 | API 调用，效果好但按次计费 |

**默认推荐**：开发用 `bge-reranker-base`，生产用 `bge-reranker-v2-m3`。

**什么情况不需要 Reranker**：数据量 < 1000 条，或者用户查询全是精确关键词（如内部 FAQ）。

---

## Agent 框架

| 框架 | 推荐场景 | 理由 |
|---|---|---|
| **手写 ReAct** | 🏆 简单 Agent | 200 行 Python，完全可控 |
| LangGraph | 复杂多 Agent + 需要 HITL | 状态机模式，Checkpoint 和审计 |
| CrewAI | 快速原型 | 角色扮演式多 Agent，15 分钟出 demo |
| AutoGen | 微软生态 | 对话式多 Agent，但维护模式（已 fork 为 AG2） |
| LlamaIndex | RAG 专用 | 内置很多 RAG 策略（Hierarchical Node Parser 等） |

**默认推荐**：先用 200 行 Python 手写一个 ReAct Agent（理解本质），再根据复杂度选框架。

---

## Chunking 策略

| 策略 | 场景 |
|---|---|
| **Recursive Split（按分隔符递归）** | 🏆 90% 场景的默认选择 |
| Semantic Chunking（embedding 检测话题切换） | 长文档、话题变化频繁（成本高） |
| Small-to-Big（小 chunk 检索 + 大 chunk 送 LLM） | 需要精确检索 + 丰富上下文（存储翻倍） |
| 固定大小 + 重叠 | 简单场景 |

**chunk_size**：中文建议 300-500 字，英文 256-512 token。overlap 10-20%。

---

## 融合算法

| 方法 | 场景 |
|---|---|
| **RRF (k=60)** | 🏆 零标注数据的默认选择 |
| 加权融合 | 有 50+ 标注数据 |
| 动态加权（查询分类） | 生产环境、查询类型多样 |

**默认推荐**：RRF。大多数公司永远不需要走到动态加权。

---

## 可观测 / 评估

| 工具 | 用途 |
|---|---|
| **LangFuse** | 全链路追踪（类比 Datadog for AI） |
| RAGAS | RAG 质量评估（Faithfulness / Context Precision / Recall） |
| Phoenix (Arize) | Embedding 空间可视化，排查检索盲区 |

**默认推荐**：开发阶段用 LLM-as-Judge 快速评估（[我的实现](./llm-as-judge)），生产环境上 LangFuse + RAGAS。

---

## 大模型 API

| 模型 | 推荐场景 | 理由 |
|---|---|---|
| **DeepSeek Chat** | 🏆 中文 + 低成本 | 中文好，价格低，兼容 OpenAI 格式 |
| Claude (Anthropic) | 长文本、需要深度推理 | 200K 上下文窗口 |
| GPT-4o (OpenAI) | 综合能力最强 | 贵但稳 |

**默认推荐**：DeepSeek。开发阶段成本可控。

---

## 总结：一套默认技术栈

```
Embedding: BAAI/bge-small-zh-v1.5（本地免费）
向量库:   ChromaDB（开发）→ Milvus（生产）
检索:     BM25 + Dense → RRF 融合
精排:     BAAI/bge-reranker-base
生成:     DeepSeek Chat
评估:     LLM-as-Judge（开发）→ RAGAS（生产）
```

这套技术栈的特点：**成本低、中文好、可升级**。我的 [rag-project](https://github.com/rushandeai/rag-project) 就是这样搭的。
