"use client";

import {
  Banknote, Boxes, Building2, CalendarRange, ChartArea,
  CheckCircle2, ChevronDown, Clock, Factory, Handshake,
  Kanban, LayoutDashboard, LayoutList, Package, PackageCheck,
  Pencil, Plus, ReceiptText, Save, Search, Settings,
  Star, Table2, TrendingUp, Users, X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { seedData, SeedData } from "./lib/seed";
import type {
  BomItem, ExhibitionStatus, MfgStatus, OfficeStatus, RentalStatus
} from "./lib/seed";

type Tab = "dashboard" | "crm" | "office" | "exhibitions" | "rental" | "manufacturing" | "hr" | "payroll" | "finance";
type CrmLine = "office" | "exhibition" | "rental" | "prefab";

const nav = [
  { id: "dashboard",     label: "總覽",      icon: LayoutDashboard },
  { id: "crm",           label: "CRM 商機",  icon: Handshake },
  { id: "office",        label: "辦公室裝修", icon: Building2 },
  { id: "exhibitions",   label: "展場特裝",  icon: PackageCheck },
  { id: "rental",        label: "展覽櫃租賃", icon: Boxes },
  { id: "manufacturing", label: "系統家具",  icon: Factory },
  { id: "hr",            label: "人資",      icon: Users },
  { id: "payroll",       label: "薪資",      icon: Banknote },
  { id: "finance",       label: "財務",      icon: ReceiptText },
] as const;

const money = (v: number) => v ? `NT$ ${v.toLocaleString("zh-TW")}` : "—";
const pct   = (a: number, b: number) => b ? Math.round(a / b * 100) : 0;

// ─── Status helpers ──────────────────────────────────────────────────────────
const OFFICE_STAGES: OfficeStatus[] = ["洽談中","場勘完成","設計提案","設計確認","施工中","驗收中","已結案"];
const EXHIBITION_STAGES: ExhibitionStatus[] = ["洽談中","可行性評估","提案前準備","設計確認","備料中","進場中","展覽中","撤場中","已結案"];
const MFG_STAGES: MfgStatus[] = ["需求轉設計","對圖拆料","備料中","生產製作","待組裝","完工入庫","已出貨"];
const RENTAL_STAGES: RentalStatus[] = ["待確認","待出貨","已出貨","使用中","已歸還","逾期"];

function officeBadge(s: OfficeStatus) {
  if (s === "已結案") return "badge green";
  if (s === "施工中" || s === "驗收中") return "badge orange";
  if (s === "設計確認") return "badge blue";
  return "badge gray";
}
function exBadge(s: ExhibitionStatus) {
  if (s === "已結案") return "badge green";
  if (s === "展覽中" || s === "進場中") return "badge orange";
  if (s === "設計確認" || s === "備料中") return "badge blue";
  if (s === "撤場中") return "badge purple";
  return "badge gray";
}
function mfgBadge(s: MfgStatus) {
  if (s === "已出貨") return "badge green";
  if (s === "完工入庫") return "badge blue";
  if (s === "生產製作" || s === "待組裝") return "badge orange";
  if (s === "備料中") return "badge purple";
  return "badge gray";
}
function rentalBadge(s: RentalStatus) {
  if (s === "已歸還") return "badge green";
  if (s === "使用中") return "badge orange";
  if (s === "待出貨" || s === "已出貨") return "badge blue";
  if (s === "逾期")   return "badge red";
  return "badge gray";
}
function finBadge(s: string) {
  if (s === "已收款" || s === "已付款") return "badge green";
  if (s === "部分收款") return "badge orange";
  return "badge gray";
}

// ─── StatusFlow ──────────────────────────────────────────────────────────────
function StatusFlow({ stages, current }: { stages: readonly string[]; current: string }) {
  const idx = stages.indexOf(current);
  return (
    <div className="statusFlow">
      {stages.map((s, i) => (
        <div key={s} className="statusStep">
          {i > 0 && <div className={`stepLine ${i <= idx ? "done" : ""}`} />}
          <div className="statusStepWrap">
            <div className={`stepDot ${i < idx ? "done" : i === idx ? "active" : ""}`}>{i < idx ? "✓" : i + 1}</div>
            <div className="stepLabel">{s}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BOM availability check ──────────────────────────────────────────────────
function BomRow({ item, inventory }: { item: BomItem; inventory: SeedData["inventory"] }) {
  const inv = inventory.find(x => x.sku === item.sku);
  const avail = inv ? inv.qty - inv.rented : 0;
  const cls = avail >= item.qty ? "bomAvail ok" : avail > 0 ? "bomAvail warn" : "bomAvail bad";
  return (
    <tr>
      <td>{item.sku}</td>
      <td>{item.name}</td>
      <td style={{ textAlign: "right" }}>{item.qty} {item.unit}</td>
      <td className={cls} style={{ textAlign: "right" }}>{inv ? `${avail} ${inv.unit}` : "未知"}</td>
      <td className={cls}>{avail >= item.qty ? "✓ 足夠" : avail > 0 ? "⚠ 不足" : "✗ 缺貨"}</td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Page() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [data, setData] = useState<SeedData>(seedData);
  const [saved, setSaved] = useState("尚未同步");

  useEffect(() => {
    fetch("/api/erp")
      .then(r => r.json())
      .then(r => { setData(r.data); setSaved(`資料來源：${r.source}`); })
      .catch(() => setSaved("使用本機種子資料"));
  }, []);

  async function persist(next = data) {
    try {
      const r = await fetch("/api/erp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next)
      });
      const j = await r.json();
      setData(j.data);
      setSaved(`已同步：${new Date().toLocaleTimeString("zh-TW")}`);
    } catch { setSaved("同步失敗"); }
  }

  // ── KPIs ──
  const kpi = useMemo(() => {
    const officeActive   = data.office.filter(x => x.status !== "已結案");
    const officeRevenue  = data.office.reduce((s, x) => s + x.amount, 0);
    const exActive       = data.exhibitions.filter(x => !["已結案"].includes(x.status));
    const rentalActive   = data.rentals.filter(x => ["使用中","待出貨","已出貨"].includes(x.status));
    const mfgActive      = data.manufacturing.filter(x => !["已出貨"].includes(x.status));
    const receivables    = data.finance.filter(x => x.type === "應收" && x.status !== "已收款").reduce((s,x) => s + x.amount, 0);
    const payables       = data.finance.filter(x => x.type === "應付" && x.status !== "已付款").reduce((s,x) => s + x.amount, 0);
    const totalRentalCabinets = data.inventory.filter(x => x.category === "租賃櫃").reduce((s,x) => s + x.qty, 0);
    const rentedCabinets      = data.inventory.filter(x => x.category === "租賃櫃").reduce((s,x) => s + x.rented, 0);
    return { officeActive: officeActive.length, officeRevenue, exActive: exActive.length, rentalActive: rentalActive.length, mfgActive: mfgActive.length, receivables, payables, totalRentalCabinets, rentedCabinets };
  }, [data]);

  // ── Rental ship / return ──
  function shipRental(id: string) {
    const r = data.rentals.find(x => x.id === id);
    if (!r || r.status === "已出貨" || r.status === "使用中") return;
    const next: SeedData = {
      ...data,
      rentals: data.rentals.map(x => x.id === id ? { ...x, status: "已出貨" as RentalStatus } : x),
      inventory: data.inventory.map(inv => {
        const match = r.items.find(i => i.sku === inv.sku);
        return match ? { ...inv, rented: Math.min(inv.qty, inv.rented + match.qty) } : inv;
      })
    };
    setData(next); void persist(next);
  }
  function returnRental(id: string) {
    const r = data.rentals.find(x => x.id === id);
    if (!r || !["已出貨","使用中","逾期"].includes(r.status)) return;
    const next: SeedData = {
      ...data,
      rentals: data.rentals.map(x => x.id === id ? { ...x, status: "已歸還" as RentalStatus } : x),
      inventory: data.inventory.map(inv => {
        const match = r.items.find(i => i.sku === inv.sku);
        return match ? { ...inv, rented: Math.max(0, inv.rented - match.qty) } : inv;
      })
    };
    setData(next); void persist(next);
  }

  // ── MFG advance status ──
  function advanceMfg(id: string) {
    const order = data.manufacturing.find(x => x.id === id);
    if (!order) return;
    const idx = MFG_STAGES.indexOf(order.status);
    if (idx >= MFG_STAGES.length - 1) return;
    const next: SeedData = {
      ...data,
      manufacturing: data.manufacturing.map(x =>
        x.id === id ? { ...x, status: MFG_STAGES[idx + 1] } : x
      )
    };
    setData(next); void persist(next);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">HS</span>
          <div><strong>紅山 ERP</strong><small>商業空間設計</small></div>
        </div>
        <div className="navSection">
          <div className="navLabel">主功能</div>
          <nav>
            {nav.map(({ id, label, icon: Icon }) => (
              <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id as Tab)}>
                <Icon size={16} />{label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>紅山商業空間設計 ERP Demo</p>
            <h1>{nav.find(x => x.id === tab)?.label ?? "總覽"}</h1>
          </div>
          <button className="primary" onClick={() => persist()}>
            <Save size={14} />儲存同步
          </button>
        </header>
        <span className="sync">{saved}</span>

        {tab === "dashboard"     && <Dashboard data={data} kpi={kpi} setTab={setTab} />}
        {tab === "crm"           && <CrmKanban data={data} />}
        {tab === "office"        && <OfficePage data={data} setData={setData} persist={persist} />}
        {tab === "exhibitions"   && <ExhibitionPage data={data} setData={setData} persist={persist} />}
        {tab === "rental"        && <RentalPage data={data} shipRental={shipRental} returnRental={returnRental} />}
        {tab === "manufacturing" && <ManufacturingPage data={data} setData={setData} persist={persist} advanceMfg={advanceMfg} />}
        {tab === "hr"            && <HrPage data={data} />}
        {tab === "payroll"       && <PayrollPage data={data} />}
        {tab === "finance"       && <FinancePage data={data} />}
      </section>
    </main>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ data, kpi, setTab }: {
  data: SeedData;
  kpi: Record<string, number>;
  setTab: (t: Tab) => void;
}) {
  const urgentEx = data.exhibitions.filter(x => ["進場中","展覽中","設計確認","備料中"].includes(x.status));
  const urgentOf = data.office.filter(x => ["施工中","驗收中"].includes(x.status));
  const lateMfg  = data.manufacturing.filter(x => x.status !== "已出貨" && x.due < new Date().toISOString().slice(0,10));

  return (
    <>
      <div className="kpis">
        <div className="metric">
          <span>進行中裝修案</span>
          <strong>{kpi.officeActive}</strong>
          <small>總金額 {money(kpi.officeRevenue)}</small>
        </div>
        <div className="metric">
          <span>展場特裝進行中</span>
          <strong>{kpi.exActive}</strong>
          <small>案件數</small>
        </div>
        <div className="metric">
          <span>租賃中櫃數</span>
          <strong>{kpi.rentedCabinets} / {kpi.totalRentalCabinets}</strong>
          <small>使用率 {pct(kpi.rentedCabinets, kpi.totalRentalCabinets)}%</small>
        </div>
        <div className="metric">
          <span>應收帳款</span>
          <strong>{money(kpi.receivables)}</strong>
          <small>應付 {money(kpi.payables)}</small>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <div className="panelHead">
            <h2>🔴 展場特裝 — 進行中</h2>
            <button className="outline" onClick={() => setTab("exhibitions")}>查看全部</button>
          </div>
          <table>
            <thead><tr><th>客戶</th><th>展館</th><th>開展</th><th>狀態</th></tr></thead>
            <tbody>
              {urgentEx.slice(0,5).map(x => (
                <tr key={x.id}>
                  <td>{x.customer}</td><td style={{maxWidth:180,overflow:"hidden",textOverflow:"ellipsis"}}>{x.exhibitionName}</td>
                  <td>{x.openDate}</td>
                  <td><span className={exBadge(x.status)}>{x.status}</span></td>
                </tr>
              ))}
              {urgentEx.length === 0 && <tr><td colSpan={4} style={{color:"var(--muted)",textAlign:"center"}}>目前無進行中案件</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <div className="panelHead">
            <h2>🏗 辦公室裝修 — 施工中</h2>
            <button className="outline" onClick={() => setTab("office")}>查看全部</button>
          </div>
          <table>
            <thead><tr><th>客戶</th><th>案場</th><th>設計師</th><th>狀態</th></tr></thead>
            <tbody>
              {urgentOf.slice(0,5).map(x => (
                <tr key={x.id}>
                  <td>{x.customer}</td><td>{x.site}</td><td>{x.designer}</td>
                  <td><span className={officeBadge(x.status)}>{x.status}</span></td>
                </tr>
              ))}
              {urgentOf.length === 0 && <tr><td colSpan={4} style={{color:"var(--muted)",textAlign:"center"}}>目前無施工中案件</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <div className="panelHead">
            <h2>📦 系統家具製造 — 待追蹤</h2>
            <button className="outline" onClick={() => setTab("manufacturing")}>查看全部</button>
          </div>
          <table>
            <thead><tr><th>訂單</th><th>成品</th><th>狀態</th><th>交期</th></tr></thead>
            <tbody>
              {data.manufacturing.filter(x => x.status !== "已出貨").slice(0,5).map(x => (
                <tr key={x.id}>
                  <td>{x.orderNo}</td><td>{x.product}</td>
                  <td><span className={mfgBadge(x.status)}>{x.status}</span></td>
                  <td style={{ color: lateMfg.includes(x) ? "#991b1b" : "inherit" }}>{x.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <div className="panelHead"><h2>🏪 租賃庫存概況</h2>
            <button className="outline" onClick={() => setTab("rental")}>查看全部</button>
          </div>
          <table>
            <thead><tr><th>品名</th><th>總數</th><th>已租</th><th>可用</th></tr></thead>
            <tbody>
              {data.inventory.filter(x => x.category === "租賃櫃").map(x => (
                <tr key={x.sku}>
                  <td>{x.name}</td>
                  <td style={{textAlign:"right"}}>{x.qty}</td>
                  <td style={{textAlign:"right"}}>{x.rented}</td>
                  <td style={{textAlign:"right"}}>
                    <span className={x.qty - x.rented === 0 ? "badge red" : x.qty - x.rented <= 2 ? "badge orange" : "badge green"}>
                      {x.qty - x.rented}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── CRM Kanban ──────────────────────────────────────────────────────────────
const CRM_PIPELINES = {
  office: {
    label: "辦公室裝修",
    stages: ["洽談中","可行性評估","提案前準備","提案"],
    opportunities: [
      { id:"CO001", title:"20260610-裝修-張公館-高雄老屋翻新全室", customer:"張公館", amount:9000000, stage:"提案", owner:"吳", color:"gold", rating:3, tag:"A級客戶" },
      { id:"CO002", title:"20260424-裝修-舊振南-台北101臨時櫃", customer:"舊振南食品", amount:250000, stage:"提案", owner:"洪", color:"green", rating:2, tag:"" },
      { id:"CO003", title:"20260526-裝修-遠寬電信-高雄夢時代", customer:"遠寬電信", amount:420000, stage:"提案前準備", owner:"袁", color:"teal", rating:1, tag:"" },
      { id:"CO004", title:"20260606-裝修-醫美診所-台中七期", customer:"美涵醫美診所", amount:1800000, stage:"可行性評估", owner:"吳", color:"gold", rating:2, tag:"新客戶" },
      { id:"CO005", title:"20260601-裝修-光禾-辦公室整層翻新", customer:"光禾科技有限公司", amount:650000, stage:"洽談中", owner:"余", color:"indigo", rating:0, tag:"" },
    ]
  },
  exhibition: {
    label: "展場特裝",
    stages: ["洽談中","可行性評估","提案前準備","提案"],
    opportunities: [
      { id:"EO001", title:"20260520-特裝-台灣普德-南港展覽館-飯店餐飲展", customer:"台灣普德股份有限公司", amount:0, stage:"洽談中", owner:"陳", color:"magenta", rating:0, tag:"" },
      { id:"EO002", title:"20260527-特裝-寶嘉誠-台中自動化展", customer:"寶嘉誠工業", amount:200000, stage:"提案前準備", owner:"洪", color:"green", rating:0, tag:"" },
      { id:"EO003", title:"20260430-特裝-聲寶-台中電器空調大展", customer:"聲寶股份有限公司", amount:680000, stage:"提案", owner:"陳", color:"magenta", rating:0, tag:"A級客戶" },
      { id:"EO004", title:"20260430-特裝-聲寶-高雄電器空調大展", customer:"聲寶股份有限公司", amount:510000, stage:"提案", owner:"陳", color:"magenta", rating:0, tag:"A級客戶" },
      { id:"EO005", title:"20260325-特裝-優志旺-南港一館-國際食品展", customer:"優志旺股份有限公司", amount:150000, stage:"提案前準備", owner:"陳", color:"magenta", rating:0, tag:"" },
    ]
  },
  rental: {
    label: "租賃機會",
    stages: ["洽談中","可行性評估","提案前準備","提案"],
    opportunities: [
      { id:"RO001", title:"20260213-租賃-金雕藝術-台北大巨蛋遠東Garden City", customer:"金雕藝術有限公司, 徐慧萍", amount:14070, stage:"洽談中", owner:"黃", color:"purple", rating:0, tag:"A級客戶" },
      { id:"RO002", title:"20250908-租賃-飛利浦-高雄樂購廣場", customer:"飛利浦總公司", amount:5985, stage:"洽談中", owner:"李", color:"green", rating:0, tag:"A級客戶" },
      { id:"RO003", title:"20260521-租賃-飛利浦-父親節百貨專案", customer:"飛利浦總公司", amount:0, stage:"提案前準備", owner:"洪", color:"green", rating:0, tag:"" },
      { id:"RO004", title:"20260506-租賃-恆隆行-父親節百貨8月請款", customer:"恆隆行貿易", amount:521063, stage:"提案前準備", owner:"黃", color:"purple", rating:0, tag:"" },
      { id:"RO005", title:"20260530-租賃-赫索視覺-台北光華商場", customer:"赫索視覺整合行銷", amount:16800, stage:"提案", owner:"黃", color:"purple", rating:0, tag:"" },
    ]
  },
  prefab: {
    label: "系統家具機會",
    stages: ["洽談中","估價報價","對圖拆料","生產製作"],
    opportunities: [
      { id:"PO001", title:"20250518-系統-王國安-高雄鼓山-系統櫃", customer:"王國安", amount:400000, stage:"洽談中", owner:"洪", color:"green", rating:0, tag:"炫耕" },
      { id:"PO002", title:"20260505-系統-光佐-高雄小港-清景麟", customer:"光佐空間設計", amount:270000, stage:"洽談中", owner:"洪", color:"green", rating:0, tag:"炫耕" },
      { id:"PO003", title:"20260520-系統-寶家-高雄辦公桌邊櫃", customer:"寶家家具設計", amount:9993, stage:"估價報價", owner:"潘", color:"teal", rating:0, tag:"" },
      { id:"PO004", title:"20260512-系統-黃瀧-桌板180x140", customer:"黃瀧有限公司", amount:7732, stage:"對圖拆料", owner:"許", color:"indigo", rating:0, tag:"" },
      { id:"PO005", title:"20260416-系統-紘毅-高雄遠見云峰", customer:"紘毅室內裝修設計", amount:69000, stage:"生產製作", owner:"宋", color:"green", rating:0, tag:"" },
    ]
  }
};

type PipelineKey = keyof typeof CRM_PIPELINES;

function CrmKanban({ data: _data }: { data: SeedData }) {
  const [active, setActive] = useState<PipelineKey>("exhibition");
  const [query, setQuery] = useState("");
  const pipeline = CRM_PIPELINES[active];
  const filtered = pipeline.opportunities.filter(x =>
    `${x.title} ${x.customer} ${x.owner} ${x.tag}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  const totalAmt = filtered.reduce((s, x) => s + x.amount, 0);

  return (
    <section className="crmShell">
      <div className="odooToolbar">
        <div className="crmActions">
          <button className="odooPrimary"><Plus size={14} style={{marginRight:3}}/>新增</button>
          <div className="pipelineTabs">
            {(Object.keys(CRM_PIPELINES) as PipelineKey[]).map(k => (
              <button key={k} className={active === k ? "selected" : ""} onClick={() => setActive(k)}>
                {CRM_PIPELINES[k].label}
              </button>
            ))}
          </div>
        </div>
        <div className="crmSearch">
          <Search size={16} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜尋商機、客戶、負責人…" />
          <button style={{border:0,background:"transparent",padding:"0 10px",cursor:"pointer"}} title="篩選"><ChevronDown size={16} /></button>
        </div>
        <div className="viewModes" aria-label="檢視模式">
          <button className="active" title="看板"><Kanban size={16} /></button>
          <button title="清單"><LayoutList size={16} /></button>
          <button title="行事曆"><CalendarRange size={16} /></button>
          <button title="圖表"><ChartArea size={16} /></button>
        </div>
      </div>
      <div style={{padding:"8px 16px",background:"#fff",borderBottom:"1px solid #e5e7eb",fontSize:12,color:"var(--muted)"}}>
        共 {filtered.length} 筆商機 · 總金額 {money(totalAmt)}
      </div>
      <div className="kanbanBoard">
        {pipeline.stages.map(stage => {
          const rows = filtered.filter(x => x.stage === stage);
          const stageTotal = rows.reduce((s, x) => s + x.amount, 0);
          return (
            <section className="kanbanColumn" key={stage}>
              <header className="kanbanHead">
                <h2>{stage}</h2>
                <div className="kanbanHeadMeta">
                  <div className="stageBar" />
                  <strong>{stageTotal ? money(stageTotal) : `${rows.length} 筆`}</strong>
                  <button className="addStage" title="新增"><Plus size={18} /></button>
                </div>
              </header>
              <div className="kanbanCards">
                {rows.map(item => (
                  <article key={item.id} className="opportunityCard">
                    <h3>{item.title}</h3>
                    {item.amount > 0 && <p className="amount">{money(item.amount)}</p>}
                    <p className="customer">{item.customer}</p>
                    {item.tag && <span className="clientTag">{item.tag}</span>}
                    <div className="cardMeta">
                      <span className="stars">{[0,1,2].map(i => <Star key={i} size={14} fill={i < item.rating ? "#d8b323" : "none"} stroke={i < item.rating ? "#d8b323" : "#94a3b8"} />)}</span>
                      <Clock size={14} />
                      {item.owner && <span className={`owner ${item.color}`}>{item.owner}</span>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

// ─── Office Page ──────────────────────────────────────────────────────────────
function OfficePage({ data, setData, persist }: { data: SeedData; setData: (d: SeedData) => void; persist: (d?: SeedData) => void }) {
  const [selected, setSelected] = useState<SeedData["office"][0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("全部");

  const shown = filterStatus === "全部" ? data.office : data.office.filter(x => x.status === filterStatus);

  function updateSelected(field: string, value: string | number) {
    if (!selected) return;
    setSelected({ ...selected, [field]: value });
  }
  function saveSelected() {
    if (!selected) return;
    const next = { ...data, office: data.office.map(x => x.id === selected.id ? selected : x) };
    setData(next); persist(next); setSelected(null);
  }
  function advanceStatus() {
    if (!selected) return;
    const idx = OFFICE_STAGES.indexOf(selected.status);
    if (idx < OFFICE_STAGES.length - 1) updateSelected("status", OFFICE_STAGES[idx + 1]);
  }

  return (
    <>
      <div className="btnRow" style={{ marginBottom: 14 }}>
        {["全部", ...OFFICE_STAGES].map(s => (
          <button key={s} className={filterStatus === s ? "primary" : "ghost"} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="panel">
        <div className="panelHead">
          <h2>辦公室裝修案件 ({shown.length})</h2>
          <button className="primary"><Plus size={14} />新增案件</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>案號</th><th>客戶</th><th>案場</th><th>坪數</th>
              <th>設計師</th><th>監工</th><th>狀態</th>
              <th style={{textAlign:"right"}}>金額</th>
              <th style={{textAlign:"right"}}>收款進度</th>
              <th>交期</th><th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map(x => (
              <tr key={x.id} className="clickable" onClick={() => setSelected(x)}>
                <td style={{color:"var(--muted)"}}>{x.id}</td>
                <td style={{fontWeight:600}}>{x.customer}</td>
                <td>{x.site}</td>
                <td>{x.area} 坪</td>
                <td>{x.designer}</td>
                <td>{x.supervisor}</td>
                <td><span className={officeBadge(x.status)}>{x.status}</span></td>
                <td style={{textAlign:"right"}}>{money(x.amount)}</td>
                <td>
                  <div className="availBar">
                    <div className="progressBar"><div className="progressFill" style={{ width: `${pct(x.paid, x.amount)}%` }} /></div>
                    <span className="availNum">{pct(x.paid, x.amount)}%</span>
                  </div>
                </td>
                <td>{x.dueDate}</td>
                <td><button className="ghost" onClick={e => { e.stopPropagation(); setSelected(x); }}><Pencil size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawerHead">
              <div>
                <div style={{fontSize:11,color:"var(--muted)"}}>{selected.id}</div>
                <h2 style={{fontSize:16}}>{selected.customer}</h2>
              </div>
              <button className="ghost" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>

            <StatusFlow stages={OFFICE_STAGES} current={selected.status} />

            <div className="drawerBody">
              <div className="drawerSection">
                <h3>案件資訊</h3>
                <div className="fieldGrid">
                  <div className="field"><label>狀態</label>
                    <select value={selected.status} onChange={e => updateSelected("status", e.target.value as OfficeStatus)}>
                      {OFFICE_STAGES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="field"><label>案場</label><input value={selected.site} onChange={e => updateSelected("site", e.target.value)} /></div>
                  <div className="field"><label>坪數</label><input type="number" value={selected.area} onChange={e => updateSelected("area", +e.target.value)} /></div>
                  <div className="field"><label>設計師</label><input value={selected.designer} onChange={e => updateSelected("designer", e.target.value)} /></div>
                  <div className="field"><label>監工</label><input value={selected.supervisor} onChange={e => updateSelected("supervisor", e.target.value)} /></div>
                  <div className="field"><label>場勘日期</label><input type="date" value={selected.surveyDate} onChange={e => updateSelected("surveyDate", e.target.value)} /></div>
                </div>
              </div>
              <div className="drawerSection">
                <h3>財務</h3>
                <div className="fieldGrid">
                  <div className="field"><label>合約金額</label><input type="number" value={selected.amount} onChange={e => updateSelected("amount", +e.target.value)} /></div>
                  <div className="field"><label>已收款</label><input type="number" value={selected.paid} onChange={e => updateSelected("paid", +e.target.value)} /></div>
                  <div className="field"><label>交期</label><input type="date" value={selected.dueDate} onChange={e => updateSelected("dueDate", e.target.value)} /></div>
                  <div className="field"><label>聯絡人</label><input value={selected.contact} onChange={e => updateSelected("contact", e.target.value)} /></div>
                  <div className="field"><label>電話</label><input value={selected.phone} onChange={e => updateSelected("phone", e.target.value)} /></div>
                </div>
              </div>
              <div className="drawerSection">
                <h3>備註</h3>
                <div className="field"><textarea value={selected.notes} onChange={e => updateSelected("notes", e.target.value)} /></div>
              </div>
            </div>
            <div className="drawerFoot">
              <button className="outline" onClick={advanceStatus}><TrendingUp size={14} />推進狀態</button>
              <button className="primary" onClick={saveSelected}><Save size={14} />儲存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Exhibition Page ──────────────────────────────────────────────────────────
function ExhibitionPage({ data, setData, persist }: { data: SeedData; setData: (d: SeedData) => void; persist: (d?: SeedData) => void }) {
  const [selected, setSelected] = useState<SeedData["exhibitions"][0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("全部");

  const shown = filterStatus === "全部" ? data.exhibitions : data.exhibitions.filter(x => x.status === filterStatus);

  function updateSelected(field: string, value: string | number) {
    if (!selected) return; setSelected({ ...selected, [field]: value });
  }
  function saveSelected() {
    if (!selected) return;
    const next = { ...data, exhibitions: data.exhibitions.map(x => x.id === selected.id ? selected : x) };
    setData(next); persist(next); setSelected(null);
  }

  return (
    <>
      <div className="btnRow" style={{ marginBottom: 14 }}>
        {["全部", ...EXHIBITION_STAGES].map(s => (
          <button key={s} className={filterStatus === s ? "primary" : "ghost"} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="panel">
        <div className="panelHead">
          <h2>展場特裝案件 ({shown.length})</h2>
          <button className="primary"><Plus size={14} />新增案件</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>案號</th><th>客戶</th><th>展覽名稱</th><th>展館</th><th>坪數</th>
              <th>進場</th><th>開展</th><th>撤場</th>
              <th>設計師</th><th>狀態</th>
              <th style={{textAlign:"right"}}>金額</th>
              <th style={{textAlign:"right"}}>收款</th><th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map(x => (
              <tr key={x.id} className="clickable" onClick={() => setSelected(x)}>
                <td style={{color:"var(--muted)"}}>{x.id}</td>
                <td style={{fontWeight:600}}>{x.customer}</td>
                <td style={{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{x.exhibitionName}</td>
                <td>{x.venue}</td>
                <td>{x.area} 坪</td>
                <td>{x.entryDate}</td><td>{x.openDate}</td><td>{x.exitDate}</td>
                <td>{x.designer}</td>
                <td><span className={exBadge(x.status)}>{x.status}</span></td>
                <td style={{textAlign:"right"}}>{money(x.amount)}</td>
                <td>
                  <div className="availBar">
                    <div className="progressBar"><div className="progressFill" style={{width:`${pct(x.paid, x.amount)}%`}} /></div>
                    <span className="availNum">{pct(x.paid, x.amount)}%</span>
                  </div>
                </td>
                <td><button className="ghost" onClick={e => { e.stopPropagation(); setSelected(x); }}><Pencil size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawerHead">
              <div>
                <div style={{fontSize:11,color:"var(--muted)"}}>{selected.id}</div>
                <h2 style={{fontSize:16}}>{selected.customer}</h2>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{selected.exhibitionName}</div>
              </div>
              <button className="ghost" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <StatusFlow stages={EXHIBITION_STAGES} current={selected.status} />
            <div className="drawerBody">
              <div className="drawerSection">
                <h3>案件資訊</h3>
                <div className="fieldGrid">
                  <div className="field"><label>狀態</label>
                    <select value={selected.status} onChange={e => updateSelected("status", e.target.value as ExhibitionStatus)}>
                      {EXHIBITION_STAGES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="field"><label>展館</label><input value={selected.venue} onChange={e => updateSelected("venue", e.target.value)} /></div>
                  <div className="field"><label>坪數</label><input type="number" value={selected.area} onChange={e => updateSelected("area", +e.target.value)} /></div>
                  <div className="field"><label>設計師</label><input value={selected.designer} onChange={e => updateSelected("designer", e.target.value)} /></div>
                  <div className="field"><label>進場日</label><input type="date" value={selected.entryDate} onChange={e => updateSelected("entryDate", e.target.value)} /></div>
                  <div className="field"><label>開展日</label><input type="date" value={selected.openDate} onChange={e => updateSelected("openDate", e.target.value)} /></div>
                  <div className="field"><label>撤場日</label><input type="date" value={selected.exitDate} onChange={e => updateSelected("exitDate", e.target.value)} /></div>
                </div>
              </div>
              <div className="drawerSection">
                <h3>財務</h3>
                <div className="fieldGrid">
                  <div className="field"><label>合約金額</label><input type="number" value={selected.amount} onChange={e => updateSelected("amount", +e.target.value)} /></div>
                  <div className="field"><label>已收款</label><input type="number" value={selected.paid} onChange={e => updateSelected("paid", +e.target.value)} /></div>
                  <div className="field"><label>收款期限</label><input type="date" value={selected.dueDate} onChange={e => updateSelected("dueDate", e.target.value)} /></div>
                </div>
              </div>
              <div className="drawerSection">
                <h3>備註</h3>
                <div className="field"><textarea value={selected.notes} onChange={e => updateSelected("notes", e.target.value)} /></div>
              </div>
            </div>
            <div className="drawerFoot">
              <button className="primary" onClick={saveSelected}><Save size={14} />儲存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Rental Page ──────────────────────────────────────────────────────────────
function RentalPage({ data, shipRental, returnRental }: {
  data: SeedData;
  shipRental: (id: string) => void;
  returnRental: (id: string) => void;
}) {
  const [tab, setTab] = useState<"orders" | "inventory">("orders");

  return (
    <>
      <div className="btnRow" style={{ marginBottom: 14 }}>
        <button className={tab === "orders" ? "primary" : "ghost"} onClick={() => setTab("orders")}>租賃訂單</button>
        <button className={tab === "inventory" ? "primary" : "ghost"} onClick={() => setTab("inventory")}>庫存管理</button>
      </div>

      {tab === "orders" && (
        <div className="panel">
          <div className="panelHead">
            <h2>展覽櫃租賃訂單</h2>
            <button className="primary"><Plus size={14} />新增訂單</button>
          </div>
          <table>
            <thead>
              <tr><th>訂單號</th><th>客戶</th><th>租賃品項</th><th>出貨日</th><th>歸還日</th><th>押金</th><th>租金</th><th>已收</th><th>狀態</th><th>操作</th></tr>
            </thead>
            <tbody>
              {data.rentals.map(r => (
                <tr key={r.id}>
                  <td style={{color:"var(--muted)"}}>{r.id}</td>
                  <td style={{fontWeight:600}}>{r.customer}</td>
                  <td>
                    <div className="rentalItems">
                      {r.items.map(i => <span key={i.sku} className="itemChip">{i.name} ×{i.qty}</span>)}
                    </div>
                  </td>
                  <td>{r.shipDate}</td><td>{r.returnDate}</td>
                  <td>{money(r.deposit)}</td>
                  <td>{money(r.rentalFee)}</td>
                  <td>{money(r.paid)}</td>
                  <td><span className={rentalBadge(r.status)}>{r.status}</span></td>
                  <td>
                    <div className="btnRow">
                      {["待確認","待出貨"].includes(r.status) && (
                        <button className="ghost" onClick={() => shipRental(r.id)}>
                          <Package size={13} />出貨
                        </button>
                      )}
                      {["已出貨","使用中","逾期"].includes(r.status) && (
                        <button className="ghost" onClick={() => returnRental(r.id)}>
                          <CheckCircle2 size={13} />歸還
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "inventory" && (
        <div className="grid two">
          <div className="panel">
            <div className="panelHead"><h2>租賃櫃庫存</h2></div>
            <table>
              <thead><tr><th>SKU</th><th>品名</th><th>總數</th><th>已租</th><th>可用</th><th>日租金</th><th>庫位</th></tr></thead>
              <tbody>
                {data.inventory.filter(x => x.category === "租賃櫃").map(x => {
                  const avail = x.qty - x.rented;
                  return (
                    <tr key={x.sku}>
                      <td style={{color:"var(--muted)",fontSize:11}}>{x.sku}</td>
                      <td style={{fontWeight:600}}>{x.name}</td>
                      <td style={{textAlign:"right"}}>{x.qty}</td>
                      <td style={{textAlign:"right"}}>{x.rented}</td>
                      <td>
                        <div className="availBar">
                          <div className="progressBar">
                            <div className="progressFill" style={{width:`${pct(x.rented, x.qty)}%`,background: avail === 0 ? "#ef4444" : avail <= 2 ? "#f59e0b" : "var(--accent-2)"}} />
                          </div>
                          <span className="availNum" style={{color: avail === 0 ? "#991b1b" : avail <= 2 ? "#92400e" : "var(--success)"}}>{avail} 座</span>
                        </div>
                      </td>
                      <td>NT$ {x.dailyRate}/天</td>
                      <td>{x.location}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="panel">
            <div className="panelHead"><h2>製造料件庫存</h2></div>
            <table>
              <thead><tr><th>SKU</th><th>品名</th><th>庫存</th><th>單位</th><th>庫位</th></tr></thead>
              <tbody>
                {data.inventory.filter(x => x.category === "製造料件").map(x => (
                  <tr key={x.sku}>
                    <td style={{color:"var(--muted)",fontSize:11}}>{x.sku}</td>
                    <td style={{fontWeight:600}}>{x.name}</td>
                    <td style={{textAlign:"right",fontWeight:700}}>{x.qty}</td>
                    <td>{x.unit}</td>
                    <td>{x.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Manufacturing Page ───────────────────────────────────────────────────────
function ManufacturingPage({ data, setData, persist, advanceMfg }: {
  data: SeedData; setData: (d: SeedData) => void;
  persist: (d?: SeedData) => void; advanceMfg: (id: string) => void;
}) {
  const [selected, setSelected] = useState<SeedData["manufacturing"][0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("全部");

  const shown = filterStatus === "全部"
    ? data.manufacturing
    : data.manufacturing.filter(x => x.status === filterStatus);

  function updateSelected(field: string, value: string | number) {
    if (!selected) return; setSelected({ ...selected, [field]: value } as typeof selected);
  }
  function saveSelected() {
    if (!selected) return;
    const next = { ...data, manufacturing: data.manufacturing.map(x => x.id === selected.id ? selected : x) };
    setData(next); persist(next); setSelected(null);
  }

  return (
    <>
      <div className="btnRow" style={{ marginBottom: 14 }}>
        {["全部", ...MFG_STAGES].map(s => (
          <button key={s} className={filterStatus === s ? "primary" : "ghost"} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="panel">
        <div className="panelHead">
          <h2>系統家具製造單 — 無限心悅品牌 ({shown.length})</h2>
          <button className="primary"><Plus size={14} />新增製造單</button>
        </div>
        <table>
          <thead>
            <tr><th>訂單號</th><th>客戶</th><th>成品</th><th>設計師</th><th>料件清單</th><th>交期</th><th>狀態</th><th style={{textAlign:"right"}}>金額</th><th>操作</th></tr>
          </thead>
          <tbody>
            {shown.map(x => (
              <tr key={x.id} className="clickable" onClick={() => setSelected(x)}>
                <td style={{color:"var(--muted)"}}>{x.orderNo}</td>
                <td style={{fontWeight:600}}>{x.customer}</td>
                <td>{x.product}</td>
                <td>{x.designer}</td>
                <td>
                  {x.bom.length ? (
                    <div className="rentalItems">
                      {x.bom.map(b => <span key={b.sku} className="itemChip">{b.name} ×{b.qty}</span>)}
                    </div>
                  ) : <span style={{color:"var(--muted)"}}>待設計師建立</span>}
                </td>
                <td style={{color: x.status !== "已出貨" && x.due < new Date().toISOString().slice(0,10) ? "#991b1b" : "inherit"}}>{x.due}</td>
                <td><span className={mfgBadge(x.status)}>{x.status}</span></td>
                <td style={{textAlign:"right"}}>{money(x.amount)}</td>
                <td>
                  <button className="ghost" disabled={x.status === "已出貨"}
                    onClick={e => { e.stopPropagation(); advanceMfg(x.id); }}
                    title="推進到下一個狀態">
                    <TrendingUp size={13} />推進
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawerHead">
              <div>
                <div style={{fontSize:11,color:"var(--muted)"}}>{selected.orderNo}</div>
                <h2 style={{fontSize:16}}>{selected.product}</h2>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{selected.customer}</div>
              </div>
              <button className="ghost" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <StatusFlow stages={MFG_STAGES} current={selected.status} />
            <div className="drawerBody">
              <div className="drawerSection">
                <h3>製造資訊</h3>
                <div className="fieldGrid">
                  <div className="field"><label>狀態</label>
                    <select value={selected.status} onChange={e => updateSelected("status", e.target.value as MfgStatus)}>
                      {MFG_STAGES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="field"><label>設計師</label><input value={selected.designer} onChange={e => updateSelected("designer", e.target.value)} /></div>
                  <div className="field"><label>交期</label><input type="date" value={selected.due} onChange={e => updateSelected("due", e.target.value)} /></div>
                  <div className="field"><label>金額</label><input type="number" value={selected.amount} onChange={e => updateSelected("amount", +e.target.value)} /></div>
                </div>
              </div>
              <div className="drawerSection">
                <h3>BOM 料件清單 — 庫存確認</h3>
                {selected.bom.length === 0
                  ? <div style={{color:"var(--muted)",fontSize:13,padding:"10px 0"}}>尚未建立料件清單，請設計師於對圖後填入</div>
                  : (
                    <table className="bomTable">
                      <thead><tr><th>SKU</th><th>品名</th><th>需求量</th><th>現有庫存</th><th>狀態</th></tr></thead>
                      <tbody>
                        {selected.bom.map(b => <BomRow key={b.sku} item={b} inventory={data.inventory} />)}
                      </tbody>
                    </table>
                  )
                }
              </div>
              <div className="drawerSection">
                <h3>備註</h3>
                <div className="field"><textarea value={selected.notes} onChange={e => updateSelected("notes", e.target.value)} /></div>
              </div>
            </div>
            <div className="drawerFoot">
              <button className="outline" onClick={() => { const i = MFG_STAGES.indexOf(selected.status); if (i < MFG_STAGES.length-1) updateSelected("status", MFG_STAGES[i+1]); }}>
                <TrendingUp size={14} />推進狀態
              </button>
              <button className="primary" onClick={saveSelected}><Save size={14} />儲存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── HR Page ──────────────────────────────────────────────────────────────────
function HrPage({ data }: { data: SeedData }) {
  const depts = [...new Set(data.employees.map(x => x.dept))];
  return (
    <div className="grid two">
      <div className="panel">
        <div className="panelHead"><h2>員工名冊</h2><button className="primary"><Plus size={14}/>新增員工</button></div>
        <table>
          <thead><tr><th>工號</th><th>姓名</th><th>部門</th><th>職務</th><th style={{textAlign:"right"}}>月薪</th><th>狀態</th></tr></thead>
          <tbody>
            {data.employees.map(x => (
              <tr key={x.id}>
                <td style={{color:"var(--muted)"}}>{x.id}</td>
                <td style={{fontWeight:600}}>{x.name}</td>
                <td>{x.dept}</td>
                <td>{x.role}</td>
                <td style={{textAlign:"right"}}>{money(x.salary)}</td>
                <td><span className="badge green">{x.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <div className="panelHead"><h2>部門人數統計</h2></div>
        <table>
          <thead><tr><th>部門</th><th>人數</th><th>平均薪資</th></tr></thead>
          <tbody>
            {depts.map(d => {
              const members = data.employees.filter(x => x.dept === d);
              const avg = Math.round(members.reduce((s, x) => s + x.salary, 0) / members.length);
              return (
                <tr key={d}>
                  <td style={{fontWeight:600}}>{d}</td>
                  <td>{members.length} 人</td>
                  <td>{money(avg)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Payroll Page ─────────────────────────────────────────────────────────────
function PayrollPage({ data }: { data: SeedData }) {
  const rows = data.payroll.map(r => ({ ...r, total: r.base + r.overtime + r.bonus - r.deduction }));
  const totalPayout = rows.reduce((s, x) => s + x.total, 0);
  return (
    <div className="panel">
      <div className="panelHead">
        <h2>薪資試算 — {rows[0]?.month}</h2>
        <span style={{fontSize:13,color:"var(--muted)"}}>本月合計：{money(totalPayout)}</span>
      </div>
      <table>
        <thead><tr><th>月份</th><th>員工</th><th style={{textAlign:"right"}}>本薪</th><th style={{textAlign:"right"}}>加班</th><th style={{textAlign:"right"}}>獎金</th><th style={{textAlign:"right"}}>扣款</th><th style={{textAlign:"right",color:"var(--accent-2)"}}>實領</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{color:"var(--muted)"}}>{r.month}</td>
              <td style={{fontWeight:600}}>{r.employee}</td>
              <td style={{textAlign:"right"}}>{money(r.base)}</td>
              <td style={{textAlign:"right",color:"var(--accent-2)"}}>{r.overtime > 0 ? money(r.overtime) : "—"}</td>
              <td style={{textAlign:"right",color:"var(--accent-2)"}}>{r.bonus > 0 ? money(r.bonus) : "—"}</td>
              <td style={{textAlign:"right",color:"#991b1b"}}>{r.deduction > 0 ? money(r.deduction) : "—"}</td>
              <td style={{textAlign:"right",fontWeight:700,color:"var(--accent-2)"}}>{money(r.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Finance Page ─────────────────────────────────────────────────────────────
function FinancePage({ data }: { data: SeedData }) {
  const [filter, setFilter] = useState("全部");
  const shown = filter === "全部" ? data.finance : data.finance.filter(x => x.type === filter);
  const totalReceivable = data.finance.filter(x => x.type === "應收" && x.status !== "已收款").reduce((s, x) => s + x.amount, 0);
  const totalPayable    = data.finance.filter(x => x.type === "應付" && x.status !== "已付款").reduce((s, x) => s + x.amount, 0);
  const totalIncome     = data.finance.filter(x => x.type === "收入").reduce((s, x) => s + x.amount, 0);

  return (
    <>
      <div className="kpis" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))", marginBottom: 16 }}>
        <div className="metric"><span>應收帳款（未收）</span><strong className="amtPositive">{money(totalReceivable)}</strong></div>
        <div className="metric"><span>應付帳款（未付）</span><strong className="amtNegative">{money(totalPayable)}</strong></div>
        <div className="metric"><span>收入（已入帳）</span><strong>{money(totalIncome)}</strong></div>
      </div>

      <div className="btnRow" style={{ marginBottom: 14 }}>
        {["全部","應收","應付","收入"].map(s => (
          <button key={s} className={filter === s ? "primary" : "ghost"} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      <div className="panel">
        <div className="panelHead"><h2>財務收付款明細 ({shown.length})</h2></div>
        <table>
          <thead><tr><th>單號</th><th>類型</th><th>產品線</th><th>專案</th><th style={{textAlign:"right"}}>金額</th><th>到期日</th><th>狀態</th></tr></thead>
          <tbody>
            {shown.map(x => (
              <tr key={x.id} className={`finRow ${x.type === "應收" ? "receivable" : x.type === "應付" ? "payable" : "income"}`}>
                <td style={{color:"var(--muted)"}}>{x.id}</td>
                <td><span className={x.type === "應收" ? "badge blue" : x.type === "應付" ? "badge red" : "badge purple"}>{x.type}</span></td>
                <td>{x.productLine}</td>
                <td style={{fontWeight:600}}>{x.project}</td>
                <td style={{textAlign:"right",fontWeight:700, color: x.type === "應付" ? "#991b1b" : "var(--success)"}}>{money(x.amount)}</td>
                <td>{x.due}</td>
                <td><span className={finBadge(x.status)}>{x.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
