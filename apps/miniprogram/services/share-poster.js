const cloudConfig = require('../config/cloud');
const { roles, getRole } = require('../data/roles');

const POSTER_WIDTH = 750;
const POSTER_HEIGHT = 1000;
const ROLE_IMAGE_ROOT = '/assets/roles';

function cloudRequest(data) {
  if (!wx.cloud) {
    return Promise.reject(new Error('当前微信环境不支持云开发，请更新微信后重试'));
  }
  const options = {
    name: cloudConfig.functionName,
    data
  };
  if (cloudConfig.environmentId) options.config = { env: cloudConfig.environmentId };
  return wx.cloud.callFunction(options).then((response) => {
    const result = response && response.result;
    if (!result || result.ok !== true) {
      throw new Error(result && result.error && result.error.message || '分享图片生成失败，请稍后重试');
    }
    return result.data;
  });
}

function getCanvasNode(page, canvasId) {
  return new Promise((resolve, reject) => {
    page.createSelectorQuery()
      .select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((result) => {
        const canvas = result && result[0] && result[0].node;
        if (!canvas) {
          reject(new Error('分享画布初始化失败，请稍后重试'));
          return;
        }
        canvas.width = POSTER_WIDTH;
        canvas.height = POSTER_HEIGHT;
        resolve(canvas);
      });
  });
}

function loadCanvasImage(canvas, src) {
  return new Promise((resolve, reject) => {
    const image = canvas.createImage();
    image.onload = () => {
      resolve({
        source: image,
        width: image.width,
        height: image.height
      });
    };
    image.onerror = (error) => {
      reject(error instanceof Error ? error : new Error('分享图片素材加载失败'));
    };
    image.src = src;
  });
}

function canvasToTempFilePath(canvas) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      callback(value);
    };
    const timeoutId = setTimeout(() => {
      finish(reject, new Error('分享图片导出超时，请稍后重试'));
    }, 10000);
    wx.canvasToTempFilePath({
      canvas,
      x: 0,
      y: 0,
      width: POSTER_WIDTH,
      height: POSTER_HEIGHT,
      destWidth: POSTER_WIDTH * 2,
      destHeight: POSTER_HEIGHT * 2,
      fileType: 'png',
      success: (result) => finish(resolve, result.tempFilePath),
      fail: (error) => finish(reject, error)
    });
  });
}

function writeCodeImage(imageBase64, contentType) {
  const extension = contentType === 'image/jpeg' ? 'jpg' : 'png';
  const filePath = `${wx.env.USER_DATA_PATH}/share-code-${Date.now()}.${extension}`;
  wx.getFileSystemManager().writeFileSync(filePath, imageBase64, 'base64');
  return filePath;
}

function removeLocalFile(filePath) {
  if (!filePath) return;
  try {
    wx.getFileSystemManager().unlinkSync(filePath);
  } catch (error) {}
}

function setFont(context, size, weight = 'normal', family = '"PingFang SC"') {
  context.font = `${weight} ${size}px ${family}`;
}

function drawText(context, text, x, y, options = {}) {
  context.fillStyle = options.color || '#171511';
  context.textAlign = options.align || 'left';
  context.textBaseline = options.baseline || 'top';
  setFont(context, options.size || 24, options.weight || 'normal', options.family);
  if (options.maxWidth) {
    context.fillText(String(text), x, y, options.maxWidth);
  } else {
    context.fillText(String(text), x, y);
  }
}

function splitLines(context, text, maxWidth, maxLines) {
  const paragraphs = String(text).split('\n');
  const lines = [];
  paragraphs.forEach((paragraph) => {
    if (!paragraph) {
      lines.push('');
      return;
    }
    let line = '';
    Array.from(paragraph).forEach((character) => {
      const candidate = `${line}${character}`;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line);
  });
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  let last = visible[maxLines - 1];
  while (last && context.measureText(`${last}…`).width > maxWidth) {
    last = last.slice(0, -1);
  }
  visible[maxLines - 1] = `${last}…`;
  return visible;
}

function drawWrappedText(context, text, x, y, options = {}) {
  const size = options.size || 24;
  const lineHeight = options.lineHeight || Math.round(size * 1.5);
  setFont(context, size, options.weight || 'normal', options.family);
  const lines = splitLines(context, text, options.maxWidth, options.maxLines || 3);
  lines.forEach((line, index) => {
    drawText(context, line, x, y + index * lineHeight, options);
  });
  return y + lines.length * lineHeight;
}

function drawImageCover(context, image, x, y, width, height, focusY = 0.5) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = Math.max(0, Math.min(
    image.height - sourceHeight,
    (image.height - sourceHeight) * focusY
  ));
  context.drawImage(
    image.source,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height
  );
}

