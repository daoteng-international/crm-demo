import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import type { SeedData } from "../../lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 主模型 + 備援模型（尖峰時依序退避重試）
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

function isTransient(e: unknown): boolean {
  const s = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return ["503", "unavailable", "overload", "high demand", "429", "resource_exhausted", "rate limit", "internal", "500"].some((k) => s.includes(k));
}

// 每日配額用完（免費層）：同模型重試沒用，直接換下一個模型（各模型有各自的每日額度）
function isQuota(e: unknown): boolean {
  const s = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return ["quota", "resource_exhausted", "free_tier", "exceeded your current quota"].some((k) => s.includes(k));
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 依序嘗試各模型；遇到暫時性錯誤（503/429/overload）就退避重試，仍失敗才換下一個模型
async function generate(
  ai: GoogleGenAI,
  contents: unknown,
  config: unknown
): Promise<Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>> {
  let lastErr: unknown;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await ai.models.generateContent({ model, contents, config } as never);
      } catch (e) {
        lastErr = e;
        if (!isTransient(e)) throw e; // 非暫時性錯誤（例如金鑰錯誤）直接拋出
        if (isQuota(e)) break; // 每日配額用完，換下一個模型
        if (attempt < 2) await wait(400 * (attempt + 1)); // 400ms、800ms 退避後重試同一模型
      }
    }
  }
  throw lastErr;
}

// ── 狀態機（與 app/page.tsx 一致）────────────────────────────────
const STAGES: Record<string, string[]> = {
  office: ["洽談中", "場勘完成", "設計提案", "設計確認", "施工中", "驗收中", "已結案"],
  exhibitions: ["洽談中", "可行性評估", "提案前準備", "設計確認", "備料中", "進場中", "展覽中", "撤場中", "已結案"],
  manufacturing: ["需求轉設計", "對圖拆料", "備料中", "生產製作", "待組裝", "完工入庫", "已出貨"],
  rentals: ["待確認", "待出貨", "已出貨", "使用中", "已歸還", "逾期"],
};

// 每個 section 的主鍵欄位
const KEY_FIELD: Record<string, string | null> = {
  office: "id",
  exhibitions: "id",
  rentals: "id",
  manufacturing: "id",
  finance: "id",
  employees: "id",
  inventory: "sku",
  payroll: null, // 以 month + employee 比對
};

const SECTIONS = Object.keys(KEY_FIELD);

type Op = {
  op: "update" | "add" | "delete";
  section: string;
  id?: string;
  fields?: Record<string, unknown>;
};

type OpResult = { ok: boolean; message: string };

// ── 確定性地把操作套用到 snapshot 副本 ───────────────────────────
function applyOps(input: SeedData, ops: Op[]): { snapshot: SeedData; results: OpResult[]; changed: boolean } {
  const snapshot: SeedData = JSON.parse(JSON.stringify(input));
  const results: OpResult[] = [];
  let changed = false;

  for (const raw of ops) {
    const op = raw?.op;
    const section = raw?.section;
    if (!section || !SECTIONS.includes(section)) {
      results.push({ ok: false, message: `未知的 section「${section}」，可用：${SECTIONS.join("、")}` });
      continue;
    }
    const list = (snapshot as unknown as Record<string, Record<string, unknown>[]>)[section];
    if (!Array.isArray(list)) {
      results.push({ ok: false, message: `section「${section}」不是可編輯的清單` });
      continue;
    }
    const keyField = KEY_FIELD[section];

    // 狀態值驗證
    const fields = (raw.fields ?? {}) as Record<string, unknown>;
    if (typeof fields.status === "string" && STAGES[section] && !STAGES[section].includes(fields.status)) {
      results.push({ ok: false, message: `「${fields.status}」不是 ${section} 的合法狀態，可用：${STAGES[section].join("、")}` });
      continue;
    }

    const matchIndex = () => {
      if (keyField) return list.findIndex((r) => String(r[keyField]) === String(raw.id));
      // payroll：以 month + employee 比對
      return list.findIndex((r) => String(r.month) === String(fields.month) && String(r.employee) === String(fields.employee));
    };

    if (op === "update") {
      const idx = matchIndex();
      if (idx < 0) {
        results.push({ ok: false, message: `${section} 找不到 ${keyField ?? "紀錄"}=${raw.id ?? `${fields.month}/${fields.employee}`}` });
        continue;
      }
      list[idx] = { ...list[idx], ...fields };
      changed = true;
      results.push({ ok: true, message: `已更新 ${section} ${keyField ? raw.id : `${fields.month}/${fields.employee}`}` });
    } else if (op === "add") {
      if (keyField && !fields[keyField]) {
        results.push({ ok: false, message: `新增 ${section} 需提供 ${keyField}` });
        continue;
      }
      if (keyField && list.some((r) => String(r[keyField]) === String(fields[keyField]))) {
        results.push({ ok: false, message: `${section} 已存在 ${keyField}=${fields[keyField]}` });
        continue;
      }
      list.push(fields);
      changed = true;
      results.push({ ok: true, message: `已新增 ${section} ${keyField ? fields[keyField] : ""}` });
    } else if (op === "delete") {
      const idx = matchIndex();
      if (idx < 0) {
        results.push({ ok: false, message: `${section} 找不到要刪除的 ${keyField ?? "紀錄"}=${raw.id}` });
        continue;
      }
      list.splice(idx, 1);
      changed = true;
      results.push({ ok: true, message: `已刪除 ${section} ${raw.id ?? ""}` });
    } else {
      results.push({ ok: false, message: `未知的 op「${op}」` });
    }
  }

  return { snapshot, results, changed };
}

