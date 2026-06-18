# SSE 流式输出笔记

> 还没在项目里做。先记一下概念，后面补实际代码。

AI 打字机效果的底层是 SSE（Server-Sent Events）。HTTP 协议的一个扩展——服务器可以持续向客户端推送数据：

```
客户端：GET /chat
服务器：data: "你"\n\n
         data: "好"\n\n
         data: "！"\n\n
```

客户端收到一条显示一条。

## SSE vs WebSocket

SSE 是单向的（服务器→客户端），WebSocket 是双向的。AI 流式回答场景 SSE 就够了。WebSocket 只在需要「用户打断 AI 生成」或「实时音视频」时才用。

SSE 还有一个好处：断线重连浏览器自动处理，WebSocket 要自己写重连逻辑。

## 什么时候做

我的 RAG 项目现在 `/ask` 是同步返回完整回答。改成流式是 TODO 之一。不复杂——FastAPI 的 `StreamingResponse` 就能实现。
