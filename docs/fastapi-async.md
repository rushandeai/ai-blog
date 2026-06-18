# FastAPI Async 笔记

> 理解了这个概念，但项目里还没真正用上。

## 问题

LLM API 调用可能等 5 秒甚至更久。如果 FastAPI 用同步 `def`：

```python
@app.post("/ask")
def ask(req):
    answer = call_llm(req.question)  # 阻塞 5 秒
    return {"answer": answer}
```

这 5 秒里当前线程完全卡住。100 个用户同时问——第 100 个要等前面所有都处理完。

## 解法

```python
@app.post("/ask")
async def ask(req):
    answer = await call_llm_async(req.question)  # await 时释放线程
    return {"answer": answer}
```

`await` 时线程释放去处理别的请求。等 LLM 返回了再切回来。

## 为什么还没用

我的 RAG 项目用的是 `requests`（同步库），不是 `httpx`（异步库）。开发阶段单用户够用。如果要生产化，第一步就是换 `httpx.AsyncClient` + `async def`。
