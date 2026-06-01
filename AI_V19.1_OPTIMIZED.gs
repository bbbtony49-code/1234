// =============================================================================
// 🌌 真·AI交易大師 V19.1.0 BALANCED OPTIMIZED（2026-06-01）
// 完整優化版：重複檢查 + 勝敗恢復 + 完整UI + 一鍵初始化 + 診斷工具
// =============================================================================

const SYSTEM_VERSION = "V19.1.0 OPTIMIZED";
const TV_PINE_VERSION = "V145.3";

// ============================================================================
// 🔧 新增：系統診斷 + 去重 + 完整UI
// ============================================================================

/**
 * 系統健康檢查
 * 檢查：重複資料、勝敗記錄、UI顯示、數據完整性
 */
function 系統健康檢查(詳細 = false) {
    const issues = [];
    const info = {};
    
    try {
        // 1️⃣ 檢查重複資料
        const dupResult = checkAndRemoveDuplicates(詳細);
        if (dupResult.duplicates > 0) {
            issues.push(`⚠️ 發現${dupResult.duplicates}筆重複訊號，已移除`);
        }
        info.duplicates = dupResult.duplicates;
        
        // 2️⃣ 檢查勝敗記錄完整性
        const wlResult = checkWinLossRecords();
        if (wlResult.missingCount > 0) {
            issues.push(`⚠️ 勝敗記錄缺失${wlResult.missingCount}筆，已修復`);
        }
        info.winLossFix = wlResult.missingCount;
        
        // 3️⃣ 檢查 TV 資料轉換
        const tvResult = checkTVDataConversion();
        if (tvResult.errors > 0) {
            issues.push(`⚠️ TV轉換失敗${tvResult.errors}筆`);
        }
        info.tvErrors = tvResult.errors;
        
        // 4️⃣ 檢查發送失敗
        const pushResult = checkFailedPushes();
        if (pushResult.failed > 0) {
            issues.push(`⚠️ 訊號發送失敗${pushResult.failed}筆，正重試`);
            retryFailedPushes();
        }
        info.pushFailed = pushResult.failed;
        
        // 5️⃣ 檢查數據完整性
        const integrityResult = checkDataIntegrity();
        if (integrityResult.issues > 0) {
            issues.push(`⚠️ 數據不完整${integrityResult.issues}筆`);
        }
        info.integrityIssues = integrityResult.issues;
        
        // 6️⃣ 檢查等級顯示
        const gradeResult = verifyGradeDisplay();
        info.gradeDisplayOk = gradeResult.ok;
        if (!gradeResult.ok) {
            issues.push(`⚠️ 等級顯示異常`);
        }
        
    } catch (e) {
        issues.push(`❌ 系統檢查出錯: ${e.message}`);
    }
    
    return { issues, info, timestamp: new Date() };
}

/**
 * 檢查並移除重複訊號
 */
function checkAndRemoveDuplicates(詳細 = false) {
    let removed = 0;
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.LOG);
        const data = sheet.getDataRange().getValues();
        const seen = new Map();
        const toDelete = [];
        
        for (let i = 1; i < data.length; i++) {
            const key = `${data[i][1]}|${data[i][2]}|${data[i][11]}`; // 股號|時間|訊號
            if (seen.has(key)) {
                toDelete.push(i);
            } else {
                seen.set(key, i);
            }
        }
        
        // 倒序刪除（避免索引偏移）
        for (let i = toDelete.length - 1; i >= 0; i--) {
            sheet.deleteRow(toDelete[i] + 1);
            removed++;
        }
        
        if (removed > 0) {
            invalidateSheet(CONFIG.SHEETS.LOG);
            if (詳細) Logger.log(`🗑️ 移除${removed}筆重複訊號`);
        }
    } catch (e) {
        Logger.log(`checkAndRemoveDuplicates 錯誤: ${e.message}`);
    }
    
    return { duplicates: removed };
}

/**
 * 檢查並修復勝敗記錄
 */
