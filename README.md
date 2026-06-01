// =============================================================================
// 🌌 真·AI交易大師 V19.1.0 BALANCED（2026-06-01）
// 目標：穩定每日運行 | 優勢訊號精選 | 當沖HL真實勝負 | 自適應門檻 | 回撤保護
// V19.1 修正：訊號過濾太嚴→放寬多層乘數 | 非線性偏差校正 | 自適應上限降低
// ─────────────────────────────────────────────────────────────────────────────
// 主要調整（相對 V19.0）：
//  1. CONFIG.AI：CONF_MIN 58→55、COMPRESS_MIN 62→57、TARGET_WR 65→60
//  2. BADGE 門檻全面下調：S=80、A=68、B=52
//  3. DRAWDOWN 觸發條件放寬：連敗5→7、MDD 8%→12%
//  4. applyNonLinearScoring z 起點：-2.15 → -1.55（恢復正常信心基線）
//  5. getRegime 預設 RANGE confMult：0.90 → 0.96
//  6. aiVote TOPPING/MAIN_DOWN 乘數：0.74 → 0.82
//  7. getMarketMode CHOP tradeMult：0.93 → 0.96
//  8. runAdaptiveThresholdTuning 自動調參上限：72 → 64（防止飄太高）
//  9. 新增「重置自適應參數」函數，一鍵恢復預設值
// =============================================================================

const SYSTEM_VERSION = "V19.1.0 BALANCED";
const TV_PINE_VERSION = "V145.3";

const CONFIG = {
    SS_ID:         "1bVwYBFm7Rn87IPsBAFBYjhlF7q5Do9kWmRICEP8NOdk",
    WEBHOOK_DAY:   "https://discord.com/api/webhooks/1509253673895727338/_hRDuoMQfr2Zu8mGYMrT9EgcOMKrQrGJxQIvQ_vxR5SCgFgN3nQTI9tJLe4AitIoXupE",
    WEBHOOK_SWING: "https://discord.com/api/webhooks/1509253801566015488/GHxoXf60Tvj00w9L3ni2TIA4eQNhu3q1RS3OFRVKX5bIXZw7f4Bfhkwx4uGe8hJTqUxz",
    TG_TOKEN:      "8789766364:AAGXvSKK0QOeh869mBmQzvnauadAYyRekYw",
    TG_CHAT_ID:    "6012796466",
    SHEETS: {
        LOG:         "AI_LOG",
        WEIGHTS_DAY: "AI_WEIGHTS_DAY",
        WEIGHTS_SW:  "AI_WEIGHTS_SWING",
        LEARNING:    "AI_LEARNING",
        STOCK_MEM:   "AI_STOCK_MEM",
        PATTERN_MEM: "AI_PATTERN_MEM",
        REGIME_MEM:  "AI_REGIME_MEM",
        CALIBRATION: "AI_CALIBRATION",
        BLACKLIST:   "AI_BLACKLIST",
        TOP_STOCK:   "AI_TOP_STOCK",
        BACKTEST:    "AI_BACKTEST",
        SWING_WATCH: "AI_SWING_WATCH",
        TIME_MEM:    "AI_TIME_MEM",
        STOCK_NAMES: "AI_STOCK_NAMES",
        INTERACT_MEM:"AI_INTERACT_MEM",
        SYSTEM:      "AI_SYSTEM",
        AUTO_TRADES: "AI_AUTO_TRADES",
        STOCK_POOL:  "STOCK_POOL",
        SIGNAL_POOL: "AI_SIGNAL_POOL",
        WEIGHT_HISTORY: "AI_WEIGHTS_HISTORY",
        STRATEGY_PERF:  "AI_STRATEGY_PERF",
        PATTERN_FREEZE: "AI_PATTERN_FREEZE",
        REGIME_CTRL:    "AI_REGIME_CTRL",
        DASHBOARD:      "AI_DASHBOARD",
        SIGNAL_DEDUP:   "AI_SIGNAL_DEDUP"
    },
    AI: {
        // 學習率
        LR_FAST:      0.022,
        LR_SLOW:      0.008,
        // 權重邊界
        W_MIN:        0.35,
        W_MAX:        2.80,
        W_CENTER:     1.00,
        REGRESS:      0.004,
        // 探索
        EXPLORE_P:    0.08,
        EXPLORE_A:    0.010,
        // 樣本門檻
        MIN_SAMPLE:   8,
        // ── V19.1 推送門檻（放寬）──
        CONF_MIN:     55,       // 原 58 → 55
        // 黑名單
        BL_LOSS_N:    5,
        BL_WR_MIN:    30,
        // Bayesian先驗
        BAYES_W:      1,
        BAYES_T:      2,
        // Top榜
        TOP_MIN_CONF: 68,       // 原 70 → 68
        // 訊號衰退
        DECAY_HALF:   3,
        // 樣本過少不影響權重
        MIN_IMPACT:   5,
        // ── V19.1 學習凍結條件放寬（防過早凍結）──
        FREEZE_WR:    38,       // 原 42 → 38
        UNFREEZE_WR:  46,       // 原 52 → 46
        // 權重週期正規化
        REGRESS_HARD: 0.012,
        // 自動回填
        AUTO_FILL_AFTER_HOUR: 14,
        SWING_MAX_HOLD_DAYS:  8,
        // ── V19.1 推送門檻（放寬）──
        SWING_CONF_MIN:       52,   // 原 55 → 52
        MARKET_CACHE_MS:      8 * 60 * 1000,
        // 自進化
        DRIFT_LIMIT:          0.45,
        MEMORY_DECAY:         0.992,
        MEMORY_MAX_DAYS:      30,
        PATTERN_MERGE_AT:     500,
        WIN_ATR_DAY:          1.2,
        LOSS_ATR_DAY:         0.8,
        WIN_ATR_SWING:        2.0,
        LOSS_ATR_SWING:       1.0,
        LOSS_PENALTY:         1.8,
        FAKE_BREAK_PENALTY:   2.0,
        MIN_VOL_RATIO:        0.8,
        MIN_ATR_PCT:          0.003,
        MIN_DATA_QUALITY:     50,   // 原 55 → 50（品質門檻輕鬆一點）
        REGIME_DROP_PCT:      10,
        PERF_GATE_MIN:        -2.0,
        PRUNE_WR_MAX:         38,   // 原 40 → 38（更嚴才修剪）
        PRUNE_MIN_N:          30,
        // ── V19.1 訊號壓縮 / UI（全面放寬）──
        COMPRESS_MIN:         57,   // 原 62 → 57
        BADGE_S_CONF:         80,   // 原 85 → 80
        BADGE_A_CONF:         68,   // 原 72 → 68
        BADGE_B_CONF:         52,   // 原 58 → 52
        DEDUP_MINUTES:        35,
        // ── V19.1 回撤保護（觸發條件放寬）──
        DRAWDOWN_LOSS_STREAK: 7,    // 原 5 → 7
        DRAWDOWN_MDD_PCT:     12,   // 原 8% → 12%
        // ── V19.1 目標勝率（降低，防止自適應把門檻調太高）──
        TARGET_WR:            60    // 原 65 → 60
    }
};

// ============================================================================
// 🛠️ 全域工具（防爆防呆）
// ============================================================================

function N(v, d) { d = (d === undefined ? 0 : d); return (v !== undefined && v !== null && isFinite(+v)) ? +v : d; }
function S(v, d) { d = (d === undefined ? "" : d); return (v !== undefined && v !== null) ? String(v) : d; }
function _json(s, f) { try { return JSON.parse(s); } catch(e) { return f; } }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function taipeiHour(d) {
    return parseInt(Utilities.formatDate(d || new Date(), "Asia/Taipei", "H"), 10);
}

function taipeiDateStr(d) {
    return Utilities.formatDate(d || new Date(), "Asia/Taipei", "yyyy-MM-dd");
}

function taipeiMinuteOfDay(d) {
    d = d || new Date();
    const h = parseInt(Utilities.formatDate(d, "Asia/Taipei", "H"), 10);
    const m = parseInt(Utilities.formatDate(d, "Asia/Taipei", "m"), 10);
    return h * 60 + m;
}

// ============================================================================
// 🔐 V19 運行時：密鑰 / 自適應參數 / 股池快取 / Gate / 去重 / 回撤
// ============================================================================

function getSecret(key, fallback) {
    try {
        const v = PropertiesService.getScriptProperties().getProperty(key);
        if (v) return v;
    } catch (e) {}
    return fallback;
}

function getSystemVal(key) {
    try {
        const data = getSheetData(CONFIG.SHEETS.SYSTEM);
        for (let i = 1; i < data.length; i++) {
            if (S(data[i][0]) === key) return S(data[i][1]);
        }
    } catch (e) {}
    return null;
}

function getAI(key) {
    const adaptKey = "ADAPT_" + key;
    const v = getSystemVal(adaptKey);
    if (v !== null && v !== "" && isFinite(+v)) return +v;
    return CONFIG.AI[key];
}

let _poolNameCache = null;
function warmPoolNameCache() {
    _poolNameCache = {};
    try {
        const data = getSheetData(CONFIG.SHEETS.STOCK_POOL);
        for (let i = 1; i < data.length; i++) {
            const t = normalizeTicker(S(data[i][0]));
            const n = S(data[i][1]).trim();
            if (t && n) _poolNameCache[t] = n;
        }
    } catch (e) {}
    return Object.keys(_poolNameCache).length;
}

function getPoolNameFast(ticker) {
    if (!_poolNameCache) warmPoolNameCache();
    const n = _poolNameCache[normalizeTicker(ticker)];
    return n && isValidStockName(n, ticker) ? n : null;
}

function isTradingSessionAllowed(isSwing) {
    if (isSwing) return true;
    const mod = taipeiMinuteOfDay();
    return mod >= 545 && mod <= 800;
}

function shouldAllowPushDedup(ticker, mode, score) {
    const mins = getAI("DEDUP_MINUTES") || 35;
    const key = mode + "|" + normalizeTicker(ticker);
    try {
        const data = getSheetData(CONFIG.SHEETS.SIGNAL_DEDUP);
        const now = Date.now();
        for (let i = 1; i < data.length; i++) {
            if (S(data[i][0]) !== key) continue;
            const lastT = new Date(data[i][2]).getTime();
            const lastS = N(data[i][1], 0);
            if (now - lastT < mins * 60000 && score <= lastS + 2) return false;
            const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.SIGNAL_DEDUP);
            setSheetRow(sheet, i + 1, 1, [key, score, new Date()]);
            invalidateSheet(CONFIG.SHEETS.SIGNAL_DEDUP);
            return true;
        }
        SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.SIGNAL_DEDUP)
            .appendRow([key, score, new Date()]);
        invalidateSheet(CONFIG.SHEETS.SIGNAL_DEDUP);
    } catch (e) { return true; }
    return true;
}

function isDrawdownProtectMode() {
    return getSystemVal("DRAWDOWN_PROTECT") === "1";
}

function updateDrawdownState() {
    try {
        const data = getSheetData(CONFIG.SHEETS.LEARNING);
        let streak = 0, equity = 100, peak = 100, mdd = 0;
        for (let i = data.length - 1; i >= 1 && i > data.length - 80; i--) {
            if (S(data[i][8]) !== "已學習") continue;
            const wl = resolveLearningWinLoss(data[i]);
            const loss = wl.isLoss;
            const pct = N(data[i][7]);
            if (streak === 0) streak = loss ? -1 : 1;
            else if (loss && streak < 0) streak--;
            else if (!loss && streak > 0) streak++;
            else break;
            equity += pct;
            if (equity > peak) peak = equity;
            const dd = peak > 0 ? (peak - equity) / peak * 100 : 0;
            if (dd > mdd) mdd = dd;
        }
        const on = Math.abs(streak) >= getAI("DRAWDOWN_LOSS_STREAK") || mdd >= getAI("DRAWDOWN_MDD_PCT");
        writeSystemKey("DRAWDOWN_PROTECT", on ? "1" : "0", `連敗${streak} MDD${mdd.toFixed(1)}%`);
        return on;
    } catch (e) { return false; }
}

function routeStrategyModel(isSwing, mm, compress) {
    if (mm.mode === "CRASH") return { model: "WAIT", zh: "觀望" };
    if (isSwing && compress.finalScore >= getAI("COMPRESS_MIN") - 2) return { model: "SWING", zh: "波段" };
    if (!isSwing && compress.finalScore >= getAI("COMPRESS_MIN")) return { model: "DAY", zh: "當沖" };
    if (compress.finalScore >= getAI("BADGE_B_CONF")) return { model: "WATCH", zh: "觀察" };
    return { model: "WAIT", zh: "觀望" };
}

