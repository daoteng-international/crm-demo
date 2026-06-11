export type BomItem = { sku: string; name: string; qty: number; unit: string };
export type MfgStatus = "需求轉設計" | "對圖拆料" | "備料中" | "生產製作" | "待組裝" | "完工入庫" | "已出貨";
export type RentalStatus = "待確認" | "待出貨" | "已出貨" | "使用中" | "已歸還" | "逾期";
export type OfficeStatus = "洽談中" | "場勘完成" | "設計提案" | "設計確認" | "施工中" | "驗收中" | "已結案";
export type ExhibitionStatus = "洽談中" | "可行性評估" | "提案前準備" | "設計確認" | "備料中" | "進場中" | "展覽中" | "撤場中" | "已結案";

export const seedData = {
  // ── 1. 辦公室裝修 ───────────────────────────────────────────
  office: [
    {
      id: "OF001",
      customer: "新竹醫材形象館",
      contact: "陳先生",
      phone: "03-560-8899",
      site: "新竹市東區",
      area: 85,
      surveyDate: "2026-06-06",
      designer: "吳品蓁",
      supervisor: "張育誠",
      status: "場勘完成" as OfficeStatus,
      nextStep: "平面配置提案",
      amount: 1250000,
      paid: 300000,
      dueDate: "2026-08-15",
      notes: "醫材展示牆 + 接待區翻新，需符合醫療規範"
    },
    {
      id: "OF002",
      customer: "台北精品鐘錶",
      contact: "林小姐",
      phone: "02-2718-1688",
      site: "台北市信義區",
      area: 120,
      surveyDate: "2026-06-10",
      designer: "吳品蓁",
      supervisor: "張育誠",
      status: "設計提案" as OfficeStatus,
      nextStep: "丈量與動線確認",
      amount: 680000,
      paid: 0,
      dueDate: "2026-09-30",
      notes: "精品風格辦公室，珠寶展示中島整合"
    },
    {
      id: "OF003",
      customer: "遠寬電信股份有限公司",
      contact: "袁先生",
      phone: "07-335-2288",
      site: "高雄夢時代專櫃",
      area: 45,
      surveyDate: "2026-05-20",
      designer: "余宗翰",
      supervisor: "張育誠",
      status: "設計確認" as OfficeStatus,
      nextStep: "發包施工",
      amount: 420000,
      paid: 100000,
      dueDate: "2026-07-10",
      notes: "電信品牌形象專櫃設計承攬"
    },
    {
      id: "OF004",
      customer: "舊振南食品股份有限公司",
      contact: "劉副理",
      phone: "02-2311-8999",
      site: "台北101臨時櫃",
      area: 30,
      surveyDate: "2026-04-24",
      designer: "洪家豪",
      supervisor: "張育誠",
      status: "施工中" as OfficeStatus,
      nextStep: "木作完工驗收",
      amount: 250000,
      paid: 125000,
      dueDate: "2026-07-05",
      notes: "臨時展示櫃體設計製作，限期完工"
    },
    {
      id: "OF005",
      customer: "張公館",
      contact: "張先生",
      phone: "07-222-4567",
      site: "高雄哈爾濱街老屋翻新",
      area: 280,
      surveyDate: "2026-03-15",
      designer: "吳品蓁",
      supervisor: "林冠宇",
      status: "施工中" as OfficeStatus,
      nextStep: "水電配管驗收",
      amount: 9000000,
      paid: 3000000,
      dueDate: "2026-10-31",
      notes: "老屋全室翻新，含ESG綠建材規劃"
    }
  ],

  // ── 2. 展場特裝 ─────────────────────────────────────────────
  exhibitions: [
    {
      id: "EX001",
      customer: "台灣普德股份有限公司",
      contact: "普德採購",
      venue: "台北南港展覽館2館",
      exhibitionName: "2026臺灣國際飯店暨餐飲設備用品展",
      area: 36,
      entryDate: "2026-05-19",
      openDate: "2026-05-20",
      exitDate: "2026-05-22",
      designer: "陳志明",
      supervisor: "張育誠",
      status: "已結案" as ExhibitionStatus,
      amount: 320000,
      paid: 320000,
      dueDate: "2026-05-25",
      notes: "特裝36坪，含廚房設備展示台"
    },
    {
      id: "EX002",
      customer: "台灣三軸科技有限公司",
      contact: "三軸業務",
      venue: "臺中國際會展中心",
      exhibitionName: "2026年台中自動化工業展",
      area: 54,
      entryDate: "2026-05-19",
      openDate: "2026-05-20",
      exitDate: "2026-05-24",
      designer: "陳志明",
      supervisor: "張育誠",
      status: "已結案" as ExhibitionStatus,
      amount: 480000,
      paid: 480000,
      dueDate: "2026-05-28",
      notes: "工業風特裝，機械臂展示台"
    },
    {
      id: "EX003",
      customer: "寶嘉誠工業股份有限公司",
      contact: "洪副理",
      venue: "台中會展中心",
      exhibitionName: "台中自動化展",
      area: 48,
      entryDate: "2026-05-26",
      openDate: "2026-05-27",
      exitDate: "2026-05-30",
      designer: "洪家豪",
      supervisor: "張育誠",
      status: "進場中" as ExhibitionStatus,
      amount: 200000,
      paid: 100000,
      dueDate: "2026-06-05",
      notes: "簡約工業風，預算控制嚴格"
    },
    {
      id: "EX004",
      customer: "優志旺股份有限公司",
      contact: "陳經理",
      venue: "台北南港一館",
      exhibitionName: "國際食品展",
      area: 18,
      entryDate: "2026-06-24",
      openDate: "2026-06-25",
      exitDate: "2026-06-28",
      designer: "陳志明",
      supervisor: "林冠宇",
      status: "提案前準備" as ExhibitionStatus,
      amount: 150000,
      paid: 50000,
      dueDate: "2026-06-30",
      notes: "食品展示攤位，需符合食品衛生規範"
    },
    {
      id: "EX005",
      customer: "聲寶股份有限公司",
      contact: "梁新源",
      venue: "台中國際展覽館",
      exhibitionName: "電器空調影音大展",
      area: 72,
      entryDate: "2026-07-29",
      openDate: "2026-07-30",
      exitDate: "2026-08-03",
      designer: "吳品蓁",
      supervisor: "張育誠",
      status: "設計確認" as ExhibitionStatus,
      amount: 680000,
      paid: 200000,
      dueDate: "2026-08-10",
      notes: "A級客戶，聲寶旗艦特裝，72坪"
    },
    {
      id: "EX006",
      customer: "聲寶股份有限公司",
      contact: "梁新源",
      venue: "高雄展覽館",
      exhibitionName: "電器空調影音大展",
      area: 54,
      entryDate: "2026-07-29",
      openDate: "2026-07-30",
      exitDate: "2026-08-03",
      designer: "吳品蓁",
      supervisor: "林冠宇",
      status: "提案前準備" as ExhibitionStatus,
      amount: 510000,
      paid: 0,
      dueDate: "2026-08-10",
      notes: "南部場，與台中場同期進行"
    }
  ],

  // ── 3. 展覽櫃租賃 ───────────────────────────────────────────
  inventory: [
    { sku: "CAB-LK-120", name: "玻璃展示立櫃 120cm", category: "租賃櫃", qty: 12, rented: 5, unit: "座", location: "五股倉", dailyRate: 350 },
    { sku: "CAB-LK-090", name: "玻璃展示立櫃 90cm",  category: "租賃櫃", qty: 8,  rented: 3, unit: "座", location: "五股倉", dailyRate: 280 },
    { sku: "CAB-WD-090", name: "木質矮櫃 90cm",       category: "租賃櫃", qty: 18, rented: 9, unit: "座", location: "五股倉", dailyRate: 220 },
    { sku: "CAB-WD-060", name: "木質矮櫃 60cm",       category: "租賃櫃", qty: 10, rented: 2, unit: "座", location: "五股倉", dailyRate: 180 },
    { sku: "CAB-CTR-180", name: "中島展示台 180cm",   category: "租賃櫃", qty: 6,  rented: 2, unit: "座", location: "五股倉", dailyRate: 600 },
    { sku: "MAT-WOOD-OAK",  name: "橡木板材",          category: "製造料件", qty: 86, rented: 0, unit: "片", location: "板材區", dailyRate: 0 },
    { sku: "MAT-LED-STRIP",  name: "展示櫃 LED 燈條",  category: "製造料件", qty: 240, rented: 0, unit: "條", location: "電材區", dailyRate: 0 },
    { sku: "MAT-GLASS-8MM",  name: "8mm 強化玻璃",     category: "製造料件", qty: 64,  rented: 0, unit: "片", location: "玻璃區", dailyRate: 0 },
    { sku: "MAT-ALUM-PRO",   name: "鋁擠型骨架",       category: "製造料件", qty: 120, rented: 0, unit: "支", location: "金屬區", dailyRate: 0 }
  ],

  rentals: [
    {
      id: "R001", customer: "台中建材展主辦單位", contact: "王經理", phone: "04-2201-6677",
      items: [
        { sku: "CAB-LK-120", name: "玻璃展示立櫃 120cm", qty: 5 }
      ],
      shipDate: "2026-06-05", returnDate: "2026-06-18",
      status: "使用中" as RentalStatus,
      deposit: 52500, rentalFee: 24500, paid: 77000,
      notes: "台中國際展覽館場地"
    },
    {
      id: "R002", customer: "南港食品展", contact: "採購部", phone: "02-2652-3456",
      items: [
        { sku: "CAB-WD-090", name: "木質矮櫃 90cm", qty: 4 },
        { sku: "CAB-LK-090", name: "玻璃展示立櫃 90cm", qty: 2 }
      ],
      shipDate: "2026-06-14", returnDate: "2026-06-22",
      status: "待出貨" as RentalStatus,
      deposit: 30000, rentalFee: 13200, paid: 30000,
      notes: "需整批同時出貨"
    },
    {
      id: "R003", customer: "恆隆行貿易股份有限公司", contact: "曹毓秋 Cecily", phone: "02-7752-0088",
      items: [
        { sku: "CAB-CTR-180", name: "中島展示台 180cm", qty: 2 },
        { sku: "CAB-LK-120", name: "玻璃展示立櫃 120cm", qty: 8 }
      ],
      shipDate: "2026-07-01", returnDate: "2026-07-15",
      status: "待確認" as RentalStatus,
      deposit: 120000, rentalFee: 521063, paid: 0,
      notes: "父親節百貨專案，多點部署"
    },
    {
      id: "R004", customer: "飛利浦總公司", contact: "蘇經理", phone: "02-8737-8000",
      items: [
        { sku: "CAB-WD-060", name: "木質矮櫃 60cm", qty: 6 }
      ],
      shipDate: "2026-06-20", returnDate: "2026-07-05",
      status: "待確認" as RentalStatus,
      deposit: 21600, rentalFee: 15120, paid: 0,
      notes: "高雄樂購廣場促銷活動"
    },
    {
      id: "R005", customer: "金雕藝術有限公司", contact: "徐慧萍", phone: "02-2718-5566",
      items: [
        { sku: "CAB-LK-120", name: "玻璃展示立櫃 120cm", qty: 3 }
      ],
      shipDate: "2026-02-10", returnDate: "2026-05-31",
      status: "已歸還" as RentalStatus,
      deposit: 31500, rentalFee: 99225, paid: 130725,
      notes: "台北大巨蛋遠東Garden City 6F長租"
    }
  ],

  // ── 4. 系統家具統包（無限心悅品牌）──────────────────────────
  manufacturing: [
    {
      id: "M001",
      orderNo: "B260501",
      customer: "紅山-裝修設計課",
      contact: "內部",
      product: "台南南紡屋簷CNC",
      designer: "潘曉梅",
      status: "完工入庫" as MfgStatus,
      due: "2026-05-31",
      deliveredDate: "2026-05-28",
      amount: 2100,
      bom: [
        { sku: "MAT-ALUM-PRO", name: "鋁擠型骨架", qty: 4, unit: "支" }
      ] as BomItem[],
      notes: "屋簷CNC切割，炫耕協力廠"
    },
    {
      id: "M002",
      orderNo: "B260502",
      customer: "台北精品鐘錶",
      contact: "林小姐",
      product: "珠寶展示中島櫃",
      designer: "吳品蓁",
      status: "生產製作" as MfgStatus,
      due: "2026-06-24",
      deliveredDate: "",
      amount: 185000,
      bom: [
        { sku: "MAT-WOOD-OAK",  name: "橡木板材",   qty: 8, unit: "片" },
        { sku: "MAT-GLASS-8MM", name: "8mm 強化玻璃", qty: 6, unit: "片" },
        { sku: "MAT-LED-STRIP", name: "展示櫃 LED 燈條", qty: 10, unit: "條" }
      ] as BomItem[],
      notes: "珠寶展示專用，玻璃需無反光鍍膜"
    },
    {
      id: "M003",
      orderNo: "B260503",
      customer: "新竹醫材形象館",
      contact: "陳先生",
      product: "醫材展示背牆",
      designer: "吳品蓁",
      status: "待組裝" as MfgStatus,
      due: "2026-07-05",
      deliveredDate: "",
      amount: 320000,
      bom: [
        { sku: "MAT-WOOD-OAK",  name: "橡木板材",   qty: 16, unit: "片" },
        { sku: "MAT-LED-STRIP", name: "展示櫃 LED 燈條", qty: 18, unit: "條" },
        { sku: "MAT-ALUM-PRO",  name: "鋁擠型骨架", qty: 12, unit: "支" }
      ] as BomItem[],
      notes: "醫材展示牆，需防菌板材"
    },
    {
      id: "M004",
      orderNo: "B260504",
      customer: "黃瀧有限公司",
      contact: "黃經理",
      product: "桌板180x140-25T-K5007",
      designer: "許志豪",
      status: "對圖拆料" as MfgStatus,
      due: "2026-06-30",
      deliveredDate: "",
      amount: 7732,
      bom: [
        { sku: "MAT-WOOD-OAK", name: "橡木板材", qty: 2, unit: "片" }
      ] as BomItem[],
      notes: "客製桌板，圖面已確認"
    },
    {
      id: "M005",
      orderNo: "B260505",
      customer: "王國安",
      contact: "王先生",
      product: "高雄鼓山系統櫃",
      designer: "洪家豪",
      status: "備料中" as MfgStatus,
      due: "2026-07-15",
      deliveredDate: "",
      amount: 400000,
      bom: [
        { sku: "MAT-WOOD-OAK",  name: "橡木板材",   qty: 24, unit: "片" },
        { sku: "MAT-GLASS-8MM", name: "8mm 強化玻璃", qty: 10, unit: "片" },
        { sku: "MAT-LED-STRIP", name: "展示櫃 LED 燈條", qty: 20, unit: "條" }
      ] as BomItem[],
      notes: "直客，炫耕品牌，住宅系統櫃"
    },
    {
      id: "M006",
      orderNo: "B260506",
      customer: "紘毅室內裝修設計工程",
      contact: "顏麗娟",
      product: "高雄遠見云峰系統櫃",
      designer: "宋建志",
      status: "需求轉設計" as MfgStatus,
      due: "2026-08-01",
      deliveredDate: "",
      amount: 69000,
      bom: [] as BomItem[],
      notes: "設計師委託，尚待對圖"
    }
  ],

  // ── 財務 ────────────────────────────────────────────────────
  finance: [
    { id: "FIN001", type: "應收", productLine: "展場特裝", project: "聲寶台中旗艦特裝",    amount: 480000, due: "2026-08-10", status: "未收款" },
    { id: "FIN002", type: "應收", productLine: "辦公室裝修", project: "新竹醫材形象館",     amount: 950000, due: "2026-08-15", status: "部分收款" },
    { id: "FIN003", type: "應收", productLine: "租賃",    project: "恆隆行父親節專案",     amount: 521063, due: "2026-07-20", status: "未收款" },
    { id: "FIN004", type: "應收", productLine: "系統家具", project: "王國安鼓山系統櫃",    amount: 400000, due: "2026-07-31", status: "未收款" },
    { id: "FIN005", type: "應付", productLine: "展場特裝", project: "協力廠商木作費",       amount: 188000, due: "2026-06-20", status: "待付款" },
    { id: "FIN006", type: "應付", productLine: "系統家具", project: "炫耕CNC加工費",        amount: 45000,  due: "2026-06-25", status: "已付款" },
    { id: "FIN007", type: "收入", productLine: "租賃",    project: "金雕藝術長租結清",      amount: 130725, due: "2026-06-01", status: "已收款" },
    { id: "FIN008", type: "收入", productLine: "展場特裝", project: "台灣普德南港展結案",   amount: 320000, due: "2026-05-25", status: "已收款" }
  ],

  // ── 員工 ────────────────────────────────────────────────────
  employees: [
    { id: "E001", name: "吳品蓁", dept: "設計部", role: "資深設計師",   salary: 62000, status: "在職" },
    { id: "E002", name: "張育誠", dept: "工務部", role: "工務主任",     salary: 58000, status: "在職" },
    { id: "E003", name: "林冠宇", dept: "業務部", role: "業務顧問",     salary: 48000, status: "在職" },
    { id: "E004", name: "周明翰", dept: "製造部", role: "木作組長",     salary: 52000, status: "在職" },
    { id: "E005", name: "陳志明", dept: "業務部", role: "展場業務",     salary: 45000, status: "在職" },
    { id: "E006", name: "洪家豪", dept: "設計部", role: "系統家具設計師", salary: 50000, status: "在職" },
    { id: "E007", name: "潘曉梅", dept: "製造部", role: "拆料專員",     salary: 44000, status: "在職" },
    { id: "E008", name: "余宗翰", dept: "業務部", role: "裝修業務",     salary: 46000, status: "在職" }
  ],

  payroll: [
    { month: "2026-06", employee: "吳品蓁", base: 62000, overtime: 4200, bonus: 8000, deduction: 3100 },
    { month: "2026-06", employee: "張育誠", base: 58000, overtime: 6800, bonus: 3000, deduction: 2900 },
    { month: "2026-06", employee: "林冠宇", base: 48000, overtime: 1200, bonus: 15000, deduction: 2400 },
    { month: "2026-06", employee: "周明翰", base: 52000, overtime: 8400, bonus: 2000, deduction: 2600 },
    { month: "2026-06", employee: "陳志明", base: 45000, overtime: 2400, bonus: 12000, deduction: 2250 },
    { month: "2026-06", employee: "洪家豪", base: 50000, overtime: 3600, bonus: 4000, deduction: 2500 }
  ]
};

export type SeedData = typeof seedData;
