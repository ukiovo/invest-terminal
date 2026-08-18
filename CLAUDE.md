# CLAUDE.md — 交易复盘日志项目说明

> 这份文件是给 Claude Code(及任何协作者)读的项目背景说明书。
> 它解释这个工具**是什么、为什么这样设计、怎么安全地改它**。
> 改动本项目前请通读本文件,尤其是「设计哲学」和「改动规范」两节。

---

## 一、项目是什么

一个**单文件 HTML 交易复盘日志(trade journal)**,用于在每笔交易**下单前**强制结构化记录决策逻辑,并在交易结束后回顾。后端用 Supabase(Postgres + Auth),实现跨设备云同步。

核心文件:
- `index.html` — 整个应用(HTML + CSS + JS 全在一个文件里,通过 CDN 引入 supabase-js)
- `CLAUDE.md` — 本文件(可公开)
- `CONTEXT_PRIVATE.md` — 用户个人化背景与设计动机(**仅本地,不上传**,见 `.gitignore`)

技术栈刻意保持极简:无构建步骤、无框架、无 npm。一个 HTML 文件直接部署到静态托管(GitHub Pages / Netlify)即可。**保持这个极简性是一个设计目标,不要在没有充分理由时引入构建工具、框架或打包器。**

---

## 二、设计哲学(最重要 — 改动前必读)

这个工具的价值**不在于"记录功能"本身,而在于它内置的几道"反直觉的摩擦"**。这些摩擦是刻意的,是整个工具的灵魂。**如果你觉得某个机制"麻烦、多余、可以简化",极有可能你正要删掉的就是这个工具存在的理由。删除或弱化任何下列机制前,必须先和用户确认。**

具体的行为动机背景见 `CONTEXT_PRIVATE.md`。这里说明每个机制要保护什么:

### 1. Decision Test 闸门(下单前第一道闸)
- **机制**:表单默认锁死(灰掉、不可填),必须先勾选一个确认框——"如果我现在空仓,我也会主动建立这笔交易"——才解锁。
- **要防的行为**:事后合理化(motivated reasoning)。即把一笔"因为不甘割肉/想摊平成本/追涨"而被动产生的仓位,用一套事后编出来的基本面逻辑包装成"理性入场"。
- **绝不能做**:不要为了"用户体验流畅"把这个闸门去掉或默认勾选。这个摩擦就是重点。

### 2. 仓位风险实时计算 + 标红警告
- **机制**:用户填入场价、失效价、仓位、风险资本后,实时计算两个比值——(a) 仓位/风险资本,(b) 触发失效价时的亏损/风险资本。后者超过 5% 标红,超过 10% 弹出强警告。
- **要防的行为**:在情绪驱动下开出过大的仓位而不自知。把"仓位大不大"这种模糊感觉,变成一个**红色的、具体的百分比**怼在眼前。
- **关键定义**:**risk capital(风险资本)是用户事先固定划定的一笔交易资金,不是总资产,也不是账户余额。** 这是一个刻意的隔离设计——防止用"反正只占总资产一点点"为由无限加仓。任何涉及仓位计算的改动都必须尊重这个定义,不要把分母悄悄换成总资产或账户余额。
- **阈值**:单笔风险的稳健线是风险资本的 1–2%,警戒线 5%,危险线 10%。这些数字可调,但调整前确认用户意图。

### 3. Thesis + Invalidation + Pre-mortem 三段式
- **Thesis(论点)**:driver(驱动)/ target(目标,含推导)/ time horizon(时间窗口)/ edge(优势)。
- **Invalidation(失效条件)**:基本面 / 技术面 / 时间 / 同类,至少三条。**这不等于止损价**——止损基于价格幅度,invalidation 基于"逻辑被证伪"。
- **Pre-mortem(事前尸检)**:假设交易已失败,写出最可能的原因和预警信号。
- **要防的行为**:无系统、凭社媒观点或临时情绪入场。强迫"写不出 thesis 就不该做这笔交易"。

