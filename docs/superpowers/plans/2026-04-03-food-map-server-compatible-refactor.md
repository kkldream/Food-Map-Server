# Food-Map-Server Compatible Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改既有 API 行為的前提下，補上文件、測試、版本治理、pnpm 遷移與低風險內部整理，讓專案回到可維護狀態。

**Architecture:** 保留現有 Express + TypeScript + MongoDB driver 架構，先拆出可測的 app bootstrap，再用 `swagger-jsdoc`/`swagger-ui-express` 提供文件、用 `vitest`/`supertest` 補最小保護網，最後再做 package manager、依賴與基礎模組整理。圖片壓縮維持現有責任與輸出格式，但將底層從 `canvas` 換成 `sharp`。

**Tech Stack:** Node.js 20 LTS, TypeScript 4.9.x, Express 4.x, MongoDB Node Driver 4.x, pnpm, Vitest, Supertest, sharp, swagger-jsdoc, swagger-ui-express

---

## File Structure Map

**Create:**

- `.nvmrc`
- `.env.example`
- `server.ts`
- `swagger.ts`
- `vitest.config.ts`
- `tests/routes/app-smoke.test.ts`
- `tests/routes/docs-route.test.ts`
- `tests/routes/user-route.test.ts`
- `tests/routes/place-route.test.ts`
- `tests/routes/root-route.test.ts`
- `tests/openapi/spec.test.ts`
- `tests/services/image-service.test.ts`
- `docs/openapi/base.yaml`
- `docs/openapi/components.yaml`
- `docs/openapi/user.yaml`
- `docs/openapi/place.yaml`
- `docs/openapi/geocode.yaml`
- `docs/openapi/root.yaml`
- `lib/env.ts`
- `lib/mongo.ts`
- `middleware/requestLogger.ts`
- `middleware/errorHandler.ts`

**Modify:**

- `package.json`
- `README.md`
- `Dockerfile`
- `.github/workflows/deploy.yml`
- `app.ts`
- `models/service/imageService.ts`

**Responsibilities:**

- `server.ts` 只負責 dotenv、Mongo 連線與 `app.listen`
- `app.ts` 只負責建立 Express app 與註冊 middleware/routes
- `swagger.ts` 封裝 OpenAPI spec 與 `/docs` 掛載
- `docs/openapi/*.yaml` 放現有 API 的 request/response 文件，不改 route 寫法
- `tests/routes/*.test.ts` 放 app 層 integration 測試
- `tests/openapi/spec.test.ts` 驗證 spec path 與 schema 存在
- `tests/services/image-service.test.ts` 驗證 `sharp` 圖片壓縮輸出
- `lib/env.ts` 與 `lib/mongo.ts` 負責集中化環境變數與 DB 入口
- `middleware/*.ts` 收斂現有 request log 與 error handling

### Task 1: Bootstrap Test Harness And Split App Startup

**Files:**
- Create: `server.ts`
- Create: `vitest.config.ts`
- Create: `tests/routes/app-smoke.test.ts`
- Modify: `app.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing smoke test**

```ts
import request from 'supertest';
import {describe, expect, it} from 'vitest';
import {createApp} from '../../app';

describe('app smoke', () => {
  it('serves root and api readiness routes', async () => {
    const app = createApp();

    const rootResponse = await request(app).get('/');
    expect(rootResponse.status).toBe(200);

    const apiResponse = await request(app).get('/api');
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.body.status).toBe(0);
    expect(apiResponse.body.result.msg).toBe('api is ready');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/routes/app-smoke.test.ts`
Expected: FAIL with a module error because `app.ts` does not export `createApp`, and `vitest` / `supertest` are not installed yet.

- [ ] **Step 3: Add the test runner scripts and minimal app bootstrap**

```json
{
  "scripts": {
    "build": "tsc --project ./",
    "start": "ts-node ./server.ts",
    "start:dist": "node ./dist/server.js",
    "dev": "nodemon --exec ts-node server.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/express": "^4.17.25",
    "@types/express-session": "^1.18.2",
    "@types/http-errors": "^2.0.5",
    "@types/node": "^18.19.130",
    "@types/supertest": "^6.0.3",
    "supertest": "^7.1.1",
    "ts-node": "^10.9.2",
    "typescript": "^4.9.5",
    "vitest": "^3.2.4"
  }
}
```

```ts
// app.ts
import express from 'express';
import createError from 'http-errors';
import session from 'express-session';
import dotenv from 'dotenv';
import {getDateFormat} from './models/utils';
import indexRoute from './routes/index';
import apiRoute from './routes/api';

dotenv.config();

export function createApp() {
  const app = express();

  app.use(require('cors')());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
    saveUninitialized: false,
    resave: false,
    name: 'user'
  }));

  app.set('views', './views');
  app.set('view engine', 'jade');

  app.use('/', (req, res, next) => {
    console.log(`[${getDateFormat()}] ${req.method}: ${req.originalUrl}`);
    next();
  });

  app.use('/', indexRoute);
  app.use('/api', apiRoute);

  app.use((req, res, next) => next(createError(404)));
  app.use((err: any, req: any, res: any, next: any) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
  });

  return app;
}
```

```ts
// server.ts
import dotenv from 'dotenv';
import {createApp} from './app';
import MongodbClient from './models/mongodbMgr';

