const test = require('node:test');
const assert = require('node:assert/strict');
const { report, sampleInput } = require('../../../tests/fixtures/review-fixtures');
const { ReviewOutputError, createReviewRunner } = require('../src/review-runner');

function cloneReport() {
  return JSON.parse(JSON.stringify(report));
}

test('regenerates once when quoted evidence cannot be found', async () => {
  const inputs = [];
  const invalid = cloneReport();
  invalid.issues[0].evidenceSamples[0] = '“简历中不存在的成绩”';

  const providerClient = {
    async generateStructured(request) {
      inputs.push(request.input);
      return {
        data: inputs.length === 1 ? invalid : cloneReport(),
        meta: { model: 'test-model', protocol: 'responses' }
      };
    }
  };

  const runner = createReviewRunner(providerClient);
  const result = await runner(sampleInput);

  assert.equal(result.meta.attempts, 2);
  assert.match(inputs[1], /原文证据无法在材料中找到/);
});

test('regenerates once when the provider returns an empty model output', async () => {
  const inputs = [];
  const providerClient = {
    async generateStructured(request) {
      inputs.push(request.input);
      if (inputs.length === 1) {
        throw Object.assign(new Error('empty'), { code: 'EMPTY_MODEL_OUTPUT' });
      }
      return {
        data: cloneReport(),
        meta: { model: 'test-model', protocol: 'responses' }
      };
    }
  };

  const runner = createReviewRunner(providerClient);
  const result = await runner(sampleInput);

  assert.equal(result.meta.attempts, 2);
  assert.match(inputs[1], /必须输出完整 JSON 对象/);
});

test('accepts repeated controlled insults without regenerating the report', async () => {
  let attempts = 0;
  const overloaded = cloneReport();
  overloaded.verdict += ' 这份废纸还想糊弄谁？';
  overloaded.issues[0].diagnosis += ' 剩下的都是屁话。';

  const providerClient = {
    async generateStructured() {
      attempts += 1;
      return {
        data: JSON.parse(JSON.stringify(overloaded)),
        meta: { model: 'test-model', protocol: 'responses' }
      };
    }
  };

  const runner = createReviewRunner(providerClient);
  const result = await runner(sampleInput);
  assert.equal(attempts, 1);
  assert.equal(result.meta.attempts, 1);
  assert.match(result.report.verdict, /废纸/);
  assert.match(result.report.issues[0].diagnosis, /屁话/);
});

test('recovers when the third generated report passes validation', async () => {
  let attempts = 0;
  const invalid = cloneReport();
  invalid.issues[0].evidenceSamples[0] = '简历里并不存在的成绩';
  const providerClient = {
    async generateStructured() {
      attempts += 1;
      return {
        data: attempts < 3 ? invalid : cloneReport(),
        meta: { model: 'test-model', protocol: 'responses' }
      };
    }
  };

  const runner = createReviewRunner(providerClient);
  const result = await runner(sampleInput);

  assert.equal(attempts, 3);
  assert.equal(result.meta.attempts, 3);
});

test('fails closed after three unsafe model outputs', async () => {
  let attempts = 0;
  const invalid = cloneReport();
  invalid.verdict = '你是废物，这份简历没有价值。';
  const providerClient = {
    async generateStructured() {
      attempts += 1;
      return {
        data: invalid,
        meta: { model: 'test-model', protocol: 'responses' }
      };
    }
  };

  const runner = createReviewRunner(providerClient);
  await assert.rejects(
    () => runner(sampleInput),
    (error) => error instanceof ReviewOutputError
      && error.validationErrors.some((message) => message.includes('人格攻击'))
  );
  assert.equal(attempts, 3);
});
