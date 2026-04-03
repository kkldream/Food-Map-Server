# Food-Map-Server

此為 Food-Map 專案的後端 Server，前端的 Android APP 為 [DDPlay123/Food-Map-App](https://github.com/DDPlay123/Food-Map-App)。

基於 Typescript 開發，路由框架使用 Express，頁面模板使用 Jade，並使用 Docker 進行部屬。

## 環境

1. 使用 Node.js 20
2. 執行 `corepack enable`
3. 執行 `pnpm install`
4. 建立 `.env` 並參考 `.env.example`
5. 使用 `pnpm start` 啟動開發環境

另外還有一個參數設定檔 `config.ts` 內可調整此 API Server 的設定。此專案僅包含 API Server 的部分，資料庫需要另外架設，目前資料庫是使用 MongoDB v5.0.6。

## 測試

- `pnpm test`
- `pnpm vitest run tests/services/image-service.test.ts`