function fetchDayOhlc(ticker, dateYmd) {
    const symbols = [`${ticker}.TW`, `${ticker}.TWO`];
    for (let s = 0; s < symbols.length; s++) {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbols[s])}?interval=1d&range=3mo`;
        const j = httpGetJson(url, 15000);
        const res = j && j.chart && j.chart.result && j.chart.result[0];
        if (!res) continue;
        const ts = res.timestamp || [];
        const q = res.indicators && res.indicators.quote && res.indicators.quote[0];
        if (!q) continue;
        for (let i = ts.length - 1; i >= 0; i--) {
            const d = taipeiDateStr(new Date(ts[i] * 1000));
            if (d !== dateYmd) continue;
            const hi = N(q.high && q.high[i]);
            const lo = N(q.low && q.low[i]);
            const cl = N(q.close && q.close[i]);
            if (cl > 0) return { high: hi || cl, low: lo || cl, close: cl, source: "YahooOhlc" };
        }
    }
    const px = fetchExitPriceMultiApi(ticker, dateYmd);
    if (px && px.price > 0) return { high: px.price, low: px.price, close: px.price, source: px.source || "fallback" };
    return null;
}

function resolveIntradayOutcome(entry, sl, tp, ohlc) {
    entry = N(entry); sl = N(sl); tp = N(tp);
    if (!ohlc || entry <= 0) return null;
    const hi = N(ohlc.high), lo = N(ohlc.low), cl = N(ohlc.close);
    const hitSl = sl > 0 && lo <= sl;
    const hitTp = tp > 0 && hi >= tp;
    if (hitSl && !hitTp) {
        return { pct: +((sl - entry) / entry * 100).toFixed(2), exit: sl, method: "觸停損", isWin: false, isLoss: true };
    }
    if (hitTp && !hitSl) {
        return { pct: +((tp - entry) / entry * 100).toFixed(2), exit: tp, method: "觸停利", isWin: true, isLoss: false };
    }
    if (hitSl && hitTp) {
        const distSl = Math.abs(entry - sl), distTp = Math.abs(tp - entry);
        if (distSl <= distTp) {
            return { pct: +((sl - entry) / entry * 100).toFixed(2), exit: sl, method: "觸停損(同K)", isWin: false, isLoss: true };
        }
        return { pct: +((tp - entry) / entry * 100).toFixed(2), exit: tp, method: "觸停利(同K)", isWin: true, isLoss: false };
    }
    const pct = +((cl - entry) / entry * 100).toFixed(2);
    return { pct, exit: cl, method: "收盤", isWin: pct >= 1.2, isLoss: pct <= -0.8, isFlat: true };
}

// ============================================================================
// 🛠️ 自適應調參（V19.1：縮小自動上調幅度，防止門檻飄太高）
// ============================================================================

function runAdaptiveThresholdTuning() {
    const wrDay = getRecentWR(false, 30);
    const wrSw = getRecentWR(true, 30);
    let compress = getAI("COMPRESS_MIN");
    let confDay = getAI("CONF_MIN");
    const target = getAI("TARGET_WR") || 60;
    // V19.1：每次只調1，上限降到64（原72），下限到54（原58）
    if (wrDay < target - 5) { compress = Math.min(64, compress + 1); confDay = Math.min(60, confDay + 1); }
    else if (wrDay > target + 3) { compress = Math.max(54, compress - 1); confDay = Math.max(50, confDay - 1); }
    writeSystemKey("ADAPT_COMPRESS_MIN", String(compress), `30d當沖WR${wrDay}%`);
    writeSystemKey("ADAPT_CONF_MIN", String(confDay), "自適應");
    writeSystemKey("ADAPT_SWING_CONF_MIN", String(wrSw < target - 5 ? getAI("SWING_CONF_MIN") + 1 : getAI("SWING_CONF_MIN")), `30d波段WR${wrSw}%`);
    updateDashboard(wrDay, wrSw);
    Logger.log(`📐 自適應調參 壓縮${compress} 當沖門檻${confDay} WR${wrDay}/${wrSw}`);
}

function updateDashboard(wrDay, wrSw) {
    try {
        const sh = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.DASHBOARD);
        const today = taipeiDateStr(new Date());
        sh.appendRow([today, wrDay, wrSw, getAI("COMPRESS_MIN"), getAI("CONF_MIN"),
            isDrawdownProtectMode() ? "是" : "否", isLearningFrozen() ? "是" : "否", new Date()]);
        invalidateSheet(CONFIG.SHEETS.DASHBOARD);
    } catch (e) {}
}

function 每日健康監控() {
    warmPoolNameCache();
    updateDrawdownState();
    const h = 系統健康檢查(true);
    if (h.issues.length) push("當沖", "⚠️ V19.1健康告警\n" + h.issues.join("\n"));
}

function 每日晨報() {
    const m = getMarket(true);
    const mm = getMarketMode(m);
    const wrD = getRecentWR(false, 7);
    const wrS = getRecentWR(true, 7);
    const msg = `\n☀️ ${SYSTEM_VERSION} 每日晨報 ${taipeiDateStr(new Date())}\n` +
        `大盤：${m.status} ｜ 模式：${mm.zh} ｜ VIX ${N(m.vix).toFixed(1)}\n` +
        `7日勝率 當沖${wrD}% 波段${wrS}% ｜ 目標${getAI("TARGET_WR")}%\n` +
        `壓縮門檻${getAI("COMPRESS_MIN")} ｜ 回撤保護${isDrawdownProtectMode() ? "ON" : "OFF"}\n` +
        `今日策略：${mm.mode === "CRASH" ? "暫停" : mm.mode === "TREND" ? "順勢優先" : "精選A/B"}`;
    push("當沖", msg);
}

let _sheetCache = {};
function clearSheetCache() { _sheetCache = {}; }
function getSheetData(sheetName) {
    if (!_sheetCache[sheetName]) {
        try {
            const sh = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(sheetName);
            _sheetCache[sheetName] = sh ? sh.getDataRange().getValues() : [];
        } catch (e) {
            _sheetCache[sheetName] = [];
        }
    }
    return _sheetCache[sheetName];
}
function invalidateSheet(sheetName) { delete _sheetCache[sheetName]; }

// ============================================================================
// 🧬 V17 自進化核心
// ============================================================================

function daysSince(d) {
    if (!d) return 999;
    return (Date.now() - new Date(d).getTime()) / 86400000;
}

/**
 * 市場模式：趨勢 / 盤整 / 高波 / 崩盤
 * V19.1：tradeMult 全面上調，減少無謂壓制
 */
function getMarketMode(market) {
    market = market || market_cache || {};
    const vix = N(market.vix, 20);
    const mom = N(market.momentum, 0);
    const gap = N(market.gap, 0);
    if (vix >= 38 || (mom < -2.5 && vix > 32)) {
        return { mode: "CRASH", zh: "崩盤暫停", tradeMult: 0, learnTrend: false, learnMean: false };
    }
    if (vix >= 28 || gap > 1.2) {
        // V19.1: 0.76 → 0.82
        return { mode: "HIGH_VOL", zh: "高波動降倉", tradeMult: 0.82, learnTrend: false, learnMean: false };
    }
    if (Math.abs(mom) < 0.45 && vix < 22) {
        // V19.1: 0.93 → 0.96
        return { mode: "CHOP", zh: "盤整均值", tradeMult: 0.96, learnTrend: false, learnMean: true };
    }
    if (Math.abs(mom) >= 0.8) {
        return { mode: "TREND", zh: "趨勢順勢", tradeMult: 1.07, learnTrend: true, learnMean: false };
    }
    return { mode: "NEUTRAL", zh: "中性", tradeMult: 1.0, learnTrend: true, learnMean: true };
}

function isRegimeEnabled(regimeType) {
    try {
        const data = getSheetData(CONFIG.SHEETS.REGIME_CTRL);
        for (let i = 1; i < data.length; i++) {
            if (S(data[i][0]) === regimeType) return S(data[i][1]) !== "0";
        }
    } catch (e) {}
    return true;
}

function setRegimeEnabled(regimeType, on, reason) {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.REGIME_CTRL);
        const data = sheet.getDataRange().getValues();
        const v = on ? "1" : "0";
        for (let i = 1; i < data.length; i++) {
            if (S(data[i][0]) === regimeType) {
                setSheetRow(sheet, i + 1, 1, [regimeType, v, reason || "", new Date()]);
                invalidateSheet(CONFIG.SHEETS.REGIME_CTRL);
                return;
            }
        }
        sheet.appendRow([regimeType, v, reason || "", new Date()]);
        invalidateSheet(CONFIG.SHEETS.REGIME_CTRL);
    } catch (e) {}
}

/**
 * applyRegimeStrategySwitch
 * V19.1：CHOP+bo 壓制 0.90→0.95，HIGH_VOL 壓制 0.85→0.90
 */
function applyRegimeStrategySwitch(vote, tv, market, regime) {
    const mm = getMarketMode(market);
    vote.marketMode = mm.mode;
    vote.marketModeZh = mm.zh;
    let conf = N(vote.conf) * mm.tradeMult;

    if (!isRegimeEnabled(regime.type)) conf *= 0.72;

    if (mm.mode === "TREND" && tv.bo) conf *= 1.06;
    if (mm.mode === "CHOP" && tv.pb) conf *= 1.05;
    if (mm.mode === "CHOP" && tv.bo) conf *= 0.95;   // V19.1: 0.90 → 0.95
    if (mm.mode === "HIGH_VOL") conf *= 0.90;         // V19.1: 0.85 → 0.90
    if (mm.mode === "CRASH") conf = Math.min(conf, 32);

    vote.conf = +clamp(conf, 0, 100).toFixed(2);
    return vote;
}

function calcDataQualityScore(tv) {
    tv = tv || {};
    const volR = N(tv.vol_ratio, 1);
    const price = N(tv.price);
    let atr = N(tv.atr);
    if (atr <= 0 && price > 0) atr = price * Math.max(N(tv.range_r, 0.01), 0.008);
    const atrPct = price > 0 ? atr / price : 0;
    let score = 100;
    if (volR < CONFIG.AI.MIN_VOL_RATIO) score -= 35;
    if (atrPct < CONFIG.AI.MIN_ATR_PCT) score -= 25;
    if (N(tv.fake_break)) score -= 40;
    if (volR > 3.5) score -= 12;
    return clamp(score, 0, 100);
}

function judgeTradeOutcome(pct, entry, atr, price, isSwing) {
    entry = N(entry);
    price = N(price, entry);
    atr = N(atr);
    if (entry <= 0) return { isWin: false, isLoss: false, isFlat: true, method: "invalid" };

    const atrPct = atr > 0 ? (atr / Math.max(entry, price)) * 100 : null;
    const winThr = atrPct ? atrPct * (isSwing ? CONFIG.AI.WIN_ATR_SWING : CONFIG.AI.WIN_ATR_DAY)
                          : (isSwing ? 3.0 : 1.2);
    const lossThr = atrPct ? -(atrPct * (isSwing ? CONFIG.AI.LOSS_ATR_SWING : CONFIG.AI.LOSS_ATR_DAY))
                           : (isSwing ? -2.0 : -0.8);

    const isWin = pct >= winThr;
    const isLoss = pct <= lossThr;
    return { isWin, isLoss, isFlat: !isWin && !isLoss, winThr, lossThr, method: atrPct ? "ATR" : "fallback" };
}

function resolveLearningWinLoss(row) {
    const res = S(row[21]);
    if (res === "勝") return { isWin: true, isLoss: false, isFlat: false };
    if (res === "敗") return { isWin: false, isLoss: true, isFlat: false };
    if (res === "平") return { isWin: false, isLoss: false, isFlat: true };
    const pct = N(row[7]);
    const entry = N(row[3]) || N(row[2]);
    const isSwing = S(row[13]) === "波段";
    return judgeTradeOutcome(pct, entry, N(row[12]), entry, isSwing);
}

function shouldAllowLearning(event, market, mm, isSwing, tvSnap) {
    if (isLearningFrozen()) return false;
    mm = mm || getMarketMode(market);
    if (mm.mode === "CRASH") return false;
    const sig = S(event);
    const isBo = sig.indexOf("突破") >= 0 || (tvSnap && N(tvSnap.bo));
    const isPb = sig.indexOf("回踩") >= 0 || (tvSnap && N(tvSnap.pb));
    if (mm.mode === "CHOP" && isBo && !mm.learnTrend) return false;
    if (mm.mode === "TREND" && isPb && !mm.learnMean) return false;
    return true;
}

function calcLearningReward(pct, isWin, isLoss, fakeBreak) {
    let reward = clamp(pct / 5, -1, 1);
    if (isLoss) reward *= CONFIG.AI.LOSS_PENALTY;
    if (fakeBreak && isLoss) reward *= -CONFIG.AI.FAKE_BREAK_PENALTY;
    return clamp(reward, -2, 2);
}

function isPatternFrozen(patternKey, regimeType) {
    try {
        const key = `${regimeType}|${patternKey}`;
        const data = getSheetData(CONFIG.SHEETS.PATTERN_FREEZE);
        for (let i = 1; i < data.length; i++) {
            if (S(data[i][0]) === key && S(data[i][2]) === "1") {
                return { frozen: true, reason: S(data[i][3]) };
            }
        }
    } catch (e) {}
    return { frozen: false, reason: "" };
}

function freezePattern(patternKey, regimeType, reason) {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.PATTERN_FREEZE);
        const key = `${regimeType}|${patternKey}`;
        const data = getSheetData(CONFIG.SHEETS.PATTERN_FREEZE);
        for (let i = 1; i < data.length; i++) {
            if (S(data[i][0]) === key) {
                setSheetRow(sheet, i + 1, 1, [key, patternKey, "1", reason, new Date()]);
                invalidateSheet(CONFIG.SHEETS.PATTERN_FREEZE);
                return;
            }
        }
        sheet.appendRow([key, patternKey, "1", reason, new Date()]);
        invalidateSheet(CONFIG.SHEETS.PATTERN_FREEZE);
    } catch (e) {}
}

function getRecentWR(isSwing, days) {
    days = days || 30;
    try {
        const data = getSheetData(CONFIG.SHEETS.LEARNING);
        const cutoff = Date.now() - days * 86400000;
        let w = 0, t = 0;
        for (let i = data.length - 1; i >= 1; i--) {
            if (S(data[i][8]) !== "已學習") continue;
            if (new Date(data[i][0]).getTime() < cutoff) break;
            if ((S(data[i][13]) === "波段") !== isSwing) continue;
            t++;
            const wl = resolveLearningWinLoss(data[i]);
            if (wl.isWin) w++;
        }
        return t >= 5 ? +(w / t * 100).toFixed(1) : 50;
    } catch (e) { return 50; }
}

function saveWeightVersion(isSwing, reason) {
    try {
        const w = getWeights(isSwing);
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.WEIGHT_HISTORY);
        const data = sheet.getDataRange().getValues();
        const ver = Math.max(1, data.length);
        sheet.appendRow([ver, isSwing ? "波段" : "當沖", JSON.stringify(w), reason || "", new Date(), getRecentWR(isSwing, 30)]);
        invalidateSheet(CONFIG.SHEETS.WEIGHT_HISTORY);
        writeSystemKey("WEIGHT_VER_" + (isSwing ? "SW" : "DAY"), String(ver), reason);
        return ver;
    } catch (e) { return 0; }
}

function rollbackWeights(version, isSwing) {
    try {
        const data = getSheetData(CONFIG.SHEETS.WEIGHT_HISTORY);
        const mode = isSwing ? "波段" : "當沖";
        for (let i = data.length - 1; i >= 1; i--) {
            if (+data[i][0] === +version && S(data[i][1]) === mode) {
                const w = _json(data[i][2], null);
                if (w) {
                    saveWeights(isSwing, w, true);
                    Logger.log("♻️ 權重回滾 v" + version + " " + mode);
                    return true;
                }
            }
        }
    } catch (e) {}
    return false;
}

function performanceGate(isSwing, oldWR) {
    const newWR = getRecentWR(isSwing, 15);
    return (newWR - oldWR) >= CONFIG.AI.PERF_GATE_MIN;
}

function updateStrategyPerf(strategy, regimeType, isSwing, isWin) {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.STRATEGY_PERF);
        const key = `${isSwing ? "波段" : "當沖"}|${strategy}|${regimeType}`;
        const data = getSheetData(CONFIG.SHEETS.STRATEGY_PERF);
        for (let i = 1; i < data.length; i++) {
            if (S(data[i][0]) === key) {
                const n = N(data[i][3]) + 1;
                const wins = N(data[i][4]) + (isWin ? 1 : 0);
                setSheetRow(sheet, i + 1, 1, [key, strategy, regimeType, n, wins, +bayes(wins, n).toFixed(1), isSwing ? "波段" : "當沖", new Date()]);
                invalidateSheet(CONFIG.SHEETS.STRATEGY_PERF);
                return;
            }
        }
        sheet.appendRow([key, strategy, regimeType, 1, isWin ? 1 : 0, +bayes(isWin ? 1 : 0, 1).toFixed(1), isSwing ? "波段" : "當沖", new Date()]);
        invalidateSheet(CONFIG.SHEETS.STRATEGY_PERF);
    } catch (e) {}
}

function decayStockMemory() {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.STOCK_MEM);
        const data = sheet.getDataRange().getValues();
        const f = CONFIG.AI.MEMORY_DECAY;
        let n = 0;
        for (let i = 1; i < data.length; i++) {
            if (N(data[i][1], 0) < 3) continue;
            const wr = N(data[i][2], 50);
            const nw = 50 + (wr - 50) * f;
            if (Math.abs(nw - wr) > 0.01) {
                sheet.getRange(i + 1, 3).setValue(+nw.toFixed(2));
                n++;
            }
        }
        if (n) invalidateSheet(CONFIG.SHEETS.STOCK_MEM);
        return n;
    } catch (e) { return 0; }
}

function decayPatternMemoryScores() {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.PATTERN_MEM);
        const data = sheet.getDataRange().getValues();
        const f = CONFIG.AI.MEMORY_DECAY;
        let n = 0;
        for (let i = 1; i < data.length; i++) {
            const samples = N(data[i][2], 0);
            const wins = N(data[i][3], 0);
            if (samples < 5) continue;
            const upd = data[i][5] ? new Date(data[i][5]) : null;
            if (daysSince(upd) < 7) continue;
            const nw = Math.max(0, wins * f);
            const ns = Math.max(1, samples * f);
            const wr = bayes(nw, ns);
            setSheetRow(sheet, i + 1, 3, [+ns.toFixed(2), +nw.toFixed(2), +wr.toFixed(1)]);
            n++;
        }
        if (n) invalidateSheet(CONFIG.SHEETS.PATTERN_MEM);
        return n;
    } catch (e) { return 0; }
}

function runSelfCorrection() {
    let actions = 0;
    try {
        const baseline = 50;
        const drop = CONFIG.AI.REGIME_DROP_PCT;

        const patData = getSheetData(CONFIG.SHEETS.PATTERN_MEM);
        for (let i = 1; i < patData.length; i++) {
            const n = N(patData[i][2], 0);
            const wr = N(patData[i][4], 50);
            if (n < CONFIG.AI.MIN_SAMPLE) continue;
            if (wr < baseline - drop) {
                freezePattern(S(patData[i][1]), "ALL", `勝率${wr.toFixed(0)}%低於基準${drop}%`);
                actions++;
            }
        }

        const regData = getSheetData(CONFIG.SHEETS.REGIME_MEM);
        for (let i = 1; i < regData.length; i++) {
            const n = N(regData[i][2], 0);
            const wr = bayes(N(regData[i][3]), n);
            if (n >= CONFIG.AI.MIN_SAMPLE && wr < baseline - drop) {
                setRegimeEnabled(S(regData[i][0]), false, `盤型勝率${wr.toFixed(0)}%`);
                actions++;
            } else if (n >= CONFIG.AI.MIN_SAMPLE && wr >= baseline + 5) {
                setRegimeEnabled(S(regData[i][0]), true, "績效恢復");
            }
        }

        [["當沖", false], ["波段", true]].forEach(pair => {
            const isSwing = pair[1];
            const stratWR = getRecentWR(isSwing, 30);
            if (stratWR < CONFIG.AI.FREEZE_WR) {
                saveWeightVersion(isSwing, "自修正還原前");
                revertWeightsBaseline();
                actions++;
            }
        });
    } catch (e) { Logger.log("runSelfCorrection: " + e.message); }
    return actions;
}

function walkForwardValidateAll() {
    let rejected = 0;
    [false, true].forEach(isSwing => {
        const trainWR = getRecentWR(isSwing, 60);
        const testWR = getRecentWR(isSwing, 15);
        if (testWR < trainWR + CONFIG.AI.PERF_GATE_MIN) {
            Logger.log(`⚠️ Walk-Forward ${isSwing ? "波段" : "當沖"} test${testWR}% < train${trainWR}%`);
            if (testWR < CONFIG.AI.FREEZE_WR) {
                rollbackWeights(getLastWeightVersion(isSwing) - 1, isSwing);
                rejected++;
            }
        }
    });
    return rejected;
}

function getLastWeightVersion(isSwing) {
    try {
        const data = getSheetData(CONFIG.SHEETS.WEIGHT_HISTORY);
        const mode = isSwing ? "波段" : "當沖";
        for (let i = data.length - 1; i >= 1; i--) {
            if (S(data[i][1]) === mode) return +data[i][0];
        }
    } catch (e) {}
    return 1;
}

function prunePatternMemory() {
    try {
        const data = getSheetData(CONFIG.SHEETS.PATTERN_MEM);
        if (data.length <= CONFIG.AI.PATTERN_MERGE_AT + 1) return 0;
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.PATTERN_MEM);
        const keep = new Map();
        for (let i = 1; i < data.length; i++) {
            const k = S(data[i][0]) + "|" + S(data[i][1]);
            const n = N(data[i][2], 0);
            if (!keep.has(k) || n > keep.get(k).n) keep.set(k, { row: i + 1, n: n, data: data[i] });
        }
        sheet.clearContents();
        sheet.appendRow(["代號", "型態Key", "樣本數", "勝數", "Bayes勝率%", "更新時間"]);
        const rows = Array.from(keep.values()).map(v => v.data);
        if (rows.length) sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
        invalidateSheet(CONFIG.SHEETS.PATTERN_MEM);
        return data.length - rows.length - 1;
    } catch (e) { return 0; }
}

function selfPruneTickers() {
    let n = 0;
    try {
        const data = getSheetData(CONFIG.SHEETS.STOCK_MEM);
        for (let i = 1; i < data.length; i++) {
            const samples = N(data[i][1], 0);
            const wr = N(data[i][2], 50);
            if (samples >= CONFIG.AI.PRUNE_MIN_N && wr < CONFIG.AI.PRUNE_WR_MAX) {
                const m = getStockMem(S(data[i][0]));
                m.bias = {};
                m.realWR = 50 + (wr - 50) * 0.5;
                saveStockMem(S(data[i][0]), m);
                n++;
            }
        }
    } catch (e) {}
    return n;
}

function 執行自進化維護() {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(120000)) return;
    try {
        clearSheetCache();
        saveWeightVersion(false, "日維護備份-當沖");
        saveWeightVersion(true, "日維護備份-波段");
        runAdaptiveThresholdTuning();
        updateDrawdownState();
        const d1 = decayStockMemory();
        const d2 = decayPatternMemoryScores();
        const sc = runSelfCorrection();
        const pr = prunePatternMemory();
        const sp = selfPruneTickers();
        const wf = walkForwardValidateAll();
        normalizeWeights(false, false);
        normalizeWeights(true, false);
        const msg = `\n🧬 ${SYSTEM_VERSION} 自進化維護\n${"━".repeat(22)}\n` +
            `記憶衰減 個股${d1} 型態${d2}\n自修正 ${sc} 項 | 修剪 ${pr} | 個股修剪 ${sp}\nWalk-Forward 拒絕 ${wf}\n${"━".repeat(22)}`;
        Logger.log(msg);
        if (d1 + d2 + sc + pr + sp + wf > 0) push("當沖", msg);
    } finally {
        lock.releaseLock();
    }
}

function writeSystemKey(key, val, note) {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.SYSTEM);
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            if (S(data[i][0]) === key) {
                setSheetRow(sheet, i + 1, 1, [key, S(val), note || "", new Date()]);
                invalidateSheet(CONFIG.SHEETS.SYSTEM);
                return;
            }
        }
        sheet.appendRow([key, S(val), note || "", new Date()]);
        invalidateSheet(CONFIG.SHEETS.SYSTEM);
    } catch (e) {}
}

function setSheetRow(sheet, rowIndex, colStart, values) {
    sheet.getRange(rowIndex, colStart, 1, values.length).setValues([values]);
}

function regimeTypeFromLogCell(cell) {
    const s = S(cell);
    const codes = ["MAIN_UP", "LATE_UP", "TOPPING", "MAIN_DOWN", "SUPER_SELL", "BREAKOUT", "DIST", "RANGE"];
    if (codes.indexOf(s) >= 0) return s;
    const map = {
        "🚀主升段": "MAIN_UP", "⚠️末升段": "LATE_UP", "🔄頭部震盪": "TOPPING",
        "📉主跌段": "MAIN_DOWN", "💥超跌反彈": "SUPER_SELL", "🌅突破初升": "BREAKOUT",
        "🏚️高檔出貨": "DIST", "🌊盤整洗盤": "RANGE"
    };
    return map[s] || "RANGE";
}

// ============================================================================
// 🧠 PRO：非線性層 / 交互矩陣 / 不確定性 / 學習凍結 / 權重正規化
// ============================================================================

function sigmoid(x) { return 1 / (1 + Math.exp(-clamp(x, -12, 12))); }

function getVolBucket(tv) {
    const v = N(tv.vol_ratio, 1);
    if (v >= 2.0) return "HIGH";
    if (v >= 1.2) return "MID";
    return "LOW";
}

function getInteractKey(regimeType, patternKey, volBucket) {
    return `${regimeType}|${patternKey}|${volBucket}`;
}

function getInteractPreset(regimeType, patternKey, volBucket, tv) {
    const sig = patternKey.split("+")[0] || "";
    let logitAdd = 0, confMult = 1, fakeRisk = 1;
    if (regimeType === "MAIN_UP" && sig === "突破" && volBucket === "HIGH") { logitAdd = 0.35; confMult = 1.08; }
    if (regimeType === "BREAKOUT" && sig === "突破" && volBucket === "HIGH") { logitAdd = 0.28; confMult = 1.06; }
    if (regimeType === "TOPPING" && sig === "突破") { logitAdd = -0.55; confMult = 0.72; fakeRisk = 1.35; }
    if (regimeType === "DIST" && sig === "突破") { logitAdd = -0.45; confMult = 0.76; fakeRisk = 1.25; }
    if (regimeType === "MAIN_DOWN" && sig === "突破") { logitAdd = -0.40; confMult = 0.78; }
    if (regimeType === "RANGE" && sig === "回踩" && volBucket !== "HIGH") { logitAdd = 0.22; confMult = 1.05; }
    if (tv.fake_break) { logitAdd -= 0.5; fakeRisk *= 1.2; }
    return { logitAdd, confMult, fakeRisk };
}

function getInteractMem(regimeType, patternKey, volBucket) {
    const key = getInteractKey(regimeType, patternKey, volBucket);
    try {
        const data = getSheetData(CONFIG.SHEETS.INTERACT_MEM);
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === key) {
                const n = N(data[i][2]), wins = N(data[i][3]);
                return { key, n, wins, bayesWR: bayes(wins, n), row: i + 1 };
            }
        }
    } catch (e) {}
    return { key, n: 0, wins: 0, bayesWR: 50, row: null };
}

function updateInteractMem(regimeType, patternKey, volBucket, isWin) {
    const key = getInteractKey(regimeType, patternKey, volBucket);
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.INTERACT_MEM);
        const data  = getSheetData(CONFIG.SHEETS.INTERACT_MEM);
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === key) {
                const n = N(data[i][2]) + 1, w = N(data[i][3]) + (isWin ? 1 : 0);
                setSheetRow(sheet, i + 1, 3, [n, w, +bayes(w, n).toFixed(1)]);
                invalidateSheet(CONFIG.SHEETS.INTERACT_MEM);
                return;
            }
        }
        sheet.appendRow([key, regimeType, 1, isWin ? 1 : 0, +bayes(isWin ? 1 : 0, 1).toFixed(1), patternKey, volBucket]);
        invalidateSheet(CONFIG.SHEETS.INTERACT_MEM);
    } catch (e) {}
}

function getInteractEffect(regime, tv, patMem) {
    const patternKey = patMem.key || getPatternKey(tv);
    const volBucket  = getVolBucket(tv);
    const preset     = getInteractPreset(regime.type, patternKey, volBucket, tv);
    const mem        = getInteractMem(regime.type, patternKey, volBucket);
    let logitAdd = preset.logitAdd;
    let confMult = preset.confMult;
    if (mem.n >= CONFIG.AI.MIN_SAMPLE) {
        logitAdd += (mem.bayesWR - 50) / 100 * 1.2;
        confMult *= 1 + (mem.bayesWR - 50) / 100 * 0.25;
    }
    return { logitAdd, confMult, fakeRisk: preset.fakeRisk, interactWR: mem.n >= 5 ? mem.bayesWR : null, key: mem.key };
}

function isLearningFrozen() {
    try {
        const data = getSheetData(CONFIG.SHEETS.SYSTEM);
        for (let i = 1; i < data.length; i++) {
            if (S(data[i][0]) === "LEARNING_FROZEN") return S(data[i][1]) === "1";
        }
    } catch (e) {}
    return PropertiesService.getScriptProperties().getProperty("LEARNING_FROZEN") === "1";
}

function setLearningFrozen(on, reason) {
    const v = on ? "1" : "0";
    PropertiesService.getScriptProperties().setProperty("LEARNING_FROZEN", v);
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.SYSTEM);
        const data  = sheet.getDataRange().getValues();
        let found = false;
        for (let i = 1; i < data.length; i++) {
            if (S(data[i][0]) === "LEARNING_FROZEN") {
                setSheetRow(sheet, i + 1, 1, ["LEARNING_FROZEN", v, reason || "", new Date()]);
                found = true;
                break;
            }
        }
        if (!found) sheet.appendRow(["LEARNING_FROZEN", v, reason || "", new Date()]);
        invalidateSheet(CONFIG.SHEETS.SYSTEM);
    } catch (e) {}
    Logger.log(on ? `🧊 學習已凍結: ${reason}` : "✅ 學習已解除凍結");
}

function normalizeWeights(isSwing, hardReset) {
    let w = hardReset ? defaultW() : getWeights(isSwing);
    if (!hardReset) {
        const keys = Object.keys(w);
        keys.forEach(k => {
            let val = N(w[k], 1);
            val -= (val - CONFIG.AI.W_CENTER) * CONFIG.AI.REGRESS_HARD;
            w[k] = clamp(val, CONFIG.AI.W_MIN, CONFIG.AI.W_MAX);
        });
    }
    saveWeights(isSwing, w);
    return w;
}

function revertWeightsBaseline() {
    saveWeights(false, defaultW());
    saveWeights(true, defaultW());
    Logger.log("♻️ 當沖/波段權重已還原 baseline");
}

function normalizeEntryDelta(d, p, tv, market, mem) {
    const tick   = getTick(p);
    const atr    = Math.max(N(tv.atr), p * N(mem.avgVol, 0.012), tick * 2);
    const atrPct = clamp(atr / p, 0.003, 0.08);
    const volB   = getVolBucket(tv);
    const volSc  = volB === "HIGH" ? 1.4 : volB === "LOW" ? 0.78 : 1.0;
    const vixSc  = clamp(N(market.vix, 20) / 20, 0.65, 1.5);
    d = d / (1 + atrPct * 5);
    d = d / volSc;
    d = d / Math.sqrt(vixSc);
    return d;
}

/**
 * Logistic 非線性校正層
 * V19.1 修正：z 起點 -2.15 → -1.55（sigmoid(-1.55)≈17%，避免信心被壓到10%基線）
 */
function applyNonLinearScoring(vote, tv, market, regime, mem, patMem, confCap) {
    const linear = N(vote.conf);
    const interact = getInteractEffect(regime, tv, patMem);
    const trendF = clamp(N(tv.trend) / 50, -2, 2);
    const volF   = clamp((N(tv.vol_ratio, 1) - 1) * 2, -2, 2);

    // V19.1: 起點從 -2.15 改為 -1.55，讓正常信號有合理的非線性基線
    let z = -1.55
        + 0.038 * N(vote.brains.bo, 50)
        + 0.034 * N(vote.brains.trend, 50)
        + 0.028 * N(vote.brains.vol, 50)
        - 0.036 * N(vote.brains.risk, 50)
        + 0.22 * trendF
        + 0.16 * volF
        + N(interact.logitAdd, 0);
    if (patMem.n >= CONFIG.AI.MIN_SAMPLE) z += (patMem.bayesWR - 50) / 50 * 0.35;
    if (mem.n >= CONFIG.AI.MIN_SAMPLE) z += (N(mem.realWR, 50) - 50) / 50 * 0.25;

    const nlConf = sigmoid(z) * 100;
    let conf = linear * 0.52 + nlConf * 0.48;
    conf *= N(interact.confMult, 1);
    if (tv.fake_break) conf *= 0.88 / N(interact.fakeRisk, 1);
    conf = clamp(conf, 0, confCap);

    const brains = [vote.brains.bo, vote.brains.trend, vote.brains.vol, vote.brains.risk].map(N);
    const meanB  = brains.reduce((a, b) => a + b, 0) / 4;
    const varB   = brains.reduce((a, b) => a + Math.pow(b - meanB, 2), 0) / 4;
    const stability   = clamp(100 - Math.sqrt(varB) * 1.15, 0, 100);
    const uncertainty = clamp(Math.sqrt(varB) * 0.65 + (100 - stability) * 0.12, 2, 22);

    vote.confLinear   = +linear.toFixed(2);
    vote.conf         = +conf.toFixed(2);
    vote.uncertainty  = +uncertainty.toFixed(1);
    vote.stability    = +stability.toFixed(1);
    vote.confLow      = +clamp(conf - uncertainty, 0, 100).toFixed(1);
    vote.confHigh     = +clamp(conf + uncertainty, 0, 100).toFixed(1);
    vote.interactKey  = interact.key;
    vote.interactWR   = interact.interactWR;
    return vote;
}

// ============================================================================
// 🔥 台股TICK精確系統
// ============================================================================

function getTick(p) {
    p = N(p);
    if (p < 10)   return 0.01;
    if (p < 50)   return 0.05;
    if (p < 100)  return 0.1;
    if (p < 500)  return 0.5;
    if (p < 1000) return 1;
    return 5;
}

function snapTick(price, dir) {
    price = N(price);
    if (price <= 0) return 0;
    const tick = getTick(price);
    const dec  = tick < 1 ? String(tick).split(".")[1].length : 0;
    let s;
    if      (dir === "up")   s = Math.ceil( price / tick) * tick;
    else if (dir === "down") s = Math.floor(price / tick) * tick;
    else {
        const lo = Math.floor(price / tick) * tick;
        const hi = lo + tick;
        s = (price - lo) <= (hi - price) ? lo : hi;
    }
    return +s.toFixed(dec);
}

function tDiff(a, b, ref) {
    const tick = getTick(N(ref));
    if (tick <= 0) return 0;
    return Math.round((N(a) - N(b)) / tick);
}

// ============================================================================
// 📡 TV → AI 解析
// ============================================================================

function resolveTradeMode(r) {
    const raw = S(r.trade_type || r.mode || r.trade_mode, "當沖");
    if (raw.indexOf("波") >= 0) return "波段";
    if (raw.indexOf("當") >= 0 || raw.indexOf("冲") >= 0 || raw.indexOf("沖") >= 0) return "當沖";
    return "當沖";
}

function hasNum(v) {
    return v !== undefined && v !== null && v !== "" && isFinite(+v);
}

function parseTvPayload(r) {
    r = r || {};
    const ticker = normalizeTicker(S(r.ticker, ""));
    const type   = resolveTradeMode(r);

    let tv = {
        ticker,
        price:    N(r.price),
        trend:    N(r.trend),
        vol_ratio:N(r.volume_ratio, 1),
        strength: N(r.signal_strength, 50),
        quality:  N(r.quality, 50),
        scan:     clamp(N(r.scan_level, 1), 1, 3),
        type,
        event:    S(r.event, "未知"),
        bo:       N(r.bo) ? 1 : 0,
        pb:       N(r.pb) ? 1 : 0,
        v:        N(r.v) ? 1 : 0,
        range_r:  N(r.range_ratio, 0.01),
        position: clamp(N(r.position, 0.5), 0, 1),
        fake_break: N(r.fake_break) ? 1 : 0,
        name: S(r.stock_name || r.name || r.stockName, ""),
        atr:  N(r.atr),
        vwap: N(r.vwap),
        ma5:  N(r.ma5),
        ma10: N(r.ma10),
        ma20: N(r.ma20),
        close_ma20_diff: N(r.close_ma20_diff),
        rsi:      hasNum(r.rsi) ? N(r.rsi) : null,
        kd_k:     hasNum(r.kd_k) ? N(r.kd_k) : null,
        kd_d:     hasNum(r.kd_d) ? N(r.kd_d) : null,
        macd:     hasNum(r.macd) ? N(r.macd) : null,
        macd_sig: hasNum(r.macd_signal || r.macd_sig) ? N(r.macd_signal || r.macd_sig) : null,
        adx:      hasNum(r.adx) ? N(r.adx) : null,
        bb_pos:   hasNum(r.bb_position || r.bb_pos) ? clamp(N(r.bb_position || r.bb_pos), 0, 1) : null,
        hour:     taipeiHour(),
        _tvFull:  true
    };

    return enrichTvData(tv);
}

function enrichTvData(tv) {
    if (tv.atr <= 0 && tv.price > 0) {
        tv.atr = Math.max(tv.price * Math.max(tv.range_r, 0.008), getTick(tv.price) * 2);
        tv._atrEst = true;
    }
    if (tv.vwap <= 0 && tv.price > 0) tv.vwap = tv.price;
    if (tv.ma20 <= 0 && tv.price > 0) {
        tv.ma20 = tv.price;
        tv.ma10 = tv.price;
        tv.ma5  = tv.price;
    }
    if (!hasNum(tv.close_ma20_diff) && tv.ma20 > 0) {
        tv.close_ma20_diff = ((tv.price - tv.ma20) / tv.ma20) * 100;
    }
    tv.vol_ratio = clamp(tv.vol_ratio, 0.5, 3.0);
    return tv;
}

function getPushRoute(type) {
    const isSwing = S(type).indexOf("波") >= 0;
    return {
        mode:    isSwing ? "波段" : "當沖",
        emoji:   isSwing ? "🟢" : "🔴",
        tag:     isSwing ? "【波段】" : "【當沖】",
        webhook: isSwing ? getSecret("WEBHOOK_SWING", CONFIG.WEBHOOK_SWING) : getSecret("WEBHOOK_DAY", CONFIG.WEBHOOK_DAY),
        confMin: isSwing ? getAI("SWING_CONF_MIN") : getAI("CONF_MIN")
    };
}

function maTrendLabel(tv) {
    if (tv.ma5 > tv.ma10 && tv.ma10 > tv.ma20 && tv.ma20 > 0) return "多頭排列";
    if (tv.ma5 < tv.ma10 && tv.ma10 < tv.ma20 && tv.ma20 > 0) return "空頭排列";
    return "糾結";
}

// ============================================================================
// 📡 Webhook 入口
// ============================================================================

function doPost(e) {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(28000)) {
        return ContentService.createTextOutput("BUSY");
    }
    try {
        if (!e || !e.postData || !e.postData.contents) {
            return ContentService.createTextOutput("ERROR:NO_BODY");
        }
        const r = JSON.parse(e.postData.contents);
        const tv = parseTvPayload(r);
        if (!tv.ticker || !tv.price) return ContentService.createTextOutput("ERROR:MISSING");
        runAI(tv);
        return ContentService.createTextOutput("OK");
    } catch (err) {
        Logger.log("❌ doPost: " + err.message);
        return ContentService.createTextOutput("ERROR:" + err.message);
    } finally {
        lock.releaseLock();
    }
}

// ============================================================================
// 🧠 主AI閉環 V19 FIX（防誤殺 + 可執行版）
// ============================================================================

function runAI(tv) {
    const t0 = Date.now();
    try {
        clearSheetCache();
        tv = enrichTvData(tv || {});

        const route   = getPushRoute(tv.type);
        const isSwing = route.mode === "波段";
        tv.type = route.mode;

        const market  = getMarket(false);
        const regime  = getRegime(market);

        const stock   = getStock(tv.ticker, tv.name);
        const mem     = getStockMem(tv.ticker);
        const patMem  = getPatternMem(tv.ticker, tv);
        const blInfo  = getBlacklist(tv.ticker);
        const timeMem = getTimeMem(tv.ticker, tv.hour);

        const gw      = getWeights(isSwing);
        const calib   = getCalibration();
        const confCap = blInfo.danger ? 62 : 100;

        let vote = aiVote(tv, market, regime, mem, patMem, timeMem, gw, isSwing, confCap, blInfo);
        vote = applyNonLinearScoring(vote, tv, market, regime, mem, patMem, confCap);
        vote = applyRegimeStrategySwitch(vote, tv, market, regime);

        const patFreeze = isPatternFrozen(patMem.key, regime.type);
        if (patFreeze.frozen) {
            vote.conf = +clamp(vote.conf * 0.75, 0, confCap).toFixed(2);
        }

        const mm = getMarketMode(market);

        vote.dataQuality = calcDataQualityScore(tv);
        vote.marketModeZh = mm.zh;

        const confRaw   = vote.conf;
        const confCalib = calibrateConf(confRaw, calib);

        const winRate   = bayesianWR(vote, tv, mem, patMem, regime, market, timeMem, isSwing);
        const decision  = getDecision(vote, winRate, tv, blInfo, isSwing, market, mm);

        // ✅ FIX：risk level（不是 compress）
        const riskLevel = getRiskLevel(vote, tv, mm);
        vote.riskLevel = riskLevel;

        const strategy  = routeStrategyModel(isSwing, mm, riskLevel);

        const pushScore = confRaw; // ✅ 不再使用錯誤 compress.finalScore

        const shouldPush =
            isTradingSessionAllowed(isSwing) &&
            shouldAllowPushDedup(tv.ticker, route.mode, pushScore) &&
            strategy.model !== "WAIT" &&
            pushScore >= route.confMin &&
            riskLevel.en !== "HIGH" &&
            !tv.fake_break;

        if (shouldPush) {
            const msg = buildMsg(
                tv, stock, vote, confCalib,
                market, winRate, regime,
                patMem, blInfo, decision,
                timeMem, route, mm,
                riskLevel, strategy
            );

            const compact = buildMsgCompact(tv, stock, vote, riskLevel, route, decision, winRate, strategy);

            push(route.mode, msg, compact);
        }

        saveLog(tv, stock, vote, confCalib, market, winRate, regime, decision);
        saveLearning(tv, vote, winRate, regime);

        clearSheetCache();

        Logger.log(`✅ ${route.tag} ${tv.ticker} ${Date.now()-t0}ms 信心${confRaw.toFixed(1)}%`);

    } catch (err) {
        Logger.log("❌ runAI: " + err.message);
    }
}
// ============================================================================
// 🗳️ AI投票機制（4腦 → 加權平均信心）
// ============================================================================

function aiVote(tv, market, regime, mem, patMem, timeMem, gw, isSwing, confCap, blInfo) {
    blInfo = blInfo || { danger: false, level: "正常", reason: "", streak: 0 };
    const p = tv.price;

    const sTrend  = clamp(tv.trend + 50, 0, 100);
    const sVol    = clamp((tv.vol_ratio - 0.5) / 2.5 * 100, 0, 100);
    const sSig    = clamp(tv.strength, 0, 100);
    const sQual   = clamp(tv.strength * Math.sqrt(clamp(tv.vol_ratio,0.5,3)) / 1.5, 0, 100);
    const posK    = isSwing ? 1.25 : 1.0;
    const sPos    = clamp((1 - tv.position * posK) * 100, 0, 100);
    const sRange  = clamp(100 - Math.abs(tv.range_r - 0.018) / 0.018 * 40, 0, 100);
    const sScan   = (tv.scan / 3) * 100;

    let sVwap = 50;
    if (tv.vwap > 0) {
        sVwap = tv.price > tv.vwap * 1.005 ? 88 :
                tv.price > tv.vwap          ? 65 :
                tv.price < tv.vwap * 0.995  ? 18 : 40;
    }

    let sRsi = 50;
    if (tv.rsi !== null && tv.rsi !== undefined && tv.rsi > 0) {
        sRsi = tv.rsi < 30 ? 82 : tv.rsi > 75 ? 22 : tv.rsi > 50 ? 62 : 40;
    }

    let sKD = 50;
    if (tv.kd_k !== null && tv.kd_d !== null && tv.kd_k > 0) {
        if (tv.kd_k > tv.kd_d && tv.kd_k < 80) sKD = 72;
        else if (tv.kd_k < tv.kd_d && tv.kd_k > 20) sKD = 30;
        else if (tv.kd_k > 85) sKD = 20;
    }

    let sMacd = 50;
    if (tv.macd !== null && tv.macd_sig !== null) {
        sMacd = tv.macd > tv.macd_sig ? 70 : 35;
    }

    let sAdx = 50;
    if (tv.adx !== null && tv.adx !== undefined && tv.adx > 0) {
        sAdx = tv.adx > 30 ? 80 : tv.adx > 20 ? 60 : 35;
    }

    let sBB = 50;
    if (tv.bb_pos !== null && tv.bb_pos !== undefined) {
        sBB = tv.bb_pos < 0.2 ? 78 : tv.bb_pos > 0.8 ? 22 : 55;
    }

    let sMaAlign = 50;
    if (tv.ma5 > 0 && tv.ma10 > 0 && tv.ma20 > 0) {
        if (tv.ma5 > tv.ma10 && tv.ma10 > tv.ma20) sMaAlign = 85;
        else if (tv.ma5 < tv.ma10 && tv.ma10 < tv.ma20) sMaAlign = 20;
        else sMaAlign = 50;
    }

    let sEvent = 50;
    if (isSwing) {
        sEvent = tv.bo ? 86 : tv.pb ? 92 : tv.v ? 76 : 42;
    } else {
        sEvent = tv.bo ? 95 : tv.v ? 88 : tv.pb ? 68 : 42;
    }
    if (tv.fake_break) sEvent = Math.max(10, sEvent - 35);

    const timeBoost = timeMem.winRate > 0 ? (timeMem.winRate - 50) / 100 * 8 : 0;

    const bias = (mem.bias) || {};
    function w(key) {
        return clamp((N(gw[key],1.0)) + N(bias[key],0), CONFIG.AI.W_MIN, CONFIG.AI.W_MAX);
    }

    const brainBO = wAvg([
        [sEvent,    w("event") * 1.5],
        [sVol,      w("volume")],
        [sSig,      w("signal")],
        [sRange,    w("range")],
        [sVwap,     w("vwap")],
        [sScan,     w("scan")]
    ]);

    const brainTrend = wAvg([
        [sTrend,    w("trend") * 1.4],
        [sMaAlign,  w("trend")],
        [sMacd,     w("macd")],
        [sAdx,      w("adx")],
        [sPos,      w("pos")],
        [sRsi,      w("rsi")]
    ]);

    const brainVol = wAvg([
        [sVol,      w("volume") * 1.4],
        [sSig,      w("signal")],
        [sQual,     w("quality")],
        [sRange,    w("range")],
        [sMacd,     w("macd")]
    ]);

    let riskScore = wAvg([
        [sPos,      1.0],
        [sVwap,     1.0],
        [sBB,       0.8],
        [sRsi,      0.8],
        [100 - clamp(N(market.vix,20) * 2, 0, 100), 1.2]
    ]);
    if (tv.fake_break) riskScore *= 0.65;

    let conf = (brainBO * 0.28 + brainTrend * 0.26 + brainVol * 0.22 + riskScore * 0.24);

    conf += timeBoost;

    conf *= tv.scan === 3 ? 1.10 : tv.scan === 2 ? 1.04 : 0.95;

    let resN = 0;
    if (tv.ma5 > tv.ma10 && tv.ma10 > tv.ma20 && tv.ma20 > 0) resN++;
    if (tv.vol_ratio > 1.8) resN++;
    if (sMacd > 60 && sKD > 60) resN++;
    if (sVwap > 70 && tv.position < 0.5) resN++;
    if (tv.bo && tv.vol_ratio > 1.8) resN++;
    const resBoost = resN >= 5 ? 12 : resN >= 4 ? 8 : resN >= 3 ? 5 : resN >= 2 ? 2 : 0;
    conf += resBoost;

    // ── 盤型修正（V19.1：懲罰力道放輕）──
    conf *= N(regime.confMult, 1.0);
    const rt = regime.type;
    if (tv.bo && (rt === "MAIN_UP" || rt === "BREAKOUT")) conf *= 1.08;
    if (tv.pb && (rt === "RANGE" || rt === "SUPER_SELL")) conf *= 1.10;
    if (rt === "DIST" || rt === "LATE_UP")               conf *= 0.88;   // V19.1: 0.80 → 0.88
    if (rt === "TOPPING" || rt === "MAIN_DOWN")          conf *= 0.82;   // V19.1: 0.74 → 0.82

    const vixLim = isSwing ? 28 : 35;
    if (N(market.vix,20) > vixLim) conf *= (1 - (N(market.vix,20) - vixLim) * 0.008);
    else if (N(market.vix,20) < 12) conf *= 1.08;

    if (market.status.includes("強勢多頭")) conf *= isSwing ? 1.16 : 1.10;
    else if (market.status.includes("偏多")) conf *= 1.05;
    else if (market.status.includes("強勢空頭")) conf *= isSwing ? 0.76 : 0.82;
    else if (market.status.includes("偏空")) conf *= 0.92;

    if (mem.n >= CONFIG.AI.MIN_SAMPLE) {
        conf *= (1 + (N(mem.realWR,50) - 50) / 100 * 0.28);
        const str = N(mem.streak);
        if (str >=  3) conf *= 1.05;
        if (str <= -3) conf *= 0.92;
    }

    if (patMem.n >= CONFIG.AI.MIN_SAMPLE) {
        conf *= (1 + (N(patMem.bayesWR,50) - 50) / 100 * 0.32);
    }

    const decayBars = N(mem.lastSignalBars, 0);
    if (decayBars > 0) {
        const decayFactor = Math.pow(0.5, decayBars / CONFIG.AI.DECAY_HALF);
        conf *= (0.7 + 0.3 * decayFactor);
    }

    conf = clamp(conf, 0, confCap);

    const tick       = getTick(p);
    const aggr       = conf / 100;
    const driftAdj   = N(mem.avgDrift,0) * 0.22;
    let entry = p;

    if (tv.bo) {
        const k = isSwing ? 0.28 : 0.52;
        let d = tick * k * aggr;
        d *= (1 + (0.5 - tv.position) * 0.30);
        d += tick * 0.07 * Math.max(0, tv.vol_ratio - 1.5);
        d -= tick * 0.05 * Math.max(0, (N(market.vix,20) - 18) / 10);
        if (N(market.momentum) < 0) d *= 0.75;
        d += driftAdj;
        d = normalizeEntryDelta(d, p, tv, market, mem);
        entry = snapTick(p + d, "near");
    } else if (tv.pb) {
        const k = isSwing ? 0.28 : 0.16;
        let d = -tick * k * aggr;
        d *= (1 + tv.position * 0.22);
        d += driftAdj * 0.4;
        d = normalizeEntryDelta(d, p, tv, market, mem);
        entry = snapTick(p + d, "near");
    } else if (tv.v) {
        const k = isSwing ? 0.22 : 0.35;
        let d = tick * k * aggr * (tv.vol_ratio / 1.5);
        d += driftAdj;
        d = normalizeEntryDelta(d, p, tv, market, mem);
        entry = snapTick(p + d, "near");
    } else {
        entry = snapTick(p, "near");
    }

    const maxDist = tick * 6;
    if (Math.abs(entry - p) > maxDist) {
        entry = snapTick(p + Math.sign(entry - p) * maxDist * 0.5, "near");
    }

    const slMult = N(mem.bestSlAtr) > 0 ? N(mem.bestSlAtr) : (isSwing ? 2.4 : 1.8);
    const tpMult = N(mem.bestTpAtr) > 0 ? N(mem.bestTpAtr) : (isSwing ? 4.0 : 2.6);

    let sl, tp, support, pressure;
    const atr = N(tv.atr);

    if (atr > 0) {
        sl       = snapTick(entry - atr * slMult, "down");
        tp       = snapTick(entry + atr * tpMult, "up");
        support  = snapTick(p - atr * 1.0, "down");
        pressure = snapTick(p + atr * 1.1, "up");
    } else {
        const volRate = Math.max(tv.range_r, 0.008 + tv.strength / 800);
        const rMult   = isSwing ? 1.22 : 0.92;
        const range   = p * volRate * rMult * (1.7 - conf / 100);
        support  = snapTick(p - range,          "down");
        pressure = snapTick(p + range,          "up");
        sl       = snapTick(entry - range * slMult, "down");
        tp       = snapTick(entry + range * tpMult, "up");
    }

    if (Math.abs(entry - sl) < tick * 2) sl = snapTick(entry - tick * 2, "down");

    const risk   = Math.max(Math.abs(entry - sl), tick);
    const reward = Math.max(Math.abs(tp - entry),  tick);
    let rr = +(reward / risk).toFixed(2);

    if (rr > 6) {
        tp = snapTick(entry + risk * 4.5, "up");
        rr = 4.5;
    }

    if (rr < 1.0) conf = clamp(conf * 0.88, 0, confCap);
    else if (rr >= 1.5 && rr <= 3.5) conf = clamp(conf * 1.04, 0, confCap);

    conf = clamp(conf, 0, confCap);

    let execP = conf - 5 + tv.vol_ratio * 3;
    if (tv.bo && tv.vol_ratio > 1.5) execP += 5;
    if (isSwing) execP -= 4;
    execP = clamp(execP, 15, 95);

    let grade = "C";
    if      (conf > 92) grade = "SSS";
    else if (conf > 88) grade = "SS";
    else if (conf > 82) grade = "S";
    else if (conf > 75) grade = "A+";
    else if (conf > 68) grade = "A";
    else if (conf > 55) grade = "B";

    return {
        conf:  +conf.toFixed(2), grade, entry,
        entryTD: tDiff(entry, p, p),
        prices: { support, pressure, sl, tp },
        rr, execP: +execP.toFixed(1),
        resN, resBoost,
        brains: {
            bo:    +brainBO.toFixed(1),
            trend: +brainTrend.toFixed(1),
            vol:   +brainVol.toFixed(1),
            risk:  +riskScore.toFixed(1)
        },
        scores: { sTrend, sVol, sSig, sQual, sEvent, sPos, sVwap, sRsi, sKD, sMacd },
        usedWeights: {
            trend:w("trend"), volume:w("volume"), signal:w("signal"), quality:w("quality"),
            event:w("event"), pos:w("pos"), range:w("range"), scan:w("scan"),
            vwap:w("vwap"), rsi:w("rsi"), kd:w("kd"), macd:w("macd"), adx:w("adx"), bb:w("bb")
        },
        reasoning: buildReason(tv, conf, mem, patMem, isSwing, market, regime, resN, resBoost, timeMem, blInfo)
    };
}

function wAvg(pairs) {
    let num = 0, den = 0;
    pairs.forEach(([val, wt]) => { num += val * wt; den += wt; });
    return den > 0 ? num / den : 50;
}

// ============================================================================
// 🎯 決策建議
// ============================================================================

function getDecision(vote, winRate, tv, blInfo, isSwing, market, mm) {
    const conf = vote.conf;
    const rr   = vote.rr;
    market = market || market_cache || {};
    mm = mm || getMarketMode(market);
    const vix  = N(market.vix, 20);

    if (blInfo.danger)              return { en:"BLACKLIST",  zh:"⛔ 黑名單暫停" };
    if (mm.mode === "CRASH" || vix > 40) return { en:"EXTREME", zh:"🚫 極度恐慌/停止" };
    if (N(vote.stability, 100) < 32) return { en:"UNSTABLE", zh:"⚠️ 四腦嚴重分歧" };
    if (tv.fake_break && tv.bo)     return { en:"FAKE",       zh:"⚠️ 假突破/等待" };
    if (N(vote.dataQuality, 100) < CONFIG.AI.MIN_DATA_QUALITY) return { en:"LOW_Q", zh:"⚠️ 資料品質不足" };

    if (conf > 82 && winRate > 75 && rr >= 1.8)  return { en:"STRONG_BUY",  zh:"🔥 強烈買進" };
    if (conf > 68 && winRate > 65 && rr >= 1.4)  return { en:"BUY",         zh:"🟢 建議買進" };
    if (conf > 55 && winRate > 55)                return { en:"WATCH",       zh:"🟡 觀察追蹤" };
    if (tv.pb && conf > 50)                       return { en:"WAIT_PB",     zh:"🛡️ 等待回踩" };
    if (tv.bo && conf < 55)                       return { en:"WAIT_BO",     zh:"⏳ 等突破確認" };
    if (conf < getAI("CONF_MIN"))                 return { en:"NO_TRADE",    zh:"🔴 不交易" };

    return { en:"NEUTRAL", zh:"🟡 中性觀望" };
}

let market_cache = { vix:20, momentum:0, gap:0, status:"盤整", consistency:50, lastUpdate:0 };

// ============================================================================
// 第三層：Bayesian 勝率
// ============================================================================

function bayes(wins, total) {
    return ((wins + CONFIG.AI.BAYES_W) / (total + CONFIG.AI.BAYES_T)) * 100;
}

function bayesianWR(vote, tv, mem, patMem, regime, market, timeMem, isSwing) {
    const conf = vote.conf;
    const patWR   = patMem.n  >= CONFIG.AI.MIN_SAMPLE ? patMem.bayesWR : null;
    const stockWR = mem.n     >= CONFIG.AI.MIN_SAMPLE
        ? bayes(Math.round(N(mem.realWR,50) * mem.n / 100), mem.n) : null;
    const regWR   = getRegimeWR(regime.type, tv.event);
    const timeWR  = timeMem.n >= 5 ? timeMem.winRate : null;
    const interact = getInteractEffect(regime, tv, patMem);
    const iWR   = interact.interactWR;

    let wr;
    if (patWR && stockWR) {
        wr = patWR*0.32 + stockWR*0.20 + conf*0.22 + N(regWR,55)*0.10 + (timeWR||55)*0.05;
    } else if (stockWR) {
        wr = stockWR*0.32 + conf*0.42 + N(regWR,55)*0.14 + (timeWR||55)*0.05;
    } else {
        wr = conf*0.60 + N(regWR,55)*0.25 + (timeWR||55)*0.10;
    }

    if (iWR !== null && iWR !== undefined) wr = wr * 0.72 + iWR * 0.28;

    let logit = Math.log(clamp(wr, 5, 95) / 100 / (1 - clamp(wr, 5, 95) / 100));
    logit += N(interact.logitAdd, 0);
    if (regime.type === "TOPPING" && tv.bo) logit -= 0.35;
    if (regime.type === "MAIN_UP" && tv.bo && getVolBucket(tv) === "HIGH") logit += 0.25;
    wr = 100 / (1 + Math.exp(-clamp(logit, -6, 6)));

    wr += (tv.scan - 1) * 2;
    if (vote.rr > 2.5) wr += 4;
    if (vote.rr < 1.0) wr -= 7;
    if (tv.fake_break)  wr -= 14;
    wr += N(mem.streak,0) * 1.1;
    wr -= N(vote.uncertainty, 0) * 0.15;
    if (mem.n < CONFIG.AI.MIN_IMPACT) wr = wr * 0.88 + 55 * 0.12;

    return +clamp(wr, 25, 95).toFixed(1);
}

// ============================================================================
// 第二層：8段盤型
// V19.1：各盤型 confMult 上調，特別是 RANGE/TOPPING/MAIN_DOWN
// ============================================================================

function getRegime(market) {
    const m = N(market.momentum), vix = N(market.vix,20), g = N(market.gap);
    if (m > 1.5 && g < 0.5 && vix < 20) return { type:"MAIN_UP",    name:"🚀主升段",   confMult:1.14 };
    if (m > 1.0 && vix > 20 && vix < 28) return { type:"LATE_UP",   name:"⚠️末升段",   confMult:0.94 };
    if (Math.abs(m) < 0.5 && vix > 22)  return { type:"TOPPING",    name:"🔄頭部震盪", confMult:0.84 };  // V19.1: 0.78→0.84
    if (m < -1.5 && g < 0.5)            return { type:"MAIN_DOWN",  name:"📉主跌段",   confMult:0.76 };  // V19.1: 0.70→0.76
    if (m < -1.0 && vix > 30)           return { type:"SUPER_SELL", name:"💥超跌反彈", confMult:0.92 };  // V19.1: 0.88→0.92
    if (m > 0.8 && g < 0.6 && vix < 18) return { type:"BREAKOUT",  name:"🌅突破初升", confMult:1.08 };
    if (m > 0.3 && vix > 25)            return { type:"DIST",       name:"🏚️高檔出貨", confMult:0.86 };  // V19.1: 0.80→0.86
    return                                      { type:"RANGE",      name:"🌊盤整洗盤", confMult:0.96 };  // V19.1: 0.90→0.96
}

// ============================================================================
// 第四層：信心校正
// ============================================================================

function getCalibration() {
    try {
        const data = getSheetData(CONFIG.SHEETS.CALIBRATION);
        const c = {};
        for (let i = 1; i < data.length; i++) if (data[i][0]) c[+data[i][0]] = N(data[i][1], +data[i][0]);
        return c;
    } catch(e) { return {}; }
}

function calibrateConf(conf, calib) {
    const bucket = Math.round(conf / 10) * 10;
    return calib[bucket] !== undefined ? +N(calib[bucket]).toFixed(1) : +conf.toFixed(1);
}

function updateCalibration(conf, predictedWR) {
    try {
        const sheet  = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.CALIBRATION);
        const bucket = Math.round(conf / 10) * 10;
        const data   = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            if (+data[i][0] === bucket) {
                const n = N(data[i][2]) + 1;
                sheet.getRange(i+1,2).setValue(+((N(data[i][1]) * (n-1) + predictedWR) / n).toFixed(2));
                sheet.getRange(i+1,3).setValue(n);
                return;
            }
        }
        sheet.appendRow([bucket, predictedWR, 1]);
        invalidateSheet(CONFIG.SHEETS.CALIBRATION);
    } catch(e) {}
}

// ============================================================================
// 第一層：個股型態記憶
// ============================================================================

function getPatternKey(tv) {
    const vol = tv.vol_ratio > 2.0 ? "爆量" : tv.vol_ratio > 1.5 ? "大量" : tv.vol_ratio > 1.2 ? "中量" : "縮量";
    const pos = tv.position < 0.3 ? "低位" : tv.position < 0.7 ? "中位" : "高位";
    const sig = tv.bo ? "突破" : tv.pb ? "回踩" : tv.v ? "量能" : "弱訊";
    return `${sig}+${vol}+${pos}`;
}

function getPatternMem(ticker, tv) {
    const key = getPatternKey(tv);
    try {
        const data = getSheetData(CONFIG.SHEETS.PATTERN_MEM);
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === ticker && data[i][1] === key) {
                const n = N(data[i][2]), wins = N(data[i][3]);
                return { ticker, key, n, wins, bayesWR: bayes(wins,n), row:i+1 };
            }
        }
    } catch(e) {}
    return { ticker, key, n:0, wins:0, bayesWR:50, row:null };
}

function savePatternMem(pm) {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.PATTERN_MEM);
        const row = [pm.ticker, pm.key, pm.n, pm.wins, +pm.bayesWR.toFixed(1), new Date()];
        if (pm.row) setSheetRow(sheet, pm.row, 1, row);
        else        sheet.appendRow(row);
        invalidateSheet(CONFIG.SHEETS.PATTERN_MEM);
    } catch(e) {}
}

// ============================================================================
// 時段學習
// ============================================================================

function hourToSlot(hour) {
    return hour < 10 ? "開盤(9-10)" : hour < 11 ? "早盤(10-11)" :
           hour < 12 ? "午前(11-12)" : hour < 13 ? "午後(12-13)" : "尾盤(13-14)";
}

function getTimeMem(ticker, hour) {
    const slot = hourToSlot(hour);
    try {
        const data = getSheetData(CONFIG.SHEETS.TIME_MEM);
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === ticker && data[i][1] === slot) {
                const n = N(data[i][2]), wins = N(data[i][3]);
                return { ticker, slot, n, winRate: n > 0 ? bayes(wins,n) : 50, row:i+1 };
            }
        }
    } catch(e) {}
    return { ticker, slot, n:0, winRate:50, row:null };
}

// ============================================================================
// 第六層：黑名單
// ============================================================================

function getBlacklist(ticker) {
    try {
        const data = getSheetData(CONFIG.SHEETS.BLACKLIST);
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === ticker) return {
                danger: data[i][1] === "黑名單", level: S(data[i][1],"正常"),
                reason: S(data[i][2]), streak: N(data[i][3]), row:i+1
            };
        }
    } catch(e) {}
    return { danger:false, level:"正常", reason:"", streak:0, row:null };
}

function updateBlacklist(ticker, streak, realWR) {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.BLACKLIST);
        const data  = sheet.getDataRange().getValues();
        let level = "正常", reason = "";
        if (streak <= -CONFIG.AI.BL_LOSS_N)                        { level="黑名單"; reason=`連敗${Math.abs(streak)}次`; }
        else if (realWR < CONFIG.AI.BL_WR_MIN && streak < 0)       { level="警戒";   reason=`勝率${realWR.toFixed(0)}%偏低`; }
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === ticker) {
                setSheetRow(sheet, i + 1, 2, [level, reason, streak]);
                invalidateSheet(CONFIG.SHEETS.BLACKLIST);
                return;
            }
        }
        if (level !== "正常") sheet.appendRow([ticker, level, reason, streak, new Date()]);
        invalidateSheet(CONFIG.SHEETS.BLACKLIST);
    } catch(e) {}
}

// ============================================================================
// 第八層：Top榜
// ============================================================================

function updateTopStock(ticker, name, conf, winRate) {
    if (conf < getAI("TOP_MIN_CONF")) return;
    const score = conf * 0.55 + winRate * 0.45;
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.TOP_STOCK);
        const data  = sheet.getDataRange().getValues();
        const today = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd");
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === ticker && data[i][5] === today) {
                if (score > N(data[i][4])) setSheetRow(sheet, i + 1, 1, [ticker, name, +conf.toFixed(1), +winRate, +score.toFixed(1), today]);
                return;
            }
        }
        sheet.appendRow([ticker, name, +conf.toFixed(1), +winRate, +score.toFixed(1), today]);
    } catch(e) {}
}

function 推送今日最強股() {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.TOP_STOCK);
        const today = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd");
        const rows  = sheet.getDataRange().getValues().slice(1)
            .filter(r => r[5] === today).sort((a,b) => N(b[4])-N(a[4])).slice(0, 8);
        if (!rows.length) { Logger.log("今日無符合條件股票"); return; }
        let msg = `\n🔥 AI今日最強股 ${today}\n${"━".repeat(24)}\n`;
        rows.forEach((r,i) => {
            const m = ["🥇","🥈","🥉"][i] || `${i+1}.`;
            msg += `${m} ${r[0]} ${r[1]}  信心:${r[2]}%  勝率:${r[3]}%\n`;
        });
        msg += "━".repeat(24);
        push("當沖", msg);
        Logger.log("✅ Top榜已推送");
    } catch(e) { Logger.log("❌ 推送Top榜: " + e); }
}

// ============================================================================
// 波段持倉監控
// ============================================================================

function addSwingWatch(tv, stock, vote, winRate) {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.SWING_WATCH);
        sheet.appendRow([
            new Date(), tv.ticker, stock.displayName || stock.ticker, tv.price, vote.entry,
            vote.prices.sl, vote.prices.tp, +winRate, vote.grade, "持倉中",
            Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd")
        ]);
    } catch(e) {}
}

function 掃描波段出場() {
    try {
        const sheet  = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.SWING_WATCH);
        const data   = sheet.getDataRange().getValues();
        const market = getMarket();
        let notified = 0;

        for (let i = 1; i < data.length; i++) {
            if (data[i][9] !== "持倉中") continue;
            const ticker = S(data[i][1]);
            const entry  = N(data[i][4]);
            const sl     = N(data[i][5]);
            const tp     = N(data[i][6]);

            try {
                const res  = UrlFetchApp.fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}.TW`, {muteHttpExceptions:true});
                const curr = N(JSON.parse(res.getContentText()).quoteResponse.result?.[0]?.regularMarketPrice, 0);
                if (curr <= 0) continue;

                let action = "";
                if (curr <= sl)       action = `⛔ 觸碰停損 ${sl}（建議出場）`;
                else if (curr >= tp)  action = `🎯 達到停利 ${tp}（建議出場）`;
                else if (curr > entry * 1.05) action = `⚠️ 已獲利${((curr-entry)/entry*100).toFixed(1)}%，考慮移動停損`;

                if (action) {
                    const msg = `📌 波段出場提醒\n${ticker} ${S(data[i][2])}\n進場:${entry} → 現價:${curr}\n${action}`;
                    push("波段", msg);
                    sheet.getRange(i+1, 10).setValue(curr <= sl ? "已停損" : curr >= tp ? "已停利" : "提醒中");
                    notified++;
                }
            } catch(se) {}
        }
        Logger.log(`✅ 波段掃描完成：${notified} 筆需注意`);
    } catch(e) { Logger.log("❌ 掃描波段出場: " + e); }
}

