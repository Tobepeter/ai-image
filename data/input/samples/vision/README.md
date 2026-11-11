# 图片理解测试样本

30 张旅游题材图片，来自 Wikimedia Commons，10 个类别各 3 张，缩到长边 1024。只取 CC0、CC BY、CC BY-SA 和公有领域授权

- `manifest.json`：每张图的 Commons 原页面、作者和许可证，使用时按许可证署名
- `labels.json`：人工标的参考类别，一张图可有多个可接受答案
- 重新取图：`pnpm vision:samples`（脚本 `scripts/vision/fetch-commons-samples.py`）