function checkWinLossRecords() {
    let fixed = 0;
    try {
        const data = getSheetData(CONFIG.SHEETS.LEARNING);
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.LEARNING);
        
        for (let i = 1; i < data.length; i++) {
            if (S(data[i][8]) !== "已學習") continue;
            
            // 檢查 col[21] 勝敗欄位
            const wlCell = S(data[i][21] || "");
            if (!wlCell || (wlCell !== "勝" && wlCell !== "敗" && wlCell !== "平")) {
                // 自動計算
                const pct = N(data[i][7], 0);
                const entry = N(data[i][3], 0) || N(data[i][2], 0);
                const atr = N(data[i][12], 0);
                const isSwing = S(data[i][13]) === "波段";
                
                const outcome = judgeTradeOutcome(pct, entry, atr, entry, isSwing);
                const wl = outcome.isWin ? "勝" : outcome.isLoss ? "敗" : "平";
                
                sheet.getRange(i + 1, 22).setValue(wl);
                fixed++;
            }
        }
        
        if (fixed > 0) {
            invalidateSheet(CONFIG.SHEETS.LEARNING);
            Logger.log(`✅ 修復${fixed}筆勝敗記錄`);
        }
    } catch (e) {
        Logger.log(`checkWinLossRecords 錯誤: ${e.message}`);
    }
    
    return { missingCount: fixed };
}

/**
 * 檢查 TV 資料轉換
 */
function checkTVDataConversion() {
    let errors = 0;
    try {
        const data = getSheetData(CONFIG.SHEETS.LOG);
        
        for (let i = 1; i < data.length; i++) {
            const tvRaw = data[i][25]; // TV Payload
            if (!tvRaw || tvRaw === "") continue;
            
            try {
                const tv = _json(tvRaw, null);
                if (!tv || !tv.price || tv.price <= 0) errors++;
            } catch (e) {
                errors++;
            }
        }
    } catch (e) {
        Logger.log(`checkTVDataConversion 錯誤: ${e.message}`);
    }
    
    return { errors };
}

/**
 * 檢查發送失敗紀錄
 */
function checkFailedPushes() {
    let failed = 0;
    try {
        const data = getSheetData(CONFIG.SHEETS.AUTO_TRADES);
        
        for (let i = 1; i < data.length; i++) {
            const status = S(data[i][18] || "");
            if (status === "發送失敗") failed++;
        }
    } catch (e) {
        Logger.log(`checkFailedPushes 錯誤: ${e.message}`);
    }
    
    return { failed };
}

/**
 * 重試發送失敗的訊號
 */
function retryFailedPushes() {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.AUTO_TRADES);
        const data = sheet.getDataRange().getValues();
        let retried = 0;
        
        for (let i = 1; i < data.length; i++) {
            const status = S(data[i][18] || "");
            if (status === "發送失敗") {
                const ticker = S(data[i][1]);
                const mode = S(data[i][13]);
                const conf = N(data[i][4]);
                
                // 重新發送
                const msg = buildFullSignalMessage(ticker, mode, conf, data[i]);
                if (msg) {
                    push(mode, msg);
                    sheet.getRange(i + 1, 19).setValue("重試發送");
                    retried++;
                }
            }
        }
        
        if (retried > 0) {
            invalidateSheet(CONFIG.SHEETS.AUTO_TRADES);
            Logger.log(`🔄 重試${retried}筆發送`);
        }
    } catch (e) {
        Logger.log(`retryFailedPushes 錯誤: ${e.message}`);
    }
}

/**
 * 檢查數據完整性
 */
function checkDataIntegrity() {
    let issues = 0;
    try {
        const data = getSheetData(CONFIG.SHEETS.LOG);
        
        for (let i = 1; i < Math.min(data.length, 100); i++) {
            if (!data[i][1] || !data[i][2] || !data[i][11]) issues++;
        }
    } catch (e) {
        Logger.log(`checkDataIntegrity 錯誤: ${e.message}`);
    }
    
    return { issues };
}

/**
 * 驗證等級顯示
 */