// ============================================================================
// 自動回測引擎
// ============================================================================

function 執行自動回測() {
    const ss    = SpreadsheetApp.openById(CONFIG.SS_ID);
    const lrnSh = ss.getSheetByName(CONFIG.SHEETS.LEARNING);
    const btSh  = ss.getSheetByName(CONFIG.SHEETS.BACKTEST);

    try {
        const lrnData = lrnSh.getDataRange().getValues();
        const learned = lrnData.slice(1).filter(r => r[8] === "已學習" && r[7] !== "");

        if (learned.length < 10) { Logger.log("⚠️ 回測樣本不足（需>=10筆）"); return; }

        const now = new Date();
        const cutoffs = [30, 90, 180];
        const results = {};

        cutoffs.forEach(days => {
            const cutoff = new Date(now - days * 86400000);
            const subset = learned.filter(r => new Date(r[0]) >= cutoff);
            if (subset.length < 5) { results[days] = null; return; }

            let wins = 0, losses = 0, profitSum = 0, drawdown = 0, peak = 0, equity = 100;
            const equities = [];

            subset.forEach(r => {
                const pct  = N(r[7]);
                const wl   = resolveLearningWinLoss(r);
                const isW  = wl.isWin;
                const isL  = wl.isLoss;
                if (isW) wins++;
                if (isL) losses++;
                profitSum += pct;
                equity    += pct;
                equities.push(equity);
                if (equity > peak) peak = equity;
                const dd = peak > 0 ? (peak - equity) / peak : 0;
                if (dd > drawdown) drawdown = dd;
            });

            const total = wins + losses;
            const wr    = total > 0 ? wins / total * 100 : 50;
            const pf    = losses > 0 ? (profitSum > 0 ? profitSum / Math.abs(losses) : 0) : 0;
            const avg   = profitSum / subset.length;
            const variance = subset.reduce((a,r) => a + Math.pow(N(r[7]) - avg, 2), 0) / subset.length;
            const sharpe   = variance > 0 ? avg / Math.sqrt(variance) : 0;

            results[days] = { wr:+wr.toFixed(1), pf:+pf.toFixed(2), sharpe:+sharpe.toFixed(2),
                              mdd:+(drawdown*100).toFixed(1), n:subset.length, wins, losses };
        });

        const today = Utilities.formatDate(now, "Asia/Taipei", "yyyy-MM-dd");
        cutoffs.forEach(days => {
            const r = results[days];
            if (!r) return;
            btSh.appendRow([today, days, r.wr, r.pf, r.sharpe, r.mdd, r.n, r.wins, r.losses]);
        });

        const r30 = results[30];
        if (r30 && r30.n >= 10) {
            if (r30.wr < CONFIG.AI.FREEZE_WR) {
                setLearningFrozen(true, `30天勝率${r30.wr}%`);
                revertWeightsBaseline();
            } else if (r30.wr >= CONFIG.AI.UNFREEZE_WR) {
                setLearningFrozen(false, "");
            }
            if (!isLearningFrozen()) {
                const w = getWeights(false);
                const ws = getWeights(true);
                const adj = (r30.wr - 55) / 1000;
                ["trend","volume","signal","quality","event"].forEach(k => {
                    if (w[k])  w[k]  = clamp(w[k]  + adj, CONFIG.AI.W_MIN, CONFIG.AI.W_MAX);
                    if (ws[k]) ws[k] = clamp(ws[k] + adj * 0.8, CONFIG.AI.W_MIN, CONFIG.AI.W_MAX);
                });
                saveWeights(false, w);
                saveWeights(true, ws);
                Logger.log(`📊 回測30天勝率${r30.wr}% → 微調權重`);
            } else {
                Logger.log(`🧊 學習凍結中，略過權重微調（30天勝率${r30.wr}%）`);
            }
            normalizeWeights(false, false);
            normalizeWeights(true, false);
        }

        let rpt = `\n📊 AI自動回測報告 ${today}\n${"━".repeat(26)}\n`;
        cutoffs.forEach(days => {
            const r = results[days];
            rpt += r ? `${days}天 | 勝率:${r.wr}% | PF:${r.pf} | Sharpe:${r.sharpe} | MDD:${r.mdd}% | N:${r.n}\n`
                     : `${days}天 | 樣本不足\n`;
        });
        push("當沖", rpt);
        Logger.log("✅ 自動回測完成");

    } catch(e) { Logger.log("❌ 自動回測: " + e.message); }
}

