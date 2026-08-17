const { getRole } = require('./roles');
const {
  createReviewSchema,
  buildReviewInstructions,
  buildReviewInput,
  validateReview
} = require('./review-engine');

const REVIEW_MODES = {
  GENERAL: 'general',
  JD: 'jd'
};

const role = getRole('resume-terminator');
const SCORE_DIMENSIONS_BY_MODE = {
  [REVIEW_MODES.GENERAL]: role.dimensions,
  [REVIEW_MODES.JD]: role.targetedDimensions
};

const resumeReviewSchema = createReviewSchema(role);
const resumeReviewInstructions = buildReviewInstructions(role);

function toGenericInput(input) {
  return {
    roleId: role.id,
    reviewMode: input.reviewMode === REVIEW_MODES.JD ? 'targeted' : input.reviewMode,
    contextText: input.jobDescription || input.contextText || '',
    materialText: input.materialText || input.resumeText || ''
  };
}

function buildResumeReviewInput(input, validationErrors = []) {
  return buildReviewInput(role, toGenericInput(input), validationErrors);
}

function validateResumeReview(report, resumeText, reviewMode = REVIEW_MODES.GENERAL) {
  return validateReview(report, resumeText, role, {
    reviewMode: reviewMode === REVIEW_MODES.JD ? 'targeted' : reviewMode
  });
}

module.exports = {
  REVIEW_MODES,
  SCORE_DIMENSIONS_BY_MODE,
  resumeReviewSchema,
  resumeReviewInstructions,
  buildResumeReviewInput,
  validateResumeReview
};
