const { parseResumeBuffer } = require('../../api/src/material-parser');
const { validateReviewInput } = require('../../api/src/review-input');
const { randomUUID } = require('crypto');

const PUBLIC_ROLE_IDS = new Set([
  'resume-terminator',
  'report-debt-collector',
  'copy-judge',
  'product-tyrant'
]);

function publicError(error) {
  return {
    code: error.code || 'CLOUD_FUNCTION_FAILED',
    message: error.message || '云端处理失败，请稍后重试',
    retryable: error.retryable !== false
  };
}

function assertFileId(fileId) {
  if (typeof fileId !== 'string' || !fileId.startsWith('cloud://')) {
    const error = new Error('云存储文件标识无效');
    error.code = 'INVALID_CLOUD_FILE_ID';
    error.retryable = false;
    throw error;
  }
}

function createCloudHandler(options) {
  const storage = options.storage;
  const reviewRunner = options.reviewRunner;
  const materialParser = options.materialParser || parseResumeBuffer;
  const miniProgramCode = options.miniProgramCode;

  async function readPrivateJson(fileId) {
    assertFileId(fileId);
    try {
      const { data: blob } = await storage.download(fileId);
      return JSON.parse(Buffer.from(await blob.arrayBuffer()).toString('utf8'));
    } finally {
      await storage.remove([fileId]).catch(() => {});
    }
  }

  async function writePrivateJson(prefix, value) {
    const date = new Date().toISOString().slice(0, 10);
    return storage.upload(
      `temporary-results/${date}/${prefix}-${randomUUID()}.json`,
      Buffer.from(JSON.stringify(value))
    );
  }

  async function parseMaterial(event) {
    assertFileId(event.fileId);
    const fileType = event.fileType === 'docx' ? 'docx' : 'pdf';
    try {
      const { data: blob } = await storage.download(event.fileId);
      const buffer = Buffer.from(await blob.arrayBuffer());
      const material = await materialParser({ fileName: `material.${fileType}`, buffer });
      return { resultFileId: await writePrivateJson('material', material) };
    } finally {
      await storage.remove([event.fileId]).catch(() => {});
    }
  }

  async function createReview(event) {
    const input = await readPrivateJson(event.requestFileId);
    const validation = validateReviewInput(input);
    if (!validation.valid) {
      const error = new Error(validation.errors[0]);
      error.code = 'INVALID_REVIEW_INPUT';
      error.retryable = false;
      throw error;
    }

    const startedAt = Date.now();
    const result = await reviewRunner(validation.value);
    const shortId = String(event.reviewId || Date.now()).replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase();
    const job = {
      id: event.reviewId || `cloud-${Date.now()}`,
      status: 'completed',
      stageIndex: 4,
      progress: 100,
      context: {
        roleId: validation.value.roleId,
        reviewMode: validation.value.reviewMode,
        modeLabel: validation.value.reviewMode === 'targeted' ? '带目标评审' : '整体评审'
      },
      report: {
        ...result.report,
        id: `BML-${shortId || 'CLOUD'}`,
        createdAt: '真实评审 · 单次验收'
      },
      meta: {
        ...result.meta,
        durationMs: Date.now() - startedAt
      },
      error: null
    };
    return { resultFileId: await writePrivateJson('review', job) };
  }

  async function generateShareCode(event) {
    const request = event.posterType === 'home'
      ? { scene: 'p=home', page: 'pages/home/index' }
      : {
          scene: `r=${event.roleId}`,
          page: 'pages/role/index'
        };
    const result = await miniProgramCode.generate(request);
    return {
      imageBase64: Buffer.from(result.buffer).toString('base64'),
      contentType: result.contentType || 'image/png'
    };
  }

  function assertShareTarget(event) {
    const valid = event.posterType === 'home'
      || (event.posterType === 'role' && PUBLIC_ROLE_IDS.has(event.roleId));
    if (!valid) {
      const error = new Error('分享海报目标无效');
      error.code = 'INVALID_SHARE_TARGET';
      error.retryable = false;
      throw error;
    }
  }

  return async function main(event = {}) {
    try {
      if (event.action === 'parseMaterial') {
        return { ok: true, data: await parseMaterial(event) };
      }
      if (event.action === 'createReview') {
        return { ok: true, data: await createReview(event) };
      }
      if (event.action === 'generateShareCode') {
        assertShareTarget(event);
        return { ok: true, data: await generateShareCode(event) };
      }
      return {
        ok: false,
        error: { code: 'UNKNOWN_ACTION', message: '云函数操作不存在', retryable: false }
      };
    } catch (error) {
      return { ok: false, error: publicError(error) };
    }
  };
}

module.exports = { createCloudHandler, publicError };