// ============================================================================
// 大盤感知
// ============================================================================

function getMarket(forceRefresh) {
    const now = Date.now();
    const ttl = CONFIG.AI.MARKET_CACHE_MS || 480000;
    if (!forceRefresh && now - market_cache.lastUpdate < ttl) return market_cache;
    try {
        const url = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5ETWII,TX=F,%5EVIX";
        const res = UrlFetchApp.fetch(url, {muteHttpExceptions:true});
        const d   = JSON.parse(res.getContentText()).quoteResponse.result || [];
        const twii = d.find(x => x.symbol === "^TWII");
        const tx   = d.find(x => x.symbol === "TX=F");
        const vix  = d.find(x => x.symbol === "^VIX");
        const tc  = N(twii?.regularMarketChangePercent);
        const txc = N(tx?.regularMarketChangePercent);
        const vv  = N(vix?.regularMarketPrice, 20);
        const mom = tc * 0.6 + txc * 0.4;
        const gap = Math.abs(tc - txc);
        let status = "🟡盤整中性";
        if      (mom > 1.5 && gap < 0.6) status = "🔥強勢多頭共振";
        else if (mom > 0.4)               status = "🟢偏多";
        else if (mom < -1.5 && gap < 0.6) status = "🔴強勢空頭共振";
        else if (mom < -0.4)              status = "🔴偏空";
        else if (gap > 0.8)               status = "⚠️背離不穩";
        market_cache = { status, vix:vv, momentum:mom, gap, consistency: clamp(100-gap*50,0,100), lastUpdate:now };
        return market_cache;
    } catch(e) {
        return market_cache;
    }
}