### 4. 事后回顾(brooding → reflective pondering)
- **机制**:每笔交易有独立的「事后回顾」字段(实际结果 / thesis 对不对 / invalidation 设得准不准 / 退出时机 / 给下一笔的提醒)。未回顾的会显示橙色「未回顾」标签。
- **要防/要促成的**:把"反复痛苦地回想亏损"(brooding,被动反刍)转化为"结构化复盘并产出下一步"(reflective pondering)。这个区分是这个字段存在的全部理由——回顾必须导向"下次怎么改",而不是单纯重温结果。

### 5. 按标的归组对比
- **机制**:历史记录按 ticker 自动归组,同一标的的多次交易并排展示。
- **目的**:让用户看出自己**是否在同一个标的上反复用同样的错误逻辑入场**。

---

## 三、数据结构(Supabase)

表名:`trades`。开启了行级安全(RLS),每个用户只能读写自己的记录。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | uuid | 主键,自动生成 |
| `user_id` | uuid | 关联 auth.users,RLS 依据 |
| `created_at` | timestamptz | 创建时间 |
| `ticker` | text | 标的代码(归组依据) |
| `trade_date` | date | 交易日期 |
| `entry_price` | numeric | 入场价 |
| `invalidation_price` | numeric | 失效价 |
| `position_size` | numeric | 仓位金额 |
| `risk_capital` | numeric | 风险资本(事先固定,非总资产) |
| `driver` / `target` / `time_horizon` / `edge` | text | thesis 四要素 |
| `inval_fundamental` / `inval_technical` / `inval_time` / `inval_peer` | text | invalidation 四条 |
| `premortem_reason` / `premortem_signal` | text | pre-mortem 两项 |
| `decision_test` | boolean | Decision Test 是否勾选 |
| `outcome` / `thesis_correct` / `invalidation_correct` / `exit_timing` / `review_notes` | text | 事后回顾五字段 |

**新增字段的正确流程见第五节。**

### 3.1 统一应用与新增表(2026-06 起)

项目已从「单文件交易日志」扩展为一个**统一的多页应用「INVEST TERMINAL」**,顶部导航切换三页:首页·总览 / 交易复盘日志 / 组合敞口AI压力测试。所有页共享同一个 Supabase 项目与一次登录。

文件结构:
- `index.html` — **生产入口**。浏览器内用 Babel 把 `app.jsx` 现场编译为 ES 模块加载(无构建步骤,纯静态托管即可)。GitHub Pages 默认加载它。
- `app.jsx` — 统一应用主体(React):登录壳 + 首页(账户总览)+ 压力测试页。**改这两页就改这里。**
- `trade-journal.html` — 交易复盘日志,**原样保留**,在 `app.jsx` 里用 iframe 内嵌(同源、共享登录态)。它的纪律机制必须保持不变(见第二节)。
- `preview.html` — 本地开发预览壳(`?file=xxx.jsx` 切换),仅开发用,不部署也无妨。
- `home.jsx` / `ai_portfolio_stress_test.jsx` — 已被 `app.jsx` 合并取代的早期独立文件(保留作参考,可删)。

新增表(均开启 RLS,`user_id` 主键,每用户只能读写自己那行):

| 表 | 字段 | 说明 |
|---|---|---|
| `portfolio` | `user_id` uuid PK / `data` jsonb / `updated_at` | 首页账户总览。`data` = `{accounts, trades, fx}` 整份存 JSON(文档式)。 |
| `stress` | `user_id` uuid PK / `data` jsonb / `updated_at` | 压力测试页。`data` = `{holdings}`。 |
| `diary` | `id` uuid PK / `user_id` / `created_at` / `kind` / `entry_date` / `title` / `mood` / `ticker` / `body` / `next_action` / `images` jsonb | 日记页。**每条一行**(会增长,故用行表)。`kind` 区分板块:`trade` 交易日记 / `life` 生活日记。日记页有日历,可按年月日筛选。`images` 存 `diary-images` 桶里的图片路径数组。 |

日记图片存于私有存储桶 **`diary-images`**,路径约定 `{user_id}/{uuid}.{ext}`,`storage.objects` 上按文件夹首段=user_id 做 RLS,读取用签名 URL(见 `app.jsx` 的 `DiaryPage`)。