function drawQrCode(context, codeImage, x, y, size) {
  context.fillStyle = '#fffdf7';
  context.fillRect(x, y, size, size);
  context.strokeStyle = '#171511';
  context.lineWidth = 2;
  context.strokeRect(x, y, size, size);
  const inset = 12;
  context.drawImage(codeImage.source, x + inset, y + inset, size - inset * 2, size - inset * 2);
}

function drawRoleCard(context, role, image, x, y, index) {
  const width = 319;
  const height = 205;
  const cardColors = ['#f7efe0', '#eee1ca', '#dfe5d6', '#762620'];
  const isDark = index === 3;
  context.fillStyle = cardColors[index];
  context.fillRect(x, y, width, height);
  context.strokeStyle = isDark ? '#f2c8ac' : '#171511';
  context.lineWidth = 2;
  context.strokeRect(x, y, width, height);
  context.fillStyle = ['#d83227', '#254e6a', '#171511', '#f2c8ac'][index];
  context.fillRect(x, y, width, 8);

  drawImageCover(context, image, x + 12, y + 20, 112, 126, 0.25);
  drawText(context, `BML · ${role.number}`, x + 140, y + 23, {
    size: 14,
    weight: 'bold',
    color: isDark ? '#dfb9b5' : '#81796d'
  });
  drawText(context, role.name, x + 140, y + 50, {
    size: 28,
    weight: 'bold',
    family: '"Songti SC"',
    color: isDark ? '#fff7e8' : '#171511',
    maxWidth: 160
  });
  drawWrappedText(context, role.title, x + 140, y + 91, {
    size: 16,
    lineHeight: 23,
    maxWidth: 158,
    maxLines: 2,
    color: isDark ? '#e3beb8' : '#5f594f'
  });
  context.fillStyle = isDark ? 'rgba(255,247,232,0.24)' : 'rgba(23,21,17,0.18)';
  context.fillRect(x + 12, y + 159, width - 24, 1);
  drawText(context, role.category, x + 12, y + 174, {
    size: 15,
    weight: 'bold',
    color: isDark ? '#ffd9d4' : '#7a211b'
  });
  drawText(context, role.symbol, x + width - 28, y + 171, {
    size: 21,
    weight: 'bold',
    family: '"Songti SC"',
    align: 'center',
    color: isDark ? '#fff7e8' : '#171511'
  });
}

function drawHomePoster(context, roleImages, codeImage) {
  context.fillStyle = '#f2eee5';
  context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  context.fillStyle = '#171511';
  context.fillRect(0, 0, POSTER_WIDTH, 146);
  context.fillStyle = '#d83227';
  context.fillRect(0, 0, POSTER_WIDTH, 10);
  drawText(context, 'BML / FOUR TYRANTS', 46, 35, {
    size: 18,
    weight: 'bold',
    color: '#a29b90'
  });
  drawText(context, '暴君别骂了', 46, 72, {
    size: 44,
    weight: 'bold',
    family: '"Songti SC"',
    color: '#fffaf0'
  });
  drawText(context, '04 / ON DUTY', 704, 45, {
    size: 16,
    weight: 'bold',
    align: 'right',
    color: '#e75b50'
  });

  drawText(context, '找夸的，别来。', 46, 181, {
    size: 48,
    weight: 'bold',
    family: '"Songti SC"'
  });
  drawText(context, '四个暴君都在岗。选一个，把你那份材料交上来。', 46, 247, {
    size: 21,
    color: '#6f685d'
  });

  roleImages.forEach((image, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    drawRoleCard(context, roles[index], image, 46 + column * 339, 296 + row * 225, index);
  });

  context.fillStyle = '#171511';
  context.fillRect(0, 761, POSTER_WIDTH, 239);
  context.fillStyle = '#d83227';
  context.fillRect(46, 803, 6, 118);
  drawText(context, '长按识别小程序码', 74, 806, {
    size: 19,
    weight: 'bold',
    color: '#e75b50'
  });
  drawWrappedText(context, '别拿半成品来。\n让暴君告诉你哪里必须重写。', 74, 845, {
    size: 31,
    lineHeight: 43,
    weight: 'bold',
    family: '"Songti SC"',
    maxWidth: 420,
    maxLines: 2,
    color: '#fffaf0'
  });
  drawQrCode(context, codeImage, 545, 796, 164);
  drawText(context, '把客套话删掉，只留下必须修的问题', 74, 951, {
    size: 15,
    color: '#8f887d'
  });
}

