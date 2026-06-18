# 混合检索：为什么比纯向量搜索好

> 纯向量检索的 recall@10 约 78%，加上 BM25 混合检索后到 91%。那 13 个百分点来自哪里？本文用具体例子讲清楚。

---

## 一句话

**混合检索 = Dense 向量（语义） + BM25 关键词（精确）并行搜索，用 RRF 融合排名结果。**

---

## 两种检索的盲区恰好互补

| 查询类型 | 纯向量检索 | 纯 BM25 |
|---|---|---|
| "如何优化数据库性能？" | ✅ 语义理解 | ⚠️ 只能匹配字面词 |
| "ERR_CONNECTION_REFUSED 怎么修？" | ❌ embedding 不理解这个字符串 | ✅ 倒排索引精确命中 |
| "最近压力大，怎么放松？" | ✅ 理解「压力」「放松」 | ⚠️ 只能匹配字面 |

核心问题：**Embedding 模型的训练数据里没有错误码、SKU、API 名称这类精确术语**。搜这些内容时，向量检索会「猜」——猜错了。

---

## RRF 融合：不看分数，只看排名

两路检索的分数尺度完全不同（向量相似度 [0,1]，BM25 分数 0 到几十），直接加权相加会出问题。

**RRF（Reciprocal Rank Fusion）的核心洞察**：不关心原始分数，只关心排名。

```
RRF_score(doc) = 1/(k + dense_rank) + 1/(k + bm25_rank)

k=60（默认值，跨数据集最鲁棒）
```

**计算示例**：

```
文档A：向量排第 1，BM25 排第 5
  score = 1/(60+1) + 1/(60+5) = 0.0164 + 0.0154 = 0.0318

文档B：向量排第 3，BM25 排第 2
  score = 1/(60+3) + 1/(60+2) = 0.0159 + 0.0161 = 0.0320

→ B 综合排名更高，尽管 A 在向量检索里是第一
```

这就是 RRF 的价值——B 在两路都排前列（更「全面」），所以比 A（只在一路强）更值得排前面。

---

## Python 实现（40 行）

```python
import jieba
from rank_bm25 import BM25Okapi

def hybrid_retrieve(query: str, top_k: int = 20) -> list[dict]:
    # 阶段 1：Dense 向量检索
    query_vec = embed_fn([query])
    dense_res = collection.query(query_embeddings=query_vec, n_results=top_k)

    # 阶段 2：BM25 稀疏检索
    tokenized_q = list(jieba.cut(query))        # 中文必须分词！
    bm25_scores = bm25.get_scores(tokenized_q)
    bm25_ranked = sorted(enumerate(bm25_scores),
                         key=lambda x: x[1], reverse=True)[:top_k]

    # 阶段 3：RRF 融合
    rrf_scores = {}
    K = 60

    for rank, doc_id in enumerate(dense_res["ids"][0]):
        rrf_scores[doc_id] = 1.0 / (K + rank + 1)

    for rank, (idx, _) in enumerate(bm25_ranked):
        doc_id = f"chunk_{idx}"
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + 1.0 / (K + rank + 1)

    return sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
```

完整代码：[rag.py](https://github.com/rushandeai/rag-project/blob/main/rag.py)

---

## 什么时候需要混合检索

```
必装场景：技术文档（API 名、错误码）、电商（SKU）、法律（条款编号）
可选场景：纯 FAQ、闲聊型查询
不必要：  数据量 < 1 万条且查询全是自然语言
```

简单判断：**用户的查询里，有没有 20% 以上包含专有名词、编号、错误码、产品名？有就加。**

---

## 实际效果

我的 RAG 系统加了混合检索 + Reranker 后，8 条测试集评估：

| 指标 | 分数 |
|---|---|
| Context Precision | 1.00 |
| Context Recall | 0.96 |

没有混合检索之前，Context Recall 预估会掉到 0.70 左右——就是因为某些精确术语（如「BGE-M3」「C-MTEB」）被向量检索漏掉了。

---

## 下一篇

混合检索解决了「召回更多」的问题，但 top-20 里第 3 条可能才是真正最相关的——下一篇讲 **Reranker（Cross-Encoder 重排序）**怎么解决「排得更准」。
