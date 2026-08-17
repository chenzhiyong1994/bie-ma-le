const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const miniProgramRoot = path.join(root, 'apps', 'miniprogram');
const appConfigPath = path.join(miniProgramRoot, 'app.json');
const errors = [];
const forbiddenProductionPatterns = [
  { pattern: /\bmode=mock\b/, label: 'mock processing route' },
  { pattern: /\bsource=mock\b/, label: 'mock report route' },
  { pattern: /\bsimulateFailure\b/, label: 'simulated failure handler' },
  { pattern: /data\/mock|data\\mock/, label: 'bundled mock data' },
  { pattern: /dev-resume-file/, label: 'bundled developer fixture' }
];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    errors.push(`${path.relative(root, filePath)}: ${error.message}`);
    return null;
  }
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function validateWxml(filePath) {
  const source = fs.readFileSync(filePath, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const stack = [];
  const supportedTags = new Set([
    'view',
    'text',
    'button',
    'input',
    'textarea',
    'image',
    'canvas',
    'icon',
    'progress',
    'checkbox',
    'radio',
    'switch',
    'slider'
  ]);
  const voidTags = new Set(['input', 'image', 'icon', 'progress', 'checkbox', 'radio', 'switch', 'slider']);
  const tagPattern = /<\/?([a-zA-Z][\w-]*)(?:\s[^<>]*?)?\/?>/g;
  let match;

  while ((match = tagPattern.exec(source))) {
    const tagToken = match[0];
    const tag = match[1];
    const isClosing = tagToken.startsWith('</');
    const isSelfClosing = tagToken.endsWith('/>') || voidTags.has(tag);

    if (!supportedTags.has(tag)) {
      errors.push(`${path.relative(root, filePath)}: unsupported WXML component <${tag}>`);
      return;
    }

    if (isClosing) {
      const openTag = stack.pop();
      if (openTag !== tag) {
        errors.push(`${path.relative(root, filePath)}: expected </${openTag || 'none'}> but found </${tag}>`);
        return;
      }
    } else if (!isSelfClosing) {
      stack.push(tag);
    }
  }

  if (stack.length) {
    errors.push(`${path.relative(root, filePath)}: unclosed <${stack[stack.length - 1]}> tag`);
  }

  const openBindings = (source.match(/{{/g) || []).length;
  const closeBindings = (source.match(/}}/g) || []).length;
  if (openBindings !== closeBindings) {
    errors.push(`${path.relative(root, filePath)}: unbalanced data bindings`);
  }

  const pageScriptPath = filePath.replace(/\.wxml$/, '.js');
  if (fs.existsSync(pageScriptPath)) {
    const pageScript = fs.readFileSync(pageScriptPath, 'utf8');
    const eventPattern = /bind(?:tap|input|change|submit|confirm)="([\w$]+)"/g;
    let eventMatch;

    while ((eventMatch = eventPattern.exec(source))) {
      const handlerPattern = new RegExp(`\\b${eventMatch[1]}\\s*\\(`);
      if (!handlerPattern.test(pageScript)) {
        errors.push(`${path.relative(root, filePath)}: missing event handler ${eventMatch[1]}`);
      }
    }

    if (/open-type=["']share["']/.test(source) && !/\bonShareAppMessage\s*\(/.test(pageScript)) {
      errors.push(`${path.relative(root, filePath)}: share button requires onShareAppMessage`);
    }
  }
}

const appConfig = readJson(appConfigPath);

if (appConfig) {
  const requiredAppFiles = ['app.js', 'app.wxss', 'sitemap.json'];
  requiredAppFiles.forEach((file) => {
    const filePath = path.join(miniProgramRoot, file);
    if (!fs.existsSync(filePath)) {
      errors.push(`missing ${path.relative(root, filePath)}`);
    }
  });

  appConfig.pages.forEach((page) => {
    ['js', 'json', 'wxml', 'wxss'].forEach((extension) => {
      const filePath = path.join(miniProgramRoot, `${page}.${extension}`);
      if (!fs.existsSync(filePath)) {
        errors.push(`missing ${path.relative(root, filePath)}`);
      }
    });
  });
}

walk(miniProgramRoot).forEach((filePath) => {
  const extension = path.extname(filePath);

  if (extension === '.json') {
    readJson(filePath);
  }

  if (extension === '.js') {
    const source = fs.readFileSync(filePath, 'utf8');
    forbiddenProductionPatterns.forEach(({ pattern, label }) => {
      if (pattern.test(source)) {
        errors.push(`${path.relative(root, filePath)}: production client contains ${label}`);
      }
    });
    try {
      new vm.Script(source, { filename: filePath });
    } catch (error) {
      errors.push(`${path.relative(root, filePath)}: ${error.message}`);
    }

    const routePattern = /url:\s*[`'"](\/pages\/[^?`'"]+)/g;
    let routeMatch;
    while ((routeMatch = routePattern.exec(source))) {
      const routeScript = path.join(miniProgramRoot, `${routeMatch[1].slice(1)}.js`);
      if (!fs.existsSync(routeScript)) {
        errors.push(`${path.relative(root, filePath)}: route ${routeMatch[1]} does not exist`);
      }
    }

    const exposesTimelineShare = /menus\s*:\s*\[[^\]]*['"]shareTimeline['"]/.test(source);
    const handlesTimelineShare = /\bonShareTimeline\s*\(/.test(source);
    if (exposesTimelineShare !== handlesTimelineShare) {
      errors.push(`${path.relative(root, filePath)}: shareTimeline menu and onShareTimeline must be configured together`);
    }
  }

  if (extension === '.wxml') {
    validateWxml(filePath);
  }
});

if (errors.length) {
  console.error('Mini program validation failed:\n');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Mini program validation passed: ${appConfig.pages.length} pages, zero external runtime dependencies.`);