// ============================================================================
// 盤型盛行率
// ============================================================================

function getRegimeWR(regType, event) {
    try {
        const data = getSheetData(CONFIG.SHEETS.REGIME_MEM);
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === regType && data[i][1] === event) return bayes(N(data[i][3]), N(data[i][2]));
        }
    } catch(e) {}
    return null;
}

function updateRegimeMem(regType, event, isWin) {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.REGIME_MEM);
        const data  = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === regType && data[i][1] === event) {
                const n = N(data[i][2])+1, w = N(data[i][3])+(isWin?1:0);
                setSheetRow(sheet, i + 1, 3, [n, w]);
                invalidateSheet(CONFIG.SHEETS.REGIME_MEM);
                return;
            }
        }
        sheet.appendRow([regType, event, 1, isWin?1:0, +bayes(isWin?1:0,1).toFixed(1)]);
        invalidateSheet(CONFIG.SHEETS.REGIME_MEM);
    } catch(e) {}
}

// ============================================================================
// 股票資訊（多 API + 快取）
// ============================================================================

const _HTTP_UA = {
    "User-Agent": "Mozilla/5.0 (compatible; AI-Trading-V19/1.0)",
    "Accept-Language": "zh-TW,zh;q=0.9"
};

function httpGetJson(url, ms) {
    try {
        const res = UrlFetchApp.fetch(url, {
            muteHttpExceptions: true,
            followRedirects: true,
            headers: _HTTP_UA,
            timeout: ms || 12000
        });
        if (res.getResponseCode() !== 200) return null;
        return JSON.parse(res.getContentText());
    } catch (e) {
        return null;
    }
}

function normalizeTicker(ticker) {
    return S(ticker)
        .toUpperCase()
        .replace(/^(TWSE|TPEX|TW|OTC):/i, "")
        .replace(/\.(TW|TWO)$/i, "")
        .trim();
}

function isValidStockName(name, ticker) {
    const n = S(name).trim();
    const t = normalizeTicker(ticker);
    if (!n) return false;
    if (n === t) return false;
    if (/^\d+$/.test(n)) return false;
    if (/^[A-Z0-9.\-]+$/i.test(n) && n.length <= 6) return false;
    if (/[\u4e00-\u9fff]/.test(n)) return true;
    return n.length >= 3;
}

function getStockNameFromSheet(ticker) {
    try {
        const data = getSheetData(CONFIG.SHEETS.STOCK_NAMES);
        for (let i = 1; i < data.length; i++) {
            if (S(data[i][0]) === ticker && isValidStockName(data[i][1], ticker)) {
                return S(data[i][1]).trim();
            }
        }
    } catch (e) {}
    return null;
}

function getStockNameFromPool(ticker) {
    const fast = getPoolNameFast(ticker);
    if (fast) return fast;
    try {
        const data = getSheetData(CONFIG.SHEETS.STOCK_POOL);
        for (let i = 1; i < data.length; i++) {
            if (normalizeTicker(S(data[i][0])) !== ticker) continue;
            const name = S(data[i][1]).trim();
            if (isValidStockName(name, ticker)) return name;
        }
    } catch (e) {}
    return null;
}

function getStockNameFromLog(ticker) {
    try {
        const data = getSheetData(CONFIG.SHEETS.LOG);
        for (let i = data.length - 1; i >= 1; i--) {
            if (S(data[i][2]) === ticker && isValidStockName(data[i][3], ticker)) {
                return S(data[i][3]).trim();
            }
        }
    } catch (e) {}
    return null;
}

function saveStockNameToSheet(ticker, name, source) {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.STOCK_NAMES);
        const data  = getSheetData(CONFIG.SHEETS.STOCK_NAMES);
        const now   = new Date();
        for (let i = 1; i < data.length; i++) {
            if (S(data[i][0]) === ticker) {
                setSheetRow(sheet, i + 1, 1, [ticker, name, source || "", now]);
                invalidateSheet(CONFIG.SHEETS.STOCK_NAMES);
                return;
            }
        }
        sheet.appendRow([ticker, name, source || "", now]);
        invalidateSheet(CONFIG.SHEETS.STOCK_NAMES);
    } catch (e) {}
}

function fetchNameTwseMis(ticker) {
    const tries = [`tse_${ticker}.tw`, `otc_${ticker}.tw`];
    for (let i = 0; i < tries.length; i++) {
        const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${tries[i]}&json=1&delay=0`;
        const j   = httpGetJson(url);
        if (!j || !j.msgArray || !j.msgArray.length) continue;
        const first = j.msgArray[0];
        if (typeof first === "string") {
            const parts = first.split("\t");
            if (parts[1] && isValidStockName(parts[1], ticker)) return parts[1].trim();
        }
        if (first && typeof first === "object") {
            const n = S(first.n || first.Name || "");
            if (isValidStockName(n, ticker)) return n.trim();
        }
        if (Array.isArray(first) && first[1] && isValidStockName(first[1], ticker)) {
            return S(first[1]).trim();
        }
    }
    return null;
}

function fetchNameYahooQuote(ticker) {
    const symbols = [`${ticker}.TW`, `${ticker}.TWO`];
    for (let i = 0; i < symbols.length; i++) {
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols[i])}`;
        const j   = httpGetJson(url);
        const d   = j && j.quoteResponse && j.quoteResponse.result && j.quoteResponse.result[0];
        if (!d) continue;
        const n = S(d.longName || d.shortName || d.displayName || "").trim();
        if (isValidStockName(n, ticker)) return n;
    }
    return null;
}

function fetchNameYahooChart(ticker) {
    const symbols = [`${ticker}.TW`, `${ticker}.TWO`];
    for (let i = 0; i < symbols.length; i++) {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbols[i])}?interval=1d&range=1d`;
        const j   = httpGetJson(url);
        const meta = j && j.chart && j.chart.result && j.chart.result[0] && j.chart.result[0].meta;
        if (!meta) continue;
        const n = S(meta.longName || meta.shortName || meta.symbol || "").trim();
        if (isValidStockName(n, ticker)) return n;
    }
    return null;
}

function getStock(ticker, hintName) {
    ticker = normalizeTicker(ticker);
    const tried = [];
    let name = null;
    let source = "";

    if (hintName && isValidStockName(hintName, ticker)) {
        name = S(hintName).trim();
        source = "TV";
    }

    if (!name) {
        name = getStockNameFromPool(ticker);
        if (name) { source = "股池"; tried.push("Pool"); }
    }

    if (!name) {
        name = getStockNameFromSheet(ticker);
        if (name) { source = "Sheet"; tried.push("Sheet"); }
    }

    if (!name) {
        name = getStockNameFromLog(ticker);
        if (name) { source = "Log"; tried.push("Log"); }
    }

    if (!name) {
        name = fetchNameTwseMis(ticker);
        if (name) { source = "TWSE"; tried.push("TWSE"); }
    }
    if (!name) {
        name = fetchNameYahooQuote(ticker);
        if (name) { source = "YahooQ"; tried.push("YahooQ"); }
    }
    if (!name) {
        name = fetchNameYahooChart(ticker);
        if (name) { source = "YahooC"; tried.push("YahooC"); }
    }

    if (name && isValidStockName(name, ticker)) {
        saveStockNameToSheet(ticker, name, source);
    }

    const nameOk = isValidStockName(name, ticker);
    const displayName = nameOk ? name : ticker;

    return {
        ticker,
        name: nameOk ? name : "",
        displayName,
        nameOk,
        source: source || "none",
        tried: tried.join("→")
    };
}

function 測試_股名() {
    const list = ["2330", "2454", "8069", "9999"];
    Logger.log("=== 股名測試（9999應無名但仍可分析）===");
    list.forEach(t => {
        clearSheetCache();
        const s = getStock(t);
        Logger.log(`${t} → 顯示:${s.displayName} | 中文:${s.nameOk} | 來源:${s.source}`);
        Utilities.sleep(300);
    });
}

function updateSignalPool(ticker, name, conf) {
    try {
        const shName = CONFIG.SHEETS.SIGNAL_POOL;
        const ss = SpreadsheetApp.openById(CONFIG.SS_ID);
        const sh = ss.getSheetByName(shName);
        if (!sh) return;
        const data = sh.getDataRange().getValues();
        const now = new Date();
        const displayName = isValidStockName(name, ticker) ? name : "";
        for (let i = 1; i < data.length; i++) {
            if (normalizeTicker(S(data[i][0])) !== ticker) continue;
            const count = N(data[i][2], 0) + 1;
            const avgConf = ((N(data[i][3], 0) * (count - 1)) + conf) / count;
            sh.getRange(i + 1, 1, 1, 6).setValues([[ticker, displayName, count, +avgConf.toFixed(2), now,
                count >= 20 && avgConf >= 68 ? "🔥核心池" : count >= 10 ? "⚡活躍池" : "📊一般池"]]);
            invalidateSheet(shName);
            return;
        }
        sh.appendRow([ticker, displayName, 1, +conf.toFixed(2), now, "🆕新股"]);
        invalidateSheet(shName);
    } catch (e) {}
}

function syncPoolNamesToCache() {
    try {
        const data = getSheetData(CONFIG.SHEETS.STOCK_POOL);
        let n = 0;
        for (let i = 1; i < data.length; i++) {
            const t = normalizeTicker(S(data[i][0]));
            const name = S(data[i][1]).trim();
            if (!t || !isValidStockName(name, t)) continue;
            saveStockNameToSheet(t, name, "股池同步");
            n++;
            if (n % 200 === 0) Utilities.sleep(50);
        }
        clearSheetCache();
        Logger.log("✅ 股池→快取 " + n + " 檔");
        return n;
    } catch (e) { return 0; }
}

function buildFullStockPool() {
    try {
        const ss = SpreadsheetApp.openById(CONFIG.SS_ID);
        let sh = ss.getSheetByName(CONFIG.SHEETS.STOCK_POOL);
        if (!sh) sh = ss.insertSheet(CONFIG.SHEETS.STOCK_POOL);
        sh.clear();
        sh.appendRow(["代號", "股名", "市場"]);
        const list = [];
        const twse = httpGetJson("https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL");
        if (Array.isArray(twse)) twse.forEach(x => { if (x.Code) list.push([normalizeTicker(x.Code), S(x.Name).trim(), "TWSE"]); });
        const tpex = httpGetJson("https://www.tpex.org.tw/openapi/v1/tpex_mainboard_peratio_analysis");
        if (Array.isArray(tpex)) tpex.forEach(x => {
            const c = x.stockNo || x.symbol;
            if (c) list.push([normalizeTicker(c), S(x.name).trim(), "TPEx"]);
        });
        const map = new Map();
        list.forEach(r => { if (r[0] && r[1]) map.set(r[0], r); });
        const finalList = Array.from(map.values());
        if (finalList.length) sh.getRange(2, 1, finalList.length, 3).setValues(finalList);
        sh.setFrozenRows(1);
        clearSheetCache();
        Logger.log("✅ STOCK_POOL " + finalList.length + " 檔");
        return finalList.length;
    } catch (e) { Logger.log("buildFullStockPool: " + e.message); return 0; }
}

// ============================================================================
// 當沖/波段分離權重
// ============================================================================

function getWeights(isSwing) {
    const shName = isSwing ? CONFIG.SHEETS.WEIGHTS_SW : CONFIG.SHEETS.WEIGHTS_DAY;
    try {
        const data = getSheetData(shName);
        const w = {};
        for (let i = 1; i < data.length; i++) if (data[i][0]) w[data[i][0]] = N(data[i][1], 1.0);
        return Object.keys(w).length ? w : defaultW();
    } catch(e) { return defaultW(); }
}

function defaultW() {
    return { trend:1, volume:1, signal:1, quality:1, event:1, pos:1, range:1, scan:1, vwap:1, rsi:0.8, kd:0.8, macd:0.7, adx:0.6, bb:0.5 };
}

function saveWeights(isSwing, w, _skipVersion) {
    const shName = isSwing ? CONFIG.SHEETS.WEIGHTS_SW : CONFIG.SHEETS.WEIGHTS_DAY;
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(shName);
        const rows  = Object.entries(w).map(([k,v]) => [k, +N(v).toFixed(4)]);
        const last = sheet.getLastRow();
        if (last > 1) sheet.getRange(2, 1, last - 1, 2).clearContent();
        if (rows.length) sheet.getRange(2, 1, rows.length, 2).setValues(rows);
        invalidateSheet(shName);
    } catch(e) {}
}

// ============================================================================
// 個股記憶
// ============================================================================

function getStockMem(ticker) {
    try {
        const data = getSheetData(CONFIG.SHEETS.STOCK_MEM);
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === ticker) return {
                n:N(data[i][1]), realWR:N(data[i][2],50), streak:N(data[i][3]),
                avgDrift:N(data[i][4]), avgVol:N(data[i][5],0.012),
                bias:_json(data[i][6],{}), bestSlAtr:N(data[i][7]), bestTpAtr:N(data[i][8]),
                lastSignalBars:N(data[i][9]), row:i+1
            };
        }
    } catch(e) {}
    return { n:0, realWR:50, streak:0, avgDrift:0, avgVol:0.012, bias:{}, bestSlAtr:0, bestTpAtr:0, lastSignalBars:0, row:null };
}

function saveStockMem(ticker, m) {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.STOCK_MEM);
        const row = [ticker, m.n, +N(m.realWR,50).toFixed(2), m.streak||0,
                     +N(m.avgDrift).toFixed(4), +N(m.avgVol,0.012).toFixed(6),
                     JSON.stringify(m.bias||{}), +N(m.bestSlAtr).toFixed(3),
                     +N(m.bestTpAtr).toFixed(3), m.lastSignalBars||0];
        if (m.row) setSheetRow(sheet, m.row, 1, row);
        else       sheet.appendRow(row);
        invalidateSheet(CONFIG.SHEETS.STOCK_MEM);
    } catch(e) {}
}

function markNewSignal(ticker) {
    const m = getStockMem(ticker);
    m.lastSignalBars = 0;
    saveStockMem(ticker, m);
}

// ============================================================================
// 記錄
// ============================================================================

function saveLog(tv, stock, vote, confCalib, market, winRate, regime, decision) {
    try {
        const row = [
            new Date(),
            tv.type,
            tv.ticker,
            stock.displayName || stock.ticker,
            tv.price,

            winRate,
            vote.conf,
            vote.grade,

            vote.entry,
            tv.event,

            vote.rr,
            decision.zh,

            N(tv.trend),
            N(tv.vol_ratio),
            regime.name,

            vote.prices.sl,
            vote.prices.tp,

            tv.atr || 0,
            tvSnapshotJson(tv)
        ];

        SpreadsheetApp.openById(CONFIG.SS_ID)
            .getSheetByName(CONFIG.SHEETS.LOG)
            .appendRow(row);

        invalidateSheet(CONFIG.SHEETS.LOG);
    } catch (e) {
        Logger.log("❌ saveLog: " + e);
    }
}

function tvSnapshotJson(tv) {
    return JSON.stringify({
        trend: tv.trend, vol_ratio: tv.vol_ratio, strength: tv.strength, quality: tv.quality,
        scan: tv.scan, bo: tv.bo, pb: tv.pb, v: tv.v, range_r: tv.range_r, position: tv.position,
        fake_break: tv.fake_break, atr: tv.atr, vwap: tv.vwap, ma5: tv.ma5, ma10: tv.ma10, ma20: tv.ma20,
        close_ma20_diff: tv.close_ma20_diff, rsi: tv.rsi, kd_k: tv.kd_k, kd_d: tv.kd_d,
        macd: tv.macd, macd_sig: tv.macd_sig, adx: tv.adx, bb_pos: tv.bb_pos, event: tv.event
    });
}

function saveLearning(tv, vote, winRate, regime) {
    try {
        SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.LEARNING).appendRow([
            new Date(), tv.ticker, tv.price, vote.entry,
            +vote.conf.toFixed(1), winRate, tv.event,
            "",
            "待回饋",
            JSON.stringify(vote.usedWeights),
            tv.vol_ratio, tv.scan, N(tv.atr)||"",
            tv.type,
            getPatternKey(tv),
            (regime && regime.type) ? regime.type : "RANGE",
            N(tv.position, 0.5),
            "", "", "",
            tvSnapshotJson(tv),
            "",
            vote.prices.sl,
            vote.prices.tp,
            ""
        ]);
        invalidateSheet(CONFIG.SHEETS.LEARNING);
    } catch(e) {}
}

// ============================================================================
// 自動回填漲幅
// ============================================================================

function canAutoFillLearningRow(signalTime, isSwing) {
    const sigDate = taipeiDateStr(signalTime);
    const today   = taipeiDateStr(new Date());
    const h       = taipeiHour();
    if (sigDate < today) return true;
    if (sigDate === today && h >= CONFIG.AI.AUTO_FILL_AFTER_HOUR) return true;
    return false;
}

function resolveExitDateYmd(signalTime, isSwing) {
    const sigDate = taipeiDateStr(signalTime);
    const today   = taipeiDateStr(new Date());
    if (!isSwing) return sigDate;
    const sigT = new Date(signalTime).getTime();
    const maxMs = CONFIG.AI.SWING_MAX_HOLD_DAYS * 86400000;
    if (today > sigDate) return today;
    if (new Date().getTime() - sigT >= maxMs) return today;
    if (sigDate === today && taipeiHour() >= CONFIG.AI.AUTO_FILL_AFTER_HOUR) return today;
    return null;
}

function calcReturnPct(entry, exitPrice) {
    entry = N(entry);
    exitPrice = N(exitPrice);
    if (entry <= 0 || exitPrice <= 0) return null;
    return +((exitPrice - entry) / entry * 100).toFixed(2);
}

function fetchCloseYahooChart(ticker, dateYmd) {
    const symbols = [`${ticker}.TW`, `${ticker}.TWO`];
    for (let s = 0; s < symbols.length; s++) {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbols[s])}?interval=1d&range=3mo`;
        const j   = httpGetJson(url, 15000);
        const res = j && j.chart && j.chart.result && j.chart.result[0];
        if (!res) continue;
        const ts  = res.timestamp || [];
        const cl  = res.indicators && res.indicators.quote && res.indicators.quote[0] && res.indicators.quote[0].close;
        if (!cl) continue;
        for (let i = ts.length - 1; i >= 0; i--) {
            if (!cl[i]) continue;
            const d = taipeiDateStr(new Date(ts[i] * 1000));
            if (d === dateYmd) return { price: N(cl[i]), source: "YahooChart" };
        }
        const today = taipeiDateStr(new Date());
        if (dateYmd === today && res.meta && N(res.meta.regularMarketPrice) > 0) {
            return { price: N(res.meta.regularMarketPrice), source: "Yahoo即時" };
        }
    }
    return null;
}

