const cloudConfig = require('./config/cloud');

App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('当前微信基础库不支持云开发');
      return;
    }
    const options = { traceUser: true };
    if (cloudConfig.environmentId) options.env = cloudConfig.environmentId;
    wx.cloud.init(options);
  },

  globalData: {
    productName: '别骂了',
    activeRoleId: 'resume-terminator',
    latestReview: null
  }
});
