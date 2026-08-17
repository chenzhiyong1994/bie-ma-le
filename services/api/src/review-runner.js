const { getReviewRuntime } = require('../../../packages/ai-core/src/review-engine');

const MAX_GENERATION_ATTEMPTS = 3;
const ATTEMPT_PROGRESS = [31, 48, 64];
const VALIDATION_PROGRESS = [42, 58, 76];

class ReviewOutputError extends Error {
  constructor(errors) {
    super('模型输出未通过报告校验');
    this.name = 'ReviewOutputError';
    this.code = 'INVALID_REVIEW_OUTPUT';
    this.retryable = true;
    this.validationErrors = errors;
  }
}

function createReviewRunner(providerClient) {
  return async function runReview(input, onStage = () => {}) {
    const runtime = getReviewRuntime(input.roleId);
    if (!runtime) {
      throw Object.assign(new Error('评审角色不存在'), {
        code: 'ROLE_NOT_FOUND',
        retryable: false
      });
    }
    let validationErrors = [];
    let latestMeta = null;

    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
      onStage({ status: 'analyzing', stageIndex: 1, progress: ATTEMPT_PROGRESS[attempt - 1] });

      let result;
      try {
        result = await providerClient.generateStructured({
          instructions: runtime.instructions,
          input: runtime.buildInput(input, validationErrors),
          schema: runtime.schema,
          schemaName: runtime.role.schemaName
        });
      } catch (error) {
        const canRegenerate = attempt < MAX_GENERATION_ATTEMPTS
          && ['EMPTY_MODEL_OUTPUT', 'INVALID_MODEL_JSON'].includes(error.code);
        if (!canRegenerate) throw error;

        validationErrors = [
          error.code === 'EMPTY_MODEL_OUTPUT'
            ? '上一次没有返回报告，必须输出完整 JSON 对象'
            : '上一次报告不是有效 JSON，必须严格遵守输出结构'
        ];
        continue;
      }

      latestMeta = result.meta;
      onStage({ status: 'validating', stageIndex: 2, progress: VALIDATION_PROGRESS[attempt - 1] });

      const validation = runtime.validate(result.data, input);
      if (validation.valid) {
        onStage({ status: 'rendering', stageIndex: 3, progress: 91 });
        return {
          report: result.data,
          meta: {
            ...latestMeta,
            attempts: attempt
          }
        };
      }

      validationErrors = validation.errors;
    }

    throw new ReviewOutputError(validationErrors);
  };
}

module.exports = {
  ReviewOutputError,
  createReviewRunner
};