function fetchCloseYahooQuote(ticker) {
    const symbols = [`${ticker}.TW`, `${ticker}.TWO`];
    for (let i = 0; i < symbols.length; i++) {
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols[i])}`;
        const j   = httpGetJson(url);
        const d   = j && j.quoteResponse && j.quoteResponse.result && j.quoteResponse.result[0];
        const p   = N(d && (d.regularMarketPrice || d.postMarketPrice));
        if (p > 0) return { price: p, source: "YahooQuote" };
    }
    return null;
}

function fetchCloseTwseMis(ticker) {
    const tries = [`tse_${ticker}.tw`, `otc_${ticker}.tw`];
    for (let i = 0; i < tries.length; i++) {
        const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${tries[i]}&json=1&delay=0`;
        const j   = httpGetJson(url);
        if (!j || !j.msgArray || !j.msgArray.length) continue;
        const first = j.msgArray[0];
        let p = 0;
        if (typeof first === "string") {
            const parts = first.split("\t");
            p = N(parts[2] || parts[1]);
        } else if (first && typeof first === "object") {
            p = N(first.z || first.y || first.b || first.a);
        }
        if (p > 0) return { price: p, source: "TWSE即時" };
    }
    return null;
}

function fetchExitPriceMultiApi(ticker, dateYmd) {
    const today = taipeiDateStr(new Date());
    let r = fetchCloseYahooChart(ticker, dateYmd);
    if (r && r.price > 0) return r;
    if (dateYmd === today) {
        r = fetchCloseTwseMis(ticker);
        if (r && r.price > 0) return r;
        r = fetchCloseYahooQuote(ticker);
        if (r && r.price > 0) return r;
    }
    return null;
}

function appendAutoTradeRecord(row) {
    try {
        const sh = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.AUTO_TRADES);
        const stock = getStock(row.ticker);
        sh.appendRow([
            new Date(), row.ticker, stock.displayName || row.ticker,
            row.type, row.entry, row.exit, row.pct, row.source, row.exitDate, row.status
        ]);
        invalidateSheet(CONFIG.SHEETS.AUTO_TRADES);
    } catch (e) {}
}

function autoFillPendingReturns() {
    clearSheetCache();
    const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.LEARNING);
    const data  = sheet.getDataRange().getValues();
    let filled = 0;

    for (let i = 1; i < data.length; i++) {
        if (S(data[i][8]) !== "待回饋") continue;
        if (data[i][7] !== "" && data[i][7] !== null) continue;

        const signalTime = new Date(data[i][0]);
        const ticker     = normalizeTicker(data[i][1]);
        const entry      = N(data[i][3]) || N(data[i][2]);
        const isSwing    = S(data[i][13]) === "波段";

        if (!ticker || entry <= 0) continue;
        if (!canAutoFillLearningRow(signalTime, isSwing)) continue;

        const exitDate = resolveExitDateYmd(signalTime, isSwing);
        if (!exitDate) continue;

        const sl = N(data[i][22]);
        const tp = N(data[i][23]);
        let pct = null;
        let pxInfo = null;

        if (!isSwing && sl > 0 && tp > 0) {
            const ohlc = fetchDayOhlc(ticker, exitDate);
            if (ohlc) {
                const out = resolveIntradayOutcome(entry, sl, tp, ohlc);
                if (out) {
                    pct = out.pct;
                    pxInfo = { price: out.exit, source: out.method + "/" + ohlc.source, fillMethod: out.method };
                    if (sheet.getLastColumn() >= 22) {
                        sheet.getRange(i + 1, 22).setValue(out.isWin ? "勝" : out.isLoss ? "敗" : "平");
                    }
                }
            }
        }

        if (pct === null) {
            const px = fetchExitPriceMultiApi(ticker, exitDate);
            if (!px || px.price <= 0) {
                Logger.log(`⚠️ ${ticker} ${exitDate} 無法取得出場價`);
                continue;
            }
            pct = calcReturnPct(entry, px.price);
            pxInfo = { price: px.price, source: px.source || "close" };
        }

        if (pct === null) continue;

        sheet.getRange(i + 1, 8).setValue(pct);
        if (sheet.getLastColumn() >= 18) {
            sheet.getRange(i + 1, 18).setValue(pxInfo.price);
            sheet.getRange(i + 1, 19).setValue(pxInfo.source);
            sheet.getRange(i + 1, 20).setValue(exitDate);
        }
        if (sheet.getLastColumn() >= 25) {
            sheet.getRange(i + 1, 25).setValue(pxInfo.fillMethod || pxInfo.source || "收盤");
        }

        appendAutoTradeRecord({
            ticker, type: isSwing ? "波段" : "當沖", entry,
            exit: pxInfo.price, pct, source: pxInfo.source, exitDate, status: "待學習"
        });

        filled++;
        Logger.log(`📈 自動回填 ${ticker} 進場${entry}→出場${pxInfo.price} (${pxInfo.source}) 漲幅${pct}%`);
        Utilities.sleep(350);
    }

    invalidateSheet(CONFIG.SHEETS.LEARNING);
    Logger.log(`✅ 自動回填完成：${filled} 筆`);
    return filled;
}

function 自動回填漲幅並學習() {
    try {
        const filled  = autoFillPendingReturns();
        const learned = 執行回饋自學();
        let btOk = false;
        if (learned >= 3) {
            try { 執行自動回測(); btOk = true; } catch (e) { Logger.log("回測: " + e.message); }
        }
        if (filled > 0 || learned > 0) {
            const today = taipeiDateStr(new Date());
            const msg = `\n📋 AI自動回測閉環 ${today}\n${"━".repeat(22)}\n` +
                `自動回填：${filled} 筆\n自學更新：${learned} 筆\n` +
                (btOk ? "已產生回測報告\n" : "") +
                `詳見試算表 AI_AUTO_TRADES / AI_LEARNING\n${"━".repeat(22)}`;
            push("當沖", msg);
        }
        return { filled, learned, btOk };
    } catch (e) {
        Logger.log("❌ 自動回填漲幅並學習: " + e.message);
        return { filled: 0, learned: 0, btOk: false };
    }
}

function 測試_自動回填() {
    const r = 自動回填漲幅並學習();
    Logger.log("測試結果: " + JSON.stringify(r));
}

// ============================================================================
// 🧬 真實自學閉環
// ============================================================================

function 執行回饋自學() {
    try {
        clearSheetCache();
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.LEARNING);
        const data  = sheet.getDataRange().getValues();
        let done = 0;

        for (let i = 1; i < data.length; i++) {
            if (S(data[i][8]) !== "待回饋") continue;
            if (data[i][7] === "" || data[i][7] === null) continue;

            const ticker     = normalizeTicker(S(data[i][1]));
            const entry      = N(data[i][3]) || N(data[i][2]);
            const conf       = N(data[i][4]);
            const pct        = N(data[i][7]);
            const event      = S(data[i][6]);
            const wSnap      = _json(data[i][9], null);
            const volR       = N(data[i][10], 1);
            const atr        = N(data[i][12]);
            const isSwing    = S(data[i][13]) === "波段";
            const patternKey = S(data[i][14]);
            const regimeType = S(data[i][15]);
            const position   = N(data[i][16], 0.5);
            const tvSnap     = _json(data[i][20], {});

            const market = getMarket(false);
            const mm = getMarketMode(market);
            const dq = calcDataQualityScore(Object.assign({ vol_ratio: volR, atr: atr, fake_break: tvSnap.fake_break }, tvSnap));
            if (dq < CONFIG.AI.MIN_DATA_QUALITY) {
                sheet.getRange(i + 1, 9).setValue("已跳過");
                if (sheet.getLastColumn() >= 25) sheet.getRange(i + 1, 25).setValue("低品質");
                continue;
            }
            if (volR < CONFIG.AI.MIN_VOL_RATIO) {
                sheet.getRange(i + 1, 9).setValue("已跳過");
                if (sheet.getLastColumn() >= 25) sheet.getRange(i + 1, 25).setValue("低量");
                continue;
            }
            if (!shouldAllowLearning(event, market, mm, isSwing, tvSnap)) {
                sheet.getRange(i + 1, 9).setValue("已跳過");
                if (sheet.getLastColumn() >= 25) sheet.getRange(i + 1, 25).setValue("盤型gating");
                continue;
            }

            const preRes = S(data[i][21]);
            let isWin, isLoss;
            if (preRes === "勝" || preRes === "敗" || preRes === "平") {
                isWin = preRes === "勝";
                isLoss = preRes === "敗";
            } else {
                const outcome = judgeTradeOutcome(pct, entry, atr, entry, isSwing);
                isWin = outcome.isWin;
                isLoss = outcome.isLoss;
            }
            const fakeBreak = N(tvSnap.fake_break) ? 1 : 0;
            const reward = calcLearningReward(pct, isWin, isLoss, fakeBreak);

            if (wSnap) {
                const oldWR = getRecentWR(isSwing, 30);
                _updateGlobalW(wSnap, reward, conf, isSwing, pct);
                if (!performanceGate(isSwing, oldWR)) {
                    rollbackWeights(getLastWeightVersion(isSwing), isSwing);
                    Logger.log("🛡️ Performance Gate 拒絕權重更新 " + (isSwing ? "波段" : "當沖"));
                }
            }

            _updateStockMem(ticker, pct, isWin, wSnap, atr, isLoss);
            if (patternKey) _updatePatternMemByKey(ticker, patternKey, isWin);
            else _updatePatternMemFromFields(ticker, event, volR, position, isWin);

            if (regimeType) updateRegimeMem(regimeType, event, isWin);
            else _updateRegimeFromLog(ticker, event, isWin, data[i][0]);

            const volB = volR >= 2 ? "HIGH" : volR >= 1.2 ? "MID" : "LOW";
            const pKey = patternKey || `${event}+${volB}`;
            updateInteractMem(regimeType || "RANGE", pKey, volB, isWin);
            _updateTimeMem(ticker, taipeiHour(new Date(data[i][0])), isWin);
            updateStrategyPerf(event || "弱訊", regimeType || "RANGE", isSwing, isWin);

            const mem2 = getStockMem(ticker);
            updateBlacklist(ticker, mem2.streak, mem2.realWR);

            if (isLoss && event === "突破" && volR < 1.5) {
                const w = getWeights(false);
                if (N(w.volume) > CONFIG.AI.W_MIN + 0.05) {
                    w.volume = clamp(w.volume - 0.025, CONFIG.AI.W_MIN, CONFIG.AI.W_MAX);
                    saveWeights(false, w);
                }
            }

            sheet.getRange(i+1, 9).setValue("已學習");
            sheet.getRange(i+1, 22).setValue(isWin ? "勝" : isLoss ? "敗" : "平");
            if (sheet.getLastColumn() >= 25) {
                sheet.getRange(i+1, 25).setValue("自學完成");
            }
            done++;
        }

        runSelfCorrection();
        selfPruneTickers();
        runAdaptiveThresholdTuning();
        updateDrawdownState();

        clearSheetCache();
        Logger.log(`✅ 自學完成：${done} 筆`);
        return done;
    } catch(e) { Logger.log("❌ 執行回饋自學: "+e.message); return 0; }
}

function _updateGlobalW(snap, reward, conf, isSwing, pct) {
    if (isLearningFrozen()) return;
    if (Math.abs(N(pct, 0)) < 0.3) return;
    const w = getWeights(isSwing);
    const lr = conf > 80 ? CONFIG.AI.LR_FAST : CONFIG.AI.LR_SLOW;
    const C = CONFIG.AI.W_CENTER;
    const DR = CONFIG.AI.DRIFT_LIMIT;
    const keys = Object.keys(snap);
    const nw = Object.assign({}, w);

    keys.forEach(k => {
        let val = N(w[k], 1.0);
        const sigW = N(snap[k], 1.0);
        val += reward * lr * sigW / Math.sqrt(keys.length);
        val -= (val - C) * CONFIG.AI.REGRESS;
        if (Math.random() < CONFIG.AI.EXPLORE_P) val += (Math.random() - 0.5) * CONFIG.AI.EXPLORE_A;
        val = clamp(val, C - DR, C + DR);
        val = clamp(val, CONFIG.AI.W_MIN, CONFIG.AI.W_MAX);
        nw[k] = val;
    });
    saveWeightVersion(isSwing, "學習前快照");
    saveWeights(isSwing, nw);
}

function _updateStockMem(ticker, pct, isWin, snap, atr, isLoss) {
    const m = getStockMem(ticker);
    m.n++;
    const alpha = clamp((m.n - 1) / m.n, 0, 0.90);
    m.realWR = m.realWR * alpha + (isWin ? 100 : 0) * (1 - alpha);
    if (daysSince(new Date()) > CONFIG.AI.MEMORY_MAX_DAYS) {
        m.realWR = 50 + (m.realWR - 50) * CONFIG.AI.MEMORY_DECAY;
    }
    m.streak = isWin ? Math.max(0, m.streak) + 1 : isLoss ? Math.min(0, m.streak) - 1 : 0;
    m.avgVol = m.avgVol * 0.85 + (Math.abs(pct) / 100) * 0.15;
    m.lastSignalBars = 0;
    if (N(atr) > 0 && isWin) m.bestTpAtr = m.bestTpAtr > 0 ? m.bestTpAtr * 0.85 + (Math.abs(pct / 100) / atr) * 0.15 : Math.abs(pct / 100) / atr;
    if (N(atr) > 0 && isLoss) m.bestSlAtr = m.bestSlAtr > 0 ? m.bestSlAtr * 0.85 + (Math.abs(pct / 100) / atr) * 0.15 : Math.abs(pct / 100) / atr;
    if (snap && m.n >= 5) {
        const reward = clamp(pct / 5, -1, 1) * (isLoss ? CONFIG.AI.LOSS_PENALTY : 1);
        const bias = m.bias || {};
        Object.keys(snap).forEach(k => {
            bias[k] = clamp(N(bias[k]) + reward * 0.014 - N(bias[k]) * 0.018, -0.75, 0.75);
            bias[k] *= CONFIG.AI.MEMORY_DECAY;
        });
        m.bias = bias;
    }
    saveStockMem(ticker, m);
}

function _updatePatternMemByKey(ticker, key, isWin) {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.PATTERN_MEM);
        const data  = getSheetData(CONFIG.SHEETS.PATTERN_MEM);
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === ticker && data[i][1] === key) {
                const n = N(data[i][2]) + 1, w = N(data[i][3]) + (isWin ? 1 : 0);
                setSheetRow(sheet, i + 1, 3, [n, w, +bayes(w, n).toFixed(1)]);
                invalidateSheet(CONFIG.SHEETS.PATTERN_MEM);
                return;
            }
        }
        sheet.appendRow([ticker, key, 1, isWin ? 1 : 0, +bayes(isWin ? 1 : 0, 1).toFixed(1), new Date()]);
        invalidateSheet(CONFIG.SHEETS.PATTERN_MEM);
    } catch(e) {}
}

function _updatePatternMemFromFields(ticker, event, volR, position, isWin) {
    const sig = event === "突破" ? "突破" : event === "回踩" ? "回踩" : event === "量能" ? "量能" : "弱訊";
    const tv = {
        vol_ratio: volR,
        position: position,
        bo: sig === "突破" ? 1 : 0,
        pb: sig === "回踩" ? 1 : 0,
        v:  sig === "量能" ? 1 : 0
    };
    _updatePatternMemByKey(ticker, getPatternKey(tv), isWin);
}

function _updateRegimeFromLog(ticker, event, isWin, ts) {
    try {
        const logData = getSheetData(CONFIG.SHEETS.LOG);
        const row = logData.slice(1).reverse().find(r =>
            r[2] === ticker && Math.abs(new Date(r[0]) - new Date(ts)) < 120000
        );
        if (!row) return;
        const regType = row[30] ? S(row[30]) : regimeTypeFromLogCell(row[21]);
        updateRegimeMem(regType, event, isWin);
    } catch(e) {}
}

function _updateTimeMem(ticker, hour, isWin) {
    const slot = hourToSlot(hour);
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.TIME_MEM);
        const data  = getSheetData(CONFIG.SHEETS.TIME_MEM);
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === ticker && data[i][1] === slot) {
                const n = N(data[i][2]) + 1, w = N(data[i][3]) + (isWin ? 1 : 0);
                setSheetRow(sheet, i + 1, 3, [n, w]);
                invalidateSheet(CONFIG.SHEETS.TIME_MEM);
                return;
            }
        }
        sheet.appendRow([ticker, slot, 1, isWin ? 1 : 0]);
        invalidateSheet(CONFIG.SHEETS.TIME_MEM);
    } catch(e) {}
}

// ============================================================================
// 💬 推理說明
// ============================================================================

