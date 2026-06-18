# 模型推理学习笔记

> 模型推理与部署概念。没实际部署过生产集群，都是看文档和读源码的理解。

## vLLM 和 PagedAttention

vLLM 是目前最流行的开源推理引擎。核心创新是 PagedAttention——把操作系统的虚拟内存分页思想用在 KV Cache 上。传统推理为每个请求预分配一大块显存放 KV Cache，但实际用到的可能只有 30%，剩下 70% 是碎片。PagedAttention 按页动态分配，用多少占多少，碎片没了。

这解释了为什么 vLLM 同等硬件能处理 10 倍的并发请求——不是算得更快，是显存利用率从 30% 提到了接近 100%。

## FlashAttention

注意力计算的瓶颈不在计算本身，在显存读写。GPU 的 HBM（显存）大但慢，SRAM（片上缓存）小但快。传统的 Attention 每一步都要从 HBM 读整个矩阵，算完写回去，大部分时间花在搬数据。FlashAttention 把矩阵切成小块，一次搬一小块到 SRAM，算完所有操作再搬下一块。

PyTorch 2.0 已经默认使用 FlashAttention，装好 torch 自动就用上了。

## 模型量化

FP16 的 7B 模型约占 14GB 显存。INT4 量化后约 3.5GB。缩小的代价是精度——4-bit 量化在 MMLU 基准上通常掉不到 1%，日常使用基本无感。

几种主流量化方法：
- GPTQ：逐层量化，用海森矩阵补偿误差，适合 GPU
- AWQ：保护最重要的 1% 权重，压缩其余，精度损失更小
- GGUF：llama.cpp 用的单文件格式，支持 CPU 推理

## Ollama 和 llama.cpp

Ollama 是本地跑模型最方便的工具——一条命令拉模型，自动暴露 OpenAI 兼容 API。底层是 llama.cpp + GGUF。开发阶段用 Ollama 验证想法，生产环境换 vLLM 或云 API。

我在笔记本上跑过 Ollama 的 qwen2.5:7b，量化后 4GB 显存就能跑。没在生产环境部署过 vLLM 集群。

## KV Cache 和投机解码

KV Cache 是推理时显存占用的大头——生成第 100 个 token 时，前 99 个的 Key 和 Value 都要存着。长序列的 KV Cache 能比模型权重本身还大。

投机解码（Speculative Decoding）的思路很有趣：用小模型快速生成几个「草稿 token」，大模型一次性验证。猜对了就省时间（等效 2-3 倍加速），猜错了大模型也只是多算了一步验证。

## OOM 排查

还没在实际项目中遇到过 GPU OOM。但知道排查顺序：`nvidia-smi` 看显存 → 调小 batch size → 换量化版本 → 减小 max_seq_length。

---

这些内容来自阅读 vLLM 文档、HuggingFace 博客和相关论文。没有实操截图，因为确实没在生产环境部署过。后面做了实际部署会补上真实经验。
