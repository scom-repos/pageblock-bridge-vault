const Fs = require('fs');
const { promises: fs } = require("fs")

const SDKList = [
  './node_modules/@openswap/sdk/dist/index.js',
  './node_modules/@openswap/troll-nft-sdk/dist/index.js',
  './node_modules/@ijstech/cross-chain-bridge/dist/index.js'
]

const GlobalBuildModuleList = [
  {
    sourceFilePath: 'src/assets/index.ts',
    distFilePath: './dist/assets/index.js',
    moduleName: '@staking/assets'
  },
  {
    sourceFilePath: 'src/global/index.ts',
    distFilePath: './dist/global/index.js',
    moduleName: '@staking/global'
  },
  {
    sourceFilePath: 'src/staking-utils/index.ts',
    distFilePath: './dist/staking-utils/index.js',
    moduleName: '@staking/staking-utils'
  },
  {
    sourceFilePath: 'src/store/index.ts',
    distFilePath: './dist/store/index.js',
    moduleName: '@staking/store'
  }
]

const GlobalModuleESBuildConfig = {
  entryPoints: GlobalBuildModuleList.map(v => v.sourceFilePath),
  external: [
    '@staking/assets', 
    '@ijstech/components',
    '@ijstech/eth-wallet',
    '@openswap/sdk',
    '@staking/global',
    '@staking/store',
    '@staking/staking-utils'
  ]
}

async function readFile(fileName) {
  return new Promise((resolve, reject) => {
      Fs.readFile(fileName, 'utf8', function (err, data) {
          if (err)
              reject(err)
          else
              resolve(data)
      })
  })
}

async function writeContent(filePath, moduleName) {
  let content = await readFile(filePath);
  content = `define("${moduleName}",(require, exports)=>{
  ${content}  
  });`
  Fs.writeFileSync(filePath, content);
}

async function buildSDKs() {
  let promises = [];
  for (let sdk of SDKList) {
    promises.push(readFile(sdk));
  }

  let content = '';
  await fs.mkdir('./dist/sdks', { recursive: true });
  await Promise.all(promises).then((dataArr) => {
    for (let data of dataArr) {
      content += data + ';';
    }
  })
  Fs.writeFileSync('./dist/sdks/index.js', content);
};

async function buildGlobalModule() {
  await require('esbuild').build({
    ...GlobalModuleESBuildConfig,
    outdir: 'dist',
    bundle: true,
    minify: false,
    format: 'cjs',
    target: 'ES2017',
    jsx: 'transform',
    plugins: [],
  }).catch(() => process.exit(1));

  await Promise.all(GlobalBuildModuleList.map(v => writeContent(v.distFilePath, v.moduleName)));

  await buildSDKs();
}

async function buildLocalModule() {
  require('esbuild').build({
    entryPoints: [
      'src/staking/index.tsx'
    ],
    external: [
      '@staking/assets',
      '@ijstech/components', 
      '@ijstech/eth-wallet', 
      '@openswap/sdk',
      '@staking/global',
      '@staking/store',
      '@staking/staking-utils'
    ],
    outdir: 'dist/staking',
    bundle: true,
    minify: false,
    format: 'iife',
    target: 'ES2017',
    jsx: 'transform',
    plugins: [],
  }).catch(() => process.exit(1));
}

buildLocalModule();
buildGlobalModule();