function buildReason(tv, conf, mem, patMem, isSwing, market, regime, resN, resBoost, timeMem, blInfo) {
    blInfo = blInfo || { danger: false, level: "正常", reason: "" };
    const parts = [];
    parts.push(tv.bo ? "突破進攻" : tv.pb ? "回踩守支" : tv.v ? "量能爆發" : "弱訊觀望");
    parts.push(isSwing ? "【波段】" : "【當沖】");
    parts.push(regime.name);
    if (resN >= 3) parts.push(`⚡共振${resN}重(+${resBoost})`);
    parts.push(tv.trend > 30 ? "強升勢" : tv.trend > 5 ? "溫升" : tv.trend < -30 ? "強跌" : tv.trend < -5 ? "溫跌" : "盤整");
    parts.push(tv.vol_ratio > 2.5 ? "爆天量" : tv.vol_ratio > 1.8 ? "大量" : tv.vol_ratio > 1.3 ? "中量" : "縮量");
    if (tv.vwap > 0) parts.push(tv.price > tv.vwap ? "VWAP上方" : "VWAP下方⚠️");
    if (tv.fake_break) parts.push("⚠️假突破風險");
    if (patMem.n >= CONFIG.AI.MIN_SAMPLE) parts.push(`型態[${patMem.key}]Bayes勝率${patMem.bayesWR.toFixed(0)}%/${patMem.n}筆`);
    if (mem.n >= CONFIG.AI.MIN_SAMPLE) {
        parts.push(`個股${mem.n}筆真實勝率${N(mem.realWR,50).toFixed(0)}%`);
        if (N(mem.streak)>=3)  parts.push("連勝🔥");
        if (N(mem.streak)<=-3) parts.push("⚠️連敗");
    } else {
        parts.push(`個股${mem.n||0}筆(學習中)`);
    }
    if (timeMem.n >= 5) parts.push(`${timeMem.slot}勝率${timeMem.winRate.toFixed(0)}%`);
    if (blInfo.level === "警戒") parts.push("⚠️警戒股");
    return parts.join(" | ");
}

// ============================================================================
// 🎨 V18/V19 訊號壓縮 + 職業級三層 UI
// ============================================================================

// ============================================================================
// 🎯 V19.2 修正：computeSignalCompression
// 根因：TV已篩選訊號，GAS不應再從零計分
// 修正：① TV訊號加成 ② 冷啟動patSc用指標估算 ③ 整體分布校正
// ============================================================================

function getRiskLevel(vote, tv, mm, decision) {
    let r = 50;
    r += (100 - N(vote.brains.risk, 50)) * 0.3;
    r += N(vote.uncertainty, 10) * 1.2;
    if (tv.fake_break)                r += 25;
    if (mm && mm.mode === "HIGH_VOL") r += 15;
    if (mm && mm.mode === "CRASH")    r += 40;
    if (N(vote.rr) < 1.2)            r += 12;
    r = clamp(r, 0, 100);
    if (r >= 65) return { en: "HIGH", zh: "高", bar: "▓▓▓░░" };
    if (r >= 38) return { en: "MID",  zh: "中", bar: "▓▓░░░" };
    return        { en: "LOW",  zh: "低", bar: "▓░░░░" };
}

function computeSignalCompression(vote, tv, market, regime, patMem, mem, winRate, mm, decision) {
    const trendSc  = N(vote.brains.trend, 50);
    const volSc    = N(vote.brains.vol, 50);

    // ✅ 修正①：patSc冷啟動用TV指標估算，不再固定50
    let patSc;
    if (patMem.n >= CONFIG.AI.MIN_SAMPLE) {
        patSc = patMem.bayesWR;
    } else {
        // TV已過濾，bo/pb/v都是有效訊號，冷啟動給予合理起始分
        let base = 52;
        if (tv.bo  && !tv.fake_break) base += 10;
        if (tv.pb)                    base += 8;
        if (tv.v   && N(tv.vol_ratio) > 1.5) base += 6;
        if (N(tv.vol_ratio) > 2.0)    base += 5;
        if (N(tv.trend) > 15)         base += 5;
        if (N(tv.adx) > 25)           base += 4;
        if (N(tv.rsi) > 50 && N(tv.rsi) < 75) base += 3;
        if (tv.fake_break)            base -= 18;
        patSc = clamp(base, 35, 80);
    }

    const regimeSc = clamp(N(regime.confMult, 1) * 54, 30, 88);  // ✅ 修正②：基準從52→54
    const riskSc   = N(vote.brains.risk, 50);

    let finalScore = trendSc * 0.25 + volSc * 0.22 + patSc * 0.20 + regimeSc * 0.18 + riskSc * 0.15;

    // ✅ 修正③：TV訊號直接加成（TV已做第一層篩選，這是應得的）
    if (tv.bo && !tv.fake_break) finalScore += 8;
    else if (tv.pb)              finalScore += 6;
    else if (tv.v)               finalScore += 5;

    // 量能加成
    const vr = N(tv.vol_ratio, 1);
    if (vr > 2.5)      finalScore += 6;
    else if (vr > 1.8) finalScore += 4;
    else if (vr > 1.3) finalScore += 2;

    // 懲罰
    if (tv.fake_break)              finalScore *= 0.72;
    if (mm && mm.mode === "CRASH")  finalScore *= 0.50;
    if (mm && mm.mode === "HIGH_VOL") finalScore *= 0.88;

    finalScore = clamp(finalScore, 0, 100);

    let mainSignal = "⏸ 觀望";
    if      (finalScore >= 78 && tv.bo) mainSignal = "🚀 突破強多";
    else if (finalScore >= 72 && tv.pb) mainSignal = "👣 回踩做多";
    else if (finalScore >= 68 && tv.v)  mainSignal = "📊 量能啟動";
    else if (finalScore >= 55)          mainSignal = "📈 偏多觀察";
    else if (finalScore >= 45)          mainSignal = "⏸ 觀望";
    else                                mainSignal = "⚠️ 高風險";

    const badge  = getTradeBadge(finalScore, N(winRate), N(vote.rr), tv, decision, mem);
    const risk   = getRiskLevel(vote, tv, mm);
    const action = getConclusionAction(tv, finalScore, decision, badge);

    return {
        finalScore: +finalScore.toFixed(1),
        mainSignal,
        trendSc, volSc, patSc, regimeSc, riskSc,
        badge, risk, action,
        reasons: compressReasons(tv, vote, patMem, regime, mm, mem)
    };
}

// ============================================================================
// 🏆 V19.2 修正：getTradeBadge
// 根因：winRate門檻對冷啟動不友善，新系統全卡C
// 修正：依樣本數動態調整門檻，樣本夠才嚴格
// ============================================================================

function getTradeBadge(score, winRate, rr, tv, decision, mem) {
    if (tv.fake_break && tv.bo)
        return { en: "C", zh: "🔴 C", hint: "假突破，禁止" };
    if (decision && decision.en === "BLACKLIST")
        return { en: "C", zh: "🔴 C", hint: "黑名單，禁止" };

    const n = mem ? N(mem.n, 0) : 0;

    // 冷啟動（樣本不足10筆）：放寬winRate門檻，以分數為主
    const coldStart = n < 10;
    const sConf = getAI("BADGE_S_CONF") || 76;
    const aConf = getAI("BADGE_A_CONF") || 68;
    const bConf = getAI("BADGE_B_CONF") || 58;

    if (coldStart) {
        // 冷啟動：winRate門檻降低，讓分數說話
        if (score >= sConf && rr >= 1.4) return { en: "S", zh: "🟢 S", hint: "強訊號（新)" };
        if (score >= aConf && rr >= 1.2) return { en: "A", zh: "🟡 A", hint: "可試單（新)" };
        if (score >= bConf)              return { en: "B", zh: "🟠 B", hint: "小倉觀察" };
    } else {
        // 資料充足：恢復嚴格模式
        const wrS = n >= 30 ? 63 : 58;
        const wrA = n >= 30 ? 56 : 52;
        if (score >= sConf && winRate >= wrS && rr >= 1.5) return { en: "S", zh: "🟢 S", hint: "重倉" };
        if (score >= aConf && winRate >= wrA && rr >= 1.2) return { en: "A", zh: "🟡 A", hint: "可試單" };
        if (score >= bConf)                                return { en: "B", zh: "🟠 B", hint: "小倉" };
    }

    return { en: "C", zh: "🔴 C", hint: "觀望" };
}

// ============================================================================
// 📱 V19.2：buildMsg 精簡版（去掉多餘說明，只留關鍵數字）
// 設計原則：1秒內看懂 → 做/不做
// ============================================================================

function buildMsg(tv, stock, vote, confCalib, market, winRate, regime, patMem, blInfo, decision, timeMem, route, mm, compress, strategy) {
    blInfo   = blInfo   || { danger: false, level: "正常", reason: "" };
    route    = route    || getPushRoute(tv.type);
    mm       = mm       || getMarketMode(market);
    compress = compress || getRiskLevel(vote, tv, mm);
    strategy = strategy || routeStrategyModel(route.mode === "波段", mm, compress);

    const now   = Utilities.formatDate(new Date(), "Asia/Taipei", "MM/dd HH:mm");
    const sign  = vote.entryTD >= 0 ? "+" : "";
    const name  = stock.nameOk ? `${stock.ticker} ${stock.name}` : stock.ticker;
    const atrMark = tv._atrEst ? "*" : "";
    const rrLine = `1:${vote.rr}`;

    // 技術快照：只留最有用的5個
    const techLine = [
        `RSI ${fmtTvNum(tv.rsi,0)}`,
        `KD ${fmtTvNum(tv.kd_k,0)}/${fmtTvNum(tv.kd_d,0)}`,
        `ADX ${fmtTvNum(tv.adx,0)}`,
        `量 ${N(tv.vol_ratio).toFixed(1)}x`,
        tv.bb_pos != null ? `BB ${(tv.bb_pos*100).toFixed(0)}%` : ""
    ].filter(Boolean).join("  ");

    // 上次學習錯誤（只在有的時候顯示）
    const learnFb = getLastLearningFeedback(tv.ticker);
    const fbLine  = learnFb ? `⚡修正 ${learnFb[0]}` : "";

    return `${route.emoji} **${name}** ${now}
━━━━━━━━━━━━━━━━━━━
${compress.badge.zh} ${compress.mainSignal}  壓縮 **${compress.finalScore}%**
信心 **${vote.conf.toFixed(0)}%**  勝率 **${winRate}%**  風險 **${compress.risk.zh}**
━━━━━━━━━━━━━━━━━━━
💰 進場 **${vote.entry}**（${sign}${vote.entryTD}T）
   SL **${vote.prices.sl}**  TP **${vote.prices.tp}**  RR ${rrLine}
━━━━━━━━━━━━━━━━━━━
${compress.reasons.map(r=>`· ${r}`).join("\n")}
${fbLine}
━━━━━━━━━━━━━━━━━━━
${techLine}
${regime.name}  ${mm.zh}  ATR${atrMark} ${fmtTvNum(tv.atr,2)}
📡 ${route.mode} · ${SYSTEM_VERSION}`;
}

// compact版不變，維持原本精簡格式
function buildMsgCompact(tv, stock, vote, compress, route, decision, winRate, strategy) {
    const title = stock.nameOk ? `${stock.ticker} ${stock.name}` : stock.ticker;
    return `${route.emoji} ${title}
${compress.badge.zh} ${compress.mainSignal} · 壓縮${compress.finalScore}% · 信心${vote.conf.toFixed(0)}%
進場${vote.entry} SL${vote.prices.sl} TP${vote.prices.tp}
${compress.reasons.slice(0,2).join(" · ")} · ${SYSTEM_VERSION}`;
}

// ============================================================================
// 📡 推送（Discord分流 + Telegram單源）
// ============================================================================

function pushDiscord(webhook, msg, mode) {
    if (!webhook || webhook.indexOf("discord.com") < 0) {
        Logger.log("❌ Discord Webhook 未設定：" + mode);
        return;
    }
    const body = JSON.stringify({ content: msg.length > 1900 ? msg.slice(0, 1890) + "\n…(截斷)" : msg });
    try {
        const res = UrlFetchApp.fetch(webhook, {
            method: "post", contentType: "application/json",
            payload: body, muteHttpExceptions: true
        });
        if (res.getResponseCode() === 429) {
            Utilities.sleep(800);
            UrlFetchApp.fetch(webhook, { method: "post", contentType: "application/json", payload: body, muteHttpExceptions: true });
        }
    } catch (e) {
        Logger.log("Discord失敗(" + mode + "):" + e);
    }
}

function pushTelegram(msg, mode) {
    const token = getSecret("TG_TOKEN", CONFIG.TG_TOKEN);
    const chatId = getSecret("TG_CHAT_ID", CONFIG.TG_CHAT_ID);
    if (!token || !chatId) return;
    const prefix = mode === "波段" ? "🟢【波段】" : "🔴【當沖】";
    const text = (prefix + "\n" + msg).slice(0, 4090);
    try {
        UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "post",
            payload: { chat_id: chatId, text: text },
            muteHttpExceptions: true
        });
    } catch (e) {
        Logger.log("Telegram失敗");
    }
}

function push(type, msgFull, msgCompact) {
    const route = getPushRoute(type);
    pushDiscord(route.webhook, msgFull, route.mode);
    pushTelegram(msgCompact || msgFull.slice(0, 800), route.mode);
    Logger.log("📡 已推送 " + route.tag + " → DC完整 / TG精簡");
}

// ============================================================================
// ⚙️ 一鍵初始化
// ============================================================================

function 一鍵初始化() {
    try {
        const ss = SpreadsheetApp.openById(CONFIG.SS_ID);

        const schemas = {
            "AI_LOG": [
                "時間","類型","代號","名稱","現價","勝率%","市場狀態",
                "支撐","壓力","停損","停利",
                "信心(原始)","信心(校正)","等級","進場價","進場TICK差",
                "訊號類型","成交率","趨勢強度","量能倍率",
                "風報比","盤型","掃描Lv","共振數","決策",
                "ATR","腦①突破","腦②趨勢","腦③量能","腦④風控","盤型代碼",
                "不確定性","穩定度","交互Key"
            ],
            "AI_WEIGHTS_DAY":  ["維度","值","說明"],
            "AI_WEIGHTS_SWING":["維度","值","說明"],
            "AI_LEARNING": [
                "時間","代號","現價","進場價","信心度","預測勝率",
                "訊號類型","實際漲幅%（自動）","狀態","權重快照",
                "量能倍率","掃描","ATR","當沖波段","型態Key","盤型代碼","位階",
                "出場價","價格來源","計價日","TV快照JSON",
                "勝敗結果","停損價","停利價","回填方式"
            ],
            "AI_AUTO_TRADES": ["回填時間","代號","股名","類型","進場價","出場價","漲幅%","API來源","計價日","狀態"],
            "AI_STOCK_MEM": ["代號","樣本數","真實勝率%","連勝連敗","平均Drift","平均波動率","個股偏移JSON","最佳SL_ATR","最佳TP_ATR","上次訊號K棒"],
            "AI_PATTERN_MEM": ["代號","型態Key","樣本數","勝數","Bayes勝率%","更新時間"],
            "AI_REGIME_MEM":  ["盤型","訊號類型","樣本數","勝數","Bayes勝率%"],
            "AI_CALIBRATION": ["信心bucket","校正後勝率%","樣本數"],
            "AI_BLACKLIST":   ["代號","狀態","原因","連勝連敗","更新時間"],
            "AI_TOP_STOCK":   ["代號","名稱","AI信心%","勝率%","綜合分","日期"],
            "AI_BACKTEST":    ["日期","回測天數","勝率%","PF","Sharpe","MDD%","樣本數","勝","敗"],
            "AI_SWING_WATCH": ["時間","代號","名稱","現價","進場","停損","停利","勝率%","等級","狀態","日期"],
            "AI_TIME_MEM":    ["代號","時段","樣本數","勝數"],
            "AI_STOCK_NAMES": ["代號","股名","來源","更新時間"],
            "AI_INTERACT_MEM": ["交互Key","盤型","樣本數","勝數","Bayes勝率%","型態Key","量能段"],
            "AI_SYSTEM": ["鍵","值","說明","更新時間"],
            "STOCK_POOL": ["代號","股名","市場"],
            "AI_SIGNAL_POOL": ["代號","股名","訊號次數","平均信心","最後訊號","池等級"],
            "AI_WEIGHTS_HISTORY": ["版本","模式","權重JSON","原因","時間","當時勝率%"],
            "AI_STRATEGY_PERF": ["Key","策略","盤型","樣本","勝數","Bayes勝率%","模式","更新"],
            "AI_PATTERN_FREEZE": ["Key","型態","凍結","原因","時間"],
            "AI_REGIME_CTRL": ["盤型","啟用","原因","更新"],
            "AI_DASHBOARD": ["日期","當沖30dWR%","波段30dWR%","壓縮門檻","當沖信心門檻","回撤保護","學習凍結","更新"],
            "AI_SIGNAL_DEDUP": ["Key","分數","時間"]
        };

        for (const [name, headers] of Object.entries(schemas)) {
            let sh = ss.getSheetByName(name);
            if (!sh) sh = ss.insertSheet(name);
            if (sh.getLastRow() === 0) {
                sh.getRange(1, 1, 1, headers.length).setValues([headers]);
                sh.setFrozenRows(1);
            } else {
                const h = sh.getRange(1, 1, 1, Math.max(headers.length, sh.getLastColumn())).getValues()[0];
                headers.forEach((v, i) => { if (v && !h[i]) sh.getRange(1, i + 1).setValue(v); });
            }
        }
        clearSheetCache();

        const initW = (shName) => {
            const sh = ss.getSheetByName(shName);
            if (sh.getLastRow() <= 1) {
                sh.getRange(2,1,14,3).setValues([
                    ["trend",1.0,"趨勢"],["volume",1.0,"量能"],["signal",1.0,"訊號"],["quality",1.0,"品質"],
                    ["event",1.0,"事件"],["pos",1.0,"位階"],["range",1.0,"K幅"],["scan",1.0,"掃描"],
                    ["vwap",1.0,"VWAP"],["rsi",0.8,"RSI"],["kd",0.8,"KD"],["macd",0.7,"MACD"],
                    ["adx",0.6,"ADX"],["bb",0.5,"布林"]
                ]);
            }
        };
        initW("AI_WEIGHTS_DAY");
        initW("AI_WEIGHTS_SWING");

        writeSystemKey("VERSION", SYSTEM_VERSION, "系統版本");
        writeSystemKey("TV_PINE", TV_PINE_VERSION, "Pine版本");
        // V19.1：初始化時寫入新的放寬值
        writeSystemKey("ADAPT_COMPRESS_MIN", String(CONFIG.AI.COMPRESS_MIN), "自適應壓縮門檻");
        writeSystemKey("ADAPT_CONF_MIN", String(CONFIG.AI.CONF_MIN), "自適應當沖門檻");
        writeSystemKey("ADAPT_SWING_CONF_MIN", String(CONFIG.AI.SWING_CONF_MIN), "自適應波段門檻");
        writeSystemKey("TARGET_WR", String(CONFIG.AI.TARGET_WR), "目標勝率%");
        writeSystemKey("DRAWDOWN_PROTECT", "0", "回撤保護（初始關閉）");
        PropertiesService.getScriptProperties().setProperty("LEARNING_FROZEN", "0");

        const handlers = ["自動回填漲幅並學習","推送今日最強股","執行自動回測","掃描波段出場",
            "權重正規化","執行自進化維護","每日健康監控","每日晨報"];
        ScriptApp.getProjectTriggers().filter(t => handlers.indexOf(t.getHandlerFunction()) >= 0).forEach(t => ScriptApp.deleteTrigger(t));

        ScriptApp.newTrigger("每日健康監控").timeBased().atHour(8).nearMinute(30).everyDays(1).create();
        ScriptApp.newTrigger("每日晨報").timeBased().atHour(8).nearMinute(45).everyDays(1).create();
        ScriptApp.newTrigger("掃描波段出場").timeBased().atHour(13).nearMinute(20).everyDays(1).create();
        ScriptApp.newTrigger("自動回填漲幅並學習").timeBased().atHour(14).nearMinute(35).everyDays(1).create();
        ScriptApp.newTrigger("推送今日最強股").timeBased().atHour(15).nearMinute(0).everyDays(1).create();
        ScriptApp.newTrigger("執行自動回測").timeBased().atHour(15).nearMinute(30).everyDays(1).create();
        ScriptApp.newTrigger("執行自進化維護").timeBased().atHour(21).nearMinute(0).everyDays(1).create();
        ScriptApp.newTrigger("權重正規化").timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(20).create();

        saveWeightVersion(false, "初始化基線-當沖");
        saveWeightVersion(true, "初始化基線-波段");

        Logger.log("✅ " + SYSTEM_VERSION + " 初始化 | Sheet:" + Object.keys(schemas).length);
        Logger.log("⏰ 08:30健康 08:45晨報 13:20波段 14:35回填 15:00Top 15:30回測 21:00進化");

    } catch(e) { Logger.log("❌ 一鍵初始化: "+e.message); }
}

