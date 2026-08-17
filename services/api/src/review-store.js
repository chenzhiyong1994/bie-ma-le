const crypto = require('crypto');

function publicJob(job) {
  return {
    id: job.id,
    status: job.status,
    stageIndex: job.stageIndex,
    progress: job.progress,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    context: job.context,
    report: job.report || null,
    meta: job.meta || null,
    error: job.error || null
  };
}

function toPublicError(error) {
  return {
    code: error.code || 'REVIEW_FAILED',
    message: error.message || '评审生成失败，请稍后重试',
    retryable: error.retryable !== false
  };
}

function createReviewStore(options) {
  const runner = options.runner;
  const ttlMs = options.ttlMs || 1800000;
  const now = options.now || (() => Date.now());
  const idFactory = options.idFactory || (() => crypto.randomUUID());
  const jobs = new Map();

  if (typeof runner !== 'function') {
    throw new Error('review runner is required');
  }

  async function process(job) {
    const startedAt = now();
    try {
      const result = await runner(job.input, (stage) => {
        Object.assign(job, stage, { updatedAt: new Date(now()).toISOString() });
      });

      const shortId = job.id.replace(/-/g, '').slice(0, 8).toUpperCase();
      job.report = {
        ...result.report,
        id: `BML-${shortId}`,
        createdAt: '真实评审 · 单次验收'
      };
      job.meta = {
        ...result.meta,
        durationMs: now() - startedAt
      };
      job.status = 'completed';
      job.stageIndex = 4;
      job.progress = 100;
    } catch (error) {
      job.status = 'failed';
      job.error = toPublicError(error);
      job.progress = Math.max(job.progress, 47);
    } finally {
      job.input = null;
      job.updatedAt = new Date(now()).toISOString();
    }
  }

  function create(input) {
    const timestamp = new Date(now()).toISOString();
    const job = {
      id: idFactory(),
      status: 'queued',
      stageIndex: 0,
      progress: 8,
      createdAt: timestamp,
      updatedAt: timestamp,
      context: {
        roleId: input.roleId,
        reviewMode: input.reviewMode,
        modeLabel: input.reviewMode === 'targeted' ? '带目标评审' : '整体评审'
      },
      input: {
        roleId: input.roleId,
        reviewMode: input.reviewMode,
        contextText: input.contextText || '',
        materialText: input.materialText
      },
      report: null,
      meta: null,
      error: null
    };

    jobs.set(job.id, job);
    setImmediate(() => process(job));
    return publicJob(job);
  }

  function get(id) {
    const job = jobs.get(id);
    return job ? publicJob(job) : null;
  }

  function cleanup() {
    const cutoff = now() - ttlMs;
    for (const [id, job] of jobs.entries()) {
      if (new Date(job.updatedAt).getTime() < cutoff) {
        jobs.delete(id);
      }
    }
  }

  const cleanupTimer = setInterval(cleanup, Math.min(ttlMs, 60000));
  cleanupTimer.unref();

  return {
    create,
    get,
    cleanup,
    close() {
      clearInterval(cleanupTimer);
      jobs.clear();
    }
  };
}

module.exports = {
  createReviewStore
};
