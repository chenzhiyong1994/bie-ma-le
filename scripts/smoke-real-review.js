const { sampleInput } = require('../tests/fixtures/review-fixtures');
const { getReviewRuntime } = require('../packages/ai-core/src/review-engine');
const { loadConfig } = require('../services/api/src/config');
const { createApiServer } = require('../services/api/src/server');

async function waitForReview(baseUrl, reviewId) {
  const deadline = Date.now() + 210000;

  while (Date.now() < deadline) {
    const response = await fetch(`${baseUrl}/api/reviews/${reviewId}`);
    const job = await response.json();

    if (job.status === 'completed') return job;
    if (job.status === 'failed') {
      throw Object.assign(new Error(job.error.message), { code: job.error.code });
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  throw Object.assign(new Error('Real review smoke test timed out'), { code: 'SMOKE_TIMEOUT' });
}

async function main() {
  const config = loadConfig();
  const server = createApiServer({
    config,
    logger: { info() {} }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const createResponse = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleInput)
    });
    const created = await createResponse.json();
    if (!createResponse.ok) {
      throw new Error(created.error ? created.error.message : 'Could not create review');
    }

    const job = await waitForReview(baseUrl, created.id);
    const runtime = getReviewRuntime(sampleInput.roleId);
    const validation = runtime.validate(job.report, sampleInput);
    if (!validation.valid) {
      throw Object.assign(new Error(validation.errors.join('; ')), { code: 'SMOKE_VALIDATION_FAILED' });
    }

    console.log(JSON.stringify({
      ok: true,
      reviewId: job.report.id,
      roleId: job.context.roleId,
      qualityBand: job.report.qualityBand,
      score: job.report.overallScore,
      strengthTitles: job.report.strengths.map((strength) => strength.title),
      issueTitles: job.report.issues.map((issue) => issue.title),
      evidenceKinds: job.report.issues.map((issue) => issue.evidenceKind),
      model: job.meta.model,
      protocol: job.meta.protocol,
      attempts: job.meta.attempts,
      durationMs: job.meta.durationMs,
      usage: job.meta.usage
    }, null, 2));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(`${error.code || 'SMOKE_FAILED'}: ${error.message}`);
  process.exit(1);
});
