const test = require('node:test');
const assert = require('node:assert/strict');
const { createReviewStore } = require('../src/review-store');

async function waitFor(check, timeoutMs = 1000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = check();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('Timed out waiting for review job');
}

const input = {
  roleId: 'resume-terminator',
  reviewMode: 'general',
  contextText: '',
  materialText: 'a'.repeat(100)
};

test('completes a job and never exposes or retains source text publicly', async () => {
  const store = createReviewStore({
    idFactory: () => '00000000-0000-0000-0000-000000000001',
    runner: async (_input, onStage) => {
      onStage({ status: 'validating', stageIndex: 2, progress: 76 });
      return {
        report: { verdict: 'test' },
        meta: { model: 'test-model', protocol: 'responses' }
      };
    }
  });

  const created = store.create(input);
  assert.equal(Object.hasOwn(created, 'input'), false);
  assert.equal(JSON.stringify(created).includes(input.materialText), false);

  const completed = await waitFor(() => {
    const job = store.get(created.id);
    return job.status === 'completed' ? job : null;
  });

  assert.equal(completed.progress, 100);
  assert.equal(completed.report.id, 'BML-00000000');
  assert.equal(completed.context.modeLabel, '整体评审');
  assert.equal(completed.context.roleId, 'resume-terminator');
  assert.equal(JSON.stringify(completed).includes(input.materialText), false);
  store.close();
});

test('returns a sanitized retryable failure', async () => {
  const store = createReviewStore({
    runner: async () => {
      const error = new Error('云开发 AI 响应超时');
      error.code = 'PROVIDER_TIMEOUT';
      error.retryable = true;
      throw error;
    }
  });

  const created = store.create(input);
  const failed = await waitFor(() => {
    const job = store.get(created.id);
    return job.status === 'failed' ? job : null;
  });

  assert.equal(failed.error.code, 'PROVIDER_TIMEOUT');
  assert.equal(failed.error.retryable, true);
  assert.equal(JSON.stringify(failed).includes(input.materialText), false);
  store.close();
});
