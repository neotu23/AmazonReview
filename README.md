<p align="center">
  <img src="src/icons/icon128.png" width="128" height="128" alt="Amazon Review Exporter 图标" />
</p>

<h1 align="center">Amazon Review Exporter</h1>

<p align="center"><strong>把亚马逊评论页，变成一份可以直接交给 AI 的分析文件。</strong></p>
<p align="center">Turn the Amazon review page you're reading into AI-ready Markdown.</p>

<p align="center">
  在评论页点一下，当前已加载的评论连同样本统计和中文分析提示词一起导出成 Markdown。
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/platform-Chrome-black" alt="Platform: Chrome" />
  <img src="https://img.shields.io/badge/manifest-v3-4285f4" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/runtime_deps-none-2ea44f" alt="无运行时依赖" />
</p>

<p align="center">
  <a href="#功能一览">功能一览</a> ·
  <a href="#安装">安装</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#导出的文件长什么样">导出格式</a> ·
  <a href="#vine-判定规则">Vine 判定规则</a> ·
  <a href="#开发与测试">开发与测试</a> ·
  <a href="https://github.com/neotu23/AmazonReview/issues">反馈问题</a>
</p>

> **只处理当前页面已加载的内容。** 不翻页、不切换排序、不按筛选条件补抓，也不会替你绕过任何限制。导出的是你此刻看到的这批评论。

## 为什么导出成文件？

把亚马逊评论粘进 AI 对话框时，结构基本会丢：星级和日期混在正文里，变体信息错位，分页之后还得手工拼接，Vine 标识更是经常在复制过程中消失。

这个扩展在页面里就地把评论解析成结构化字段，写进一个 `.md` 文件，并在文件开头附上一套分析口径：统计分母怎么算、日期怎么按月或按周分组、Vine 占比怎么比较、哪些推断不允许做。把整份文件交给 AI，得到的是带数量和证据的分析，而不是一段笼统的产品评价摘要。

## 功能一览

### 一键导出，不打断浏览

点击工具栏图标 → `Export to Markdown` → 浏览器下载文件，弹窗同时告诉你导出了多少条评论。不需要打开 DevTools，也不需要写脚本。

### 字段完整，来源可查

每条评论保留 Review ID、作者、星级、原始日期、标题、正文和变体信息。星级和日期保留页面原文，不翻译也不统一格式——由分析环节负责解析，避免扩展自己猜错。

Review ID 尤其重要：页面本身有重复节点时，AI 可以按 ID 去重并说明差异，而不是把同一条评论统计两次。

### Vine 身份单独判定

