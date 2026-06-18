# 手写 RAG 全链路：从 Chunking 到 Reranker

> 我搭了一个 RAG 系统，每一层都是手写的——没有用 LangChain 的 `VectorstoreIndexCreator` 一行出结果。本文记录全链路的技术决策和代码。

**项目源码**：[github.com/rushandeai/rag-project](https://github.com/rushandeai/rag-project)

---

## 为什么手写

LangChain 的 `RetrievalQA` 几行代码就能跑一个 RAG demo，但想搞清楚每一步在做什么——Chunking 策略、Embedding 选型、Reranker 集成——三行代码的背后你什么都看不到。

手写一遍，每一步都清楚。这也是这篇文章的结构：按数据流顺序，从文档入库到生成回答，每层讲清楚「做了什么 + 为什么这么做」。

---

## 第 1 层：Chunking（文档切块）

**做什么**：把长文档切成小段，每段独立做 Embedding 存入向量库。

**我的策略**——针对中文 Markdown 文档做了两层切分：

```
第 1 级：按 ## 二级标题切 → 保留文档结构
第 2 级：长段落按中文句号（。）断句
滑动窗口：相邻 chunk 重叠 50 字符
每个 chunk 带 [章节名] 前缀
```

**代码**：[`ingest.py`](https://github.com/rushandeai/rag-project/blob/main/ingest.py)

```python
CHUNK_SIZE = 300       # 每块最大字符数
CHUNK_OVERLAP = 50     # 相邻块重叠

for section in text.split("\n## "):
    # 按章节切
    # 长段落按句号再切
    # 保留 50 字重叠防止语义切断
```

**为什么不用 LangChain 的 RecursiveCharacterTextSplitter**：那个很好，但在中文场景下按 `["\n\n", "\n", "。", ".", " ", ""]` 优先级切，中文句号的优先级不够高。我的实现直接把 `。` 作为主要断句符，对中文更友好。

**实际效果**：1754 字的知识库，切成了 9 个 chunk，每个带章节标签，检索时能精确定位到段落。

---

## 第 2 层：Embedding（文本向量化）

**做什么**：把每个 chunk 变成 512 维的浮点数数组。语义相近的文字，数字也相近。

**选型：BAAI/bge-small-zh-v1.5**

| 对比项 | BGE-small-zh | OpenAI text-embedding-3 | all-MiniLM-L6-v2 |
|---|---|---|---|
| 中文效果 | ✅ C-MTEB 前列 | ⚠️ 通用，非中文专项 | ❌ 以英文为主 |
| 成本 | 免费（本地跑） | 按 token 计费 | 免费 |
| 大小 | 24MB | 云端 | 80MB |
| 维度 | 512 | 可调 | 384 |

选 BGE 的核心原因：**中文效果好 + 本地免费**。开发阶段不用操心 API 费用。

**代码**：[`embedding.py`](https://github.com/rushandeai/rag-project/blob/main/embedding.py)

---

## 第 3 层：混合检索（Hybrid Search）

**做什么**：两路同时搜索——Dense（语义向量）+ BM25（关键词），用 RRF 融合结果。

这是整个系统里最重要的设计决策。为什么不能只用向量检索？

**向量检索的盲区**：
- 搜「Transformer」→ 能找到，因为语义明显
- 搜「ERR_CONNECTION_REFUSED」→ 找不到，因为 embedding 模型没见过这个错误码
- BM25 恰好相反——精确关键词命中率高，但语义变化就失效

两者互补：BM25 补 Dense 的关键词盲区，Dense 补 BM25 的语义盲区。

**RRF 融合公式**：

```
RRF_score(doc) = 1/(k + dense_rank) + 1/(k + bm25_rank)
k=60（SIGIR 2009 论文的默认值，跨数据集最鲁棒）
```

不看原始分数（向量相似度和 BM25 分数尺度完全不同），只看排名。零调参，工业界通用。

**代码**：[`rag.py` L66-108](https://github.com/rushandeai/rag-project/blob/main/rag.py)

---

## 第 4 层：Reranker（重排序）

**做什么**：粗排拿到 20 条候选，再用 Cross-Encoder 精排到 3 条。

**为什么需要？**

| 方法 | 编码方式 | 精度 | 速度 |
|---|---|---|---|
| Bi-Encoder（向量检索） | query 和 doc 分开编码 | 中 | 快 |
| Cross-Encoder（Reranker） | query + doc 拼在一起编码 | 高 | 慢 |

所以只对粗排的 top-20 做精排——省时间，精度收益最大。

**模型**：BAAI/bge-reranker-base（~1GB），Cross-Encoder 把 query 和 doc 拼在一起送入 Transformer 联合编码，精度远高于余弦相似度。

**代码**：[`rag.py` L113-133](https://github.com/rushandeai/rag-project/blob/main/rag.py)

---

## 第 5 层：生成 + 评估

**生成**：top-3 文档拼成 prompt，发给 DeepSeek。System prompt 加了「严格基于资料，不编造」的约束。

**评估**：没用 RAGAS 库（0.4.3 和 langchain-community 有兼容性 bug），自己用 DeepSeek 做 LLM-as-Judge，写了三个指标：

| 指标 | 分数（8 条测试集） |
|---|---|
| Faithfulness | 1.00 |
| Context Precision | 1.00 |
| Context Recall | 0.96 |

> 知识库只有 9 个 chunk，这个分数有水份。扩展后会更真实。

**评估代码**：[`evaluate.py`](https://github.com/rushandeai/rag-project/blob/main/evaluate.py)

---

## 总结

整个系统 6 个 Python 文件，没有用 LangChain 的检索链。每一层都能讲清楚为什么。

下一步：多轮对话、流式输出、知识库扩容。