function verifyGradeDisplay() {
    let ok = true;
    try {
        const grades = ["SSS", "SS", "S", "A+", "A", "B", "C"];
        const data = getSheetData(CONFIG.SHEETS.LOG);
        
        for (let i = 1; i < Math.min(data.length, 50); i++) {
            const grade = S(data[i][6] || "");
            if (grade && grades.indexOf(grade) < 0) {
                ok = false;
                break;
            }
        }
    } catch (e) {
        ok = false;
    }
    
    return { ok };
}

// ============================================================================
// 🎯 完整訊號 UI 顯示格式
// ============================================================================

/**
 * 構建完整的訊號訊息（Discord + Telegram）
 * 格式：標題｜股號｜股名｜等級｜勝率｜信心度｜現價｜AI進場｜支撐｜壓力｜停損｜停利｜RR
 */
function buildFullSignalMessage(ticker, mode, conf, logRow) {
    try {
        const stockName = getPoolNameFast(ticker) || "股票";
        const grade = logRow[6] || getGrade(conf);
        const winRate = logRow[9] || "50%";
        const currentPrice = logRow[3] || "N/A";
        const entry = logRow[4] || currentPrice;
        const support = logRow[31] || "N/A";
        const pressure = logRow[32] || "N/A";
        const sl = logRow[33] || "N/A";
        const tp = logRow[34] || "N/A";
        const rr = logRow[35] || "N/A";
        const signal = logRow[11] || "訊號";
        const volRatio = logRow[14] || "1.0x";
        const strategy = logRow[13] || "當沖";
        
        const msg = `
╔════════════════════════════════════════╗
║ 【${strategy}】${ticker} ${stockName}
║ 等級: ${grade} | 勝率: ${winRate} | 信心: ${conf}分
╠════════════════════════════════════════╣
║ 現價: ${currentPrice}元
║ AI進場: ${entry}元
║ 支撐: ${support}元 | 壓力: ${pressure}元
║ 停損: ${sl}元 | 停利: ${tp}元
║ RR比: ${rr}
╠════════════════════════════════════════╣
║ 訊號: ${signal}
║ 成交量: ${volRatio}
║ 時間: ${new Date().toLocaleString("zh-TW", {timeZone: "Asia/Taipei"})}
╚════════════════════════════════════════╝
        `;
        
        return msg;
    } catch (e) {
        Logger.log(`buildFullSignalMessage 錯誤: ${e.message}`);
        return null;
    }
}

/**
 * 獲取等級
 */
function getGrade(conf) {
    conf = N(conf, 50);
    if (conf > 92) return "SSS";
    if (conf > 88) return "SS";
    if (conf > 82) return "S";
    if (conf > 75) return "A+";
    if (conf > 68) return "A";
    if (conf > 55) return "B";
    return "C";
}

/**
 * 完整訊號 UI（表格格式）
 */
function displayFullSignalUI(signals) {
    const lines = [
        "╔════╦════════╦════════╦════╦════╦════╦════════╦════════╦════════╦════════╦════════╦════════╦═════╗",
        "║ # ║ 股號   ║ 股名   ║ 級 ║ 率 ║ 信 ║ 現價   ║ AI進場 ║ 支撐   ║ 壓力   ║ 停損   ║ 停利   ║ RR  ║",
        "╠════╬════════╬════════╬════╬════╬════╬════════╬════════╬════════╬════════╬════════╬════════╬═════╣"
    ];
    
    signals.forEach((sig, idx) => {
        lines.push(`║ ${String(idx+1).padEnd(2)} ║ ${String(sig.ticker).padEnd(6)} ║ ${String(sig.name).padEnd(6)} ║ ${String(sig.grade).padEnd(2)} ║ ${String(sig.wr).padEnd(2)} ║ ${String(sig.conf).padEnd(2)} ║ ${String(sig.price).padEnd(6)} ║ ${String(sig.entry).padEnd(6)} ║ ${String(sig.support).padEnd(6)} ║ ${String(sig.pressure).padEnd(6)} ║ ${String(sig.sl).padEnd(6)} ║ ${String(sig.tp).padEnd(6)} ║ ${String(sig.rr).padEnd(3)} ║`);
    });
    
    lines.push("╚════╩════════╩════════╩════╩════╩════╩════════╩════════╩════════╩════════╩════════╩════════╩═════╝");
    
    return lines.join("\n");
}

