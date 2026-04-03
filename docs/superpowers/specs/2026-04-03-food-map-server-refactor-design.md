# Food-Map-Server 相容式重構設計

## 背景

此專案為舊版人工維護的 Node.js API Server，使用 Express、TypeScript 與原生 MongoDB driver。專案可運作，但目前存在幾個會直接拖慢維護與升級的問題：

- 缺少可查看與對照的 API 文件
- 沒有自動化測試，升級與重構缺乏保護網
- 依賴版本偏舊，Node 版本治理不完整
- 使用 Yarn 1，與目前較常用的 pnpm 不一致
- 內部結構偏向單體檔案與全域狀態，影響可測性與後續整理
- 圖片處理依賴 `canvas`，對 Docker 與原生編譯環境較敏感

## 目標

本次重構以「不改既有 API 行為」為最高原則，逐步把專案整理到可維護、可測試、可升級的狀態。

本次要達成的目標：

- 補上可查看的 OpenAPI 文件
- 建立最小可用的測試基礎建設
- 固定 Node 版本並升級到較新的穩定依賴區間
- 將 package manager 由 Yarn 1 遷移到 pnpm
- 拔除 `canvas`，改用較易維護的圖片壓縮方案
- 進行低風險的內部整理，降低後續重構成本

## 非目標

本次不處理以下事項：

- 不更換資料存取技術為 `mongoose`
- 不調整既有 API path、HTTP method、request body、response 結構
- 不做大規模 controller/service/repository 重切
- 不直接升級到高風險跨 major 組合，例如 `express@5`、`mongodb@7`、`typescript@5+`
- 不在本輪全面重寫帳號安全機制

## 現況摘要

目前專案結構集中於根目錄的 [`app.ts`](/mnt/c/source/Food-Map-Server/app.ts)、[`config.ts`](/mnt/c/source/Food-Map-Server/config.ts)、[`routes/`](/mnt/c/source/Food-Map-Server/routes)、[`models/`](/mnt/c/source/Food-Map-Server/models)。

關鍵現況如下：

- `app.ts` 直接負責 env 載入、session 設定、Mongo 連線與 server listen
- DB 使用 [`models/mongodbMgr.ts`](/mnt/c/source/Food-Map-Server/models/mongodbMgr.ts) 封裝，並透過 `global.mongodbClient` 在全域取用
- 主要業務邏輯集中於 [`models/userMgr.ts`](/mnt/c/source/Food-Map-Server/models/userMgr.ts) 與 [`models/placeMgr.ts`](/mnt/c/source/Food-Map-Server/models/placeMgr.ts)
- 沒有測試目錄、測試 scripts 或 CI 測試步驟
- 沒有 Swagger 或 OpenAPI 入口
- `Dockerfile` 已使用 Node 20，但專案內沒有 `.nvmrc` / `.node-version`
- 圖片壓縮只在 [`models/service/imageService.ts`](/mnt/c/source/Food-Map-Server/models/service/imageService.ts) 使用 `canvas`

## 核心設計原則

### 1. 相容優先

所有整理都以「外部 API 行為不變」為前提，包含：

- 路由位置不變
- 請求參數格式不變
- 回應欄位名稱不變
- 既有資料表與文件結構不主動改版

### 2. 先補護欄，再談大整理

在沒有測試與文件的前提下，直接大改架構風險過高。因此順序固定為：

1. 版本與建置穩定化
2. 文件化
3. 測試基礎建設
4. 套件升級
5. 低風險內部整理

### 3. 低侵入技術選型

只採用可局部導入、可分階段合併的方案，避免要求全專案同步重寫。

## 關鍵技術決策

### API 文件：採用 `swagger-jsdoc` + `swagger-ui-express`

原因：

- 可直接套用於現有 Express 架構
- 不需要先重寫 route 結構
- 可逐支 API 補註解與 schema
- 可在 `/docs` 提供瀏覽入口

第一批文件覆蓋範圍：

- `/api/user/*`
- `/api/place/*`
- `/api/geocode/*`
- `/api/root/*`

每支 API 至少補齊：

- request body
- 成功 response 範例
- 錯誤 response 範例
- 驗證需求說明

### 資料層：維持原生 MongoDB driver，不導入 `mongoose`

原因：

- 目前主要風險來自缺少測試、缺少文件與內部耦合，不是 ODM 缺失
- 在沒有測試保護下直接更換資料層技術，回歸風險過高
- 現有資料操作已大量分散於 manager/service，直接改 ODM 會擴散改動面

本輪策略：

- 保留 `mongodb` driver
- 延後 `mongoose` 評估
- 優先補 collection typing、DB 入口整理與後續可拆分邊界

### 圖片處理：由 `canvas` 改為 `sharp`

目前 `canvas` 只用於：

- 下載遠端圖片後做 resize
- 轉成 JPEG
- 產出 base64 內容儲存至 MongoDB

改為 `sharp` 的原因：

- 更符合伺服器端圖片處理需求
- API 較直接，足以覆蓋目前需求
- 維護與部署成本低於 `canvas`
- 可保留現有 API 與資料流，不需要改外部介面

替換範圍僅限：

- [`models/service/imageService.ts`](/mnt/c/source/Food-Map-Server/models/service/imageService.ts)
- 相關建置依賴與 Docker 安裝流程