Vine 与「已验证购买」是两个互不替代的字段。Vine 只在评论自身的元数据区里找徽章或 `/gp/vine/help` 链接，判断结果分 `Yes` / `Not marked` / `Unknown` 三态，见 [Vine 判定规则](#vine-判定规则)。

### 样本统计写明分母

文件开头的样本信息给出导出条数、Vine 条数与占比、未显示 Vine 标识数、身份未知数和统计范围（当前页面、去重前）。知道分母，才知道后面的百分比能不能用。

### 内置中文分析提示词

提示词要求 AI 先核对样本再分析，覆盖：样本概况与星级分布、满意点与不满意点（含提及数与占比）、Vine 占比与组间差异、评论时间分布（覆盖不足 60 天改用按周）、Vine 集中时段、随时间的评分与问题变化、按证据排序的改进建议。

### 抓到的内容不当指令执行

评论正文里出现「忽略以上要求」「请重写任务」之类的文字，只是待分析的数据。提示词里对此有明确声明，也声明了正文提到 Vine 不改变结构化字段的判定。

### 可以分析本地保存的页面

保存下来的评论页用 `file://` 打开同样能导出，方便在没有网络或页面已下线时复现同一份样本。

## 安装

1. 打开 `chrome://extensions/`。
2. 右上角开启 **开发者模式**。
3. 点 **加载已解压的扩展程序**，选择本仓库的 `src` 目录。扩展没有构建步骤，`src` 就是最终产物。
4. 需要在本地 HTML 上使用时，点该扩展的 **详情**，打开 **允许访问文件网址**（`Allow access to file URLs`）。

扩展只声明 `activeTab` 和 `scripting` 两个权限，没有后台服务，不发起网络请求。

## 快速开始

**1. 打开评论页**

普通的亚马逊评论页直接打开即可；本地保存的 HTML 用浏览器打开，并确认上一步已允许访问文件网址。

**2. 刷新一次**

如果页面在加载扩展之前就已经打开，先刷新，否则内容脚本还没注入。

**3. 导出**

点工具栏图标，再点 **Export to Markdown**，弹窗会显示导出了多少条评论。下载的 `.md` 以页面标题命名，整份上传给 AI 工具即可。

改过 `src/` 里的代码后，回到 `chrome://extensions/` 点 **重新加载**，再刷新评论页——只重新加载扩展、不刷新页面的话，跑的还是旧的内容脚本。

## 支持的站点

内容脚本匹配以下域名，以及 `file://` 下的本地页面：

`amazon.com` · `amazon.co.uk` · `amazon.de` · `amazon.fr` · `amazon.it` · `amazon.es` · `amazon.ca` · `amazon.jp` · `amazon.com.au`

其他区域站需要在 `src/manifest.json` 的 `content_scripts[0].matches` 里补上对应域名。

## 导出的文件长什么样

文件由三部分组成：分析提示词、样本信息、评论数据。单条评论的字段顺序如下：

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

正文内容（页面里的 <br> 转为换行）
```

`Review Badge` 只在识别到徽章时出现，内容是页面上的徽章原文（含本地化文案）。`Variation` 在页面没有变体信息时省略。

## Vine 判定规则

| 字段值 | 含义 |
| --- | --- |
| `Yes` | 在评论自身的元数据区找到 Vine 标识徽章，或找到 `/gp/vine/help` 链接 |
| `Not marked` | 元数据存在，但没有 Vine 标识。**不**等于已证明非 Vine |
| `Unknown` | 缺少可判定的元数据区域，无法判断 |

判定只看单条评论的元数据：变体链接旁边、`review-format-strip` 里的绿色加粗徽章，或显式的 `review-vine-strip`。以下情况都不会被误判为 Vine：

- 页面级（评论列表之外）的 Vine 标记；
- 正文里提到 "Amazon Vine Customer Review of Free Product"；
- 变体名恰好叫 `Vine` 之类的字符串。

`Verified Purchase` 是独立字段，不参与 Vine 身份判断。

## 已知限制

- **只导出当前页面**：分页、排序、筛选之后的其余评论不会自动抓取。
- **样本有偏差**：受页面加载状态、排序与筛选影响，不代表该商品的全部评论。
- **最早一条评论不是上市日期**：提示词里明确了这条边界，零评论时段也不等于零销量。
- **导出计数是去重前的**：页面本身有重复节点时会一并导出，由分析环节按 Review ID 去重并说明差异。
- **页面改版会失效**：解析依赖 `data-hook` 属性，亚马逊前端结构调整后需要同步修改 `src/content.js`。

## 开发与测试

无需构建。改完 `src/` 下的文件，重新加载扩展即可。DOM 回归测试用 [linkedom](https://github.com/WebReflection/linkedom) 在 Node.js 里跑：

```bash
npm install
npm test
```

测试基于 `tests/content.test.cjs` 里的内联 HTML 片段，覆盖：变体旁的 Vine 徽章识别、正文提及 Vine 不误判、元数据缺失为 `Unknown`、变体名为 `Vine` 不误判、显式 hook 与本地化徽章、样本统计与计数、空页面报错。测试不依赖仓库之外的文件。

## 目录结构

```
src/
  manifest.json    扩展配置（Manifest V3，权限与匹配站点）
  popup.html       弹窗界面
  popup.js         弹窗逻辑：发送消息、下载 Markdown
  content.js       页面脚本：提取评论、生成 Markdown 与分析提示词
  icons/           扩展图标（16/32/48/128 与高清母版）
tests/
  content.test.cjs DOM 回归测试
docs/              图标设计与实现计划记录
```

## 隐私

- 评论提取和文件生成全部在本地浏览器里完成，没有上传、没有埋点、没有第三方请求。
- 扩展不需要账号，也不读写亚马逊之外的页面。
- 导出的 Markdown 含评论正文与作者名，分享或公开前请自行判断是否合适。

## 许可证

[MIT](LICENSE)