function drawRolePoster(context, role, roleImage, codeImage) {
  context.fillStyle = '#171511';
  context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  context.fillStyle = '#d83227';
  context.fillRect(0, 0, POSTER_WIDTH, 10);
  drawText(context, 'BML / TYRANT PROFILE', 46, 34, {
    size: 18,
    weight: 'bold',
    color: '#a29b90'
  });
  drawText(context, `FILE · ${role.number}`, 704, 34, {
    size: 18,
    weight: 'bold',
    align: 'right',
    color: '#e75b50'
  });

  drawImageCover(context, roleImage, 46, 78, 658, 382, 0.2);
  context.fillStyle = 'rgba(23,21,17,0.88)';
  context.fillRect(46, 374, 658, 86);
  drawText(context, role.englishName, 70, 392, {
    size: 16,
    weight: 'bold',
    color: '#e75b50'
  });
  drawText(context, role.name, 70, 418, {
    size: 31,
    weight: 'bold',
    family: '"Songti SC"',
    color: '#fffaf0'
  });
  drawText(context, role.symbol, 663, 393, {
    size: 47,
    weight: 'bold',
    family: '"Songti SC"',
    align: 'center',
    color: '#fffaf0'
  });

  context.fillStyle = '#f2eee5';
  context.fillRect(0, 493, POSTER_WIDTH, 507);
  drawText(context, '有人把暴君放出来了。', 46, 535, {
    size: 43,
    weight: 'bold',
    family: '"Songti SC"'
  });
  drawText(context, `这次轮到 ${role.name}。你那份材料，敢交吗？`, 46, 598, {
    size: 21,
    color: '#6f685d'
  });
  context.fillStyle = '#fffaf0';
  context.fillRect(46, 651, 461, 180);
  context.strokeStyle = '#c9c1b3';
  context.lineWidth = 2;
  context.strokeRect(46, 651, 461, 180);
  drawText(context, '“', 66, 658, {
    size: 61,
    weight: 'bold',
    family: '"Songti SC"',
    color: '#d83227'
  });
  drawWrappedText(context, role.declaration, 102, 684, {
    size: 21,
    lineHeight: 32,
    weight: 'bold',
    family: '"Songti SC"',
    maxWidth: 372,
    maxLines: 4,
    color: '#2b2823'
  });
  drawQrCode(context, codeImage, 540, 651, 164);
  drawText(context, '长按识别', 622, 829, {
    size: 16,
    weight: 'bold',
    align: 'center',
    color: '#7a211b'
  });
  context.fillStyle = '#d83227';
  context.fillRect(46, 872, 658, 74);
  drawText(context, '选这个暴君，把材料交上去', 72, 895, {
    size: 25,
    weight: 'bold',
    color: '#fffaf0'
  });
  drawText(context, '→', 674, 889, {
    size: 34,
    align: 'right',
    color: '#fffaf0'
  });
  drawText(context, '不展示任何人的报告、分数或材料', 46, 966, {
    size: 15,
    color: '#81796d'
  });
}

async function generateSharePoster(page, options) {
  const posterType = options.posterType === 'role' ? 'role' : 'home';
  const role = posterType === 'role' ? getRole(options.roleId) : null;
  const code = await cloudRequest({
    action: 'generateShareCode',
    posterType,
    roleId: role && role.id
  });
  let codeFilePath = '';
  try {
    codeFilePath = writeCodeImage(code.imageBase64, code.contentType);
    const imageSources = posterType === 'home'
      ? roles.map((item) => `${ROLE_IMAGE_ROOT}/${item.id}.jpg`)
      : [`${ROLE_IMAGE_ROOT}/${role.id}.jpg`];
    const canvas = await getCanvasNode(page, options.canvasId);
    const [codeImage, ...roleImages] = await Promise.all([
      loadCanvasImage(canvas, codeFilePath),
      ...imageSources.map((source) => loadCanvasImage(canvas, source))
    ]);
    const context = canvas.getContext('2d');
    if (posterType === 'home') {
      drawHomePoster(context, roleImages, codeImage);
    } else {
      drawRolePoster(context, role, roleImages[0], codeImage);
    }
    return await canvasToTempFilePath(canvas);
  } finally {
    removeLocalFile(codeFilePath);
  }
}

function saveImageToPhotosAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: resolve,
      fail: reject
    });
  });
}

function showModal(options) {
  return new Promise((resolve, reject) => {
    wx.showModal({ ...options, success: resolve, fail: reject });
  });
}

function openSetting() {
  return new Promise((resolve, reject) => {
    wx.openSetting({ success: resolve, fail: reject });
  });
}

function isAlbumPermissionError(error) {
  const message = error && (error.errMsg || error.message) || '';
  return /auth deny|authorize:fail|permission|权限/i.test(message);
}

async function saveSharePoster(filePath) {
  try {
    await saveImageToPhotosAlbum(filePath);
  } catch (error) {
    if (!isAlbumPermissionError(error)) throw error;
    const choice = await showModal({
      title: '需要相册权限',
      content: '允许保存图片后，才能把这张暴君海报发到朋友圈。',
      confirmText: '去设置',
      cancelText: '先不保存'
    });
    if (!choice.confirm) throw new Error('尚未获得相册权限');
    const setting = await openSetting();
    if (!setting.authSetting || !setting.authSetting['scope.writePhotosAlbum']) {
      throw new Error('尚未获得相册权限');
    }
    await saveImageToPhotosAlbum(filePath);
  }
}

module.exports = {
  generateSharePoster,
  saveSharePoster
};
