const { getRole } = require('../../data/roles');

function roleIdFromOptions(options = {}) {
  if (options.roleId) return options.roleId;
  if (!options.scene) return '';
  const scene = decodeURIComponent(options.scene);
  const roleEntry = scene.split('&').find((entry) => entry.startsWith('r='));
  return roleEntry ? roleEntry.slice(2) : '';
}

Page({
  data: {
    role: getRole('resume-terminator'),
    badVerdict: '',
    goodVerdict: ''
  },

  onLoad(options) {
    const role = getRole(roleIdFromOptions(options));
    this.setData({
      role,
      badVerdict: role.preview.badVerdict,
      goodVerdict: role.preview.goodVerdict
    });
    wx.setNavigationBarTitle({ title: role.name });
    if (wx.hideShareMenu) wx.hideShareMenu();
  },

  startReview() {
    wx.navigateTo({
      url: `/pages/review/index?roleId=${this.data.role.id}`
    });
  }
});
