function positiveInteger(value, fallback, name) {
  const parsed = Number.parseInt(value || fallback, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function required(value, name) {
  if (!value || !String(value).trim()) {
    throw new Error(`${name} is required`);
  }
  return String(value).trim();
}

function loadConfig(env = process.env) {
  return {
    host: env.API_HOST || '127.0.0.1',
    port: positiveInteger(env.API_PORT, 8787, 'API_PORT'),
    reviewTtlMs: positiveInteger(env.REVIEW_TTL_MS, 1800000, 'REVIEW_TTL_MS'),
    provider: {
      envId: required(env.CLOUDBASE_ENV_ID, 'CLOUDBASE_ENV_ID'),
      providerGroup: (env.CLOUDBASE_AI_PROVIDER || 'cloudbase').trim(),
      model: (env.CLOUDBASE_AI_MODEL || 'hy3').trim(),
      secretId: env.TENCENT_SECRET_ID ? env.TENCENT_SECRET_ID.trim() : '',
      secretKey: env.TENCENT_SECRET_KEY ? env.TENCENT_SECRET_KEY.trim() : '',
      timeoutMs: positiveInteger(env.AI_TIMEOUT_MS, 55000, 'AI_TIMEOUT_MS'),
      maxOutputTokens: positiveInteger(env.AI_MAX_OUTPUT_TOKENS, 6000, 'AI_MAX_OUTPUT_TOKENS')
    }
  };
}

module.exports = {
  loadConfig
};
