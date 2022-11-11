# Food-Map-Server
 
[如何在 Node.js 中建立 TypeScript 的環境](https://jimmyswebnote.com/create-nodejs-project-with-typescript/)

### 偵錯

需先將tsconfig.json裡的sourceMap改為true：  
```json
{
  "compilerOptions": {
    ...
    "sourceMap": true,
    ...
  }
}
```

### Docker (Linux)

編譯容器：
```bash
docker build -t kkldream/food-map:v0.1 .
```

執行容器：
```bash
docker run --rm -it -p 3000:3000 -v $(pwd)/.env:/root/app/.env kkldream/food-map:v0.1
```