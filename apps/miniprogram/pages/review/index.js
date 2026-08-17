const { getRole } = require('../../data/roles');
const { parseMaterialFile } = require('../../services/review-api');
const { getActiveMaterialText, validateActiveMaterial } = require('../../utils/review-material');

const MAX_FILE_BYTES = 8 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

Page({
  data: {
    role: getRole('resume-terminator'),
    isResume: true,
    reviewMode: 'general',
    contextText: '',
    contextLength: 0,
    materialMode: 'file',
    materialText: '',
    materialLength: 0,
    fileMaterialText: '',
    fileName: '',
    fileSizeLabel: '',
    fileType: '',
    fileStatus: 'idle',
    fileError: '',
    fileWarnings: [],
    consentAccepted: false
  },

  onLoad(options) {
    const role = getRole(options.roleId);
    this.setData({ role });
    wx.setNavigationBarTitle({ title: `提交给${role.name}` });
  },

  selectReviewMode(event) {
    this.setData({ reviewMode: event.currentTarget.dataset.mode });
  },

  selectMaterialMode(event) {
    this.setData({ materialMode: event.currentTarget.dataset.mode });
  },

  onContextInput(event) {
    const contextText = event.detail.value;
    this.setData({ contextText, contextLength: contextText.length });
  },

  onMaterialInput(event) {
    const materialText = event.detail.value;
    this.setData({ materialText, materialLength: materialText.length });
  },

  parseSelectedFile(file) {
    if (!file || !file.path) return;
    if (file.size > MAX_FILE_BYTES) {
      wx.showToast({ title: '超过 8MB，太大了，换一个', icon: 'none' });
      return;
    }
    this.setData({
      materialMode: 'file',
      fileStatus: 'parsing',
      fileName: file.name || '评审材料',
      fileSizeLabel: formatFileSize(file.size),
      fileType: '',
      fileMaterialText: '',
      fileError: '',
      fileWarnings: []
    });

    parseMaterialFile(file.path, file.name || '评审材料.pdf')
      .then((material) => {
        this.setData({
          fileStatus: 'ready',
          fileType: material.fileType.toUpperCase(),
          fileWarnings: material.warnings || [],
          fileMaterialText: material.text
        });
      })
      .catch((error) => {
        this.setData({
          fileStatus: 'error',
          fileError: error.message || '这个文件没读出来。重新选一个，或者直接粘贴正文。',
          fileMaterialText: ''
        });
      });
  },

  chooseMaterialFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf', 'docx', 'doc'],
      success: (result) => {
        const file = result.tempFiles && result.tempFiles[0];
        if (!file) return;
        this.parseSelectedFile({ path: file.path || file.tempFilePath, name: file.name, size: file.size });
      },
      fail: (error) => {
        if (error.errMsg && error.errMsg.includes('cancel')) return;
        this.setData({ fileStatus: 'error', fileError: '没能打开这个文件。重新选择，或者直接粘贴正文。' });
      }
    });
  },

  removeFile() {
    this.setData({
      fileStatus: 'idle', fileName: '', fileSizeLabel: '', fileType: '', fileError: '',
      fileWarnings: [], fileMaterialText: ''
    });
  },

  toggleConsent() {
    this.setData({ consentAccepted: !this.data.consentAccepted });
  },

  startReview() {
    const materialText = getActiveMaterialText(this.data).trim();
    const draft = {
      roleId: this.data.role.id,
      reviewMode: this.data.reviewMode,
      contextText: this.data.reviewMode === 'targeted' ? this.data.contextText.trim() : '',
      materialText
    };
    wx.navigateTo({
      url: '/pages/processing/index',
      success(result) { result.eventChannel.emit('reviewDraft', draft); }
    });
  },

  submitReview() {
    if (this.data.reviewMode === 'targeted' && this.data.contextText.trim().length < 20) {
      wx.showToast({ title: '目标都没说清，审什么？', icon: 'none' });
      return;
    }
    const materialValidation = validateActiveMaterial(this.data);
    if (!materialValidation.valid) {
      wx.showToast({ title: materialValidation.message, icon: 'none' });
      return;
    }
    if (!this.data.consentAccepted) {
      wx.showToast({ title: '先确认云端处理说明', icon: 'none' });
      return;
    }
    this.startReview();
  }
});
