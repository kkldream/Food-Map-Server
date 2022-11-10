# Food-Map-Server
 
[如何在 Node.js 中建立 TypeScript 的環境](https://jimmyswebnote.com/create-nodejs-project-with-typescript/)

### 偵錯
需先將tsconfig.json裡的sourceMap改為true
```json
{
  "compilerOptions": {
    ...
    "sourceMap": true,
    ...
  }
}
```