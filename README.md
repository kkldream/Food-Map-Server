# Food-Map-Server

此為 Food-Map 專案的後端 Server，前端的 Android APP 為 [DDPlay123/Food-Map-App](https://github.com/DDPlay123/Food-Map-App)。

基於 Typescript 開發，路由框架使用 Express，頁面模板使用 Jade，並使用 Docker 進行部屬。

## 環境

需先在專案根目錄下建立 `.env` 檔來設置環境變數，內容如下：  
```dotenv
ROOT_ACCESS_KEY="......................." // 管理員呼叫API使用的Key
MONGODB_URL="mongodb://................." // MongoDB資料庫位址
GOOGLE_API_KEY="abcdefg................." // Google地圖API的Key
```
另外還有一個參數設定檔 `config.ts` 內可調整此 API Server 的設定。

此專案僅包含 API Server 的部分，資料庫需要另外架設，目前資料庫是使用 MongoDB v5.0.6。

# Vue

將 Vue 部屬在 Express 上的方法是採用 [Vue 官方推薦的方案](https://router.vuejs.org/zh/guide/essentials/history-mode.html#express-node-js)，使用套件 [connect-history-api-fallback](https://github.com/bripkens/connect-history-api-fallback) 作為 Middleware。

參考：https://zhuanlan.zhihu.com/p/116749549

