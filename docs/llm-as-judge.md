# 用 LLM-as-Judge 评估 RAG 系统

> 我没用 RAGAS 库——0.4.3 版本和 langchain-community 有兼容性问题。直接用 DeepSeek 做评判模型，手写了三个指标。

**评估代码**：[evaluate.py](https://github.com/rushandeai/rag-project/blob/main/evaluate.py)

---

## 为什么要评估

RAG 系统不是调通了就算完。你换了 Embedding 模型、改了 Chunking 策略、加了 Reranker——哪个改动真的有效？用数据说话。

三个核心指标：

| 指标 | 问什么 | 怎么算 |
|---|---|---|
| **Faithfulness（忠实度）** | 回答有没有编造？ | LLM 检查每条回答是否都能在检索文档中找到依据 |
| **Context Precision（精度）** | 相关文档排在前面了吗？ | LLM 逐条判断检索到的文档是否相关，按位置加权 |
| **Context Recall（召回率）** | 该检索到的都检索到了吗？ | LLM 比对标准答案，看检索文档覆盖了多少关键信息 |

---

## 为什么不用 RAGAS

RAGAS 是 RAG 评估的标准库，但我遇到了现实问题：

```python
# 安装 ragas 0.4.3 后导入报错
from ragas import evaluate
# → ModuleNotFoundError: No module named 'langchain_community.chat_models.vertexai'
```

0.4.3 依赖了旧版 langchain-community 的 API，新版已经移除了 `chat_models.vertexai` 模块。这是一个已知的兼容性 bug（GitHub issue #2765）。

**方案**：不用 RAGAS，直接用 DeepSeek API 做评判——LLM-as-Judge。

好处：
- 零依赖冲突
- 每条指标的 prompt 自己写，逻辑透明
- 每条指标的 prompt 自己写，逻辑透明，知道 Faithfulness 到底是怎么算的

---

## 实现：三个 Prompt

### Faithfulness（忠实度）

```
评估以下回答是否完全基于提供的上下文，有无编造。

上下文：{检索到的文档}

生成的回答：{LLM 的答案}

请评分：
- 1.0：回答全部基于上下文，无编造
- 0.7-0.9：基本基于上下文，有少量合理推断
- 0.4-0.6：部分基于上下文，有一些编造
- 0.0-0.3：大量编造

只回答一个 0.0 到 1.0 之间的数字。
```

### Context Precision（检索精度）

```
判断以下文档是否与问题和参考答案相关。只回答 "相关" 或 "不相关"。

问题：{用户问题}
参考答案：{标准答案}
文档：{检索到的第 i 条文档}
```

对每条检索结果独立判断，然后按位置加权：

```python
# 排前面的相关文档权重更高
for i, is_relevant in enumerate(relevance_results):
    if is_relevant:
        score += (relevant_count / (i + 1))
# 等价于 Average Precision
```

### Context Recall（召回率）

```
评估检索到的文档对参考答案的覆盖程度。

问题：{用户问题}
参考答案：{标准答案}
检索到的文档：{检索结果}

请用 0-100 的数字评价覆盖了多少关键信息。
```

---

## 实测数据

8 条 AI 知识测试题，每条跑一次 RAG + 三次 LLM 评判（共 32 次 API 调用）：

| 指标 | 分数 |
|---|---|
| Faithfulness | 1.00 |
| Context Precision | 1.00 |
| Context Recall | 0.96 |

> ⚠️ 知识库只有 9 个 chunk、8 道直球题，分数有水分。扩知识库后会掉，但方向是对的。

---

## 关键经验

**LLM 评判的 temperature 必须设 0**——评估需要确定性，不能有随机性。我的代码里 `temperature=0.0`，输出格式要求严格（「只回答一个数字」），避免 LLM 啰嗦导致解析失败。

**prompt 里要限定输出格式**——我的三个 prompt 都要求「只回答数字」或「只回答相关/不相关」，方便代码解析。

---

## 下一步

给知识库加更多内容（从 9 个 chunk 扩到 50+），再加 10 条刁钻的测试题（包含精确术语、否定问题、跨章节综合问题），重新评估。估计 Faithfulness 还能保持 0.9+，但 Context Recall 会面临真正的考验。
