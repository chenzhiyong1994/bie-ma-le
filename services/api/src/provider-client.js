class ProviderError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.status = options.status || 502;
    this.retryable = options.retryable !== false;
  }
}

const CONCURRENCY_BACKOFF_MS = [1000, 2000, 4000, 8000, 16000];

function parseJsonOutput(text) {
  const stripped = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  if (!stripped) {
    throw new ProviderError('EMPTY_MODEL_OUTPUT', '模型没有返回可用报告');
  }

  try {
    return JSON.parse(stripped);
  } catch (error) {
    throw new ProviderError('INVALID_MODEL_JSON', '模型返回的报告不是有效 JSON');
  }
}

function schemaInstruction(schemaName, schema) {
  return `输出对象名称：${schemaName}\n只输出一个能被 JSON.parse 直接解析的 JSON 对象，不要输出 Markdown 代码块、解释或前后缀。\n必须严格符合以下 JSON Schema：\n${JSON.stringify(schema)}`;
}

function mapProviderError(error) {
  const message = String(error && error.message || '').toLowerCase();
  const status = Number(error && (error.status || error.statusCode || error.code));
  if (message.includes('timeout') || message.includes('timed out')) {
    return new ProviderError('PROVIDER_TIMEOUT', '云开发 AI 响应超时');
  }
  if (message.includes('model') || message.includes('not found') || message.includes('invalidparameter')) {
    return new ProviderError('MODEL_NOT_AVAILABLE', '云开发环境尚未启用当前模型', {
      retryable: false
    });
  }
  if (message.includes('quota')
    || message.includes('token usage')
    || message.includes('exceed_token_quota')
    || message.includes('额度')) {
    return new ProviderError('PROVIDER_QUOTA_EXCEEDED', '云开发 AI 当前额度不可用', {
      retryable: false
    });
  }
  if (status === 429
    || message.includes('429')
    || message.includes('concurrent')
    || message.includes('too many requests')
    || message.includes('rate limit')
    || message.includes('并发')) {
    return new ProviderError('PROVIDER_CONCURRENCY_LIMITED', '云开发 AI 当前请求拥挤');
  }
  return new ProviderError('PROVIDER_REQUEST_FAILED', '云开发 AI 暂时不可用');
}

function createProviderClient(config, options = {}) {
  let aiModel = options.aiModel;
  const sleep = options.sleep || ((milliseconds) => new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  }));
  const now = options.now || Date.now;
  if (!aiModel) {
    const cloudbase = options.cloudbaseSdk || require('@cloudbase/node-sdk');
    const initOptions = { timeout: config.timeoutMs };
    if (config.envId) initOptions.env = config.envId;
    if (config.secretId || config.secretKey) {
      initOptions.secretId = config.secretId;
      initOptions.secretKey = config.secretKey;
    }
    const app = cloudbase.init(initOptions);
    aiModel = app.ai().createModel(config.providerGroup);
  }

  async function generateStructured({ instructions, input, schema, schemaName }) {
    const request = {
      model: config.model,
      temperature: 0.2,
      max_tokens: config.maxOutputTokens,
      messages: [
        { role: 'system', content: `${instructions}\n\n${schemaInstruction(schemaName, schema)}` },
        { role: 'user', content: input }
      ]
    };
    let result;
    for (let attempt = 0; attempt <= CONCURRENCY_BACKOFF_MS.length; attempt += 1) {
      const attemptStartedAt = now();
      try {
        result = await aiModel.generateText(request, { timeout: config.timeoutMs });
        break;
      } catch (error) {
        const providerError = mapProviderError(error);
        if (providerError.code === 'PROVIDER_CONCURRENCY_LIMITED'
          && attempt < CONCURRENCY_BACKOFF_MS.length) {
          await sleep(CONCURRENCY_BACKOFF_MS[attempt]);
          continue;
        }
        const isFastTransientFailure = providerError.code === 'PROVIDER_REQUEST_FAILED'
          && now() - attemptStartedAt <= 5000;
        if (attempt === 0 && isFastTransientFailure) {
          await sleep(300);
          continue;
        }
        throw providerError;
      }
    }

    return {
      data: parseJsonOutput(result && result.text),
      meta: {
        model: config.model,
        providerGroup: config.providerGroup,
        protocol: 'cloudbase_ai',
        usage: result && result.usage || null
      }
    };
  }

  return {
    generateStructured
  };
}

module.exports = {
  ProviderError,
  createProviderClient,
  parseJsonOutput,
  schemaInstruction
};