function systemInstruction(data: SeedData): string {
  return [
    "你是「紅山商業空間設計」ERP 系統的 AI 助理，用繁體中文、簡潔專業地回答。",
    "系統資料分為以下 section（陣列）：",
    "- office 辦公室裝修案（主鍵 id 如 OF001；狀態 status 屬於：" + STAGES.office.join("/") + "；含 customer/amount/paid/status/nextStep 等）",
    "- exhibitions 展場特裝案（主鍵 id 如 EX001；狀態：" + STAGES.exhibitions.join("/") + "）",
    "- rentals 展覽櫃租賃單（主鍵 id 如 R001；狀態：" + STAGES.rentals.join("/") + "）",
    "- manufacturing 系統家具工單（主鍵 id 如 M001；狀態：" + STAGES.manufacturing.join("/") + "；含 bom 用料）",
    "- inventory 庫存（主鍵 sku；含 qty/rented/dailyRate）",
    "- finance 財務（主鍵 id 如 FIN001；type 應收/應付/收入/支出；amount/status）",
    "- employees 員工（主鍵 id 如 E001）、payroll 薪資（以 month+employee 比對）",
    "",
    "查詢類問題：直接根據下方 JSON 計算後回答，金額用 NT$ 千分位。",
    "當使用者要求新增/修改/刪除資料時，呼叫 apply_erp_changes 函式（可一次帶多筆 operations）；不要只用文字描述改動。",
    "修改狀態時務必使用該 section 合法的狀態值。改完用一句話跟使用者確認做了什麼。",
    "",
    "目前完整資料 JSON：",
    JSON.stringify(data),
  ].join("\n");
}

const applyChangesTool = {
  functionDeclarations: [
    {
      name: "apply_erp_changes",
      description: "新增、修改或刪除 ERP 資料。可一次帶入多筆操作。",
      parameters: {
        type: Type.OBJECT,
        properties: {
          operations: {
            type: Type.ARRAY,
            description: "要套用的操作清單",
            items: {
              type: Type.OBJECT,
              properties: {
                op: { type: Type.STRING, enum: ["update", "add", "delete"], description: "操作類型" },
                section: {
                  type: Type.STRING,
                  enum: SECTIONS,
                  description: "資料區塊名稱",
                },
                id: { type: Type.STRING, description: "目標紀錄主鍵（update/delete 用；inventory 用 sku 值）" },
                fields: { type: Type.OBJECT, description: "要寫入的欄位鍵值（add 全部欄位；update 只帶要改的欄位）" },
              },
              required: ["op", "section"],
            },
          },
        },
        required: ["operations"],
      },
    },
  ],
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: "尚未設定 GEMINI_API_KEY，AI 助理暫時無法使用。", changed: false });
  }

  let body: { messages?: { role: string; text: string }[]; data?: SeedData };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reply: "請求格式錯誤。", changed: false }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const data = body.data;
  if (!data) return NextResponse.json({ reply: "缺少目前資料。", changed: false }, { status: 400 });

  const ai = new GoogleGenAI({ apiKey });

  const contents = messages.map((m) => ({
    role: m.role === "ai" ? "model" : "user",
    parts: [{ text: m.text }],
  }));

  const config = {
    systemInstruction: systemInstruction(data),
    tools: [applyChangesTool],
    temperature: 0.2,
  };

  let workingData = data;
  let changed = false;

  try {
    // 單次呼叫：模型若要改資料就回 functionCall，我們在伺服器端確定性套用並自行組回覆，
    // 不再做第二趟模型呼叫（省一半配額、且改資料在額度吃緊時仍可靠）。
    const response = await generate(ai, contents, config);
    const calls = response.functionCalls ?? [];

    // 純查詢（沒有 functionCall）→ 直接回模型文字
    if (!calls.length) {
      return NextResponse.json({ reply: response.text || "（沒有回覆內容）", changed: false });
    }

    // 有改資料需求 → 確定性套用所有操作
    const results: OpResult[] = [];
    for (const call of calls) {
      if (call.name === "apply_erp_changes") {
        const ops = ((call.args as { operations?: Op[] })?.operations) ?? [];
        const res = applyOps(workingData, ops);
        workingData = res.snapshot;
        if (res.changed) changed = true;
        results.push(...res.results);
      }
    }

    // 用套用結果自行組出確認訊息（不需再呼叫模型）
    const okMsgs = results.filter((r) => r.ok).map((r) => r.message);
    const errMsgs = results.filter((r) => !r.ok).map((r) => r.message);
    let reply = "";
    if (okMsgs.length) reply += "✅ " + okMsgs.join("；");
    if (errMsgs.length) reply += (reply ? "\n" : "") + "⚠️ " + errMsgs.join("；");
    if (changed) reply += "\n（記得按上方「儲存同步」才會寫入資料庫）";
    if (!reply) reply = "沒有可套用的變更。";

    return NextResponse.json({
      reply,
      updatedData: changed ? workingData : undefined,
      changed,
    });
  } catch (e) {
    const s = (e instanceof Error ? e.message : String(e)).toLowerCase();
    let reply: string;
    if (s.includes("quota") || s.includes("free_tier") || s.includes("resource_exhausted") || s.includes("exceeded your current quota")) {
      reply = "今天的 Gemini 免費額度用完了（免費層每個模型每日上限）。稍後再試，或把 API key 換成已開通付費/提高額度的專案就沒有這限制。";
    } else if (isTransient(e)) {
      reply = "Gemini 目前流量高峰，稍等幾秒再送一次通常就好了 🙏";
    } else {
      reply = `AI 服務發生錯誤：${e instanceof Error ? e.message : String(e)}`;
    }
    return NextResponse.json({ reply, changed: false }, { status: 200 });
  }
}
