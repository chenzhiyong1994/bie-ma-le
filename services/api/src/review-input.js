const { getRole } = require('../../../packages/ai-core/src/roles');

function validateReviewInput(body) {
  const errors = [];
  const role = getRole(body.roleId);
  const legacyJdMode = body.reviewMode === 'jd';
  const reviewMode = legacyJdMode ? 'targeted' : ['general', 'targeted'].includes(body.reviewMode) ? body.reviewMode : '';
  const contextText = typeof body.contextText === 'string'
    ? body.contextText.trim()
    : typeof body.jobDescription === 'string' ? body.jobDescription.trim() : '';
  const materialText = typeof body.materialText === 'string'
    ? body.materialText.trim()
    : typeof body.resumeText === 'string' ? body.resumeText.trim() : '';

  if (!role) errors.push('评审角色不存在');
  if (!reviewMode) errors.push('评审模式必须为 general 或 targeted');
  if (reviewMode === 'targeted' && (contextText.length < 20 || contextText.length > 8000)) {
    errors.push('目标背景必须为 20-8000 个字符');
  }
  if (materialText.length < 80 || materialText.length > 20000) {
    errors.push('评审材料必须为 80-20000 个字符');
  }

  return {
    valid: errors.length === 0,
    errors,
    value: {
      roleId: role ? role.id : '',
      reviewMode,
      contextText: reviewMode === 'targeted' ? contextText : '',
      materialText
    }
  };
}

module.exports = { validateReviewInput };
