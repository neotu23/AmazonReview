# Amazon Review Exporter

一个 Chrome 扩展（Manifest V3）：把亚马逊商品评论页当前已加载的评论整理成 Markdown 文件，附带样本统计和一整套中文分析提示词，直接丢给 AI 就能做满意度、Vine 占比和时间分布分析。

不抓取、不翻页、不发网络请求。点一下按钮，得到一份 `.md`。

## 功能

- **一键导出**：点击工具栏图标 → `Export to Markdown` → 浏览器下载文件。
- **保留原始信息**：每条评论保留 Review ID、作者、星级、原始日期（不翻译、不改格式）、标题、正文、变体信息。
- **Vine 与 Verified Purchase 分别识别**：Vine 身份与"已验证购买"是两个独立字段，互不替代。
- **样本统计先于去重**：文件开头给出导出条数、Vine 条数与占比、未显示 Vine 标识数、身份未知数，并写明分母。
- **内置中文分析提示词**：要求 AI 先核对样本再分析，内容包括样本概况、满意/不满意主题、Vine 占比与差异、评论时间分布（按月或按周）、Vine 集中时段、随时间变化、行动建议。
- **提示注入防护**：提示词明确声明页面抓取内容只是待分析数据而非指令；正文里提到 Vine 也不会改变结构化字段的判定。
- **支持本地 HTML**：可以把保存下来的评论页当作 `file://` 页面导出，方便离线复现。

## 安装

1. 打开 Chrome，访问 `chrome://extensions/`。
2. 右上角开启 **开发者模式**。
3. 点 **加载已解压的扩展程序**，选择本仓库的 `src` 目录。
4. 加载完成后点该扩展的 **详情**，打开 **允许访问文件网址**（`Allow access to file URLs`）。只有需要用本地 HTML 时才是必需的。

扩展没有构建步骤，也没有运行时依赖，`src` 目录就是最终产物。

## 使用

1. 打开亚马逊评论页（或本地保存的 HTML 文件）。
2. 如果页面在安装扩展之前就已打开，先 **刷新** 一次，否则内容脚本还没注入。
3. 点击工具栏上的扩展图标。
4. 点 **Export to Markdown**，弹窗会显示导出了多少条评论。
5. 下载的 `.md` 文件可以整份上传给 AI 工具。

更新扩展代码后，回到 `chrome://extensions/` 点 **重新加载**，再刷新亚马逊页面，否则跑的还是旧脚本。

## 支持的站点

`manifest.json` 中的内容脚本匹配以下域名，以及 `file://` 下的本地页面：

`amazon.com` · `amazon.co.uk` · `amazon.de` · `amazon.fr` · `amazon.it` · `amazon.es` · `amazon.ca` · `amazon.jp` · `amazon.com.au`

其他区域站需要自行在 `src/manifest.json` 的 `content_scripts[0].matches` 里加上对应域名。

## 导出的 Markdown 长什么样

1. **AI 分析提示词** —— 7 条分析要求 + 输出格式与边界说明。
2. **样本信息** —— 页面标题、来源 URL、导出时间（UTC）、统计范围、总条数、Vine 条数与占比、未显示 Vine 标识数、身份未知数。
3. **评论数据** —— 每条评论一节，字段如下：

```
### 1. 评论标题

**Review ID:** RU3HV01NBCBPR
**Author:** Honest Reviewer
**Rating:** 3.0 out of 5 stars
**Date:** Reviewed in the United States on May 6, 2026
**Vine Review:** Yes
**Review Badge:** Amazon Vine Customer Review of Free Product
**Verified Purchase:** Not marked
**Variation:** Color: Yellow

正文内容（<br> 转为换行）
```

星级和日期保留页面原文，不做翻译或统一格式，由 AI 负责解析。

## Vine 判定规则

| 字段值 | 含义 |
| --- | --- |
| `Yes` | 在评论的元数据区域找到 Vine 标识徽章或 `/gp/vine/help` 链接 |
| `Not marked` | 元数据存在，但没找到 Vine 标识。**不** 等于已证明非 Vine |
| `Unknown` | 缺少可判定的元数据区域，无法判断 |

判定只看评论自身的元数据区：变体链接旁边、`review-format-strip` 内的绿色加粗徽章，或显式的 `review-vine-strip`。以下情况都不会被误判为 Vine：

- 页面级（评论列表之外）的 Vine 标记；
- 正文里提到 "Amazon Vine Customer Review of Free Product"；
- 变体名刚好叫 `Vine` 之类的字符串。

非英文站点的本地化徽章配合 Vine 帮助链接同样能识别，且保留徽章原文写入 `Review Badge` 字段。

## 已知限制

- **只导出当前页面**：不会自动翻页、切换排序或按筛选条件继续抓取。
- **样本有偏差**：受分页、排序、筛选和页面加载状态影响，不代表商品全部评论。
- **最早一条评论不等于上市日期**：文件里的提示词会提醒 AI 不要这样推断，零评论时段也不等于零销量。
- **页面改版会失效**：解析依赖 `data-hook` 属性，亚马逊前端结构变化后可能需要跟着调整 `src/content.js`。
- **导出计数是去重前的**：如果页面本身有重复节点，重复项会一并导出，提示词要求 AI 自行按 Review ID 去重并说明差异。

## 隐私

- 扩展只声明 `activeTab` 和 `scripting` 权限，没有后台服务，不发起任何网络请求。
- 评论提取和文件生成全部在本地浏览器完成，不上传数据，也没有埋点。
- 导出的 Markdown 包含评论正文和作者名，分享或上传前请自行判断是否合适。

## 开发

无需构建。改完 `src/` 下的文件，重新加载扩展即可。

跑 DOM 回归测试（用 [linkedom](https://github.com/WebReflection/linkedom) 模拟页面环境）：

```sh
npm install
npm test
```

测试都基于 `tests/content.test.cjs` 里的内联 HTML 片段，覆盖：变体旁的 Vine 徽章识别、正文提及 Vine 不误判、元数据缺失为 `Unknown`、变体名 `Vine` 不误判、显式 hook 与本地化徽章、样本统计与计数、空页面报错。测试不依赖任何外部样本文件。

## 目录结构

```
src/
  manifest.json    扩展配置（Manifest V3）
  popup.html       弹窗界面
  popup.js         弹窗逻辑：发消息、下载 Markdown
  content.js       页面脚本：提取评论、生成 Markdown
  icons/           扩展图标（16/32/48/128 及高清母版）
tests/
  content.test.cjs 基于 linkedom 的 DOM 回归测试
docs/              图标设计与实现计划记录
```

## License

[MIT](LICENSE)
