const test = require('node:test');
const assert = require('node:assert/strict');
const { createApiServer, validateReviewInput } = require('../src/server');

const validBody = {
  roleId: 'resume-terminator',
  reviewMode: 'general',
  contextText: '',
  materialText: '有成果证据的评审材料正文。'.repeat(12)
};

function testConfig() {
  return {
    host: '127.0.0.1',
    port: 0,
    reviewTtlMs: 1000,
    provider: {
      envId: 'test-env',
      providerGroup: 'cloudbase',
      model: 'test-model',
      timeoutMs: 1000,
      maxOutputTokens: 100
    }
  };
}

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

test('validates the supported role and input length boundaries', () => {
  assert.equal(validateReviewInput(validBody).valid, true);
  assert.equal(validateReviewInput({ ...validBody, materialText: 'too short' }).valid, false);
  assert.equal(validateReviewInput({ ...validBody, roleId: 'other-role' }).valid, false);
  for (const roleId of ['resume-terminator', 'report-debt-collector', 'copy-judge', 'product-tyrant']) {
    const validated = validateReviewInput({ ...validBody, roleId });
    assert.equal(validated.valid, true, roleId);
    assert.equal(validated.value.roleId, roleId);
  }
});

test('creates and reads review jobs without exposing source material', async () => {
  const jobs = new Map();
  const reviewStore = {
    create(input) {
      const job = {
        id: '00000000-0000-0000-0000-000000000002',
        status: 'queued',
        stageIndex: 0,
        progress: 8,
        context: {
          reviewMode: input.reviewMode,
          modeLabel: input.reviewMode === 'jd' ? '按目标 JD 评审' : '整体简历评审'
        }
      };
      jobs.set(job.id, job);
      return job;
    },
    get(id) {
      return jobs.get(id) || null;
    },
    close() {}
  };
  const server = createApiServer({
    config: testConfig(),
    reviewStore,
    logger: { info() {} }
  });
  const baseUrl = await listen(server);

  const createResponse = await fetch(`${baseUrl}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validBody)
  });
  const created = await createResponse.json();
  assert.equal(createResponse.status, 202);
  assert.equal(created.status, 'queued');
  assert.equal(JSON.stringify(created).includes(validBody.materialText), false);

  const getResponse = await fetch(`${baseUrl}/api/reviews/${created.id}`);
  assert.equal(getResponse.status, 200);

  const invalidResponse = await fetch(`${baseUrl}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...validBody, materialText: 'short' })
  });
  assert.equal(invalidResponse.status, 400);

  const targetedResponse = await fetch(`${baseUrl}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...validBody, reviewMode: 'targeted', contextText: 'too short' })
  });
  assert.equal(targetedResponse.status, 400);

  await new Promise((resolve) => server.close(resolve));
});

test('accepts one multipart document through the material parsing route', async () => {
  let receivedUpload;
  const extractedText = '工作经历\n负责增长实验并将转化率从 10% 提升到 16%。'.repeat(4);
  const server = createApiServer({
    config: testConfig(),
    reviewStore: {
      create() {},
      get() { return null; },
      close() {}
    },
    materialParser: async (upload) => {
      receivedUpload = upload;
      return {
        fileName: upload.fileName,
        fileType: 'pdf',
        characterCount: extractedText.length,
        text: extractedText,
        warnings: []
      };
    },
    logger: { info() {} }
  });
  const baseUrl = await listen(server);
  const form = new FormData();
  form.append('file', new Blob([Buffer.from('%PDF-1.7\nresume fixture')], {
    type: 'application/pdf'
  }), 'resume.pdf');

  const response = await fetch(`${baseUrl}/api/materials/parse`, {
    method: 'POST',
    body: form
  });
  const material = await response.json();

  assert.equal(response.status, 200);
  assert.equal(receivedUpload.fileName, 'resume.pdf');
  assert.equal(receivedUpload.buffer.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.equal(material.text, extractedText);

  await new Promise((resolve) => server.close(resolve));
});
