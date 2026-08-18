import { useState, useMemo, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');`;

// 与 trade-journal.html 同一个 Supabase 项目 / publishable key（配合 RLS 安全）
const SUPABASE_URL = "https://rrnxrpowezukxrobcanl.supabase.co";
const SUPABASE_KEY = "sb_publishable_fYga6xuLrwaCGX9MJ3m-0A_e5Auq8gU";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const BASE = "CNY";
const CCYS = ["CNY", "USD", "HKD"];
const SYM = { CNY: "¥", USD: "$", HKD: "HK$" };
const UP = "#3fb950", DOWN = "#f85149", AMBER = "#a78bfa", PURPLE = "#a78bfa", WARM = "#fb8500";

const num = (v) => (v === "" || v == null ? 0 : Number(v) || 0);
const money = (n, ccy) => SYM[ccy] + Math.round(n).toLocaleString("en-US");
const signMoney = (n, ccy) => (n >= 0 ? "+" : "-") + SYM[ccy] + Math.round(Math.abs(n)).toLocaleString("en-US");
const pct = (n) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
const pctRaw = (n) => n.toFixed(1) + "%";
const pnlColor = (n) => (n >= 0 ? UP : n < 0 ? DOWN : "#8b95a5");
const uid = () => Math.random().toString(36).slice(2, 9);

const PAGE = { background: "radial-gradient(1100px 560px at 15% -10%, rgba(124,58,237,0.30), transparent 60%), radial-gradient(1000px 520px at 100% 0%, rgba(192,132,252,0.18), transparent 55%), #0a0713", backgroundAttachment: "fixed", minHeight: "100vh", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#e6edf3", boxSizing: "border-box" };
const MONO = { fontFamily: "'IBM Plex Mono', monospace" };
const GRAD = "linear-gradient(90deg,#a78bfa,#c4b5fd,#f0abfc)";
const GRAD_TEXT = { background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" };
const GLASS = { background: "rgba(22,17,38,0.55)", border: "1px solid rgba(168,139,250,0.20)", borderRadius: 14, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)" };

// ════════════════════ 顶层：登录 + 导航壳 ════════════════════
export default function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("home");

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) return <Splash text="加载中…" />;
  if (!session) return <Login />;

  const NAV = [
    { id: "home", label: "首页 · 总览" },
    { id: "journal", label: "交易复盘日志" },
    { id: "diary", label: "日记" },
    { id: "stress", label: "组合敞口 AI 压力测试" },
  ];

  return (
    <div style={PAGE}>
      <style>{FONTS}{`input,select{outline:none}input:focus,select:focus{border-color:${AMBER}!important}`}</style>

      {/* 顶部导航 */}
      <div style={{ borderBottom: "1px solid rgba(168,139,250,0.18)", background: "rgba(10,7,19,0.6)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ ...MONO, ...GRAD_TEXT, fontWeight: 700, letterSpacing: 2, fontSize: 13, padding: "14px 0" }}>INVEST&nbsp;TERMINAL</div>
          <nav style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {NAV.map((n) => (
              <div key={n.id} onClick={() => setTab(n.id)} style={{ padding: "14px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: tab === n.id ? "#e6edf3" : "#6e7a8a", borderBottom: tab === n.id ? `2px solid ${AMBER}` : "2px solid transparent" }}>{n.label}</div>
            ))}
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ ...MONO, fontSize: 11, color: "#6e7a8a" }}>{session.user.email}</span>
            <button style={btn} onClick={() => sb.auth.signOut()}>登出</button>
          </div>
        </div>
      </div>

      {/* 页面内容 */}
      {tab === "home" && <HomePage session={session} />}
      {tab === "journal" && (
        <iframe title="交易复盘日志" src="trade-journal.html" style={{ width: "100%", height: "calc(100vh - 50px)", border: "none", display: "block" }} />
      )}
      {tab === "diary" && <DiaryPage session={session} />}
      {tab === "stress" && <StressPage session={session} />}
    </div>
  );
}

const btn = { background: "rgba(168,139,250,0.10)", border: "1px solid rgba(168,139,250,0.30)", borderRadius: 8, color: "#d6ccf5", fontSize: 12, fontWeight: 600, padding: "6px 11px", cursor: "pointer", fontFamily: "inherit" };
const iconBtn = { background: "transparent", border: "none", color: "#8b81a6", cursor: "pointer", fontSize: 15, padding: "0 4px", lineHeight: 1 };
const sel = { background: "rgba(12,10,22,0.6)", border: "1px solid rgba(168,139,250,0.22)", borderRadius: 5, color: "#c9c2e0", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, padding: "2px 4px" };

function Splash({ text }) {
  return <div style={{ ...PAGE, display: "flex", alignItems: "center", justifyContent: "center", ...MONO, color: "#6e7a8a" }}><style>{FONTS}</style>{text}</div>;
}

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [signup, setSignup] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const tr = (m) => /invalid login/i.test(m) ? "邮箱或密码错误" : /already registered/i.test(m) ? "该邮箱已注册，请直接登录" : /password should be/i.test(m) ? "密码至少 6 位" : /email/i.test(m) && /valid/i.test(m) ? "邮箱格式不正确" : m;
  const submit = async () => {
    if (!email || !pass) { setErr("请填写邮箱和密码"); return; }
    setBusy(true); setErr("");
    try {
      if (signup) {
        const { error } = await sb.auth.signUp({ email, password: pass });
        if (error) throw error;
        const { data: s } = await sb.auth.getSession();
        if (!s.session) { setErr("注册成功，请登录"); setSignup(false); }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      }
    } catch (e) { setErr(tr(e.message)); }
    setBusy(false);
  };
  const inp = { width: "100%", boxSizing: "border-box", background: "#0c1119", border: "1px solid #1f2733", borderRadius: 8, color: "#e6edf3", fontFamily: "inherit", fontSize: 14, padding: "10px 12px", marginBottom: 10 };
  return (
    <div style={{ ...PAGE, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{FONTS}{`input:focus{outline:none;border-color:${AMBER}}`}</style>
      <div style={{ width: 320, ...GLASS, padding: 24 }}>
        <div style={{ ...MONO, ...GRAD_TEXT, fontWeight: 700, letterSpacing: 2, fontSize: 12 }}>INVEST&nbsp;TERMINAL</div>
        <h2 style={{ fontSize: 20, margin: "8px 0 18px" }}>{signup ? "注册" : "登录"}</h2>
        <input style={inp} type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={inp} type="password" placeholder="密码" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        {err && <div style={{ color: DOWN, fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <button disabled={busy} onClick={submit} style={{ width: "100%", background: GRAD, color: "#1a1030", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, padding: "11px", cursor: "pointer", fontFamily: "inherit", opacity: busy ? 0.6 : 1 }}>{signup ? "创建账号" : "登录"}</button>
        <div style={{ fontSize: 12, color: "#6e7a8a", marginTop: 14, textAlign: "center" }}>
          {signup ? "已有账号？" : "还没有账号？"}
          <a onClick={() => { setSignup(!signup); setErr(""); }} style={{ color: AMBER, cursor: "pointer", marginLeft: 4 }}>{signup ? "去登录" : "注册一个"}</a>
        </div>
      </div>
    </div>
  );
}

// ════════════════════ 首页 · 账户总览 ════════════════════
const SAMPLE_ACCOUNTS = [
  { id: "futu", name: "富途证券", type: "券商", cash: [{ ccy: "USD", amount: 1200 }, { ccy: "HKD", amount: 800 }], holdings: [{ ticker: "MU", name: "美光科技", ccy: "USD", shares: 20, avgCost: 95, last: 110 }, { ticker: "00709", name: "南方海力士2x", ccy: "HKD", shares: 500, avgCost: 6.5, last: 7.2 }] },
  { id: "cmb", name: "招商银行", type: "银行", cash: [{ ccy: "CNY", amount: 50000 }], holdings: [{ ticker: "600519", name: "贵州茅台", ccy: "CNY", shares: 10, avgCost: 1650, last: 1580 }] },
];
const SAMPLE_TRADES = [
  { date: "2026-06-25", account: "富途证券", ticker: "NVDA", side: "卖出", ccy: "USD", price: 130, shares: 5, buyPrice: 100 },
  { date: "2026-06-20", account: "富途证券", ticker: "MU", side: "买入", ccy: "USD", price: 95, shares: 20, buyPrice: "" },
];

function HomePage({ session }) {
  const [accounts, setAccounts] = useState(null);
  const [trades, setTrades] = useState([]);
  const [fx, setFx] = useState({ CNY: 1, USD: 7.20, HKD: 0.92 });
  const [fxStatus, setFxStatus] = useState("示例汇率");
  const [saveState, setSaveState] = useState("");
  const loadedRef = useRef(false);
  const saveTimer = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await sb.from("portfolio").select("data").eq("user_id", session.user.id).maybeSingle();
      if (error) setSaveState("读取失败：" + error.message);
      const d = data && data.data;
      if (d && d.accounts) { setAccounts(d.accounts); setTrades(d.trades || []); if (d.fx) setFx(d.fx); setSaveState("已加载"); }
      else { setAccounts(SAMPLE_ACCOUNTS); setTrades(SAMPLE_TRADES); setSaveState("空档案 · 示例数据，编辑后自动保存"); }
      loadedRef.current = true;
    })();
  }, [session.user.id]);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD").then((r) => r.json()).then((d) => {
      if (!d || !d.rates) throw new Error();
      const usdCny = d.rates.CNY, usdHkd = d.rates.HKD;
      setFx({ CNY: 1, USD: usdCny, HKD: usdCny / usdHkd });
      setFxStatus("自动 · " + (d.time_last_update_utc || "").replace(/\s*\(.*\)/, "").slice(0, 16));
    }).catch(() => setFxStatus("自动拉取失败 · 用手填值"));
  }, []);

  useEffect(() => {
    if (!loadedRef.current || accounts === null) return;
    setSaveState("待保存…");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, 1000);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line
  }, [accounts, trades, fx]);

  async function save() {
    setSaveState("保存中…");
    const { error } = await sb.from("portfolio").upsert({ user_id: session.user.id, data: { accounts, trades, fx }, updated_at: new Date().toISOString() });
    setSaveState(error ? "保存失败：" + error.message : "已保存 " + new Date().toLocaleTimeString());
  }

  const setAcc = (id, patch) => setAccounts((as) => as.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const findAcc = (id) => accounts.find((a) => a.id === id);
  const addAccount = () => setAccounts((as) => [...as, { id: uid(), name: "新账户", type: "券商", cash: [], holdings: [] }]);
  const removeAccount = (id) => setAccounts((as) => as.filter((x) => x.id !== id));
  const setCash = (id, i, patch) => setAcc(id, { cash: findAcc(id).cash.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const addCash = (id) => setAcc(id, { cash: [...findAcc(id).cash, { ccy: "CNY", amount: "" }] });
  const rmCash = (id, i) => setAcc(id, { cash: findAcc(id).cash.filter((_, j) => j !== i) });
  const setHold = (id, i, patch) => setAcc(id, { holdings: findAcc(id).holdings.map((h, j) => (j === i ? { ...h, ...patch } : h)) });
  const addHold = (id) => setAcc(id, { holdings: [...findAcc(id).holdings, { ticker: "", name: "", ccy: "CNY", shares: "", avgCost: "", last: "" }] });
  const rmHold = (id, i) => setAcc(id, { holdings: findAcc(id).holdings.filter((_, j) => j !== i) });
  const setTrade = (i, patch) => setTrades((t) => t.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const addTrade = () => setTrades((t) => [{ date: "2026-06-27", account: "", ticker: "", side: "买入", ccy: "CNY", price: "", shares: "", buyPrice: "" }, ...t]);
  const rmTrade = (i) => setTrades((t) => t.filter((_, j) => j !== i));

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ accounts, trades, fx }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "portfolio.json"; a.click(); URL.revokeObjectURL(url);
  };
  const importJSON = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); if (d.accounts) setAccounts(d.accounts); if (d.trades) setTrades(d.trades); if (d.fx) setFx(d.fx); } catch { alert("导入失败：不是有效的 JSON"); } };
    r.readAsText(f); e.target.value = "";
  };

  const calc = useMemo(() => {
    if (!accounts) return null;
    const accs = accounts.map((a) => {
      const cashBase = a.cash.reduce((s, c) => s + num(c.amount) * (fx[c.ccy] || 1), 0);
      const holds = a.holdings.map((h) => {
        const mv = num(h.shares) * num(h.last), cost = num(h.shares) * num(h.avgCost);
        return { ...h, mv, cost, pnl: mv - cost, ret: cost ? (mv - cost) / cost * 100 : 0 };
      });
      const mvBase = holds.reduce((s, h) => s + h.mv * (fx[h.ccy] || 1), 0);
      const costBase = holds.reduce((s, h) => s + h.cost * (fx[h.ccy] || 1), 0);
      return { ...a, holds, cashBase, mvBase, costBase, totalBase: cashBase + mvBase };
    });
    const total = accs.reduce((s, a) => s + a.totalBase, 0);
    const cash = accs.reduce((s, a) => s + a.cashBase, 0);
    const mv = accs.reduce((s, a) => s + a.mvBase, 0);
    const cost = accs.reduce((s, a) => s + a.costBase, 0);
    const byCcy = {};
    accounts.forEach((a) => {
      a.cash.forEach((c) => { byCcy[c.ccy] = (byCcy[c.ccy] || 0) + num(c.amount); });
      a.holdings.forEach((h) => { byCcy[h.ccy] = (byCcy[h.ccy] || 0) + num(h.shares) * num(h.last); });
    });
    return { accs, total, cash, mv, cost, pnl: mv - cost, ret: cost ? (mv - cost) / cost * 100 : 0, byCcy };
  }, [accounts, fx]);

  const S = {
    wrap: { maxWidth: 980, margin: "0 auto", padding: "20px 16px 56px" },
    card: { ...GLASS, padding: 16, marginBottom: 14 },
    label: { fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "#6e7a8a", fontWeight: 600 },
    th: { textAlign: "left", fontSize: 11, color: "#6e7a8a", fontWeight: 600, padding: "6px 8px", borderBottom: "1px solid #1f2733", whiteSpace: "nowrap" },
    td: { fontSize: 13, padding: "6px 8px", borderBottom: "1px solid #161c26", whiteSpace: "nowrap" },
  };

  if (!calc) return <Splash text="读取组合…" />;

  return (
    <div style={S.wrap}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "6px 0 16px" }}>
        <span style={{ ...MONO, fontSize: 11, color: saveState.includes("失败") ? DOWN : "#6e7a8a" }}>● {saveState}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button style={btn} onClick={save}>立即保存</button>
          <button style={btn} onClick={exportJSON}>导出</button>
          <button style={btn} onClick={() => fileRef.current.click()}>导入</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={importJSON} />
        </div>
      </div>

      <div style={{ ...S.card, padding: 20 }}>
        <div style={S.label}>组合总资产 · 折算 {BASE}</div>
        <div style={{ ...MONO, ...GRAD_TEXT, fontSize: 40, fontWeight: 700, lineHeight: 1.1, margin: "6px 0 2px" }}>{money(calc.total, BASE)}</div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 10 }}>
          <Stat label="持仓市值" value={money(calc.mv, BASE)} />
          <Stat label="现金" value={money(calc.cash, BASE)} />
          <Stat label="持仓浮动盈亏" value={signMoney(calc.pnl, BASE)} color={pnlColor(calc.pnl)} />
          <Stat label="持仓收益率" value={pct(calc.ret)} color={pnlColor(calc.ret)} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
          {Object.entries(calc.byCcy).map(([c, v]) => (
            <span key={c} style={{ ...MONO, fontSize: 12, color: "#9aa6b6", background: "#0c1119", border: "1px solid #1f2733", borderRadius: 6, padding: "4px 9px" }}>{c} {money(v, c)}</span>
          ))}
          <span style={{ ...MONO, fontSize: 11, color: "#6e7a8a", marginLeft: 6 }}>汇率→¥</span>
          {["USD", "HKD"].map((c) => (
            <span key={c} style={{ ...MONO, fontSize: 12, color: "#9aa6b6" }}>{c}
              <input value={String(fx[c] ?? "")} onChange={(e) => setFx((f) => ({ ...f, [c]: e.target.value }))} style={{ width: 56, marginLeft: 4, background: "#0c1119", border: "1px solid #1f2733", borderRadius: 5, color: "#e6edf3", fontFamily: "inherit", fontSize: 12, padding: "2px 5px" }} />
            </span>
          ))}
          <span style={{ ...MONO, fontSize: 11, color: "#6e7a8a" }}>({fxStatus})</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <span style={S.label}>账户 · 资产与持仓勾稽</span>
        <button style={{ ...btn, marginLeft: "auto" }} onClick={addAccount}>+ 账户</button>
      </div>

      {calc.accs.map((a) => (
        <div key={a.id} style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <input value={a.name} onChange={(e) => setAcc(a.id, { name: e.target.value })} style={{ fontSize: 16, fontWeight: 700, background: "transparent", border: "none", borderBottom: "1px dashed #2a3340", color: "#e6edf3", fontFamily: "inherit", width: 130 }} />
            <select value={a.type} onChange={(e) => setAcc(a.id, { type: e.target.value })} style={{ ...sel, fontFamily: "inherit" }}><option>券商</option><option>银行</option></select>
            <span style={{ ...MONO, marginLeft: "auto", fontSize: 18, fontWeight: 700 }}>{money(a.totalBase, BASE)}</span>
            <button style={iconBtn} title="删除账户" onClick={() => removeAccount(a.id)}>✕</button>
          </div>
          <div style={{ ...MONO, fontSize: 12, color: "#8b95a5", background: "#0c1119", borderRadius: 8, padding: "8px 10px", marginBottom: 12 }}>
            账户总资产 {money(a.totalBase, BASE)} = 现金 {money(a.cashBase, BASE)} + 持仓市值 {money(a.mvBase, BASE)}
          </div>
          <div style={{ ...S.label, fontSize: 10, marginBottom: 6 }}>现金</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {a.cash.map((c, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#0c1119", border: "1px solid #1f2733", borderRadius: 7, padding: "4px 6px" }}>
                <select value={c.ccy} onChange={(e) => setCash(a.id, i, { ccy: e.target.value })} style={{ background: "transparent", border: "none", color: "#9aa6b6", ...MONO, fontSize: 12 }}>{CCYS.map((x) => <option key={x}>{x}</option>)}</select>
                <input value={String(c.amount ?? "")} onChange={(e) => setCash(a.id, i, { amount: e.target.value })} inputMode="decimal" style={{ width: 84, background: "transparent", border: "none", borderBottom: "1px dashed #2a3340", color: "#e6edf3", ...MONO, fontSize: 13 }} />
                <button style={iconBtn} onClick={() => rmCash(a.id, i)}>✕</button>
              </span>
            ))}
            <button style={{ ...btn, padding: "4px 9px" }} onClick={() => addCash(a.id)}>+ 币种</button>
          </div>
          <div style={{ ...S.label, fontSize: 10, marginBottom: 6 }}>持仓</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
              <thead><tr>{["代码", "名称", "币种", "股数", "成本价", "现价", "市值", "浮动盈亏", "收益率", ""].map((h, i) => (<th key={i} style={{ ...S.th, textAlign: i >= 3 && i <= 8 ? "right" : "left" }}>{h}</th>))}</tr></thead>
              <tbody>
                {a.holds.map((h, i) => (
                  <tr key={i}>
                    <td style={S.td}><Inp v={h.ticker} mono w={62} onChange={(v) => setHold(a.id, i, { ticker: v })} /></td>
                    <td style={S.td}><Inp v={h.name} w={96} onChange={(v) => setHold(a.id, i, { name: v })} /></td>
                    <td style={S.td}><select value={h.ccy} onChange={(e) => setHold(a.id, i, { ccy: e.target.value })} style={sel}>{CCYS.map((x) => <option key={x}>{x}</option>)}</select></td>
                    <td style={S.td}><Inp v={h.shares} mono num w={62} onChange={(v) => setHold(a.id, i, { shares: v })} /></td>
                    <td style={S.td}><Inp v={h.avgCost} mono num w={70} onChange={(v) => setHold(a.id, i, { avgCost: v })} /></td>
                    <td style={S.td}><Inp v={h.last} mono num w={70} onChange={(v) => setHold(a.id, i, { last: v })} /></td>
                    <td style={{ ...S.td, ...MONO, textAlign: "right" }}>{money(h.mv, h.ccy)}</td>
                    <td style={{ ...S.td, ...MONO, textAlign: "right", color: pnlColor(h.pnl), fontWeight: 600 }}>{signMoney(h.pnl, h.ccy)}</td>
                    <td style={{ ...S.td, ...MONO, textAlign: "right", color: pnlColor(h.pnl), fontWeight: 600 }}>{pct(h.ret)}</td>
                    <td style={{ ...S.td, textAlign: "right" }}><button style={iconBtn} onClick={() => rmHold(a.id, i)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button style={{ ...btn, marginTop: 10, padding: "4px 9px" }} onClick={() => addHold(a.id)}>+ 持仓</button>
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "center", margin: "22px 0 10px" }}>
        <span style={S.label}>交易记录</span>
        <button style={{ ...btn, marginLeft: "auto" }} onClick={addTrade}>+ 交易</button>
      </div>
      <div style={{ ...S.card, overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 780 }}>
          <thead><tr>{["日期", "账户", "代码", "方向", "币种", "价格", "股数", "金额", "买入价", "已实现收益", ""].map((h, i) => (<th key={i} style={{ ...S.th, textAlign: i >= 5 && i <= 9 ? "right" : "left" }}>{h}</th>))}</tr></thead>
          <tbody>
            {trades.map((t, i) => {
              const amount = num(t.price) * num(t.shares);
              const isSell = t.side === "卖出";
              const hasBuy = isSell && t.buyPrice !== "" && t.buyPrice != null;
              const realizedAmt = hasBuy ? (num(t.price) - num(t.buyPrice)) * num(t.shares) : null;
              const realizedRet = hasBuy && num(t.buyPrice) ? (num(t.price) - num(t.buyPrice)) / num(t.buyPrice) * 100 : null;
              return (
                <tr key={i}>
                  <td style={S.td}><Inp v={t.date} mono w={92} onChange={(v) => setTrade(i, { date: v })} /></td>
                  <td style={S.td}><Inp v={t.account} w={86} onChange={(v) => setTrade(i, { account: v })} /></td>
                  <td style={S.td}><Inp v={t.ticker} mono w={62} onChange={(v) => setTrade(i, { ticker: v })} /></td>
                  <td style={S.td}><select value={t.side} onChange={(e) => setTrade(i, { side: e.target.value })} style={{ ...sel, fontFamily: "inherit", fontWeight: 600, color: t.side === "买入" ? UP : DOWN }}><option>买入</option><option>卖出</option></select></td>
                  <td style={S.td}><select value={t.ccy} onChange={(e) => setTrade(i, { ccy: e.target.value })} style={sel}>{CCYS.map((x) => <option key={x}>{x}</option>)}</select></td>
                  <td style={S.td}><Inp v={t.price} mono num w={66} onChange={(v) => setTrade(i, { price: v })} /></td>
                  <td style={S.td}><Inp v={t.shares} mono num w={56} onChange={(v) => setTrade(i, { shares: v })} /></td>
                  <td style={{ ...S.td, ...MONO, textAlign: "right" }}>{money(amount, t.ccy)}</td>
                  <td style={S.td}>{isSell ? <Inp v={t.buyPrice} mono num w={66} right onChange={(v) => setTrade(i, { buyPrice: v })} /> : <span style={{ color: "#3a424f" }}>—</span>}</td>
                  <td style={{ ...S.td, ...MONO, textAlign: "right", fontWeight: 600, color: realizedAmt == null ? "#3a424f" : pnlColor(realizedAmt) }}>{realizedAmt == null ? "—" : `${signMoney(realizedAmt, t.ccy)} (${pct(realizedRet)})`}</td>
                  <td style={{ ...S.td, textAlign: "right" }}><button style={iconBtn} onClick={() => rmTrade(i)}>✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════ 组合敞口 AI 压力测试 ════════════════════
const PALETTE = ["#f85149", "#ff7b72", "#da3633", "#fb8500", "#ffb000", "#a78bfa", "#2dd4bf", "#58a6ff", "#3fb950", "#d29922"];
const STRESS_INIT = [
  { id: "mu", ticker: "MU", name: "美光科技", cat: "内存", beta: 1.1, lev: 1, value: 5000, color: "#f85149" },
  { id: "dram", ticker: "DRAM", name: "Roundhill 内存 ETF", cat: "内存", beta: 1.0, lev: 1, value: 2000, color: "#ff7b72" },
  { id: "hynix", ticker: "00709", name: "南方 2x 做多海力士", cat: "内存", beta: 1.0, lev: 2, value: 1295, color: "#da3633" },
  { id: "crdo", ticker: "CRDO", name: "Credo 科技", cat: "AI 连接", beta: 1.2, lev: 1, value: 3000, color: "#fb8500" },
  { id: "dxyz", ticker: "DXYZ", name: "Destiny Tech100", cat: "AI 私募", beta: 1.1, lev: 1, value: 1000, color: "#ffb000" },
  { id: "orcl", ticker: "ORCL", name: "Oracle", cat: "AI 云", beta: 0.7, lev: 1, value: 1500, color: "#a78bfa" },
  { id: "nok", ticker: "NOK", name: "Nokia", cat: "AI 网络", beta: 0.6, lev: 1, value: 500, color: "#2dd4bf" },
  { id: "googl", ticker: "GOOGL", name: "Alphabet", cat: "科技大盘", beta: 0.5, lev: 1, value: 2000, color: "#58a6ff" },
  { id: "now", ticker: "NOW", name: "ServiceNow", cat: "AI 软件（对冲）", beta: 0.2, lev: -1, value: 0, color: "#3fb950" },
];
const SCENARIOS = [
  { pct: 15, label: "温和回调", desc: "板块轮动 / 小幅获利了结", tone: "#ffb000" },
  { pct: 25, label: "中度回调", desc: "AI capex 叙事降温", tone: "#fb8500" },
  { pct: 40, label: "重度回调", desc: "AI 泡沫破裂 / 衰退", tone: "#f85149" },
];
const PP_BETA = 0.15;
const usd = (n) => "$" + Math.round(n).toLocaleString("en-US");
// 相关性分组：由敏感度自动归类
const groupOf = (shock) => (shock >= 1 ? "高度" : shock > 0 ? "中度" : "对冲");
const GROUPS = [
  { k: "高度", t: "高度 AI 相关（敏感度 ≥1.0）", c: "#f85149" },
  { k: "中度", t: "中度 AI 相关（0 ~ 1.0）", c: PURPLE },
  { k: "对冲", t: "对冲 / 反向（敏感度 ≤0）", c: "#3fb950" },
];

const DEFAULT_TAGS = ["内存", "AI 连接", "AI 私募", "AI 云", "AI 网络", "科技大盘", "AI 软件（对冲）", "半导体设备", "电力 / 能源", "其他"];
function TagSelect({ value, tags, onChange }) {
  const opts = [...new Set([...DEFAULT_TAGS, ...tags, value].filter(Boolean))];
  return (
    <select value={value || ""} onChange={(e) => {
      if (e.target.value === "__new__") { const t = prompt("新标签名称"); if (t && t.trim()) onChange(t.trim()); }
      else onChange(e.target.value);
    }} style={{ width: 122, background: "#0c1119", border: "1px solid #1f2733", borderRadius: 5, color: "#c9d1d9", fontFamily: "inherit", fontSize: 12, padding: "3px 6px" }}>
      {!value && <option value="">选择标签</option>}
      {opts.map((t) => <option key={t} value={t}>{t}</option>)}
      <option value="__new__">＋ 新建标签…</option>
    </select>
  );
}

function StressPage({ session }) {
  const [holdings, setHoldings] = useState(null);
  const [saveState, setSaveState] = useState("");
  const loadedRef = useRef(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await sb.from("stress").select("data").eq("user_id", session.user.id).maybeSingle();
      if (error) setSaveState("读取失败：" + error.message);
      const d = data && data.data;
      if (d && d.holdings && d.holdings.length) { setHoldings(d.holdings); setSaveState("已加载"); }
      else { setHoldings(STRESS_INIT); setSaveState("空档案 · 示例数据，编辑后自动保存"); }
      loadedRef.current = true;
    })();
  }, [session.user.id]);

  useEffect(() => {
    if (!loadedRef.current || holdings === null) return;
    setSaveState("待保存…");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, 1000);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line
  }, [holdings]);

  async function save() {
    setSaveState("保存中…");
    const { error } = await sb.from("stress").upsert({ user_id: session.user.id, data: { holdings }, updated_at: new Date().toISOString() });
    setSaveState(error ? "保存失败：" + error.message : "已保存 " + new Date().toLocaleTimeString());
  }

  const setH = (id, patch) => setHoldings((hs) => hs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const addH = () => setHoldings((hs) => [...hs, { id: uid(), ticker: "NEW", name: "", cat: "", beta: 1, lev: 1, value: 0, color: PALETTE[hs.length % PALETTE.length] }]);
  const rmH = (id) => setHoldings((hs) => hs.filter((x) => x.id !== id));

  const tags = useMemo(() => [...new Set((holdings || []).map((h) => (h.cat || "").trim()).filter(Boolean))], [holdings]);

  const m = useMemo(() => {
    if (!holdings) return null;
    const hs = holdings.map((h) => ({ ...h, shock: num(h.beta) * num(h.lev), grp: groupOf(num(h.beta) * num(h.lev)) }));
    const total = hs.reduce((s, h) => s + num(h.value), 0) || 1;
    const weightedShock = hs.reduce((s, h) => s + num(h.value) * h.shock, 0) / total;
    const buckets = { 高度: 0, 中度: 0, 对冲: 0 };
    hs.forEach((h) => { buckets[h.grp] += num(h.value); });
    const sorted = [...hs].filter((h) => num(h.value) > 0).sort((a, b) => b.value - a.value);
    const top = sorted[0];
    return { hs, total, weightedShock, buckets, sorted, top };
  }, [holdings]);

  if (!m) return <Splash text="读取组合…" />;

  const S = {
    wrap: { maxWidth: 980, margin: "0 auto", padding: "20px 16px 56px" },
    mono: MONO,
    card: { ...GLASS, padding: 16, marginBottom: 14 },
    label: { fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "#6e7a8a", fontWeight: 600 },
    th: { textAlign: "left", fontSize: 11, color: "#6e7a8a", fontWeight: 600, padding: "6px 8px", borderBottom: "1px solid #1f2733", whiteSpace: "nowrap" },
    td: { fontSize: 13, padding: "6px 8px", borderBottom: "1px solid #161c26", whiteSpace: "nowrap" },
  };
  const hardPct = (m.buckets.高度 / m.total) * 100;
  const midPct = (m.buckets.中度 / m.total) * 100;
  const hedgePct = (m.buckets.对冲 / m.total) * 100;
  const oneVarPct = hardPct + midPct;
  const topPct = m.top ? (m.top.value / m.total) * 100 : 0;
  const multiple = m.weightedShock / PP_BETA;
  const dd40 = 40 * m.weightedShock;

  // 实时诊断：阈值着色 + 一句说明
  const lvl = (v, warn, danger, invert) => {
    if (invert) return v <= danger ? DOWN : v <= warn ? "#ffb000" : UP;
    return v >= danger ? DOWN : v >= warn ? "#ffb000" : UP;
  };
  const diags = [
    { name: "AI 敏感度系数", val: "×" + m.weightedShock.toFixed(2), c: lvl(m.weightedShock, 0.6, 1.0), note: `AI 板块每跌 1%，组合跌约 ${m.weightedShock.toFixed(2)}%` },
    { name: "单一变量敞口", val: pctRaw(oneVarPct), c: lvl(oneVarPct, 50, 75), note: "高度+中度相关之和——都押注同一个 AI capex 叙事" },
    { name: "对冲 / 反向占比", val: pctRaw(hedgePct), c: lvl(hedgePct, 15, 5, true), note: "唯一能真正压低回撤的部分，越低越脆弱" },
    { name: "最大单一标的集中度", val: (m.top ? m.top.ticker + " " : "") + pctRaw(topPct), c: lvl(topPct, 25, 40), note: "单一标的占比，过高则个股风险主导" },
    { name: "相对永久组合倍数", val: multiple.toFixed(1) + "×", c: lvl(multiple, 3, 6), note: "同样冲击下，回撤是 25%股/债/金/现金 组合的倍数" },
    { name: "重度回调潜在回撤", val: "−" + pctRaw(dd40) + " / −" + usd(m.total * dd40 / 100), c: lvl(dd40, 20, 35), note: "AI 板块 −40% 时的估算回撤金额" },
  ];

  return (
    <div style={S.wrap}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ ...S.mono, fontSize: 11, color: "#fb8500", letterSpacing: 2, fontWeight: 600 }}>RISK TERMINAL</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 2px", lineHeight: 1.2 }}>组合 AI 敞口压力测试</h1>
        <p style={{ fontSize: 13, color: "#8b949e", margin: 0 }}>填入你的真实持仓金额，看 AI 板块回调时你会回撤多少</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 14px" }}>
        <span style={{ ...MONO, fontSize: 11, color: saveState.includes("失败") ? DOWN : "#6e7a8a" }}>● {saveState}</span>
        <button style={{ ...btn, marginLeft: "auto" }} onClick={save}>立即保存</button>
      </div>

      {/* 持仓输入（可增删改） */}
      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
          <span style={S.label}>持仓输入（美元）</span>
          <button style={{ ...btn, marginLeft: "auto" }} onClick={addH}>+ 标的</button>
        </div>
        {/* 敏感度公式说明 */}
        <div style={{ background: "rgba(88,166,255,0.07)", border: "1px solid rgba(88,166,255,0.25)", borderRadius: 8, padding: "9px 12px", marginBottom: 12, fontSize: 12, color: "#9fb6cc", lineHeight: 1.6 }}>
          <b style={{ color: "#cdd9e5" }}>敏感度 = AI相关β × 杠杆倍数</b>(自动算)。
          <b>β</b>：该标的对「AI capex 叙事」的相关强度——0=无关，1=与板块同步，&gt;1=比板块更剧烈；
          <b>杠杆</b>：普通持仓=1，2x 做多=2，反向 / 对冲填负数。
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720 }}>
            <thead><tr>{["", "代码", "名称", "领域标签", "β", "杠杆", "敏感度", "持仓 $", ""].map((h, i) => (<th key={i} style={{ ...S.th, textAlign: i >= 4 && i <= 7 ? "right" : "left" }}>{h}</th>))}</tr></thead>
            <tbody>
              {m.hs.map((h) => (
                <tr key={h.id}>
                  <td style={{ ...S.td, padding: "6px 4px" }}><div style={{ width: 4, height: 22, borderRadius: 2, background: h.color }} /></td>
                  <td style={S.td}><Inp v={h.ticker} mono w={64} onChange={(v) => setH(h.id, { ticker: v })} /></td>
                  <td style={S.td}><Inp v={h.name} w={120} onChange={(v) => setH(h.id, { name: v })} /></td>
                  <td style={S.td}><TagSelect value={h.cat} tags={tags} onChange={(v) => setH(h.id, { cat: v })} /></td>
                  <td style={S.td}><Inp v={h.beta} mono num w={48} onChange={(v) => setH(h.id, { beta: v })} /></td>
                  <td style={S.td}><Inp v={h.lev} mono num w={48} onChange={(v) => setH(h.id, { lev: v })} /></td>
                  <td style={{ ...S.td, ...MONO, textAlign: "right", fontWeight: 700, color: h.shock >= 1 ? "#f85149" : h.shock < 0 ? "#3fb950" : PURPLE }}>×{h.shock.toFixed(1)}</td>
                  <td style={S.td}>
                    <span style={{ display: "inline-flex", alignItems: "center", background: "#0a0e14", border: "1px solid #2a3340", borderRadius: 8, padding: "0 8px" }}>
                      <span style={{ color: "#6e7a8a", fontSize: 13 }}>$</span>
                      <Inp v={h.value} mono num w={72} right onChange={(v) => setH(h.id, { value: v })} />
                    </span>
                  </td>
                  <td style={{ ...S.td, textAlign: "right" }}><button style={iconBtn} onClick={() => rmH(h.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 总市值 + 敏感度 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ ...S.card, marginBottom: 0 }}>
          <div style={S.label}>组合总市值</div>
          <div style={{ ...S.mono, fontSize: 26, fontWeight: 700, marginTop: 6 }}>{usd(m.total)}</div>
        </div>
        <div style={{ ...S.card, marginBottom: 0, borderColor: "rgba(248,81,73,0.35)" }}>
          <div style={S.label}>AI 敏感度系数</div>
          <div style={{ ...S.mono, fontSize: 26, fontWeight: 700, marginTop: 6, color: m.weightedShock >= 1 ? "#f85149" : "#ffb000" }}>×{m.weightedShock.toFixed(2)}</div>
          <div style={{ fontSize: 10.5, color: "#8b949e", marginTop: 2 }}>AI 板块每跌 1%，你跌 {m.weightedShock.toFixed(2)}%</div>
        </div>
      </div>

      {/* 持仓结构 */}
      <div style={S.card}>
        <div style={{ ...S.label, marginBottom: 10 }}>持仓结构（按相关性分组）</div>
        <div style={{ display: "flex", height: 26, borderRadius: 6, overflow: "hidden", marginBottom: 12, background: "#0a0e14" }}>
          {m.sorted.map((h) => (<div key={h.id} title={h.ticker} style={{ width: (h.value / m.total) * 100 + "%", background: h.color }} />))}
        </div>
        {GROUPS.map((b) => {
          const v = m.buckets[b.k]; const p = (v / m.total) * 100;
          return (
            <div key={b.k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: b.c, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, flex: 1, color: "#c9d1d9" }}>{b.t}</span>
              <span style={{ ...S.mono, fontSize: 13, fontWeight: 600, color: b.c }}>{pctRaw(p)}</span>
              <span style={{ ...S.mono, fontSize: 11, color: "#6e7a8a", width: 64, textAlign: "right" }}>{usd(v)}</span>
            </div>
          );
        })}
      </div>

      {/* 压力情景 */}
      <div style={{ ...S.label, margin: "22px 4px 12px" }}>━━ 压力测试情景 ━━</div>
      {SCENARIOS.map((sc) => {
        const lossPct = sc.pct * m.weightedShock;
        const lossUsd = m.total * (lossPct / 100);
        const ppLossPct = sc.pct * PP_BETA;
        return (
          <div key={sc.pct} style={{ ...S.card, borderColor: sc.tone + "55" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ ...S.mono, fontSize: 15, fontWeight: 700, color: sc.tone }}>AI 板块 −{sc.pct}%</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#c9d1d9" }}>{sc.label}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#8b949e", marginTop: 2 }}>{sc.desc}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, background: "#0a0e14", borderRadius: 8, padding: "11px 12px" }}>
                <div style={{ fontSize: 10, color: "#6e7a8a", letterSpacing: 0.5 }}>你的组合回撤</div>
                <div style={{ ...S.mono, fontSize: 21, fontWeight: 700, color: sc.tone, marginTop: 3 }}>−{pctRaw(lossPct)}</div>
                <div style={{ ...S.mono, fontSize: 12, color: "#f85149", marginTop: 1 }}>−{usd(lossUsd)}</div>
              </div>
              <div style={{ flex: 1, background: "#0a0e14", borderRadius: 8, padding: "11px 12px", border: "1px solid #1a3326" }}>
                <div style={{ fontSize: 10, color: "#6e7a8a", letterSpacing: 0.5 }}>永久组合参考</div>
                <div style={{ ...S.mono, fontSize: 21, fontWeight: 700, color: "#3fb950", marginTop: 3 }}>−{pctRaw(ppLossPct)}</div>
                <div style={{ ...S.mono, fontSize: 11, color: "#6e7a8a", marginTop: 1 }}>25%股/债/金/现金</div>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: "#8b949e", marginTop: 10, lineHeight: 1.5 }}>
              同样的市场冲击，你的回撤是分散组合的 <b style={{ color: sc.tone }}>{multiple.toFixed(0)} 倍</b>
            </div>
          </div>
        );
      })}

      {/* 实时诊断 */}
      <div style={{ ...S.card, background: "linear-gradient(135deg,#1a1020,#11161f)", borderColor: "#3a2733", marginTop: 18 }}>
        <div style={{ ...S.label, color: "#fb8500", marginBottom: 12 }}>⚠ 实时诊断</div>
        {diags.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "8px 0", borderBottom: "1px solid #241a28" }}>
            <span style={{ fontSize: 12.5, color: "#c9d1d9", width: 132, flexShrink: 0 }}>{d.name}</span>
            <span style={{ ...S.mono, fontSize: 14, fontWeight: 700, color: d.c, width: 116, flexShrink: 0 }}>{d.val}</span>
            <span style={{ fontSize: 11.5, color: "#8b949e", lineHeight: 1.45 }}>{d.note}</span>
          </div>
        ))}
        <p style={{ fontSize: 12, color: "#8b949e", margin: "12px 0 0", lineHeight: 1.6 }}>
          绿=稳健 / 橙=警戒 / 红=危险。能真正降回撤的是<b style={{ color: "#3fb950" }}>低相关或反向资产</b>(长债、黄金、防御股、现金)——「不同标的、同一变量」不是分散。
        </p>
      </div>

      <div style={{ fontSize: 10.5, color: "#4a5563", textAlign: "center", marginTop: 18, lineHeight: 1.5 }}>
        敏感度系数为估算（基于历史 β 和杠杆），非精确预测<br />仅供风险管理参考，不构成投资建议
      </div>
    </div>
  );
}