建表 SQL 见 `supabase_portfolio.sql`。两张表都是「每用户一行、整份 JSON」的文档式存法——刻意从简,字段稳定后若要做按笔统计,再把交易流水拆成行表(干净的后续迁移)。

**新增字段的正确流程见第五节。**

---

## 四、技术约束与安全红线(不可违反)

1. **密钥分级**:
   - Supabase **publishable key**(`sb_publishable_...`)可以出现在前端代码里——它配合 RLS 是安全的,官方设计如此。
   - Supabase **secret key**(`sb_secret_...`)/ service_role key **绝对不能**出现在任何前端代码、本仓库、或对话中。它能绕过所有 RLS。
2. **RLS 必须始终开启**。任何对 `trades` 表的改动不得关闭或绕过 RLS。前端的安全完全依赖它。
3. **不在 URL / query string 里放任何个人数据**。
4. **登录密码是唯一的门**。前端不存储明文凭证,依赖 Supabase Auth。
5. **浏览器存储限制**:本项目数据存云端(Supabase)。localStorage 仅可用于非敏感的 UI 偏好(如折叠状态),不得存交易数据或凭证。
6. **保持单文件、无构建**。除非用户明确要求,不要拆分文件或引入打包工具。

---

## 五、改动规范(协作流程)

改动分两类,务必区分并告知用户属于哪类:

**A. 纯前端改动**(改 UI、逻辑、样式、新增不依赖新字段的功能)
→ 首页/压力测试改 `app.jsx`,复盘日志改 `trade-journal.html`。用户用新文件覆盖托管平台上的旧文件即可。无需动数据库。

**B. 涉及数据结构的改动**(新增/重命名/删除字段)
→ 必须**同时**:
  1. 提供一段 SQL(`CREATE TABLE` / `ALTER TABLE ...`)让用户在 Supabase SQL Editor 执行;
  2. 修改对应文件(`app.jsx` 或 `trade-journal.html`)里的表单、保存逻辑(insert/upsert 的对象)、渲染逻辑。
→ 必须明确告诉用户:"这次改动需要先去 Supabase 执行 SQL,再更新 HTML",并把 SQL 单独给出。
→ 新增字段时记得同步更新本文件第三节的字段表。

**通用要求**:
- 改动后说明属于 A 还是 B 类。
- 不要默默改变第二节中任何纪律机制的行为;如果改动会影响它们,先提示用户。
- 保持中文 UI 文案,英文理论术语保留并在适当处加中文说明(用户偏好)。

---

## 六、UI / 文案风格

- **视觉基调变更(2026-06,用户明确要求)**:统一应用改为**紫色渐变 + 毛玻璃(glassmorphism)**风格——深紫底、紫色径向渐变、半透明 `backdrop-blur` 卡片、渐变文字强调色。`app.jsx` 用 `GLASS`/`GRAD`/`PAGE` 常量集中控制,`trade-journal.html` 用 `:root` 里的 `--amber`(现已指向紫色 `#a78bfa`)+ body 渐变背景。这与下面原定的「单一琥珀色、克制、不诱发情绪」相反,是用户在知情下的取舍;涨跌红绿语义保持不变。
- (原定基调,保留作参考)深色「交易终端」视觉:深底、单一琥珀色强调,克制、不喧闹、不诱发情绪。
- 中文为主,关键理论术语保留英文原词 + 中文释义(如 "thesis(论点)")。
- 文案语气:冷静、直接、像实验记录本,不卖弄、不用感叹号堆砌。
- 可访问性底线:键盘焦点可见、响应式到移动端、颜色不是唯一的信息载体。

---

## 七、未来可能的迭代方向(仅备忘,非待办)

用户可能会提出的扩展,实现时注意守住第二节的设计哲学:
- 统计视图(胜率、按 thesis 类型分类的表现、卖飞幅度追踪)
- 标签系统(speculation vs allocation 区分 — 这两类应有不同的规则集)
- 导入/导出增强
- 提醒机制(持仓超过 time horizon 时提示复查)

任何新功能都应服务于"用纪律对抗情绪化交易"这一核心,而非单纯增加功能数量。