// ============================================================================
// 🔄 一鍵初始化系統
// ============================================================================

/**
 * 一鍵初始化所有數據
 * 危險操作：清空所有學習數據、權重、記錄
 */
function resetAllSystemData(confirmReset = false) {
    if (!confirmReset) {
        Logger.log("⚠️ 危險操作！需要確認。呼叫: resetAllSystemData(true)");
        return { status: "未執行", reason: "需要確認" };
    }
    
    try {
        const lock = LockService.getScriptLock();
        if (!lock.tryLock(300000)) return { status: "失敗", reason: "系統忙碌中" };
        
        try {
            clearSheetCache();
            let cleared = 0;
            
            // 1️⃣ 清空學習紀錄
            clearSheetContent(CONFIG.SHEETS.LEARNING);
            cleared++;
            
            // 2️⃣ 重置股票記憶
            clearSheetContent(CONFIG.SHEETS.STOCK_MEM);
            cleared++;
            
            // 3️⃣ 重置型態記憶
            clearSheetContent(CONFIG.SHEETS.PATTERN_MEM);
            cleared++;
            
            // 4️⃣ 重置權重
            const defaultWeights = defaultW();
            saveWeights(false, defaultWeights, true);
            saveWeights(true, defaultWeights, true);
            cleared += 2;
            
            // 5️⃣ 重置自適應參數
            resetAdaptiveParameters();
            cleared++;
            
            // 6️⃣ 清除黑名單
            clearSheetContent(CONFIG.SHEETS.BLACKLIST);
            cleared++;
            
            // 7️⃣ 重置系統狀態
            writeSystemKey("DRAWDOWN_PROTECT", "0", "系統重置");
            writeSystemKey("LEARNING_FROZEN", "0", "系統重置");
            cleared++;
            
            // 8️⃣ 清空交易紀錄
            clearSheetContent(CONFIG.SHEETS.AUTO_TRADES);
            cleared++;
            
            Logger.log(`✅ 系統重置完成！清空${cleared}個模組`);
            
            push("當沖", `🔄 系統已重置\n清空${cleared}個模組\n時間: ${new Date().toLocaleString("zh-TW", {timeZone: "Asia/Taipei"})}`);
            
            return {
                status: "成功",
                cleared,
                timestamp: new Date()
            };
        } finally {
            lock.releaseLock();
        }
    } catch (e) {
        Logger.log(`❌ 系統重置失敗: ${e.message}`);
        return { status: "失敗", reason: e.message };
    }
}

/**
 * 清空工作表內容
 */
function clearSheetContent(sheetName) {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(sheetName);
        if (sheet) {
            sheet.clearContents();
            invalidateSheet(sheetName);
        }
    } catch (e) {
        Logger.log(`clearSheetContent ${sheetName} 失敗: ${e.message}`);
    }
}

/**
 * 重置自適應參數
 */
function resetAdaptiveParameters() {
    try {
        const sheet = SpreadsheetApp.openById(CONFIG.SS_ID).getSheetByName(CONFIG.SHEETS.SYSTEM);
        const data = getSheetData(CONFIG.SHEETS.SYSTEM);
        
        const defaults = {
            "ADAPT_COMPRESS_MIN": String(CONFIG.AI.COMPRESS_MIN),
            "ADAPT_CONF_MIN": String(CONFIG.AI.CONF_MIN),
            "ADAPT_SWING_CONF_MIN": String(CONFIG.AI.SWING_CONF_MIN)
        };
        
        for (const [key, val] of Object.entries(defaults)) {
            writeSystemKey(key, val, "參數重置");
        }
        
        Logger.log("✅ 自適應參數已重置");
    } catch (e) {
        Logger.log(`resetAdaptiveParameters 失敗: ${e.message}`);
    }
}

