const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const functionName = 'bml-api-v2';
const outputRoot = path.join(root, 'dist', 'cloudfunctions', functionName);
const resolvedOutput = path.resolve(outputRoot);
const expectedParent = path.resolve(root, 'dist', 'cloudfunctions');

if (!resolvedOutput.startsWith(`${expectedParent}${path.sep}`)) {
  throw new Error(`Refusing to rebuild unexpected path: ${resolvedOutput}`);
}

fs.rmSync(resolvedOutput, { recursive: true, force: true });
fs.mkdirSync(resolvedOutput, { recursive: true });

esbuild.buildSync({
  entryPoints: [path.join(root, 'services', 'cloud-function', 'src', 'index.js')],
  outfile: path.join(resolvedOutput, 'index.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  external: ['unpdf', 'wx-server-sdk'],
  sourcemap: false,
  minify: false,
  logLevel: 'warning'
});

const packageJson = {
  name: functionName,
  version: '1.0.0',
  private: true,
  main: 'index.js',
  dependencies: {
    unpdf: '1.6.2',
    'wx-server-sdk': '4.0.2'
  }
};
fs.writeFileSync(
  path.join(resolvedOutput, 'package.json'),
  `${JSON.stringify(packageJson, null, 2)}\n`
);

const functionConfigPath = path.join(root, 'services', 'cloud-function', 'config.json');
const functionConfig = JSON.parse(fs.readFileSync(functionConfigPath, 'utf8'));
const openApiPermissions = functionConfig.permissions && functionConfig.permissions.openapi;
if (!Array.isArray(openApiPermissions) || !openApiPermissions.includes('wxacode.getUnlimited')) {
  throw new Error('Cloud function config must declare wxacode.getUnlimited permission');
}
fs.copyFileSync(functionConfigPath, path.join(resolvedOutput, 'config.json'));

console.log(`Cloud function bundle ready: ${path.relative(root, resolvedOutput)}`);