/**
 * 【V19.1 新增】一鍵重置自適應參數
 * 用途：當 AI_SYSTEM 裡的 ADAPT_* 值被自動調得太高（或 DRAWDOWN_PROTECT=1），執行此函數一鍵恢復
 */
function 重置自適應參數() {
    clearSheetCache();
    writeSystemKey("ADAPT_COMPRESS_MIN", String(CONFIG.AI.COMPRESS_MIN), "V19.1手動重置");
    writeSystemKey("ADAPT_CONF_MIN",     String(CONFIG.AI.CONF_MIN),     "V19.1手動重置");
    writeSystemKey("ADAPT_SWING_CONF_MIN", String(CONFIG.AI.SWING_CONF_MIN), "V19.1手動重置");
    writeSystemKey("DRAWDOWN_PROTECT",   "0",                            "V19.1手動重置");
    writeSystemKey("TARGET_WR",          String(CONFIG.AI.TARGET_WR),   "V19.1手動重置");
    PropertiesService.getScriptProperties().setProperty("LEARNING_FROZEN", "0");
    clearSheetCache();
    const msg = `\n✅ ${SYSTEM_VERSION} 自適應參數已重置\n` +
        `COMPRESS_MIN=${CONFIG.AI.COMPRESS_MIN}  CONF_MIN=${CONFIG.AI.CONF_MIN}  SWING_CONF_MIN=${CONFIG.AI.SWING_CONF_MIN}\n` +
        `TARGET_WR=${CONFIG.AI.TARGET_WR}  DRAWDOWN_PROTECT=OFF  LEARNING_FROZEN=OFF`;
    Logger.log(msg);
    push("當沖", msg);
}

function 一鍵完整部署() {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(120000)) return;
    try {
        一鍵初始化();
        const poolN = buildFullStockPool();
        const cacheN = poolN > 0 ? syncPoolNamesToCache() : 0;
        warmPoolNameCache();
        runAdaptiveThresholdTuning();
        系統健康檢查(true);
        push("當沖", `\n🌌 ${SYSTEM_VERSION} 部署完成\n股池${poolN} 快取${cacheN} 記憶${Object.keys(_poolNameCache||{}).length}\n請跑「V19完整測試」→ 部署 Web App`);
    } finally { lock.releaseLock(); }
}

function 系統健康檢查(silent) {
    const report = { sheetsTotal: 0, sheetsOk: 0, triggers: 0, poolRows: 0, issues: [] };
    report.sheetsTotal = Object.keys(CONFIG.SHEETS).length;
    try {
        const ss = SpreadsheetApp.openById(CONFIG.SS_ID);
        Object.values(CONFIG.SHEETS).forEach(name => {
            const sh = ss.getSheetByName(name);
            if (sh && sh.getLastRow() >= 1) report.sheetsOk++;
            else report.issues.push("缺:" + name);
        });
        report.poolRows = Math.max(0, getSheetData(CONFIG.SHEETS.STOCK_POOL).length - 1);
        if (report.poolRows < 100) report.issues.push("股池不足");
        report.triggers = ScriptApp.getProjectTriggers().length;
        Logger.log("健康 Sheet " + report.sheetsOk + "/" + report.sheetsTotal + " 觸發器" + report.triggers);
        if (!silent && !report.issues.length) push("當沖", "✅ " + SYSTEM_VERSION + " 健康檢查通過");
    } catch (e) { report.issues.push(e.message); }
    return report;
}

// ============================================================================
// 🧪 測試函數
// ============================================================================

function 測試_自進化引擎() {
    Logger.log("=== 自進化引擎測試 ===");
    Logger.log("勝負ATR: " + JSON.stringify(judgeTradeOutcome(2.5, 100, 2, 100, false)));
    Logger.log("品質分: " + calcDataQualityScore({ price: 100, vol_ratio: 1.5, atr: 2 }));
    Logger.log("市場模式: " + getMarketMode(getMarket(true)).zh);
    執行自進化維護();
}

function 測試_V19完整() {
    Logger.log("════ " + SYSTEM_VERSION + " 完整測試 ════");
    warmPoolNameCache();
    系統健康檢查(true);
    測試_股名();
    Utilities.sleep(600);
    測試_推送路由();
    Utilities.sleep(600);
    測試_當沖();
    Utilities.sleep(600);
    測試_波段();
    Utilities.sleep(600);
    測試_假突破();
    Logger.log("✅ V19.1完整測試完成");
}

function 測試_V18完整() { 測試_V19完整(); }
function 測試_V17完整() { 測試_V19完整(); }

function 測試_系統對齊() {
    系統健康檢查(true);
    測試_股名();
    測試_推送路由();
}

function 大盤監控() {
    const m = getMarket();
    const r = getRegime(m);
    Logger.log("=== 大盤狀態 ===");
    Logger.log("狀態：" + m.status);
    Logger.log("VIX：" + m.vix.toFixed(1) + "  動能：" + m.momentum.toFixed(2));
    Logger.log("背離：" + m.gap.toFixed(2) + "  一致性：" + m.consistency.toFixed(0) + "%");
    Logger.log("盤型：" + r.name + "（confMult=" + r.confMult + "）");
}

function 測試_推送路由() {
    const d = getPushRoute("當沖");
    const s = getPushRoute("波段");
    Logger.log("當沖 → " + (d.webhook.indexOf("150925367") >= 0 ? "WEBHOOK_DAY ✓" : "檢查URL"));
    Logger.log("波段 → " + (s.webhook.indexOf("150925380") >= 0 ? "WEBHOOK_SWING ✓" : "檢查URL"));
    push("當沖", "🔴【路由測試】當沖 → 應出現在 DC 當沖頻道 + TG 統一視窗");
    Utilities.sleep(1200);
    push("波段", "🟢【路由測試】波段 → 應出現在 DC 波段頻道 + TG 統一視窗");
    Logger.log("✅ 推送路由測試完成");
}

function 測試_當沖() {
    runAI({
        ticker:"2330", price:720, trend:38, vol_ratio:2.3,
        strength:88, quality:90, scan:3, type:"當沖", event:"突破",
        bo:1, pb:0, v:0, range_r:0.020, position:0.42, fake_break:0,
        atr:8.5, vwap:716, ma5:718, ma10:712, ma20:705,
        close_ma20_diff:2.1, rsi:62, kd_k:72, kd_d:65, macd:1.2, macd_sig:0.8, adx:28
    });
    Logger.log("✅ 當沖測試（2330 突破）");
}

function 測試_波段() {
    runAI({
        ticker:"2454", price:285, trend:14, vol_ratio:1.55,
        strength:76, quality:80, scan:2, type:"波段", event:"回踩",
        bo:0, pb:1, v:0, range_r:0.015, position:0.28, fake_break:0,
        atr:4.2, vwap:283, ma5:284, ma10:282, ma20:278,
        close_ma20_diff:2.5, rsi:48, kd_k:42, kd_d:38
    });
    Logger.log("✅ 波段測試（2454 回踩）");
}

function 測試_假突破() {
    runAI({
        ticker:"2317", price:115, trend:3, vol_ratio:1.1,
        strength:50, quality:52, scan:1, type:"當沖", event:"突破",
        bo:1, pb:0, v:0, range_r:0.007, position:0.82, fake_break:1,
        atr:1.1, vwap:116, ma5:114, ma10:113, ma20:112
    });
    Logger.log("✅ 假突破測試（2317 應大幅降低信心）");
}

function 測試_TICK精確() {
    Logger.log("=== TICK精確度測試 ===");
    const cases = [
        [8.234, "near"],
        [35.678, "up"],
        [72.456, "down"],
        [285.789, "near"],
        [720.5, "up"]
    ];
    cases.forEach(c => {
        const snapped = snapTick(c[0], c[1]);
        Logger.log(`${c[0]} → ${snapped} (tick=${getTick(c[0])})`);
    });
}

function 測試_全系統() {
    Logger.log("══════════════════════════════");
    Logger.log("🌌 " + SYSTEM_VERSION + " 全系統測試");
    Logger.log("══════════════════════════════");
    測試_推送路由();
    Utilities.sleep(800);
    測試_TICK精確();
    Utilities.sleep(800);
    測試_當沖();
    Utilities.sleep(800);
    測試_波段();
    Utilities.sleep(800);
    測試_假突破();
    Logger.log("══════════════════════════════");
    Logger.log("✅ 全系統測試完成");
}

function 權重正規化() {
    normalizeWeights(false, false);
    normalizeWeights(true, false);
    Logger.log("✅ 當沖/波段權重已正規化（拉回中心）");
}

function 解除學習凍結() {
    setLearningFrozen(false, "手動解除");
}

function migrateSecretsToProperties() {
    const p = PropertiesService.getScriptProperties();
    if (CONFIG.WEBHOOK_DAY)   p.setProperty("WEBHOOK_DAY", CONFIG.WEBHOOK_DAY);
    if (CONFIG.WEBHOOK_SWING) p.setProperty("WEBHOOK_SWING", CONFIG.WEBHOOK_SWING);
    if (CONFIG.TG_TOKEN)      p.setProperty("TG_TOKEN", CONFIG.TG_TOKEN);
    if (CONFIG.TG_CHAT_ID)    p.setProperty("TG_CHAT_ID", CONFIG.TG_CHAT_ID);
    Logger.log("✅ 密鑰已寫入 Script Properties（可從程式碼移除明文）");
    push("當沖", "🔐 V19.1 密鑰已外移至 Script Properties");
}

// ============================================================================
// 🎛️ 測試控制台 UI
// ============================================================================

function showTestPanel() {
    openTestConsole();
}

function openTestConsole() {
    try {
        const ui = SpreadsheetApp.getUi();
        const html = HtmlService.createHtmlOutput(getTestPanelHtml_())
            .setWidth(400)
            .setHeight(560);
        ui.showModelessDialog(html, "AI 測試控制台 " + SYSTEM_VERSION);
    } catch (e1) {
        try {
            const html = HtmlService.createHtmlOutput(getTestPanelHtml_())
                .setTitle("AI 測試控制台")
                .setWidth(320);
            SpreadsheetApp.getUi().showSidebar(html);
        } catch (e2) {
            SpreadsheetApp.getUi().alert(
                "無法開啟 UI 面板",
                "請確認：\n1. 在「試算表」內點選單（不是 GAS 編輯器執行）\n2. 已重新整理試算表 F5\n3. 或直接用選單「當沖測試」「波段測試」\n\n錯誤：" + e2.message,
                SpreadsheetApp.getUi().ButtonSet.OK
            );
        }
    }
}

function setupTestConsoleSheet() {
    const ss = SpreadsheetApp.openById(CONFIG.SS_ID);
    const name = "🎛️測試台";
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    sh.clear();
    sh.getRange(1, 1, 13, 3).setValues([
        ["AI 測試控制台", SYSTEM_VERSION, ""],
        ["", "", ""],
        ["操作方式", "說明", ""],
        ["A", "試算表選單 → 🎛️ 測試控制台", "開啟彈窗按鈕"],
        ["B", "選單 → 📊 當沖測試", "等同紅色按鈕"],
        ["C", "選單 → 📈 波段測試", "等同綠色按鈕"],
        ["", "", ""],
        ["注意", "必須在試算表內點選單", "GAS編輯器執行無法開UI"],
        ["", "檔名副檔名須為 .gs", ".TEXT 僅備份用"],
        ["", "", ""],
        ["快速測試", "執行函數名稱", ""],
        ["當沖", "測試_當沖", "2330 突破"],
        ["波段", "測試_波段", "2454 回踩"]
    ]);
    sh.setColumnWidth(1, 120);
    sh.setColumnWidth(2, 280);
    sh.setColumnWidth(3, 160);
    sh.getRange(1, 1, 1, 2).setFontWeight("bold").setFontSize(12);
    sh.setFrozenRows(1);
    ss.setActiveSheet(sh);
    SpreadsheetApp.getUi().alert("已建立「🎛️測試台」分頁\n請用選單 → 🎛️ 測試控制台 開啟按鈕面板");
}

function getTestPanelHtml_() {
    var ver = SYSTEM_VERSION;
    var html = [
        '<!DOCTYPE html><html><head><base target="_top"><meta charset="UTF-8">',
        '<style>',
        'body{font-family:"Segoe UI","Microsoft JhengHei",sans-serif;background:#0d1117;color:#e6edf3;padding:14px;margin:0}',
        '.hdr{text-align:center;padding:10px 0 14px;border-bottom:1px solid #30363d;margin-bottom:14px}',
        '.hdr h1{font-size:15px;margin:0 0 4px}',
        '.ver{font-size:11px;color:#8b949e}',
        '.lbl{font-size:10px;color:#8b949e;margin:0 0 6px 2px;letter-spacing:1px}',
        '.btn{display:block;width:100%;border:none;border-radius:10px;padding:14px;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:8px;color:#fff;text-align:left}',
        '.btn:disabled{opacity:.45;cursor:not-allowed}',
        '.day{background:linear-gradient(135deg,#da3633,#f85149)}',
        '.swing{background:linear-gradient(135deg,#238636,#3fb950)}',
        '.reset{background:linear-gradient(135deg,#6e40c9,#a371f7)}',
        '.sub{display:block;font-size:11px;font-weight:400;opacity:.9;margin-top:4px}',
        '.sub2{background:#21262d;border:1px solid #30363d;color:#c9d1d9;padding:10px;font-size:12px;text-align:center;margin-bottom:8px}',
        '.row{display:flex;gap:8px;margin-bottom:8px}',
        '.row .sub2{flex:1;margin:0}',
        '.log{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:10px;font-size:11px;min-height:64px;white-space:pre-wrap;color:#8b949e}',
        '.log.ok{color:#3fb950;border-color:#238636}',
        '.log.err{color:#f85149;border-color:#da3633}',
        '.log.busy{color:#d29922}',
        '.hint{font-size:10px;color:#6e7681;text-align:center;margin-top:10px}',
        '</style></head><body>',
        '<div class="hdr"><h1>AI 測試控制台</h1><div class="ver">', ver, '</div></div>',
        '<div class="lbl">主力測試</div>',
        '<button class="btn day" id="btnDay" onclick="runDay()">當沖測試<span class="sub">2330 突破 → DC當沖 + TG</span></button>',
        '<button class="btn swing" id="btnSwing" onclick="runSwing()">波段測試<span class="sub">2454 回踩 → DC波段 + TG</span></button>',
        '<div class="lbl">輔助</div>',
        '<div class="row"><button class="sub2" id="btnFake" onclick="runFake()">假突破</button>',
        '<button class="sub2" id="btnRoute" onclick="runRoute()">推送路由</button></div>',
        '<button class="sub2" id="btnFull" onclick="runFull()" style="width:100%;margin-bottom:8px">V19.1 完整測試</button>',
        '<button class="btn reset" id="btnReset" onclick="runReset()">⚙️ 重置自適應參數<span class="sub">一鍵恢復預設門檻值</span></button>',
        '<div class="lbl" style="margin-top:10px">狀態</div>',
        '<div class="log" id="log">就緒。請點按鈕。</div>',
        '<div class="hint">請在試算表選單開啟（非 GAS 編輯器）</div>',
        '<script>',
        'function busy(b){["btnDay","btnSwing","btnFake","btnRoute","btnFull","btnReset"].forEach(function(i){document.getElementById(i).disabled=b;});}',
        'function logMsg(m,c){var e=document.getElementById("log");e.className="log"+(c?" "+c:"");e.textContent=m;}',
        'function done(r){busy(false);logMsg(r&&r.msg?r.msg:"完成",r&&r.ok?"ok":"err");}',
        'function fail(e){busy(false);logMsg("失敗: "+(e.message||e),"err");}',
        'function runDay(){busy(true);logMsg("當沖執行中…","busy");google.script.run.withSuccessHandler(done).withFailureHandler(fail).uiTestDay();}',
        'function runSwing(){busy(true);logMsg("波段執行中…","busy");google.script.run.withSuccessHandler(done).withFailureHandler(fail).uiTestSwing();}',
        'function runFake(){busy(true);logMsg("假突破執行中…","busy");google.script.run.withSuccessHandler(done).withFailureHandler(fail).uiTestFakeBreak();}',
        'function runRoute(){busy(true);logMsg("路由執行中…","busy");google.script.run.withSuccessHandler(done).withFailureHandler(fail).uiTestRoute();}',
        'function runFull(){busy(true);logMsg("完整測試執行中…","busy");google.script.run.withSuccessHandler(done).withFailureHandler(fail).uiTestFull();}',
        'function runReset(){busy(true);logMsg("重置自適應參數中…","busy");google.script.run.withSuccessHandler(done).withFailureHandler(fail).uiResetParams();}',
        '<\/script></body></html>'
    ];
    return html.join('');
}

function uiTestDay() {
    try {
        測試_當沖();
        return { ok: true, msg: "✅ 當沖測試完成\n2330 突破訊號已送出\n請檢查：Discord【當沖】+ Telegram 精簡卡" };
    } catch (e) {
        return { ok: false, msg: "當沖測試失敗：\n" + e.message };
    }
}

function uiTestSwing() {
    try {
        測試_波段();
        return { ok: true, msg: "✅ 波段測試完成\n2454 回踩訊號已送出\n請檢查：Discord【波段】+ Telegram 精簡卡" };
    } catch (e) {
        return { ok: false, msg: "波段測試失敗：\n" + e.message };
    }
}

function uiTestFakeBreak() {
    try {
        測試_假突破();
        return { ok: true, msg: "✅ 假突破測試完成\n2317 應被過濾或大幅降級\n若無推送＝過濾正常" };
    } catch (e) {
        return { ok: false, msg: "假突破測試失敗：\n" + e.message };
    }
}

function uiTestRoute() {
    try {
        測試_推送路由();
        return { ok: true, msg: "✅ 路由測試完成\n已各推一則當沖/波段至 DC+TG" };
    } catch (e) {
        return { ok: false, msg: "路由測試失敗：\n" + e.message };
    }
}

function uiTestFull() {
    try {
        測試_V19完整();
        return { ok: true, msg: "✅ V19.1 完整測試已執行\n含：健康檢查、股名、路由、當沖、波段、假突破\n請至 DC/TG 與執行紀錄確認" };
    } catch (e) {
        return { ok: false, msg: "完整測試失敗：\n" + e.message };
    }
}

function uiResetParams() {
    try {
        重置自適應參數();
        return { ok: true, msg: "✅ 自適應參數已重置\nCOMPRESS_MIN=" + CONFIG.AI.COMPRESS_MIN +
            "  CONF_MIN=" + CONFIG.AI.CONF_MIN + "\nDRAWDOWN_PROTECT=OFF  LEARNING_FROZEN=OFF\n請重跑當沖/波段測試確認訊號正常" };
    } catch (e) {
        return { ok: false, msg: "重置失敗：\n" + e.message };
    }
}

function onOpen() {
    try {
        SpreadsheetApp.getUi()
            .createMenu("🌌 AI大師 " + SYSTEM_VERSION)
            .addItem("🎛️ 測試控制台（當沖/波段）", "showTestPanel")
            .addItem("📄 建立測試台分頁", "setupTestConsoleSheet")
            .addSeparator()
            .addItem("⚙️ 重置自適應參數（緊急）", "重置自適應參數")
            .addItem("🚀 一鍵完整部署", "一鍵完整部署")
            .addItem("⚙️ 一鍵初始化", "一鍵初始化")
            .addItem("📋 系統健康檢查", "系統健康檢查")
            .addSeparator()
            .addItem("🏗️ 建立全市場股池", "buildFullStockPool")
            .addItem("🔄 股池→股名快取", "syncPoolNamesToCache")
            .addItem("🧬 執行自進化維護", "執行自進化維護")
            .addSeparator()
            .addItem("🧪 V19完整測試", "測試_V19完整")
            .addItem("📊 當沖測試", "測試_當沖")
            .addItem("📈 波段測試", "測試_波段")
            .addItem("📡 推送路由測試", "測試_推送路由")
            .addItem("🧬 自進化測試", "測試_自進化引擎")
            .addSeparator()
            .addItem("📈 自動回填+自學", "自動回填漲幅並學習")
            .addItem("🏷️ 股名測試", "測試_股名")
            .addItem("♻️ 權重還原", "revertWeightsBaseline")
            .addItem("📐 權重正規化", "權重正規化")
            .addItem("🧊 解除學習凍結", "解除學習凍結")
            .addItem("🔐 密鑰外移", "migrateSecretsToProperties")
            .addToUi();
    } catch (e) {}
}
