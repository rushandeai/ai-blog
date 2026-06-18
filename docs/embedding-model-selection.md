# Embedding 模型怎么选

> 给 RAG 选 Embedding 模型，试了三个。最终选 BGE，中间踩了几个坑。

## 试过的三个

| 模型 | 中文 | 英文 | 大小 | 成本 |
|---|---|---|---|---|
| all-MiniLM-L6-v2 | ❌ | ✅ | 80MB | 免费 |
| BAAI/bge-small-zh-v1.5 | ✅ | ✅ | 24MB | 免费 |
| OpenAI text-embedding-3 | ✅ | ✅ | 云端 | 按 token |

### MiniLM 的坑

它处理中文的方式是 tokenizer 不认识中文 → 把每个汉字当成一个 token → 中文语义理解基本没有。搜「Transformer 架构」能勉强找到，搜「那个 Google 2017 年提出的模型」完全找不到。

结论：中文 RAG 不能用英文 Embedding 模型。

### BGE 为什么对

BGE（BAAI General Embedding）是智源研究院出的。bge-small-zh-v1.5：
- C-MTEB 中文基准前几名
- 24MB，本地跑
- 中文+英文混合输入效果都可以
- 免费

我的 RAG 项目用的就是这个。Embedding 步骤零 API 成本。

### OpenAI 什么时候用

不想管模型、愿意花钱、需要多语言 → OpenAI text-embedding-3。1M token 约 0.02 美元。开发阶段没必要花这个钱。

## 实际选型建议

- 本地开发、中文为主 → bge-small-zh-v1.5
- 多语言 + 还需要 Sparse 向量 → bge-m3（一个模型同时出 dense + sparse）
- 不差钱、不想运维 → OpenAI
- 英文为主 → all-MiniLM-L6-v2 或 bge-large-en
