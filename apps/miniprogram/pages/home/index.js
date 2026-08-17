const { roles } = require('../../data/roles');
const { generateSharePoster, saveSharePoster } = require('../../services/share-poster');

Page({
  data: {
    roles,
    sharePosterPath: '',
    sharePosterVisible: false,
    sharePosterGenerating: false
  },

  onLoad() {
    if (wx.hideShareMenu) wx.hideShareMenu();
  },

  goToRole(event) {
    const roleId = event.currentTarget.dataset.roleId;
    wx.navigateTo({
      url: `/pages/role/index?roleId=${roleId}`
    });
  },

  async generateAllTyrantsPoster() {
    if (this.data.sharePosterGenerating) return;
    this.setData({ sharePosterGenerating: true });
    wx.showLoading({ title: '正在抓暴君合影', mask: true });
    try {
      const sharePosterPath = await generateSharePoster(this, {
        posterType: 'home',
        canvasId: 'homeSharePosterCanvas'
      });
      this.setData({
        sharePosterPath,
        sharePosterVisible: true
      });
    } catch (error) {
      wx.showModal({
        title: '合影没生成出来',
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
  }
});
