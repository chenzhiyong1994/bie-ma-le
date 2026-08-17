const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getActiveMaterialText,
  validateActiveMaterial
} = require('../../../apps/miniprogram/utils/review-material');

const longText = '这是一段足够长的材料正文，用来验证当前选中的输入来源。'.repeat(8);
const parsedFileText = '这是从 PDF 文件中解析出的独立正文，不应该写进粘贴文本框。'.repeat(8);

test('uses only the currently selected material tab', () => {
  const data = {
    materialMode: 'text',
    materialText: longText,
    fileMaterialText: parsedFileText,
    fileStatus: 'ready'
  };
  assert.equal(getActiveMaterialText(data), longText);
  assert.equal(getActiveMaterialText({ ...data, materialMode: 'file' }), parsedFileText);
});

test('blocks an empty text tab even when a parsed file exists', () => {
  const result = validateActiveMaterial({
    materialMode: 'text',
    materialText: '',
    fileMaterialText: parsedFileText,
    fileStatus: 'ready'
  });
  assert.equal(result.valid, false);
  assert.equal(result.code, 'TEXT_TOO_SHORT');
});

test('blocks an unfinished file tab even when pasted text exists', () => {
  const result = validateActiveMaterial({
    materialMode: 'file',
    materialText: longText,
    fileMaterialText: '',
    fileStatus: 'parsing'
  });
  assert.equal(result.valid, false);
  assert.equal(result.code, 'FILE_NOT_READY');
});

test('returns the parsed file text when the file tab is ready', () => {
  const result = validateActiveMaterial({
    materialMode: 'file',
    materialText: '',
    fileMaterialText: parsedFileText,
    fileStatus: 'ready'
  });
  assert.equal(result.valid, true);
  assert.equal(result.materialText, parsedFileText);
});
