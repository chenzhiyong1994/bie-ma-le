const test = require('node:test');
const assert = require('node:assert/strict');
const { createCloudHandler } = require('../../cloud-function/src/handler');

test('deletes the temporary cloud file after successful parsing', async () => {
  const removed = [];
  const uploaded = [];
  const handler = createCloudHandler({
    storage: {
      async download() {
        return { data: new Blob([Buffer.from('%PDF-test')]) };
      },
      async remove(fileIds) {
        removed.push(...fileIds);
      },
      async upload(cloudPath, buffer) {
        uploaded.push({ cloudPath, value: JSON.parse(buffer.toString('utf8')) });
        return 'cloud://test-env/temporary-results/material.json';
      }
    },
    materialParser: async (upload) => ({
      fileName: upload.fileName,
      fileType: 'pdf',
      characterCount: 80,
      text: '材料正文'.repeat(20),
      warnings: []
    }),
    reviewRunner: async () => ({})
  });

  const result = await handler({
    action: 'parseMaterial',
    fileId: 'cloud://test-env/temporary-materials/resume.pdf',
    fileType: 'pdf'
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.resultFileId, 'cloud://test-env/temporary-results/material.json');
  assert.equal(uploaded[0].value.text, '材料正文'.repeat(20));
  assert.deepEqual(removed, ['cloud://test-env/temporary-materials/resume.pdf']);
});

test('still deletes the temporary cloud file when parsing fails', async () => {
  const removed = [];
  const handler = createCloudHandler({
    storage: {
      async download() {
        return { data: new Blob([Buffer.from('%PDF-test')]) };
      },
      async remove(fileIds) {
        removed.push(...fileIds);
      },
      async upload() {
        throw new Error('should not upload');
      }
    },
    materialParser: async () => {
      throw Object.assign(new Error('文件解析失败'), { code: 'FILE_PARSE_FAILED' });
    },
    reviewRunner: async () => ({})
  });

  const result = await handler({
    action: 'parseMaterial',
    fileId: 'cloud://test-env/temporary-materials/broken.pdf',
    fileType: 'pdf'
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'FILE_PARSE_FAILED');
  assert.deepEqual(removed, ['cloud://test-env/temporary-materials/broken.pdf']);
});

test('reads private review input, deletes it, and returns only a private result file id', async () => {
  const removed = [];
  let uploadedJob;
  const inputFileId = 'cloud://test-env/temporary-payloads/review.json';
  const handler = createCloudHandler({
    storage: {
      async download(fileId) {
        assert.equal(fileId, inputFileId);
        return { data: new Blob([Buffer.from(JSON.stringify({
          roleId: 'resume-terminator',
          reviewMode: 'general',
          contextText: '',
          materialText: '材料正文'.repeat(20)
        }))]) };
      },
      async remove(fileIds) {
        removed.push(...fileIds);
      },
      async upload(cloudPath, buffer) {
        uploadedJob = JSON.parse(buffer.toString('utf8'));
        return 'cloud://test-env/temporary-results/review.json';
      }
    },
    reviewRunner: async () => ({
      report: { qualityBand: 'ready', issues: [] },
      meta: { model: 'test' }
    })
  });

  const result = await handler({
    action: 'createReview',
    reviewId: 'test-review',
    requestFileId: inputFileId
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.data, {
    resultFileId: 'cloud://test-env/temporary-results/review.json'
  });
  assert.equal(uploadedJob.status, 'completed');
  assert.deepEqual(removed, [inputFileId]);
});

test('creates a privacy-safe mini program code for the all-tyrant poster', async () => {
  const requests = [];
  const handler = createCloudHandler({
    storage: {},
    reviewRunner: async () => ({}),
    miniProgramCode: {
      async generate(request) {
        requests.push(request);
        return {
          buffer: Buffer.from('poster-code'),
          contentType: 'image/png'
        };
      }
    }
  });

  const result = await handler({
    action: 'generateShareCode',
    posterType: 'home',
    report: { overallScore: 18, verdict: '不得进入分享载荷' }
  });

  assert.deepEqual(result, {
    ok: true,
    data: {
      imageBase64: Buffer.from('poster-code').toString('base64'),
      contentType: 'image/png'
    }
  });
  assert.deepEqual(requests, [{
    scene: 'p=home',
    page: 'pages/home/index'
  }]);
});

test('creates a mini program code that opens the selected public tyrant', async () => {
  const requests = [];
  const handler = createCloudHandler({
    storage: {},
    reviewRunner: async () => ({}),
    miniProgramCode: {
      async generate(request) {
        requests.push(request);
        return { buffer: Buffer.from('role-code') };
      }
    }
  });

  const result = await handler({
    action: 'generateShareCode',
    posterType: 'role',
    roleId: 'product-tyrant'
  });

  assert.equal(result.ok, true);
  assert.deepEqual(requests, [{
    scene: 'r=product-tyrant',
    page: 'pages/role/index'
  }]);
});

test('rejects share codes for unpublished or caller-controlled targets', async () => {
  const handler = createCloudHandler({
    storage: {},
    reviewRunner: async () => ({}),
    miniProgramCode: {
      async generate() {
        throw new Error('must not call the platform');
      }
    }
  });

  const result = await handler({
    action: 'generateShareCode',
    posterType: 'role',
    roleId: '../../pages/report/index',
    page: 'pages/report/index'
  });

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: 'INVALID_SHARE_TARGET',
      message: '分享海报目标无效',
      retryable: false
    }
  });
});
