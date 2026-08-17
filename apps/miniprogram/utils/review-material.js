const MIN_MATERIAL_LENGTH = 80;

function getActiveMaterialText(data) {
  return data.materialMode === 'file'
    ? String(data.fileMaterialText || '')
    : String(data.materialText || '');
}

function validateActiveMaterial(data) {
  if (data.materialMode === 'file' && data.fileStatus !== 'ready') {
    return { valid: false, code: 'FILE_NOT_READY', message: '文件还没读完，急什么？' };
  }

  const materialText = getActiveMaterialText(data).trim();
  if (materialText.length < MIN_MATERIAL_LENGTH) {
    return {
      valid: false,
      code: data.materialMode === 'file' ? 'FILE_TEXT_TOO_SHORT' : 'TEXT_TOO_SHORT',
      message: data.materialMode === 'file'
        ? '文件里能读到的内容不到 80 字，拿什么审？'
        : '粘贴框里 80 个字都没有，拿什么审？'
    };
  }

  return { valid: true, materialText };
}

module.exports = {
  MIN_MATERIAL_LENGTH,
  getActiveMaterialText,
  validateActiveMaterial
};
