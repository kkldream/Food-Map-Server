import fs from 'fs';
import path from 'path';
import type {Express, RequestHandler} from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

type OpenApiSpec = {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths?: Record<string, unknown>;
  components?: Record<string, unknown>;
  tags?: Array<{
    name: string;
    description?: string;
  }>;
};

let openApiSpecCache: OpenApiSpec | null = null;

function resolveOpenApiDirectory() {
  const candidates = [
    path.resolve(__dirname, 'docs/openapi'),
    path.resolve(__dirname, '../docs/openapi'),
    path.resolve(process.cwd(), 'docs/openapi')
  ];

  const openApiDirectory = candidates.find((candidate, index) => {
    return candidates.indexOf(candidate) === index && fs.existsSync(candidate);
  });

  if (!openApiDirectory) {
    throw new Error('OpenAPI docs directory not found.');
  }

  return openApiDirectory;
}

export function getOpenApiSpec() {
  if (openApiSpecCache) {
    return openApiSpecCache;
  }

  const openApiDirectory = resolveOpenApiDirectory();

  openApiSpecCache = swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Food Map Server API',
        version: '1.0.0'
      }
    },
    apis: [path.join(openApiDirectory, '*.yaml')],
    failOnErrors: true
  }) as OpenApiSpec;

  return openApiSpecCache;
}

export function registerSwagger(app: Express) {
  let swaggerUiHandler: RequestHandler | null = null;

  app.use('/docs', swaggerUi.serve);
  app.use('/docs', (req, res, next) => {
    try {
      if (!swaggerUiHandler) {
        swaggerUiHandler = swaggerUi.setup(getOpenApiSpec()) as RequestHandler;
      }

      return swaggerUiHandler(req, res, next);
    } catch (error) {
      return next(error);
    }
  });
}
