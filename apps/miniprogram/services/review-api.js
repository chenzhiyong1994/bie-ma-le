const cloudConfig = require('../config/cloud');

const activeReviews = new Map();

function cloudUnavailableError() {
  return {
    code: 'CLOUD_UNAVAILABLE',
    message: '当前微信环境不支持云开发，请更新微信后重试',
    retryable: false
  };
}

function normalizeCloudError(error, fallbackMessage) {
  const message = error && (error.message || error.errMsg) || fallbackMessage;
  if (message.includes('environment') || message.includes('env') || message.includes('环境')) {
    return {
      code: 'CLOUD_ENV_NOT_CONFIGURED',
      message: '云开发环境未正确关联，请检查环境 ID 与小程序 AppID',
      retryable: false
    };
  }
  if (message.includes('not exists')) {
    return {
      code: 'CLOUD_FUNCTION_NOT_DEPLOYED',
      message: '云函数尚未部署，请先部署 bml-api-v2',
      retryable: false
    };
  }
  if (message.includes('FUNCTIONS_EXECUTE_FAIL')) {
    return {
      code: 'CLOUD_FUNCTION_EXECUTE_FAILED',
      message: fallbackMessage,
      retryable: true
    };
  }
  return {
    code: 'CLOUD_REQUEST_FAILED',
    message: fallbackMessage,
    retryable: true
  };
}

function callCloud(data) {
  if (!wx.cloud) return Promise.reject(cloudUnavailableError());
  const options = {
    name: cloudConfig.functionName,
    data
  };
  if (cloudConfig.environmentId) options.config = { env: cloudConfig.environmentId };
  return wx.cloud.callFunction(options).then((response) => {
    const result = response && response.result;
    if (!result || result.ok !== true) {
      return Promise.reject(result && result.error || {
        code: 'INVALID_CLOUD_RESPONSE',
        message: '云函数返回了无效结果',
        retryable: true
      });
    }
    return result.data;
  });
}

function createReviewId() {
  const random = Math.random().toString(16).slice(2, 10);
  return `${Date.now().toString(16)}-${random}`;
}

function createReview(draft) {
  const id = createReviewId();
  const createdAt = new Date().toISOString();
  const state = {
    id,
    status: 'queued',
    stageIndex: 0,
    progress: 8,
    createdAt,
    updatedAt: createdAt,
    context: {
      roleId: draft.roleId,
      reviewMode: draft.reviewMode,
      modeLabel: draft.reviewMode === 'targeted' ? '带目标评审' : '整体评审'
    },
    report: null,
    meta: null,
    error: null,
    startedAt: Date.now()
  };
  activeReviews.set(id, state);

  (async () => {
    let requestFileId = '';
    try {
      requestFileId = await uploadPrivateJson('review-input', draft);
      const { resultFileId } = await callCloud({
        action: 'createReview',
        reviewId: id,
        requestFileId
      });
      requestFileId = '';
      const job = await downloadPrivateJson(resultFileId);
      Object.assign(state, job, { updatedAt: new Date().toISOString() });
    } catch (error) {
      if (requestFileId) wx.cloud.deleteFile({ fileList: [requestFileId] }).catch(() => {});
      state.status = 'failed';
      state.error = error && error.code
        ? error
        : normalizeCloudError(error, '云开发 AI 调用失败，请稍后重试');
      state.progress = Math.max(state.progress, 47);
      state.updatedAt = new Date().toISOString();
    }
  })();

  return Promise.resolve({ ...state, startedAt: undefined });
}

function getReview(reviewId) {
  const state = activeReviews.get(reviewId);
  if (!state) {
    return Promise.reject({
      code: 'REVIEW_NOT_FOUND',
      message: '本次评审任务已失效，请返回重新提交',
      retryable: false
    });
  }

  if (state.status === 'queued' || state.status === 'analyzing') {
    const elapsed = Date.now() - state.startedAt;
    if (elapsed > 900) {
      state.status = 'analyzing';
      state.stageIndex = elapsed > 16000 ? 2 : 1;
      state.progress = elapsed > 16000
        ? Math.min(76, 58 + Math.floor((elapsed - 16000) / 1400))
        : Math.min(57, 26 + Math.floor(elapsed / 900));
    }
  }

  return Promise.resolve({ ...state, startedAt: undefined });
}

function cloudPathFor(fileName) {
  const extensionMatch = String(fileName || '').toLowerCase().match(/\.(pdf|docx)$/);
  const extension = extensionMatch ? extensionMatch[1] : 'bin';
  const date = new Date().toISOString().slice(0, 10);
  return `temporary-materials/${date}/${createReviewId()}.${extension}`;
}

function privateJsonPath(prefix) {
  const date = new Date().toISOString().slice(0, 10);
  return `temporary-payloads/${date}/${prefix}-${createReviewId()}.json`;
}

async function uploadPrivateJson(prefix, value) {
  const localPath = `${wx.env.USER_DATA_PATH}/${prefix}-${createReviewId()}.json`;
  const fileSystem = wx.getFileSystemManager();
  fileSystem.writeFileSync(localPath, JSON.stringify(value), 'utf8');
  try {
    const upload = await wx.cloud.uploadFile({
      cloudPath: privateJsonPath(prefix),
      filePath: localPath
    });
    return upload.fileID;
  } finally {
    try { fileSystem.unlinkSync(localPath); } catch (error) {}
  }
}

async function downloadPrivateJson(fileId) {
  try {
    const download = await wx.cloud.downloadFile({ fileID: fileId });
    const text = wx.getFileSystemManager().readFileSync(download.tempFilePath, 'utf8');
    return JSON.parse(text);
  } finally {
    if (fileId) await wx.cloud.deleteFile({ fileList: [fileId] }).catch(() => {});
  }
}

async function parseMaterialFile(filePath, fileName = '评审材料.pdf') {
  if (!wx.cloud) throw cloudUnavailableError();
  let fileId = '';
  try {
    const upload = await wx.cloud.uploadFile({
      cloudPath: cloudPathFor(fileName),
      filePath
    });
    fileId = upload.fileID;
    const { resultFileId } = await callCloud({
      action: 'parseMaterial',
      fileId,
      fileType: String(fileName).toLowerCase().endsWith('.docx') ? 'docx' : 'pdf'
    });
    return await downloadPrivateJson(resultFileId);
  } catch (error) {
    if (fileId) wx.cloud.deleteFile({ fileList: [fileId] }).catch(() => {});
    if (error && error.code) throw error;
    throw normalizeCloudError(error, '文件上传或解析失败，请重试');
  }
}

module.exports = {
  createReview,
  getReview,
  parseMaterialFile,
  parseResumeFile: parseMaterialFile
};