// ════════════════════ 日记 ════════════════════
const MOODS = {
  trade: ["", "冷静 / 客观", "贪婪 / FOMO", "恐惧 / 恐慌", "焦虑", "后悔 / 懊恼", "过度自信", "手痒 / 想做 T", "其他"],
  life: ["", "平静", "开心", "充实", "疲惫", "焦虑", "低落", "愤怒", "其他"],
};
const BOARDS = [{ id: "trade", label: "交易日记" }, { id: "life", label: "生活日记" }];
const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const newId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2));
const today = () => new Date().toISOString().slice(0, 10);
const ymd = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function Calendar({ view, setView, selDate, setSelDate, days }) {
  const { y, m } = view;
  const first = new Date(y, m, 1).getDay();
  const dim = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  const go = (dm) => { let nm = m + dm, ny = y; if (nm < 0) { nm = 11; ny--; } if (nm > 11) { nm = 0; ny++; } setView({ y: ny, m: nm }); };
  const cellBase = { textAlign: "center", padding: "6px 0", fontSize: 12, borderRadius: 8, cursor: "pointer" };
  return (
    <div style={{ ...GLASS, padding: 14, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <button style={{ ...iconBtn, fontSize: 20 }} onClick={() => go(-1)}>‹</button>
        <span style={{ ...MONO, fontWeight: 700, fontSize: 15 }}>{y} 年 {m + 1} 月</span>
        <button style={{ ...iconBtn, fontSize: 20 }} onClick={() => go(1)}>›</button>
        <button style={{ ...btn, marginLeft: "auto", padding: "4px 9px" }} onClick={() => { const d = new Date(); setView({ y: d.getFullYear(), m: d.getMonth() }); }}>今天</button>
        {selDate && <button style={{ ...btn, padding: "4px 9px" }} onClick={() => setSelDate(null)}>清除筛选</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {WEEK.map((w) => <div key={w} style={{ textAlign: "center", fontSize: 10, color: "#8b81a6", padding: "2px 0" }}>{w}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = ymd(y, m, d), has = days.has(ds), isSel = selDate === ds, isToday = ds === today();
          return (
            <div key={i} onClick={() => setSelDate(isSel ? null : ds)} style={{ ...cellBase,
              background: isSel ? "rgba(168,139,250,0.38)" : has ? "rgba(168,139,250,0.12)" : "transparent",
              border: isToday ? "1px solid rgba(168,139,250,0.65)" : "1px solid transparent",
              color: has || isSel ? "#e6edf3" : "#6a6382", fontWeight: has ? 700 : 400 }}>
              {d}
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: has ? "#c4b5fd" : "transparent", margin: "2px auto 0" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DiaryPage({ session }) {
  const [entries, setEntries] = useState(null);
  const [urls, setUrls] = useState({}); // 图片路径 -> 签名URL
  const [saveState, setSaveState] = useState("");
  const loadedRef = useRef(false);
  const entriesRef = useRef([]);
  const dirty = useRef(new Set());
  const saveTimer = useRef(null);
  const [board, setBoard] = useState("trade");
  const [view, setView] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selDate, setSelDate] = useState(null);

  useEffect(() => { entriesRef.current = entries || []; }, [entries]);

  useEffect(() => {
    (async () => {
      const { data, error } = await sb.from("diary").select("*").eq("user_id", session.user.id).order("entry_date", { ascending: false }).order("created_at", { ascending: false });
      if (error) { setSaveState("读取失败：" + error.message); setEntries([]); loadedRef.current = true; return; }
      setEntries(data || []);
      setSaveState(data && data.length ? "已加载" : "还没有日记，点「+ 新日记」开始");
      const paths = (data || []).flatMap((e) => e.images || []);
      if (paths.length) {
        const { data: signed } = await sb.storage.from("diary-images").createSignedUrls(paths, 3600);
        const map = {}; (signed || []).forEach((s) => { if (s.signedUrl) map[s.path] = s.signedUrl; });
        setUrls(map);
      }
      loadedRef.current = true;
    })();
  }, [session.user.id]);

  const scheduleSave = () => {
    if (!loadedRef.current) return;
    setSaveState("待保存…");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, 1000);
  };
  async function flush() {
    const ids = [...dirty.current]; if (!ids.length) return;
    const rows = entriesRef.current.filter((e) => ids.includes(e.id)).map((e) => ({
      id: e.id, user_id: session.user.id, kind: e.kind || "trade", entry_date: e.entry_date || null, title: e.title || null,
      mood: e.mood || null, ticker: e.ticker || null, body: e.body || null, next_action: e.next_action || null, images: e.images || [],
    }));
    setSaveState("保存中…");
    const { error } = await sb.from("diary").upsert(rows);
    if (error) { setSaveState("保存失败：" + error.message); return; }
    dirty.current.clear();
    setSaveState("已保存 " + new Date().toLocaleTimeString());
  }

  const edit = (id, patch) => { setEntries((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e))); dirty.current.add(id); scheduleSave(); };
  const addEntry = () => { const e = { id: newId(), kind: board, entry_date: selDate || today(), title: "", mood: "", ticker: "", body: "", next_action: "", images: [] }; setEntries((es) => [e, ...(es || [])]); dirty.current.add(e.id); scheduleSave(); };
  const delEntry = async (id) => {
    const e = entriesRef.current.find((x) => x.id === id);
    setEntries((es) => es.filter((x) => x.id !== id)); dirty.current.delete(id);
    if (e && e.images && e.images.length) sb.storage.from("diary-images").remove(e.images);
    await sb.from("diary").delete().eq("id", id);
    setSaveState("已删除 " + new Date().toLocaleTimeString());
  };
  const uploadImg = async (id, file) => {
    if (!file) return;
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${session.user.id}/${newId()}.${ext}`;
    setSaveState("上传图片…");
    const { error } = await sb.storage.from("diary-images").upload(path, file, { upsert: false });
    if (error) { setSaveState("图片上传失败：" + error.message); return; }
    const { data: signed } = await sb.storage.from("diary-images").createSignedUrl(path, 3600);
    if (signed && signed.signedUrl) setUrls((u) => ({ ...u, [path]: signed.signedUrl }));
    const cur = entriesRef.current.find((e) => e.id === id);
    edit(id, { images: [...((cur && cur.images) || []), path] });
  };
  const removeImg = (id, path) => {
    const cur = entriesRef.current.find((e) => e.id === id);
    edit(id, { images: ((cur && cur.images) || []).filter((p) => p !== path) });
    sb.storage.from("diary-images").remove([path]);
  };

  const S = {
    wrap: { maxWidth: 760, margin: "0 auto", padding: "20px 16px 56px" },
    card: { ...GLASS, padding: 16, marginBottom: 14 },
    label: { fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "#6e7a8a", fontWeight: 600 },
    field: { background: "rgba(12,10,22,0.6)", border: "1px solid rgba(168,139,250,0.22)", borderRadius: 8, color: "#e6edf3", fontFamily: "inherit", fontSize: 14, padding: "9px 11px", boxSizing: "border-box", width: "100%" },
  };

  if (!entries) return <Splash text="读取日记…" />;

  const boardEntries = entries.filter((e) => (e.kind || "trade") === board);
  const days = new Set(boardEntries.map((e) => e.entry_date).filter(Boolean));
  const visible = selDate ? boardEntries.filter((e) => e.entry_date === selDate) : boardEntries;
  const nextLabel = board === "trade" ? "下一步 →" : "感想 / 提醒 →";
  const nextPh = board === "trade" ? "一句话：下次我要怎么改（可选）" : "一句话：留给未来的自己（可选）";
  const bodyPh = board === "trade" ? "正文——今天发生了什么，你怎么想、怎么做的" : "正文——今天的生活、心情、想记下的事";

  return (
    <div style={S.wrap}>
      {/* 板块切换 */}
      <div style={{ display: "inline-flex", gap: 4, padding: 4, ...GLASS, borderRadius: 12, marginBottom: 14 }}>
        {BOARDS.map((b) => (
          <div key={b.id} onClick={() => { setBoard(b.id); setSelDate(null); }} style={{ padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 9, background: board === b.id ? "rgba(168,139,250,0.25)" : "transparent", color: board === b.id ? "#e6edf3" : "#8b81a6" }}>{b.label}</div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 14px" }}>
        <span style={{ ...MONO, fontSize: 11, color: saveState.includes("失败") ? DOWN : "#8b81a6" }}>● {saveState}</span>
        <button style={{ ...btn, marginLeft: "auto" }} onClick={addEntry}>+ 新日记</button>
      </div>

      <Calendar view={view} setView={setView} selDate={selDate} setSelDate={setSelDate} days={days} />

      {selDate && <div style={{ ...MONO, fontSize: 12, color: "#c4b5fd", marginBottom: 10 }}>筛选：{selDate}（共 {visible.length} 条）</div>}

      {visible.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", color: "#8b81a6", fontSize: 13, padding: "36px 16px" }}>
          {selDate ? "这一天还没有日记。" : "还没有日记。点右上角「+ 新日记」记录第一条。"}
        </div>
      )}

      {visible.map((e) => (
        <div key={e.id} style={S.card}>
          {/* 头：日期 / 情绪 / 标的 / 删除 */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
            <input type="date" value={e.entry_date || ""} onChange={(ev) => edit(e.id, { entry_date: ev.target.value })} style={{ ...S.field, width: "auto", padding: "6px 9px", ...MONO, fontSize: 13, colorScheme: "dark" }} />
            <select value={e.mood || ""} onChange={(ev) => edit(e.id, { mood: ev.target.value })} style={{ ...S.field, width: "auto", padding: "6px 9px", fontSize: 13, color: e.mood ? "#e6edf3" : "#8b81a6" }}>
              {MOODS[board].map((mo) => <option key={mo} value={mo}>{mo || "情绪…"}</option>)}
            </select>
            {board === "trade" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ ...MONO, fontSize: 12, color: "#8b81a6" }}>$</span>
                <input value={e.ticker || ""} onChange={(ev) => edit(e.id, { ticker: ev.target.value })} placeholder="标的" style={{ ...S.field, width: 78, padding: "6px 9px", ...MONO, fontSize: 13 }} />
              </span>
            )}
            <button style={{ ...iconBtn, marginLeft: "auto" }} title="删除这条日记" onClick={() => delEntry(e.id)}>✕</button>
          </div>

          <input value={e.title || ""} onChange={(ev) => edit(e.id, { title: ev.target.value })} placeholder="标题" style={{ ...S.field, fontSize: 16, fontWeight: 700, marginBottom: 10 }} />
          <textarea value={e.body || ""} onChange={(ev) => edit(e.id, { body: ev.target.value })} placeholder={bodyPh} rows={5} style={{ ...S.field, resize: "vertical", lineHeight: 1.6, marginBottom: 10 }} />

          {/* 图片 */}
          {e.images && e.images.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {e.images.map((p) => (
                <div key={p} style={{ position: "relative" }}>
                  {urls[p]
                    ? <a href={urls[p]} target="_blank" rel="noreferrer"><img src={urls[p]} alt="" style={{ height: 96, borderRadius: 8, border: "1px solid #1f2733", display: "block" }} /></a>
                    : <div style={{ height: 96, width: 96, borderRadius: 8, border: "1px solid #1f2733", background: "#0c1119", display: "flex", alignItems: "center", justifyContent: "center", color: "#6e7a8a", fontSize: 11 }}>加载中</div>}
                  <button onClick={() => removeImg(e.id, p)} style={{ position: "absolute", top: -8, right: -8, background: "#11161f", border: "1px solid #2a3340", color: "#c9d1d9", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 12, lineHeight: 1 }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <label style={{ ...btn, display: "inline-block", marginBottom: 10 }}>
            + 图片
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(ev) => { uploadImg(e.id, ev.target.files[0]); ev.target.value = ""; }} />
          </label>

          {/* 下一步 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(12,10,22,0.5)", border: "1px solid rgba(168,139,250,0.2)", borderRadius: 8, padding: "8px 11px" }}>
            <span style={{ fontSize: 12, color: AMBER, fontWeight: 600, whiteSpace: "nowrap" }}>{nextLabel}</span>
            <input value={e.next_action || ""} onChange={(ev) => edit(e.id, { next_action: ev.target.value })} placeholder={nextPh} style={{ background: "transparent", border: "none", color: "#e6edf3", fontFamily: "inherit", fontSize: 13, width: "100%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#6e7a8a", fontWeight: 600 }}>{label}</div>
      <div style={{ ...MONO, fontSize: 17, fontWeight: 700, color: color || "#e6edf3", marginTop: 3 }}>{value}</div>
    </div>
  );
}

function Inp({ v, onChange, mono, num, w = 80, right }) {
  return (
    <input value={String(v ?? "")} onChange={(e) => onChange(e.target.value)} inputMode={num ? "decimal" : undefined}
      style={{ width: w, background: "transparent", border: "none", borderBottom: "1px dashed #2a3340", color: "#e6edf3", fontFamily: mono ? "'IBM Plex Mono',monospace" : "inherit", fontSize: 13, padding: "2px 0", textAlign: right || num ? "right" : "left" }} />
  );
}
