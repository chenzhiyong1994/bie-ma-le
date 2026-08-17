const http = require('http');
const { URL } = require('url');
const { loadConfig } = require('./config');
const { createProviderClient } = require('./provider-client');
const { createReviewRunner } = require('./review-runner');
const { createReviewStore } = require('./review-store');
const { parseResumeBuffer, readSingleUpload } = require('./material-parser');
const { validateReviewInput } = require('./review-input');

const BODY_LIMIT_BYTES = 128 * 1024;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > BODY_LIMIT_BYTES) {
        reject(Object.assign(new Error('请求内容过大'), { statusCode: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (error) {
        reject(Object.assign(new Error('请求 JSON 无效'), { statusCode: 400 }));
      }
    });

    request.on('error', reject);
  });
}

function createApiServer(options = {}) {
  const config = options.config || loadConfig();
  const logger = options.logger || console;
  let reviewStore = options.reviewStore;
  if (!reviewStore) {
    const providerClient = options.providerClient || createProviderClient(config.provider);
    reviewStore = createReviewStore({
      runner: createReviewRunner(providerClient),
      ttlMs: config.reviewTtlMs
    });
  }
  const materialParser = options.materialParser || parseResumeBuffer;

  const server = http.createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
      sendJson(response, 204, {});
      return;
    }

    const url = new URL(request.url, 'http://localhost');

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, {
        status: 'ok',
        provider: {
          configured: true,
          model: config.provider.model,
          providerGroup: config.provider.providerGroup,
          protocol: 'cloudbase_ai'
        }
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/reviews') {
      try {
        const body = await readJsonBody(request);
        const validation = validateReviewInput(body);
        if (!validation.valid) {
          sendJson(response, 400, {
            error: {
              code: 'INVALID_REVIEW_INPUT',
              message: validation.errors[0],
              details: validation.errors
            }
          });
          return;
        }

        const job = reviewStore.create(validation.value);
        logger.info(`[review:${job.id}] queued`);
        sendJson(response, 202, job);
      } catch (error) {
        sendJson(response, error.statusCode || 500, {
          error: {
            code: 'INVALID_REQUEST',
            message: error.message || '请求处理失败'
          }
        });
      }
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/materials/parse') {
      try {
        const upload = await readSingleUpload(request);
        const material = await materialParser(upload);
        sendJson(response, 200, material);
      } catch (error) {
        sendJson(response, error.statusCode || 400, {
          error: {
            code: error.code || 'FILE_PARSE_FAILED',
            message: error.message || '文件解析失败'
          }
        });
      }
      return;
    }

    const reviewMatch = url.pathname.match(/^\/api\/reviews\/([a-f0-9-]+)$/i);
    if (request.method === 'GET' && reviewMatch) {
      const job = reviewStore.get(reviewMatch[1]);
      if (!job) {
        sendJson(response, 404, {
          error: {
            code: 'REVIEW_NOT_FOUND',
            message: '评审任务不存在或已过期'
          }
        });
        return;
      }

      sendJson(response, 200, job);
      return;
    }

    sendJson(response, 404, {
      error: {
        code: 'NOT_FOUND',
        message: '接口不存在'
      }
    });
  });

  server.on('close', () => reviewStore.close());
  server.reviewStore = reviewStore;
  return server;
}

if (require.main === module) {
  const config = loadConfig();
  const server = createApiServer({ config });
  server.listen(config.port, config.host, () => {
    console.log(`Bie-Ma-Le API listening on http://${config.host}:${config.port}`);
    console.log(`CloudBase AI configured: ${config.provider.providerGroup} / ${config.provider.model}`);
  });
}

module.exports = {
  createApiServer,
  validateReviewInput
};
