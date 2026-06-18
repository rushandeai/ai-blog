# Agent 和框架学习笔记

> Agent 概念和框架对比。没在生产项目用过这些框架，只是看文档、跑过 demo。

## Agent 的核心：ReAct 循环

Agent 和普通 LLM 调用的区别：Agent 能调外部工具。你问「今天深圳天气怎么样」，普通 LLM 只能凭训练数据猜，Agent 会实际调天气 API 拿到数据再回答。

ReAct 循环：
```
Thought → Action → Observation → Thought → Action → ... → Final Answer
```

LLM 不只是输出文字，还能输出「调哪个函数、传什么参数」。系统执行函数后把结果还给 LLM，继续推理。

当前我的 RAG 项目本质上是个单工具 Agent——唯一的工具是检索系统。下一步计划加一个真正的 Agent 层，让 LLM 自己决定什么时候检索、什么时候直接回答。

## LangChain 的问题

没实际用 LangChain 做过项目。但理解它的问题：抽象层级高。

```python
qa = RetrievalQA.from_chain_type(llm=llm, retriever=vectorstore.as_retriever())
qa.run("什么是 Transformer")
```

5 行代码跑一个 RAG。但想改检索策略（比如 top-3 改成 top-5），你得钻进去读 LangChain 源码定位在哪改。这就是「抽象税」——框架帮你少写代码，但出了 Bug 你得多读代码才能定位。

LangChain 后来出了 LangGraph——一个显式状态机框架。每个节点是什么、边怎么走，一眼看清。比 Chain 的黑盒模式调试友好得多。

## CrewAI 和 AutoGen

CrewAI：角色扮演式多 Agent。定义研究员 Agent、写手 Agent，分配任务，自动化执行。15 分钟能跑一个 demo，看着很炫。

AutoGen：微软出的对话式多 Agent 框架。Agent 之间通过互相发消息协作。但去年底进入维护模式，社区 fork 了 AG2。

两个都没在生产用过。我的判断：大多数场景不需要多 Agent——单 Agent + 多个工具就够了。多 Agent 框架目前偏「演示友好，生产存疑」。

## LlamaIndex

和 LangChain 定位不同——LlamaIndex 专注于 RAG，不搞通用的 Agent 框架。内置了很多 RAG 策略（Hierarchical Node Parser、Sub-Question Query Engine、Auto-Merging Retriever）。

没用过。和学习 LangChain 同样的理由——先手写理解底层，再用框架加速。

---

以上纯阅读笔记。没有实际项目经验支撑。Agent 相关的内容等到我把 RAG 项目加上 Agent 层之后会有实操文章。
