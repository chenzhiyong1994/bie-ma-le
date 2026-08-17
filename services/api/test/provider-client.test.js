const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ProviderError,
  createProviderClient,
  parseJsonOutput,
  schemaInstruction
} = require('../src/provider-client');

function config() {
  return {
    envId: 'test-env',
    providerGroup: 'cloudbase',
    model: 'test-model',
    timeoutMs: 1000,
    maxOutputTokens: 500
  };
}

test('parses plain and fenced JSON output', () => {
  assert.deepEqual(parseJsonOutput('{"ok":true}'), { ok: true });
  assert.deepEqual(parseJsonOutput('```json\n{"ok":true}\n```'), { ok: true });
});

test('includes the schema in the CloudBase AI system message', async () => {
  let captured;
  let capturedOptions;
  const client = createProviderClient(config(), {
    aiModel: {
      async generateText(request, options) {
        captured = request;
        capturedOptions = options;
        return {
          text: '{"ok":true}',
          usage: { total_tokens: 12 }
        };
      }
    }
  });

  const result = await client.generateStructured({
    instructions: 'test instructions',
    input: 'test input',
    schemaName: 'test_schema',
    schema: {
      type: 'object',
      properties: { ok: { type: 'boolean' } },
      required: ['ok']
    }
  });

  assert.equal(captured.model, 'test-model');
  assert.equal(captured.temperature, 0.2);
  assert.equal(captured.max_tokens, 500);
  assert.deepEqual(capturedOptions, { timeout: 1000 });
  assert.equal(captured.messages[0].role, 'system');
  assert.match(captured.messages[0].content, /不要输出 Markdown/);
  assert.match(captured.messages[0].content, /test_schema/);
  assert.match(captured.messages[0].content, /"required":\["ok"\]/);
  assert.equal(captured.messages[1].content, 'test input');
  assert.equal(result.data.ok, true);
  assert.equal(result.meta.protocol, 'cloudbase_ai');
  assert.equal(result.meta.providerGroup, 'cloudbase');
});

test('retries one transient provider failure before succeeding', async () => {
  let attempts = 0;
  const delays = [];
  const client = createProviderClient(config(), {
    aiModel: {
      async generateText() {
        attempts += 1;
        if (attempts === 1) {
          const error = new Error('socket hang up');
          error.code = 'ECONNRESET';
          throw error;
        }
        return {
          text: '{"ok":true}',
          usage: null
        };
      }
    },
    sleep: async (milliseconds) => {
      delays.push(milliseconds);
    }
  });

  const result = await client.generateStructured({
    instructions: 'test',
    input: 'test',
    schemaName: 'test_schema',
    schema: { type: 'object' }
  });

  assert.equal(result.data.ok, true);
  assert.equal(attempts, 2);
  assert.deepEqual(delays, [300]);
});

test('backs off when CloudBase reports a concurrency limit', async () => {
  let attempts = 0;
  const delays = [];
  const client = createProviderClient(config(), {
    aiModel: {
      async generateText() {
        attempts += 1;
        if (attempts < 3) {
          const error = new Error('该 API key 超出并发限制');
          error.status = 429;
          throw error;
        }
        return {
          text: '{"ok":true}',
          usage: null
        };
      }
    },
    sleep: async (milliseconds) => {
      delays.push(milliseconds);
    }
  });

  const result = await client.generateStructured({
    instructions: 'test',
    input: 'test',
    schemaName: 'test_schema',
    schema: { type: 'object' }
  });

  assert.equal(result.data.ok, true);
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [1000, 2000]);
});

test('keeps retrying through the four consecutive concurrency limits observed in production', async () => {
  let attempts = 0;
  const delays = [];
  const client = createProviderClient(config(), {
    aiModel: {
      async generateText() {
        attempts += 1;
        if (attempts <= 4) {
          const error = new Error('该 API key 超出并发限制');
          error.status = 429;
          throw error;
        }
        return {
          text: '{"ok":true}',
          usage: null
        };
      }
    },
    sleep: async (milliseconds) => {
      delays.push(milliseconds);
    }
  });

  const result = await client.generateStructured({
    instructions: 'test',
    input: 'test',
    schemaName: 'test_schema',
    schema: { type: 'object' }
  });

  assert.equal(result.data.ok, true);
  assert.equal(attempts, 5);
  assert.deepEqual(delays, [1000, 2000, 4000, 8000]);
});

test('stops after the bounded concurrency backoff window is exhausted', async () => {
  let attempts = 0;
  const delays = [];
  const client = createProviderClient(config(), {
    aiModel: {
      async generateText() {
        attempts += 1;
        const error = new Error('该 API key 超出并发限制');
        error.status = 429;
        throw error;
      }
    },
    sleep: async (milliseconds) => {
      delays.push(milliseconds);
    }
  });

  await assert.rejects(
    () => client.generateStructured({
      instructions: 'test',
      input: 'test',
      schemaName: 'test_schema',
      schema: { type: 'object' }
    }),
    (error) => error instanceof ProviderError
      && error.code === 'PROVIDER_CONCURRENCY_LIMITED'
  );

  assert.equal(attempts, 6);
  assert.deepEqual(delays, [1000, 2000, 4000, 8000, 16000]);
});

test('schema instruction is deterministic and names the output', () => {
  const instruction = schemaInstruction('report', { type: 'object' });
  assert.match(instruction, /report/);
  assert.match(instruction, /JSON Schema/);
});

test('maps unavailable models without leaking CloudBase details', async () => {
  let attempts = 0;
  const client = createProviderClient(config(), {
    aiModel: {
      async generateText() {
        attempts += 1;
        throw new Error('InvalidParameter: model sensitive-internal-model not found');
      }
    }
  });

  await assert.rejects(
    () => client.generateStructured({
      instructions: 'test',
      input: 'test',
      schemaName: 'test_schema',
      schema: { type: 'object' }
    }),
    (error) => error instanceof ProviderError
      && error.code === 'MODEL_NOT_AVAILABLE'
      && !error.message.includes('sensitive')
  );
  assert.equal(attempts, 1);
});
