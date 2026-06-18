# Agent 到底是什么

> 最开始以为 Agent 就是调 ChatGPT API。后来发现不是这么回事。

## 一个例子说清楚

不用 Agent：用户问「今天深圳天气怎么样」，LLM 直接回答（训练数据里可能有，也可能是编的）。

用 Agent：用户问「今天深圳天气怎么样」，LLM 说「我需要查天气 API」→ 系统调天气 API 拿到「28°C，多云」→ LLM 基于这个真实数据回答「今天深圳 28 度，多云」。

区别：Agent 能调用外部工具获取实时信息，而不是只靠训练时记住的东西。

## 核心循环：ReAct

ReAct = Reasoning（思考）+ Acting（执行）。循环是：

```
Thought: 我需要查天气
Action: 调用 weather_api("深圳")
Observation: 返回 { "temp": 28, "weather": "多云" }
Thought: 拿到数据了，可以回答
Final Answer: 今天深圳 28 度，多云
```

「Action」这一步是 Agent 和普通 LLM 的本质区别——LLM 不只是说话，还能做事。

## Function Calling 是 ReAct 的实现方式

OpenAI/DeepSeek 的 Function Calling 就是让 LLM 输出 JSON 格式的函数调用意图，系统解析后执行函数，结果还给 LLM。

```json
{
  "tool_calls": [{
    "function": {
      "name": "get_weather",
      "arguments": "{\"city\": \"深圳\"}"
    }
  }]
}
```

LLM 本身不执行代码——它只是「说」要调哪个函数、传什么参数。执行是外面系统的事。

## 和 RAG 的关系

RAG 本质上是 Agent 的一种特例——Agent 的「工具」是一个检索系统。Agent 思考「我需要查知识库」，调 RAG 工具，拿到上下文，生成回答。

我下一个项目就是把 Agent 和 RAG 系统集成——让 LLM 自己决定什么时候检索、什么时候直接回答。
