const path = require('path');
const Busboy = require('busboy');
const mammoth = require('mammoth');

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MIN_RESUME_CHARS = 80;
const MAX_RESUME_CHARS = 20000;

class MaterialParseError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = 'MaterialParseError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function cleanExtractedText(value) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function safeFileName(value) {
  return path.basename(String(value || 'resume')).replace(/[\u0000-\u001f]/g, '').slice(0, 120);
}

function detectFileType(fileName, buffer) {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === '.doc') {
    throw new MaterialParseError(
      'LEGACY_WORD_UNSUPPORTED',
      '暂不支持旧版 .doc，请另存为 .docx 或 PDF 后上传'
    );
  }

  if (extension === '.pdf' && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'pdf';
  }

  if (extension === '.docx' && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return 'docx';
  }

  if (!['.pdf', '.docx'].includes(extension)) {
    throw new MaterialParseError('UNSUPPORTED_FILE_TYPE', '只支持 PDF 和 Word（.docx）文件');
  }

  throw new MaterialParseError('FILE_SIGNATURE_MISMATCH', '文件内容与扩展名不一致，请重新导出后上传');
}

async function extractPdfText(buffer) {
  const { extractText } = await import('unpdf');
  const result = await extractText(new Uint8Array(buffer), { mergePages: true });
  return result.text;
}

async function extractDocxText(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return {
    text: result.value,
    hasWarnings: Array.isArray(result.messages) && result.messages.length > 0
  };
}

async function parseResumeBuffer(upload, options = {}) {
  const buffer = upload.buffer;
  const fileName = safeFileName(upload.fileName);

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new MaterialParseError('EMPTY_FILE', '没有读取到文件内容');
  }
  if (buffer.length > MAX_FILE_BYTES) {
    throw new MaterialParseError('FILE_TOO_LARGE', '文件不能超过 8MB', 413);
  }

  const fileType = detectFileType(fileName, buffer);
  let rawText;
  let hasWarnings = false;

  try {
    if (fileType === 'pdf') {
      const extractor = options.pdfExtractor || extractPdfText;
      rawText = await extractor(buffer);
    } else {
      const extractor = options.docxExtractor || extractDocxText;
      const result = await extractor(buffer);
      if (typeof result === 'string') {
        rawText = result;
      } else {
        rawText = result.text;
        hasWarnings = Boolean(result.hasWarnings);
      }
    }
  } catch (error) {
    if (error instanceof MaterialParseError) throw error;
    throw new MaterialParseError('FILE_PARSE_FAILED', '文件解析失败，请重新导出或改用粘贴文本');
  }

  const text = cleanExtractedText(rawText);
  if (text.length < MIN_RESUME_CHARS) {
    const message = fileType === 'pdf'
      ? '没有提取到足够文字；扫描版 PDF 暂不支持，请改用可复制文字的 PDF 或粘贴文本'
      : 'Word 文件中没有提取到足够的材料正文';
    throw new MaterialParseError('EXTRACTED_TEXT_TOO_SHORT', message);
  }
  if (text.length > MAX_RESUME_CHARS) {
    throw new MaterialParseError('EXTRACTED_TEXT_TOO_LONG', '提取内容超过 20000 字，请精简材料后重试');
  }

  return {
    fileName,
    fileType,
    characterCount: text.length,
    text,
    warnings: hasWarnings ? ['部分复杂 Word 格式可能未完整保留，已按纯文本评审'] : []
  };
}

function readSingleUpload(request) {
  return new Promise((resolve, reject) => {
    let parser;
    try {
      parser = Busboy({
        headers: request.headers,
        limits: {
          files: 1,
          fields: 0,
          parts: 1,
          fileSize: MAX_FILE_BYTES
        }
      });
    } catch (error) {
      reject(new MaterialParseError('INVALID_MULTIPART_REQUEST', '文件上传请求无效'));
      return;
    }

    let upload = null;
    let uploadError = null;

    parser.on('file', (fieldName, stream, info) => {
      const chunks = [];
      let truncated = false;

      if (fieldName !== 'file') {
        uploadError = new MaterialParseError('INVALID_FILE_FIELD', '上传字段必须命名为 file');
      }

      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('limit', () => {
        truncated = true;
      });
      stream.on('end', () => {
        if (truncated || stream.truncated) {
          uploadError = new MaterialParseError('FILE_TOO_LARGE', '文件不能超过 8MB', 413);
          return;
        }
        upload = {
          fileName: info.filename,
          mimeType: info.mimeType,
          buffer: Buffer.concat(chunks)
        };
      });
    });

    parser.on('filesLimit', () => {
      uploadError = new MaterialParseError('TOO_MANY_FILES', '每次只能上传一个材料文件');
    });
    parser.on('error', () => {
      reject(new MaterialParseError('INVALID_MULTIPART_REQUEST', '文件上传请求无效'));
    });
    parser.on('close', () => {
      if (uploadError) {
        reject(uploadError);
      } else if (!upload) {
        reject(new MaterialParseError('MISSING_FILE', '请选择要上传的材料文件'));
      } else {
        resolve(upload);
      }
    });

    request.pipe(parser);
  });
}

module.exports = {
  MAX_FILE_BYTES,
  MIN_RESUME_CHARS,
  MAX_RESUME_CHARS,
  MaterialParseError,
  cleanExtractedText,
  detectFileType,
  parseResumeBuffer,
  readSingleUpload
};
