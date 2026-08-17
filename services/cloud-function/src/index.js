const cloudbase = require('@cloudbase/node-sdk');
const wxCloud = require('wx-server-sdk');
const { createProviderClient } = require('../../api/src/provider-client');
const { createReviewRunner } = require('../../api/src/review-runner');
const { createCloudHandler } = require('./handler');

const AI_TIMEOUT_MS = Number.parseInt(process.env.AI_TIMEOUT_MS || '55000', 10);
const providerConfig = {
  providerGroup: process.env.CLOUDBASE_AI_PROVIDER || 'cloudbase',
  model: process.env.CLOUDBASE_AI_MODEL || 'hy3',
  timeoutMs: AI_TIMEOUT_MS,
  maxOutputTokens: Number.parseInt(process.env.AI_MAX_OUTPUT_TOKENS || '6000', 10)
};
const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV,
  timeout: AI_TIMEOUT_MS
});
wxCloud.init({ env: wxCloud.DYNAMIC_CURRENT_ENV });
const providerClient = createProviderClient(providerConfig, {
  aiModel: app.ai().createModel(providerConfig.providerGroup)
});

const storage = {
  async download(fileId) {
    const result = await app.downloadFile({ fileID: fileId });
    if (!result.fileContent) {
      const error = new Error('云存储文件下载失败');
      error.code = 'CLOUD_FILE_DOWNLOAD_FAILED';
      throw error;
    }
    const buffer = Buffer.isBuffer(result.fileContent)
      ? result.fileContent
      : Buffer.from(result.fileContent);
    return {
      data: {
        arrayBuffer: async () => buffer
      }
    };
  },
  remove(fileIds) {
    return app.deleteFile({ fileList: fileIds });
  },
  async upload(cloudPath, fileContent) {
    const result = await app.uploadFile({ cloudPath, fileContent });
    return result.fileID;
  }
};

const miniProgramCode = {
  async generate({ scene, page }) {
    try {
      const result = await wxCloud.openapi.wxacode.getUnlimited({
        scene,
        page,
        checkPath: true,
        envVersion: 'release',
        width: 430
      });
      return {
        buffer: result.buffer,
        contentType: result.contentType || 'image/png'
      };
    } catch (cause) {
      console.error('share_code_generation_failed', {
        code: cause && (cause.errCode || cause.code),
        message: cause && (cause.errMsg || cause.message)
      });
      const error = new Error('小程序码生成失败，请稍后重试');
      error.code = 'SHARE_CODE_FAILED';
      error.retryable = true;
      error.cause = cause;
      throw error;
    }
  }
};

exports.main = createCloudHandler({
  storage,
  reviewRunner: createReviewRunner(providerClient),
  miniProgramCode
});
