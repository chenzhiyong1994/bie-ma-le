const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MaterialParseError,
  cleanExtractedText,
  detectFileType,
  parseResumeBuffer
} = require('../src/material-parser');
const devResumeFile = require('../../../tests/fixtures/dev-resume-file');

test('normalizes extracted document text without flattening paragraphs', () => {
  assert.equal(cleanExtractedText('第一段  \r\n\r\n\r\n第二段\u0000'), '第一段\n\n第二段');
});

test('detects PDF and DOCX signatures and rejects legacy DOC', () => {
  assert.equal(detectFileType('resume.pdf', Buffer.from('%PDF-1.7')), 'pdf');
  assert.equal(detectFileType('resume.docx', Buffer.from([0x50, 0x4b, 0x03, 0x04])), 'docx');
  assert.throws(
    () => detectFileType('resume.doc', Buffer.from('legacy')),
    (error) => error instanceof MaterialParseError && error.code === 'LEGACY_WORD_UNSUPPORTED'
  );
});

test('parses a PDF entirely in memory through the configured extractor', async () => {
  const result = await parseResumeBuffer({
    fileName: 'resume.pdf',
    buffer: Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(20)])
  }, {
    pdfExtractor: async () => '工作经历\n负责增长实验并将转化率从 10% 提升到 16%。'.repeat(4)
  });

  assert.equal(result.fileType, 'pdf');
  assert.ok(result.characterCount >= 80);
  assert.match(result.text, /转化率/);
});

test('parses DOCX text and exposes a generic formatting warning', async () => {
  const result = await parseResumeBuffer({
    fileName: 'resume.docx',
    buffer: Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(20)])
  }, {
    docxExtractor: async () => ({
      text: '项目经历\n完成用户增长项目并交付可核验结果。'.repeat(5),
      hasWarnings: true
    })
  });

  assert.equal(result.fileType, 'docx');
  assert.equal(result.warnings.length, 1);
});

test('rejects scanned or empty files with a recoverable message', async () => {
  await assert.rejects(
    () => parseResumeBuffer({
      fileName: 'scan.pdf',
      buffer: Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(20)])
    }, {
      pdfExtractor: async () => ''
    }),
    (error) => error.code === 'EXTRACTED_TEXT_TOO_SHORT' && error.message.includes('扫描版')
  );
});

test('parses the test-only sanitized PDF fixture through the real extractor', async () => {
  const result = await parseResumeBuffer({
    fileName: devResumeFile.fileName,
    buffer: Buffer.from(devResumeFile.base64, 'base64')
  });

  assert.equal(result.fileType, 'pdf');
  assert.equal(result.characterCount, 443);
  assert.match(result.text, /trial-to-paid conversion/);
});
