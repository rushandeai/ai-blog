# 中文 RAG 开发四大坑

> 搭 RAG 系统的过程中踩了一些坑——不是「这个模型比那个好 2%」那种论文讨论，是代码跑不起来、API 报错、网络超时这种实实在在的问题。

---

## 坑 1：BM25 对中文无效——必须分词

**现象**：加了 BM25 混合检索，结果比纯向量还差。

**原因**：BM25 按空格分词，英文天然支持。中文没有空格——「混合检索与重排序」到了 BM25 眼里变成了 `["混", "合", "检", "索", "与", "重", "排", "序"]`，每个字都是独立的「词」。

你搜「混合检索」，BM25 匹配的是「混」「合」「检」「索」四个字的出现频率，不是「混合检索」这个词的语义。

**解决**：用 jieba 分词。

```python
import jieba
from rank_bm25 import BM25Okapi

def tokenize(text: str) -> list[str]:
    return list(jieba.cut(text))

# 建索引和查询必须用同一个分词函数
tokenized_chunks = [tokenize(c) for c in chunks]
bm25 = BM25Okapi(tokenized_chunks)

# 查询时
tokenized_q = tokenize("什么是混合检索")
bm25_scores = bm25.get_scores(tokenized_q)
```

**关键**：索引和查询用同一个 `tokenize()` 函数。否则 token 对不上。

---

## 坑 2：HuggingFace 镜像不完整——HEAD 请求超时

**现象**：

```
'[WinError 10060] 连接尝试失败' thrown while requesting HEAD
https://huggingface.co/BAAI/bge-small-zh-v1.5/resolve/main/adapter_config.json
Retrying in 1s [Retry 1/5]
```

**原因**：`HF_ENDPOINT=https://hf-mirror.com` 镜像对模型权重文件的 GET 请求支持正常，但对 `adapter_config.json`、`processor_config.json` 等元数据文件的 HEAD 请求支持不完整。每次启动都会重试 5 次 × 每个文件 × 约 23 秒 = 很慢。

**解决**：模型下载完后，用 `local_files_only=True` 跳过在线检查。

```python
import os
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'

from sentence_transformers import SentenceTransformer

# 先尝试本地缓存，失败再走在线
try:
    model = SentenceTransformer("BAAI/bge-small-zh-v1.5", local_files_only=True)
except Exception:
    model = SentenceTransformer("BAAI/bge-small-zh-v1.5")
```

第一次启动：等下载（~24MB Embedding + ~1GB Reranker）
之后启动：秒过

**同样的逻辑也适用于 CrossEncoder（Reranker 模型）**。

---

## 坑 3：Pydantic v2 的 `str = None` 不接受前端 `null`

**现象**：

```
POST /ask HTTP/1.1 422 Unprocessable Entity
```

**原因**：FastAPI 的 Pydantic 模型中写了 `textbook_id: str = None`，前端在未选择教材时传了 `{ textbook_id: null }`。Pydantic v2 的 `str = None` 对 JSON `null` 的处理和 Optional 不同。

**解决**：

```python
# ❌ 旧写法
class AskRequest(BaseModel):
    textbook_id: str = None

# ✅ 新写法
class AskRequest(BaseModel):
    textbook_id: str | None = None
```

前端也改——不选教材时不传这个字段：

```typescript
// ❌ 旧写法
body: JSON.stringify({ question: q, textbook_id: selectedTextbook || null })

// ✅ 新写法
body: JSON.stringify({
    question: q,
    ...(selectedTextbook ? { textbook_id: selectedTextbook } : {}),
})
```

---

## 坑 4：Embedding 模型选错——英文模型处理中文

**现象**：用 `all-MiniLM-L6-v2` 做中文知识库的 Embedding，检索结果不相关。

**原因**：`all-MiniLM-L6-v2` 是英文模型。虽然它能处理 multilanguage 输入（因为 tokenizer 会 fallback），但中文语义理解能力远不如专门的中文模型。

**解决**：换 `BAAI/bge-small-zh-v1.5`，C-MTEB 中文基准测试排名前列。

| 模型 | 中文效果 | 大小 |
|---|---|---|
| all-MiniLM-L6-v2 | ❌ 差 | 80MB |
| BAAI/bge-small-zh-v1.5 | ✅ 好 | 24MB |

BGE 比 MiniLM 更小、中文更好——因为 MiniLM 用英文语料训练，BGE 用中文语料。

---

## 总结

这四个坑的共同点：**都不是 AI 算法问题，是工程落地问题。** 真的把系统跑起来才会遇到。

相关代码：[rag-project](https://github.com/rushandeai/rag-project)