`compressUrlImageToBase64()` 的輸入輸出責任保持不變。

### 測試框架：建立 API 導向的最小測試保護網

本輪測試重點不是覆蓋率，而是保護重構與升級風險。測試分三類：

- app 啟動與 smoke test
- 使用 `supertest` 的 API integration test
- 少量純邏輯 service 測試

第一批測試鎖定：

- `user/register`
- `user/login`
- `user/logout`
- `place/search_by_distance`
- `place/details_by_place_id`
- `root/push_url_photo`
- `root/get_photo`
- 驗證失敗與錯誤格式

Google API 與 MongoDB 必須隔離，優先採用 mock 或測試專用資料源。

### 套件升級策略：先升穩定區間，不直接跨 major

本輪升級原則：

- Node 固定為 20 LTS
- `express` 升到 4.x 最新穩定
- `mongodb` 升到 4.x 最新穩定
- `typescript` 先升到 4.9.x
- `axios`、`dotenv`、型別套件同步升級

本輪不直接升：

- `express@5`
- `mongodb@7`
- `typescript@5` 或 `typescript@6`

理由是缺少完整測試保護，直接跨 major 的風險與回歸成本過高。

### Package Manager：由 Yarn 1 遷移到 pnpm

遷移範圍包含：

- `packageManager` 欄位
- lockfile
- 本機安裝流程
- `Dockerfile`
- GitHub Actions workflow

此項目需要與 `sharp` 替換一起驗證，避免 CI 與 Docker 安裝落差。

## 分期規劃

### Stage 1：建置與版本治理

目標：讓本機、Docker、CI 的安裝與建置流程可預期。

工作內容：

- 加入 `.nvmrc` 或 `.node-version`
- 補 `.env.example`
- 更新 `README` 的開發環境與啟動說明
- 遷移 `yarn` 到 `pnpm`
- 更新 `Dockerfile`
- 更新 GitHub Actions workflow
- 將 `canvas` 改為 `sharp`

驗證結果：

- `pnpm install` 可成功
- TypeScript build 可成功
- Docker image build 可成功
- CI 安裝與 build 流程可成功

### Stage 2：文件化 API

目標：提供可查看、可對照、可作為測試依據的 API 文件。

工作內容：

- 導入 OpenAPI 基礎設定
- 新增 `/docs` 入口
- 為主要 route 補上 request / response schema
- 定義共用錯誤碼與驗證說明

驗證結果：

- 可在本機啟動後瀏覽 `/docs`
- 文件與現有 API 路由一致

### Stage 3：測試基礎建設

目標：建立足以保護升級與局部整理的自動化測試。

工作內容：

- 導入測試框架與 `supertest`
- 讓 app 建立與 listen 分離，方便測試
- 建立測試用 env 與資料來源策略
- 寫入第一批高價值 route 測試

驗證結果：

- 測試可在本機執行
- 測試可在 CI 執行
- 重點路徑具備最小回歸保護

### Stage 4：安全的小步升級

目標：在既有行為不變前提下，將依賴移動到較新的安全區間。

工作內容：

- 升級 `express` 4.x、`mongodb` 4.x、`typescript` 4.9.x、`axios`、`dotenv`
- 修正因型別或相依關係帶來的低風險相容問題
- 以測試回歸驗證升級結果

驗證結果：

- build 成功
- 測試通過
- 主要 API 路徑行為不變

### Stage 5：低風險內部整理

目標：降低全域狀態與重複邏輯，讓後續重構更容易。

工作內容：

- 將 `app` 建立與 server 啟動拆開
- 集中 env/config 載入
- 將 DB 初始化收斂為單一入口
- 集中 request logging、error handling 與共用 middleware
- 在不改 API 行為前提下減少 `any` 與重複驗證流程

驗證結果：

- 外部 API 行為不變
- 測試持續通過
- 啟動流程與依賴邊界更清楚

## 風險與注意事項

### 1. `sharp` 與 pnpm 的安裝驗證必須同時進行

如果只在本機驗證成功，Docker 或 CI 仍可能因 binary 或 install strategy 失敗。因此需要同時驗證：

- 本機 WSL
- Docker build
- GitHub Actions

### 2. 文件與測試必須先於大部分升級

若先升級依賴再補文件與測試，將難以判斷異常是既有問題還是升級造成。

### 3. 本輪雖不改安全機制，但需明確記錄風險

目前程式內存在較高風險項目，例如：

- session secret 寫死於程式碼
- 密碼以明碼流程處理

雖然這些不在本輪主目標內，但應列為下一輪優先修正項。

## 完成定義

本次相容式重構完成時，應符合以下條件：

- 專案可使用 pnpm 安裝與建置
- `canvas` 已移除，圖片壓縮改由 `sharp` 處理
- 可透過 `/docs` 查看主要 API 文件
- 至少具備一批可在本機與 CI 執行的自動化測試
- Node 與主要依賴升級至較新的穩定區間
- 啟動流程、設定載入與 DB 入口比現況更清楚
- 對外 API 行為維持相容

## 後續延伸方向

若本輪完成且測試穩定，下一輪再評估以下主題：

- 密碼雜湊與 session/認證安全改善
- `global.mongodbClient` 的進一步收斂
- 大型 manager 檔案的分拆
- `mongoose` 或其他資料層抽象是否具備足夠回報
