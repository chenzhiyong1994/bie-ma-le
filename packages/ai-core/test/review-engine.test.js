const test = require('node:test');
const assert = require('node:assert/strict');
const {
  report,
  sampleInput,
  sampleInputs,
  solidResumeInput,
  solidResumeReport,
  readyResumeInput,
  readyResumeReport,
  getMockReport
} = require('../../../tests/fixtures/review-fixtures');
const { getRole, listRoles } = require('../src/roles');
const { getReviewRuntime, validateReview } = require('../src/review-engine');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('accepts a critical report with clustered quoted evidence', () => {
  const role = getRole('resume-terminator');
  const validation = validateReview(clone(report), sampleInput.materialText, role, sampleInput);
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(report.issues[0].evidenceSamples.length, 2);
});

test('accepts a standalone solid resume with evidence-linked strengths', () => {
  const role = getRole('resume-terminator');
  const validation = validateReview(clone(solidResumeReport), solidResumeInput.materialText, role, solidResumeInput);
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(solidResumeReport.qualityBand, 'rebuilding');
  assert.equal(solidResumeReport.strengths.length, 2);
});

test('accepts a ready resume without inventing a criticism', () => {
  const role = getRole('resume-terminator');
  const validation = validateReview(clone(readyResumeReport), readyResumeInput.materialText, role, readyResumeInput);
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(readyResumeReport.issues.length, 0);
  assert.equal(readyResumeReport.strengths.length, 3);
});

test('rejects fabricated evidence in strengths and issues', () => {
  const role = getRole('resume-terminator');
  const candidate = clone(solidResumeReport);
  candidate.strengths[0].evidenceSamples[0] = '从不存在的 1% 提升至 99%';
  candidate.issues[0].evidenceSamples[0] = '这句话也不在材料里';
  const validation = validateReview(candidate, solidResumeInput.materialText, role, solidResumeInput);
  assert.equal(validation.valid, false);
  assert.equal(validation.errors.filter((message) => message.includes('无法在材料中找到')).length, 2);
});

test('enforces quality band composition instead of forcing criticism on ready work', () => {
  const role = getRole('resume-terminator');
  const ready = clone(solidResumeReport);
  ready.qualityBand = 'ready';
  ready.overallScore = 88;
  ready.issues = [];
  assert.equal(validateReview(ready, solidResumeInput.materialText, role, solidResumeInput).valid, true);

  ready.strengths = [];
  const validation = validateReview(ready, solidResumeInput.materialText, role, solidResumeInput);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join('\n'), /ready/);
});

test('rejects global worth attacks at every quality level', () => {
  const role = getRole('resume-terminator');
  const candidate = clone(report);
  candidate.verdict = '你是废物，这份材料也没有价值。';
  const validation = validateReview(candidate, sampleInput.materialText, role, sampleInput);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join('\n'), /人格攻击/);
});

test('rejects intellect insults even when the report is critical', () => {
  const role = getRole('resume-terminator');
  const candidate = clone(report);
  candidate.verdictNote = '动动你的猪脑子，这种写法也敢交。';
  const validation = validateReview(candidate, sampleInput.materialText, role, sampleInput);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join('\n'), /人格攻击/);
});

test('rejects dangerous expressions at every quality level', () => {
  const role = getRole('resume-terminator');
  const candidate = clone(readyResumeReport);
  candidate.verdict = '这份材料能投，但你要是再写空话就去死。';
  const validation = validateReview(candidate, readyResumeInput.materialText, role, readyResumeInput);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join('\n'), /危险表达/);
});

test('rejects copy that falsely implies a previous review round', () => {
  const role = getRole('resume-terminator');
  const candidate = clone(solidResumeReport);
  candidate.verdict = '这次终于像份简历了，至少有两条成果能看。';
  const validation = validateReview(candidate, solidResumeInput.materialText, role, solidResumeInput);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join('\n'), /独立新材料/);
});

test('does not reject a report only because it uses another metaphor style', () => {
  const role = getRole('resume-terminator');
  const candidate = clone(report);
  candidate.verdict = '这一刀先砍掉空话，再追你欠下的证据债。';
  const validation = validateReview(candidate, sampleInput.materialText, role, sampleInput);
  assert.equal(validation.valid, true);
});

test('does not reject a report only because of controlled insult counts', () => {
  const role = getRole('resume-terminator');
  const overloaded = clone(report);
  overloaded.issues[0].diagnosis += ' 这又是一堆屁话，整页废纸。';
  const criticalValidation = validateReview(overloaded, sampleInput.materialText, role, sampleInput);
  assert.equal(criticalValidation.valid, true);

  const pollutedReady = clone(readyResumeReport);
  pollutedReady.verdict += ' 这种垃圾写法总算清干净了。';
  const readyValidation = validateReview(pollutedReady, readyResumeInput.materialText, role, readyResumeInput);
  assert.equal(readyValidation.valid, true);
});

test('rejects thin suggestions and vague acceptance criteria', () => {
  const role = getRole('resume-terminator');
  const candidate = clone(report);
  candidate.issues[0].suggestion = '补充数据并优化表达。';
  candidate.issues[0].acceptance = '看起来更清楚。';
  const validation = validateReview(candidate, sampleInput.materialText, role, sampleInput);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join('\n'), /修改建议过于笼统/);
  assert.match(validation.errors.join('\n'), /通过标准过于笼统/);
});

test('builds one strict runtime for every registered role', () => {
  for (const role of listRoles()) {
    const runtime = getReviewRuntime(role.id);
    const input = {
      roleId: role.id,
      reviewMode: 'general',
      contextText: '',
      materialText: sampleInputs[role.id].materialText
    };
    const mock = getMockReport(role.id);
    const validation = runtime.validate(mock, input);
    assert.equal(validation.valid, true, `${role.name}: ${validation.errors.join('\n')}`);
    assert.equal(runtime.schema.properties.scores.minItems, 4);
    assert.match(runtime.buildInput(input), /<material/);
    assert.match(runtime.instructions, new RegExp(role.name));
    assert.match(runtime.instructions, /尖酸刻薄、不留情面/);
    assert.match(runtime.instructions, /真实评审会/);
    assert.match(runtime.instructions, /这也叫/);
  }
});

test('wraps targeted context and repair errors as untrusted input', () => {
  const runtime = getReviewRuntime('copy-judge');
  const prompt = runtime.buildInput({
    roleId: 'copy-judge',
    reviewMode: 'targeted',
    contextText: '面向新手管理者，希望其预约试用产品',
    materialText: sampleInputs['copy-judge'].materialText
  }, ['第一条证据不存在']);
  assert.match(prompt, /<review_context>/);
  assert.match(prompt, /第一条证据不存在/);
  assert.match(prompt, /<material/);
  assert.match(runtime.instructions, /独立的新材料/);
});