// ============================================================================
// 🎯 當沖/波段測試工具
// ============================================================================

/**
 * 當沖測試
 * 模擬當沖訊號並顯示完整 UI
 */
function testDayTradeSignal(ticker) {
    try {
        // 假資料測試
        const testData = {
            ticker: ticker,
            mode: "當沖",
            conf: 72,
            price: 100,
            entry: 101,
            support: 98,
            pressure: 102,
            sl: 97,
            tp: 105,
            rr: "2.0:1",
            wr: "65%",
            grade: "A",
            signal: "突破高點",
            volRatio: "1.8x"
        };
        
        const msg = buildFullSignalMessage(ticker, "當沖", testData.conf, 
            [null, ticker, null, 100, 101, null, "A", null, "已學習", "當沖", "65", "突破高點", null, "當沖", "1.8x", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 98, 102, 97, 105, "2.0:1"]);
        
        Logger.log(msg);
        push("當沖", `🧪 當沖測試訊號\n${msg}`);
        
        return { status: "成功", msg };
    } catch (e) {
        Logger.log(`❌ 當沖測試失敗: ${e.message}`);
        return { status: "失敗", reason: e.message };
    }
}

/**
 * 波段測試
 * 模擬波段訊號並顯示完整 UI
 */
function testSwingTradeSignal(ticker) {
    try {
        const testData = {
            ticker: ticker,
            mode: "波段",
            conf: 68,
            price: 100,
            entry: 102,
            support: 95,
            pressure: 105,
            sl: 94,
            tp: 110,
            rr: "2.1:1",
            wr: "62%",
            grade: "B",
            signal: "突破回踩",
            volRatio: "2.2x"
        };
        
        const msg = buildFullSignalMessage(ticker, "波段", testData.conf,
            [null, ticker, null, 100, 102, null, "B", null, "已學習", "波段", "62", "突破回踩", null, "波段", "2.2x", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 95, 105, 94, 110, "2.1:1"]);
        
        Logger.log(msg);
        push("當沖", `🧪 波段測試訊號\n${msg}`);
        
        return { status: "成功", msg };
    } catch (e) {
        Logger.log(`❌ 波段測試失敗: ${e.message}`);
        return { status: "失敗", reason: e.message };
    }
}

// ============================================================================
// 📊 每日自動執行
// ============================================================================

/**
 * 每日啟動：檢查系統 + 晨報 + 測試觸發
 */
function 每日啟動檢查() {
    warmPoolNameCache();
    
    // 系統健康檢查
    const health = 系統健康檢查(true);
    Logger.log(`🏥 系統檢查: ${health.issues.length}個問題`);
    
    if (health.issues.length > 0) {
        push("當沖", `⚠️ ${SYSTEM_VERSION} 系統告警\n` + health.issues.join("\n"));
    }
    
    // 晨報
    每日晨報();
    
    // 觸發測試
    Logger.log("🧪 觸發測試訊號");
    testDayTradeSignal("2330");
    testSwingTradeSignal("2454");
}

// ============================================================================
// 🛠️ 輔助函數
// ============================================================================

function defaultW() {
    return {
        trend: 1.0, volume: 1.0, signal: 1.0, quality: 1.0,
        event: 1.0, pos: 1.0, range: 1.0, scan: 1.0,
        vwap: 1.0, rsi: 1.0, kd: 1.0, macd: 1.0, adx: 1.0, bb: 1.0
    };
}

// 調用方式：
// 1. 系統檢查：系統健康檢查()
// 2. 移除重複：checkAndRemoveDuplicates(true)
// 3. 修復勝敗：checkWinLossRecords()
// 4. 重試發送：retryFailedPushes()
// 5. 當沖測試：testDayTradeSignal("2330")
// 6. 波段測試：testSwingTradeSignal("2454")
// 7. 一鍵重置：resetAllSystemData(true) ⚠️ 危險！
// 8. 每日啟動：每日啟動檢查()
