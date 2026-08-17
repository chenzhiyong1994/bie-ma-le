const { getRole, processingStagesByRole } = require('../../data/roles');
const { createReview, getReview } = require('../../services/review-api');

Page({
  data: {
    role: getRole('resume-terminator'),
    progress: 8,
    activeStage: 0,
    stages: processingStagesByRole['resume-terminator'].map((stage, index) => ({
      ...stage,
      state: index === 0 ? 'active' : 'pending'
    })),
    hasFailed: false,
    errorCode: '',
    errorMessage: '',
    retryable: true
  },

  onLoad() {
    this.role = getRole('resume-terminator');
    this.processingStages = processingStagesByRole[this.role.id];

    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('reviewDraft', (draft) => {
      this.reviewDraft = draft;
      this.role = getRole(draft.roleId);
      this.processingStages = processingStagesByRole[this.role.id];
      this.setData({
        role: this.role,
        stages: this.buildStages(0)
      });
      this.startRealReview();
    });

    this.waitingTimer = setTimeout(() => {
      if (this.reviewDraft) return;

      this.failReview({
        code: 'MISSING_REVIEW_DRAFT',
        message: '材料根本没传过来。返回去，重新交一次。',
        retryable: false
      });
    }, 600);
  },

  onUnload() {
    this.clearTimers();
  },

  clearTimers() {
    (this.timers || []).forEach((timer) => clearTimeout(timer));
    this.timers = [];
    clearTimeout(this.waitingTimer);
    clearTimeout(this.pollTimer);
  },

  buildStages(stageIndex, failed = false) {
    const stages = this.processingStages || processingStagesByRole['resume-terminator'];
    return stages.map((stage, index) => ({
      ...stage,
      state: failed && index === stageIndex
        ? 'failed'
        : index < stageIndex
          ? 'done'
          : index === stageIndex
            ? 'active'
            : 'pending'
    }));
  },

  resetState() {
    this.clearTimers();
    this.timers = [];
    this.setData({
      progress: 8,
      activeStage: 0,
      hasFailed: false,
      errorCode: '',
      errorMessage: '',
      retryable: true,
      stages: this.buildStages(0)
    });
  },

  async startRealReview() {
    this.resetState();
    this.pollFailures = 0;

    try {
      const job = await createReview(this.reviewDraft);
      this.reviewId = job.id;
      this.applyJob(job);
      this.schedulePoll(350);
    } catch (error) {
      this.failReview(error);
    }
  },

  schedulePoll(delay = 850) {
    clearTimeout(this.pollTimer);
    this.pollTimer = setTimeout(() => this.pollReview(), delay);
  },

  async pollReview() {
    try {
      const job = await getReview(this.reviewId);
      this.pollFailures = 0;
      this.applyJob(job);

      if (job.status === 'completed') {
        this.completeRealReview(job);
        return;
      }

      if (job.status === 'failed') {
        this.failReview(job.error || {});
        return;
      }

      this.schedulePoll();
    } catch (error) {
      this.pollFailures += 1;
      if (this.pollFailures < 3) {
        this.schedulePoll(1200);
        return;
      }
      this.failReview(error);
    }
  },

  applyJob(job) {
    const stageIndex = Math.min(Number(job.stageIndex) || 0, this.processingStages.length - 1);
    const reportedProgress = Number(job.progress) || 8;
    const progress = job.status === 'analyzing' && reportedProgress <= this.data.progress
      ? Math.min(this.data.progress + 1, 68)
      : reportedProgress;
    this.setData({
      activeStage: stageIndex,
      progress,
      stages: this.buildStages(stageIndex)
    });
  },

  failReview(error) {
    this.clearTimers();
    const failedStage = Math.min(this.data.activeStage || 1, this.processingStages.length - 1);
    this.setData({
      hasFailed: true,
      progress: Math.max(this.data.progress, 47),
      errorCode: error.code || 'REVIEW_FAILED',
      errorMessage: error.message || '刚才没批成。材料还在，直接再试一次。',
      retryable: error.retryable !== false,
      stages: this.buildStages(failedStage, true)
    });
  },

  completeRealReview(job) {
    this.clearTimers();
    getApp().globalData.latestReview = {
      report: job.report,
      context: job.context,
      meta: job.meta
    };
    this.setData({
      progress: 100,
      stages: this.processingStages.map((stage) => ({
        ...stage,
        state: 'done'
      }))
    });

    const timer = setTimeout(() => {
      wx.redirectTo({
        url: '/pages/report/index'
      });
    }, 420);
    this.timers = [timer];
  },

  retry() {
    if (!this.data.retryable) return;
    this.startRealReview();
  },

  returnToEdit() {
    wx.navigateBack();
  }
});
