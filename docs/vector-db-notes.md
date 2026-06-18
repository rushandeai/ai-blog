# 向量数据库和检索概念整理

> 向量数据库和检索的阅读笔记。ChromaDB 是唯一实际用过的，Milvus、FAISS、Qdrant 只是看了文档。

## ChromaDB —— 唯一实战过的

两个项目都在用。选它的原因很简单：`pip install chromadb` 之后三行代码跑起来，零配置。

```python
import chromadb
client = chromadb.PersistentClient(path="./data")
col = client.create_collection(name="docs")
col.add(ids=["1"], documents=["hello world"])
```

持久化模式把数据存在本地目录，备份直接拷文件夹。ChromaDB 的局限也很明显：metadata 过滤弱（不支持 LIKE、范围查询）、没有分布式、数据超过 10 万条后检索速度明显下降。但在开发和小规模场景下，这些都不重要。

## Milvus —— 只在文档里见过

深圳 AI 公司用得最多。分布式架构，支持十亿级向量检索，腾讯云有托管版。

部署比 ChromaDB 复杂一个数量级——需要 K8s + etcd + MinIO。我的项目数据量太小，没到需要 Milvus 的阶段。可以把 ChromaDB 理解为 SQLite，Milvus 理解为 PostgreSQL——场景不同，工具不同。

## FAISS —— 算法库，不是数据库

Meta 开源的向量检索算法库。只管「给你一堆向量，快速找出最近的 N 个」，不管持久化、不管分布式、不管 metadata 过滤。适合嵌入到已有系统里用，不适合单独当数据库。

## 混合检索和 RRF

这是我 RAG 项目里实际实现过的。BM25 关键词检索 + Dense 语义检索并行，用 RRF 融合排名。RRF 的巧妙之处：不看原始分数（向量相似度和 BM25 分数尺度不同），只看排名。不需要调参。

## Reranker

Cross-Encoder 做精排。向量检索是 Bi-Encoder（query 和 doc 分开编码），快但精度一般。Reranker 把 query 和 doc 拼在一起编码，精度高但慢。所以只对粗排的 top-20 做精排。我的项目用的 BAAI/bge-reranker-base，约 1GB。

## GraphRAG

微软的研究。传统 RAG 检索孤立的 chunk，GraphRAG 先建知识图谱，把相关实体归入同一社区，查询时从社区取上下文。思路好但索引成本太高——每段文本要调多次 LLM 提取实体和关系。目前不适合开发阶段尝试。

---

ChromaDB + 混合检索 + Reranker 是实际用过的，其余是阅读笔记。
