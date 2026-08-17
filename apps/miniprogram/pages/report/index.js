const { getRole } = require('../../data/roles');
const { generateSharePoster, saveSharePoster } = require('../../services/share-poster');

const qualityMeta = {
  critical: {
    label: '当场打回',
    closingTitle: ['这份先别发。', '发出去只是给别人多一个删除理由。'],
    closingNote: '上面点名的破写法一次清掉，别让同一堆废话出去丢两次人。',
    navColor: '#8f251e'
  },
  rebuilding: {
    label: '尚未过关',
    closingTitle: ['不算废，确实有点东西。', '但离能打还差得远。'],
    closingNote: '上面几处不补完，就别急着感动自己。能看和能交，中间还隔着证据。',
    navColor: '#946521'
  },
  ready: {
    label: '这份能交',
    closingTitle: ['行，这份能发。', '别手欠再往里塞废话。'],
    closingNote: '该有的证据都有了。到此为止，继续乱改只会越改越差。',
    navColor: '#315b3c'
  }
};

Page({
  data: {
    role: getRole('resume-terminator'),
    report: null,
    context: {},
    meta: {},
    hasReport: false,
    expandedIssue: -1,
    quality: qualityMeta.critical,
    sharePosterPath: '',
    sharePosterVisible: false,
    sharePosterGenerating: false
  },

  onLoad(options) {
    const latestReview = getApp().globalData.latestReview;
    if (!latestReview || !latestReview.report) {
      wx.reLaunch({
        url: '/pages/home/index',
        success() {
          wx.showToast({ title: '这份评审已结束，请重新提交材料', icon: 'none' });
        }
      });
      return;
    }

    let report = latestReview.report;
    const context = latestReview.context || {};
    const meta = latestReview.meta || {};
    const roleId = context.roleId || 'resume-terminator';
    const role = getRole(roleId);
    report = {
      ...report,
      issues: (report.issues || []).map((issue) => ({
        ...issue,
        evidenceRows: issue.evidenceSamples.map((evidence, index) => ({
          evidence,
          number: index + 1,
          isPreview: index < 2
        })),
        hasMoreEvidence: issue.evidenceSamples.length > 2,
        remainingEvidenceCount: Math.max(0, issue.evidenceSamples.length - 2)
      }))
    };
    const quality = qualityMeta[report.qualityBand] || qualityMeta.critical;
    this.setData({
      hasReport: true,
      role,
      report,
      context,
      meta,
      quality,
      expandedIssue: -1
    });
    wx.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: quality.navColor });
    if (wx.hideShareMenu) wx.hideShareMenu();
  },

  toggleIssue(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({ expandedIssue: this.data.expandedIssue === index ? -1 : index });
  },

  reviewAnother() {
    getApp().globalData.latestReview = null;
    wx.redirectTo({ url: `/pages/review/index?roleId=${this.data.role.id}` });
  },

  async generateRolePoster() {
    if (this.data.sharePosterGenerating) return;
    this.setData({ sharePosterGenerating: true });
    wx.showLoading({ title: '正在制作邀请图', mask: true });
    try {
      const sharePosterPath = await generateSharePoster(this, {
        posterType: 'role',
        roleId: this.data.role.id,
        canvasId: 'reportSharePosterCanvas'
      });
      this.setData({
        sharePosterPath,
        sharePosterVisible: true
      });
    } catch (error) {
      wx.showModal({
        title: '邀请图没生成出来',
        content: error && error.message || '暴君临时离岗了，请稍后重试。',
        showCancel: false,
        confirmText: '知道了'
      });
    } finally {
      wx.hideLoading();
      this.setData({ sharePosterGenerating: false });
    }
  },

  closeSharePoster() {
    this.setData({ sharePosterVisible: false });
  },

  async saveSharePoster() {
    try {
      await saveSharePoster(this.data.sharePosterPath);
      wx.showToast({ title: '已保存，去朋友圈喊人', icon: 'success' });
    } catch (error) {
      wx.showToast({
        title: error && error.message || '保存失败，请重试',
        icon: 'none'
      });
    }
  },

  preventPosterScroll() {
  },

  goHome() {
    getApp().globalData.latestReview = null;
    wx.reLaunch({ url: '/pages/home/index' });
  }
});
