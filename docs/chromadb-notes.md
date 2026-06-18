# ChromaDB 使用小记

> 两个项目都在用 ChromaDB。记一些实际碰到的点。

两个项目的数据量：RAG 项目 9 个 chunk，英语教学工具取决于上传的教材（一个 Unit 大概 15-30 个 chunk）。量很小，ChromaDB 完全够用。

## 为什么不用别的

装了 `chromadb` 之后直接 `PersistentClient(path)` 就跑起来了。不需要 Docker、不需要配 K8s、不需要额外服务。对开发阶段来说这是最重要的——把「跑起来」的门槛降到最低。

## 实际操作

```python
import chromadb
client = chromadb.PersistentClient(path="./chroma_data")

# get_or_create 比 create 实用——重跑不会报错
col = client.get_or_create_collection(name="docs")

col.add(
    ids=["1"],
    documents=["hello world"],
    embeddings=[[0.1] * 384],  # 传 embedding 可以跳过内置的 embedding function
    metadatas=[{"source": "test"}]
)

# 检索
results = col.query(query_embeddings=[[0.15]*384], n_results=3)
```

## 几个注意点

1. 每次全量重导数据时最好 `delete_collection` 再 `create_collection`，比逐条删快得多
2. metadata 过滤只支持精确匹配（`where={"source": "a"}`），不支持 LIKE、范围查询。需要复杂过滤的场景 ChromaDB 不合适
3. 持久化目录直接拷走就是备份——里面是 `chroma.sqlite3` 加一些二进制文件

## 不够的地方

metadata 过滤太弱。英语教学工具里想按 `textbook_id` 过滤，用的是精确匹配——刚好够。但如果以后想按「年级 > 7」这种条件过滤，ChromaDB 做不到，得换 Qdrant 或 Milvus。

另一个限制：单机。数据量上十万条后检索速度明显下降。目前两个项目都远没到这个量级。