dotenv.config();

const app = createApp();
const port = process.env.PORT || 3000;
const mongodbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';

declare global {
  var mongodbClient: MongodbClient;
}

global.mongodbClient = new MongodbClient(mongodbUrl, () => {
  console.log('mongo client is connected');
  app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}/`);
  });
});

process.on('SIGINT', async () => {
  await global.mongodbClient.close();
  process.exit(0);
});
```

```ts
// vitest.config.ts
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
});
```

- [ ] **Step 4: Run the smoke test and build**

Run: `pnpm install`
Expected: install completes and `pnpm-lock.yaml` is generated.

Run: `pnpm vitest run tests/routes/app-smoke.test.ts`
Expected: PASS

Run: `pnpm build`
Expected: PASS and `dist/server.js` is emitted.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml app.ts server.ts vitest.config.ts tests/routes/app-smoke.test.ts
git commit -m "test: bootstrap app factory and smoke test"
```

### Task 2: Migrate To pnpm And Replace Canvas With Sharp

**Files:**
- Create: `.nvmrc`
- Create: `.env.example`
- Create: `tests/services/image-service.test.ts`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `Dockerfile`
- Modify: `.github/workflows/deploy.yml`
- Modify: `models/service/imageService.ts`

- [ ] **Step 1: Write the failing image compression test**

```ts
import {describe, expect, it} from 'vitest';
import {compressImageBufferToBase64} from '../../models/service/imageService';

const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pV6czsAAAAASUVORK5CYII=';

describe('imageService', () => {
  it('converts a png buffer to jpeg metadata and base64 content', async () => {
    const input = Buffer.from(tinyPngBase64, 'base64');
    const result = await compressImageBufferToBase64(input, 0.6);

    expect(result.format).toBe('jpeg');
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.length).toBeGreaterThan(0);
    expect(Buffer.from(result.data, 'base64').subarray(0, 2).toString('hex')).toBe('ffd8');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/services/image-service.test.ts`
Expected: FAIL because `compressImageBufferToBase64` does not exist and the module still depends on `canvas`.

- [ ] **Step 3: Replace the image backend and update package/build configuration**

```json
{
  "packageManager": "pnpm@10.8.1",
  "dependencies": {
    "axios": "^1.14.0",
    "connect-history-api-fallback": "^2.0.0",
    "cors": "^2.8.6",
    "dotenv": "^16.6.1",
    "express": "^4.21.2",
    "express-session": "^1.18.2",
    "http-errors": "^2.0.1",
    "image-to-base64": "^2.2.0",
    "jade": "^1.11.0",
    "mongodb": "^4.17.2",
    "sharp": "^0.34.5"
  }
}
```

```dockerfile
FROM node:20-bookworm-slim

WORKDIR /root/app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000
CMD [ "node", "dist/server.js" ]
```

```yaml
# .github/workflows/deploy.yml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 10

- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: pnpm

- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Run tests
  run: pnpm test
```

```dotenv
# .env.example
ROOT_ACCESS_KEY=replace-me
MONGODB_URL=mongodb://localhost:27017
GOOGLE_API_KEY=replace-me
SESSION_SECRET=replace-me
PORT=3000
```

```txt
# .nvmrc
20
```

```ts
// models/service/imageService.ts
import sharp from 'sharp';

export async function compressImageBufferToBase64(buff: Buffer, rate: number = 0.5): Promise<photoItem> {
  const pipeline = sharp(buff).rotate().resize({
    width: config.image.maxWidth,
    withoutEnlargement: true
  });

  const {data, info} = await pipeline
    .jpeg({quality: Math.round(rate * 100)})
    .toBuffer({resolveWithObject: true});

  const base64 = data.toString('base64');

  return {
    width: info.width,
    height: info.height,
    data: base64,
    length: base64.length,
    format: 'jpeg'
  };
}

export async function compressUrlImageToBase64(url: string, rate: number = 0.5): Promise<photoItem> {
  let base64 = '';
  try {
    base64 = await imageToBase64(url);
  } catch (error) {
    throwError(errorCodes.photoUrlError);
  }
  return compressImageBufferToBase64(Buffer.from(base64, 'base64'), rate);
}
```

- [ ] **Step 4: Update the README and verify install/build paths**

```md
## 環境

1. 使用 Node.js 20
2. 執行 `corepack enable`
3. 執行 `pnpm install`
4. 建立 `.env` 並參考 `.env.example`
5. 使用 `pnpm start` 啟動開發環境

## 測試

- `pnpm test`
- `pnpm vitest run tests/services/image-service.test.ts`
```

Run: `pnpm vitest run tests/services/image-service.test.ts`
Expected: PASS

Run: `pnpm build`
Expected: PASS

Run: `docker build -t food-map-server:plan-check .`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .nvmrc .env.example package.json pnpm-lock.yaml README.md Dockerfile .github/workflows/deploy.yml models/service/imageService.ts tests/services/image-service.test.ts
git commit -m "build: migrate to pnpm and replace canvas with sharp"
```

### Task 3: Add OpenAPI Bootstrap And Docs Route

**Files:**
- Create: `swagger.ts`
- Create: `docs/openapi/base.yaml`
- Create: `docs/openapi/components.yaml`
- Create: `docs/openapi/user.yaml`
- Create: `docs/openapi/place.yaml`
- Create: `docs/openapi/geocode.yaml`
- Create: `docs/openapi/root.yaml`
- Create: `tests/openapi/spec.test.ts`
- Create: `tests/routes/docs-route.test.ts`
- Modify: `app.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing docs route and spec tests**

```ts
import request from 'supertest';
import {describe, expect, it} from 'vitest';
import {createApp} from '../../app';

describe('docs route', () => {
  it('serves swagger ui and exposes the expected paths', async () => {
    const app = createApp();

    const html = await request(app).get('/docs/');
    expect(html.status).toBe(200);
    expect(html.text).toContain('Swagger UI');
  });
});
```

```ts
import {describe, expect, it} from 'vitest';
import {openApiSpec} from '../../swagger';

describe('openApiSpec', () => {
  it('contains the existing route groups', () => {
    expect(openApiSpec.paths?.['/api/user/login']).toBeTruthy();
    expect(openApiSpec.paths?.['/api/place/search_by_distance']).toBeTruthy();
    expect(openApiSpec.paths?.['/api/geocode/autocomplete']).toBeTruthy();
    expect(openApiSpec.paths?.['/api/root/get_photo']).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/routes/docs-route.test.ts tests/openapi/spec.test.ts`
Expected: FAIL because `/docs` is not registered and `swagger.ts` does not exist.

- [ ] **Step 3: Add swagger packages, YAML spec files, and route registration**

```json
{
  "dependencies": {
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "@types/swagger-ui-express": "^4.1.8"
  }
}
```

```ts
// swagger.ts
import path from 'path';
import type {Express} from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export const openApiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Food Map Server API',
      version: '1.0.0'
    }
  },
  apis: [path.join(__dirname, 'docs/openapi/*.yaml')]
});

export function registerSwagger(app: Express) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
}
```

```yaml
# docs/openapi/base.yaml
openapi: 3.0.3
info:
  title: Food Map Server API
  version: 1.0.0
tags:
  - name: user
  - name: place
  - name: geocode
  - name: root
```

```yaml
# docs/openapi/components.yaml
components:
  schemas:
    ApiResponse:
      type: object
      properties:
        status:
          type: integer
        verify:
          type: boolean
        errMsg:
          type: string
        result:
          type: object
          additionalProperties: true
```

```yaml
# docs/openapi/user.yaml
/api/user/register:
  post:
    tags: [user]
    summary: Register user
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [username, password, deviceId]
            properties:
              username: {type: string}
              password: {type: string}
              deviceId: {type: string}
    responses:
      '200':
        description: register result
/api/user/login:
  post:
    tags: [user]
    summary: Login user
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [username, password, deviceId]
            properties:
              username: {type: string}
              password: {type: string}
              deviceId: {type: string}
    responses:
      '200':
        description: login result
```

```yaml
# docs/openapi/place.yaml
/api/place/search_by_distance:
  post:
    tags: [place]
    summary: Search nearby places by distance
    responses:
      '200':
        description: place list
/api/place/details_by_place_id:
  post:
    tags: [place]
    summary: Get place detail by place_id
    responses:
      '200':
        description: place detail
```

```yaml
# docs/openapi/geocode.yaml
/api/geocode/autocomplete:
  post:
    tags: [geocode]
    summary: Geocode autocomplete
    responses:
      '200':
        description: autocomplete list
```

```yaml
# docs/openapi/root.yaml
/api/root/get_photo:
  post:
    tags: [root]
    summary: Get photo by photoId
    responses:
      '200':
        description: photo payload
```

```ts
// app.ts
import {registerSwagger} from './swagger';

export function createApp() {
  const app = express();
  // existing middleware
  registerSwagger(app);
  return app;
}
```

- [ ] **Step 4: Expand the YAML files to cover the remaining existing endpoints**

Add these concrete user paths to `docs/openapi/user.yaml`:

- `/api/user/add_fcm_token`
- `/api/user/logout`
- `/api/user/delete_account`
- `/api/user/get_image`
- `/api/user/set_image`
- `/api/user/set_password`
- `/api/user/push_favorite`
- `/api/user/pull_favorite`
- `/api/user/get_favorite`
- `/api/user/push_black_list`
- `/api/user/pull_black_list`
- `/api/user/get_black_list`
- `/api/user/push_place_list`
- `/api/user/pull_place_list`
- `/api/user/get_place_list`

Add these concrete place paths to `docs/openapi/place.yaml`:

- `/api/place/search_by_keyword`
- `/api/place/draw_card`
- `/api/place/get_html_photo/{photoId}`
- `/api/place/autocomplete`

Add these concrete geocode paths to `docs/openapi/geocode.yaml`:

- `/api/geocode/get_location_by_address`
- `/api/geocode/get_route_polyline`

Add these concrete root paths to `docs/openapi/root.yaml`:

- `/api/root/push_black_list`
- `/api/root/pull_black_list`
- `/api/root/get_black_list`
- `/api/root/push_url_photo`
- `/api/root/fcm_send`
- `/api/root/get_google_api_key`

For every added path, include:

- the existing HTTP method from the route file
- the required request fields taken from the route body destructuring
- a `200` response entry
- the shared `components.schemas.ApiResponse` wrapper

Run: `pnpm vitest run tests/routes/docs-route.test.ts tests/openapi/spec.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml app.ts swagger.ts docs/openapi/base.yaml docs/openapi/components.yaml docs/openapi/user.yaml docs/openapi/place.yaml docs/openapi/geocode.yaml docs/openapi/root.yaml tests/openapi/spec.test.ts tests/routes/docs-route.test.ts
git commit -m "docs: add openapi docs and swagger ui"
```

### Task 4: Add Route Tests For User And Root APIs

**Files:**
- Create: `tests/routes/user-route.test.ts`
- Create: `tests/routes/root-route.test.ts`
- Modify: `app.ts`

- [ ] **Step 1: Write the failing user route tests**

```ts
import request from 'supertest';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createApp} from '../../app';

vi.mock('../../models/userMgr', () => ({
  default: {
    register: vi.fn().mockResolvedValue({msg: '註冊成功', userId: 'u1', accessKey: 'k1'}),
    loginByDevice: vi.fn().mockResolvedValue({msg: '登入成功', userId: 'u1', accessKey: 'k1', deviceId: 'web'})
  }
}));

describe('user routes', () => {
  it('returns the wrapped register response', async () => {
    const app = createApp();
    const response = await request(app).post('/api/user/register').send({
      username: 'demo',
      password: 'pass',
      deviceId: 'web'
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(0);
    expect(response.body.result.msg).toBe('註冊成功');
  });
});
```

```ts
import request from 'supertest';
import {describe, expect, it, vi} from 'vitest';
import {createApp} from '../../app';

vi.mock('../../models/rootMgr', () => ({
  default: {
    getGoogleApiKey: vi.fn().mockReturnValue({key: 'demo'})
  }
}));

describe('root routes', () => {
  it('returns root response envelope', async () => {
    const app = createApp();
    const response = await request(app).post('/api/root/get_google_api_key').send({
      accessKey: 'root'
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/routes/user-route.test.ts tests/routes/root-route.test.ts`
Expected: FAIL because current app boot path still expects live `global.mongodbClient` access in auth flows.

- [ ] **Step 3: Make app creation test-friendly without changing API behavior**

```ts
// app.ts
export interface CreateAppOptions {
  enableRequestLogging?: boolean;
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const enableRequestLogging = options.enableRequestLogging ?? true;

  if (enableRequestLogging) {
    app.use('/', (req, res, next) => {
      console.log(`[${getDateFormat()}] ${req.method}: ${req.originalUrl}`);
      next();
    });
  }

  app.use('/', indexRoute);
  app.use('/api', apiRoute);
  registerSwagger(app);
  return app;
}
```

Add focused tests for these cases:

- `/api/user/register`
- `/api/user/login`
- `/api/user/logout`
- `/api/root/get_google_api_key`
- `/api/root/get_photo`

Each test should assert:

- HTTP status `200`
- wrapper shape `{status, result}` or `{status, errMsg}`
- no route-level schema regression in key field names
- mocked manager methods are called with the same body fields currently destructured in the route

- [ ] **Step 4: Run the route tests**

Run: `pnpm vitest run tests/routes/user-route.test.ts tests/routes/root-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app.ts tests/routes/user-route.test.ts tests/routes/root-route.test.ts
git commit -m "test: cover user and root routes"
```

### Task 5: Add Route Tests For Place, Geocode, And Error Flows

**Files:**
- Create: `tests/routes/place-route.test.ts`
- Modify: `app.ts`

- [ ] **Step 1: Write the failing place and geocode tests**

```ts
import request from 'supertest';
import {describe, expect, it, vi} from 'vitest';
import {createApp} from '../../app';

vi.mock('../../models/placeMgr', () => ({
  default: {
    searchByDistance: vi.fn().mockResolvedValue({updated: false, placeCount: 0, placeList: []}),
    detailsByPlaceId: vi.fn().mockResolvedValue({updated: false, isFavorite: false, place: {name: 'demo'}}),
    getPhoto: vi.fn().mockResolvedValue({format: 'jpeg', data: 'abc', width: 1, height: 1, length: 3})
  }
}));

describe('place routes', () => {
  it('returns the wrapped search response', async () => {
    const app = createApp();
    const response = await request(app).post('/api/place/search_by_distance').send({
      userId: 'u1',
      accessKey: 'k1',
      location: {lat: 25, lng: 121},
      distance: 1000,
      skip: 0,
      limit: 10
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/routes/place-route.test.ts`
Expected: FAIL because auth and shared response behavior are not isolated well enough for route-only tests.

- [ ] **Step 3: Add the remaining route coverage**

Add concrete tests for:

- `/api/place/search_by_distance`
- `/api/place/details_by_place_id`
- `/api/geocode/autocomplete`
- `/api/geocode/get_location_by_address`
- 404 API fallback from `routes/api.ts`

Use `vi.mock` to isolate:

- `models/placeMgr`
- `models/geocodeMgr`
- `apiResponseBase.prototype.verifyUser`

Assert:

- success shape for happy paths
- `status = -1` for missing API route
- `errMsg` presence for failure envelope

Example failure-path assertion:

```ts
const response = await request(app).get('/api/not_found');
expect(response.status).toBe(200);
expect(response.body.status).toBe(-1);
expect(response.body.errMsg).toContain('Not found');
```

- [ ] **Step 4: Run the route suite**

Run: `pnpm vitest run tests/routes/place-route.test.ts tests/routes/user-route.test.ts tests/routes/root-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/routes/place-route.test.ts tests/routes/user-route.test.ts tests/routes/root-route.test.ts
git commit -m "test: cover place geocode and error routes"
```

### Task 6: Upgrade Stable Dependencies Without Crossing Major Boundaries

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `tsconfig.json`

- [ ] **Step 1: Write a failing full-suite check**

Run: `pnpm test && pnpm build`
Expected: PASS and captures the exact pre-upgrade baseline before changing dependency versions.

- [ ] **Step 2: Apply the stable-version upgrades**

```json
{
  "dependencies": {
    "axios": "^1.14.0",
    "cors": "^2.8.6",
    "dotenv": "^16.6.1",
    "express": "^4.21.2",
    "express-session": "^1.18.2",
    "http-errors": "^2.0.1",
    "mongodb": "^4.17.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.25",
    "@types/express-session": "^1.18.2",
    "@types/http-errors": "^2.0.5",
    "@types/node": "^18.19.130",
    "ts-node": "^10.9.2",
    "typescript": "^4.9.5"
  }
}
```

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "sourceMap": false,
    "outDir": "dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

- [ ] **Step 3: Refresh lockfile and fix low-risk type errors**

Run: `pnpm install`
Expected: PASS and lockfile updates to the selected stable versions.

Fix only these low-risk issues if they surface:

- `Request` / `Response` type imports for middleware signatures
- `server.ts` dist entrypoint path
- `swagger-ui-express` type import mismatches

- [ ] **Step 4: Re-run the full suite**

Run: `pnpm test`
Expected: PASS

Run: `pnpm build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json
git commit -m "chore: upgrade dependencies within stable majors"
```

### Task 7: Centralize Env, Mongo Bootstrap, And Shared Middleware

**Files:**
- Create: `lib/env.ts`
- Create: `lib/mongo.ts`
- Create: `middleware/requestLogger.ts`
- Create: `middleware/errorHandler.ts`
- Modify: `app.ts`
- Modify: `server.ts`
- Test: `tests/routes/app-smoke.test.ts`

- [ ] **Step 1: Write the failing smoke regression test**

```ts
import request from 'supertest';
import {describe, expect, it} from 'vitest';
import {createApp} from '../../app';

describe('app smoke regression', () => {
  it('still serves html root, docs, and api routes after bootstrap refactor', async () => {
    const app = createApp({enableRequestLogging: false});

    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/docs/')).status).toBe(200);
    expect((await request(app).get('/api')).status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/routes/app-smoke.test.ts`
Expected: FAIL once the old inline bootstrap code is removed from `app.ts` and before the new shared modules are wired.

- [ ] **Step 3: Extract env, mongo, request logging, and error handling**

```ts
// lib/env.ts
export function getEnv() {
  return {
    port: Number(process.env.PORT || 3000),
    mongodbUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017',
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret'
  };
}
```

```ts
// lib/mongo.ts
import MongodbClient from '../models/mongodbMgr';

declare global {
  var mongodbClient: MongodbClient;
}

export async function connectMongo(url: string) {
  return new Promise<MongodbClient>((resolve) => {
    global.mongodbClient = new MongodbClient(url, () => resolve(global.mongodbClient));
  });
}
```

```ts
// middleware/requestLogger.ts
import {Request, Response, NextFunction} from 'express';
import {getDateFormat} from '../models/utils';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  console.log(`[${getDateFormat()}] ${req.method}: ${req.originalUrl}`);
  next();
}
```

```ts
// middleware/errorHandler.ts
import createError from 'http-errors';
import {NextFunction, Request, Response} from 'express';

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  next(createError(404));
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
}
```

```ts
// server.ts
import dotenv from 'dotenv';
import {createApp} from './app';
import {getEnv} from './lib/env';
import {connectMongo} from './lib/mongo';

dotenv.config();

async function main() {
  const env = getEnv();
  await connectMongo(env.mongodbUrl);
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`server is running on http://localhost:${env.port}/`);
  });
}

main();
```

- [ ] **Step 4: Run the smoke test, full test suite, and build**

Run: `pnpm vitest run tests/routes/app-smoke.test.ts`
Expected: PASS

Run: `pnpm test`
Expected: PASS

Run: `pnpm build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/env.ts lib/mongo.ts middleware/requestLogger.ts middleware/errorHandler.ts app.ts server.ts tests/routes/app-smoke.test.ts
git commit -m "refactor: centralize bootstrap and shared middleware"
```

## Coverage Check

- Stage 1 build and package-manager changes are covered by Task 1 and Task 2.
- `canvas` to `sharp` replacement is covered by Task 2.
- OpenAPI and `/docs` are covered by Task 3.
- Minimal regression tests are covered by Task 1, Task 4, Task 5, and Task 7.
- Stable dependency upgrades are covered by Task 6.
- Low-risk internal cleanup is covered by Task 7.
- `mongoose` migration is intentionally excluded from this plan.
