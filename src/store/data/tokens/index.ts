import { ITokenObject } from "../../../global";

const Tokens_BSC: ITokenObject[] = require('./mainnet/bsc.json');
const Tokens_Ethereuem: ITokenObject[] = require('./mainnet/ethereum.json');
const Tokens_Polygon: ITokenObject[] = require('./mainnet/polygon.json');
const Tokens_Avalanche: ITokenObject[] = require('./mainnet/avalanche.json');
const Tokens_Fantom: ITokenObject[] = require('./mainnet/fantom.json');
const Tokens_Cronos: ITokenObject[] = require('./mainnet/cronos.json'); //not added

const Tokens_Kovan: ITokenObject[] = require('./testnet/kovan.json');
const Tokens_BSC_Testnet: ITokenObject[] = require('./testnet/bsc-testnet.json');
const Tokens_Fuji: ITokenObject[] = require('./testnet/fuji.json');
const Tokens_Mumbai: ITokenObject[] = require('./testnet/mumbai.json');
const Tokens_Fantom_Testnet: ITokenObject[] = require('./testnet/fantom-testnet.json');
const Tokens_Amino: ITokenObject[] = require('./testnet/amino.json');
const Tokens_AminoXTestnet: ITokenObject[] = require('./testnet/aminoX-testnet.json');
const Tokens_Cronos_Testnet: ITokenObject[] = require('./testnet/cronos-testnet.json');

const DefaultERC20Tokens: { [chainId: number]: ITokenObject[] } = {
  1: Tokens_Ethereuem,
  25: Tokens_Cronos,
  42: Tokens_Kovan,
  56: Tokens_BSC,
  97: Tokens_BSC_Testnet,
  137: Tokens_Polygon,
  338: Tokens_Cronos_Testnet,
  31337: Tokens_Amino,
  80001: Tokens_Mumbai,
  43113: Tokens_Fuji,
  43114: Tokens_Avalanche,
  250: Tokens_Fantom,
  4002: Tokens_Fantom_Testnet,
  13370: Tokens_AminoXTestnet
}

const ChainNativeTokenByChainId: { [chainId: number]: ITokenObject } = {
  1: { address: undefined, decimals: 18, symbol: "ETH", name: 'ETH', isNative: true },
  25: { address: undefined, decimals: 18, symbol: "CRO", name: 'CRO', isNative: true }, //cronos
  42: { address: undefined, decimals: 18, symbol: "ETH", name: 'ETH', isNative: true }, // Kovan,
  56: { address: undefined, decimals: 18, symbol: "BNB", name: 'BNB', isNative: true }, // Binance Mainnet
  97: { address: undefined, decimals: 18, symbol: "BNB", name: 'BNB', isNative: true }, // Binance Test Chain
  137: { address: undefined, decimals: 18, symbol: "MATIC", name: 'MATIC', isNative: true }, //Polygon
  338: { address: undefined, decimals: 18, symbol: "TCRO", name: 'TCRO', isNative: true }, //cronos
  31337: { address: undefined, decimals: 18, symbol: "ACT", name: 'ACT', isNative: true }, //Amino Testnet
  80001: { address: undefined, decimals: 18, symbol: "MATIC", name: 'MATIC', isNative: true }, //Mumbai, Polygon testnet
  43114: { address: undefined, decimals: 18, symbol: "AVAX", name: 'AVAX', isNative: true }, //Avalanche Mainnet C-Chain
  43113: { address: undefined, decimals: 18, symbol: "AVAX", name: 'AVAX', isNative: true },  //Avalanche FUJI C-Chain
  250: { address: undefined, decimals: 18, symbol: "FTM", name: 'FTM', isNative: true }, // Fantom Opera
  4002: { address: undefined, decimals: 18, symbol: "FTM", name: 'FTM', isNative: true }, // Fantom Testnet
  13370: { address: undefined, decimals: 18, symbol: "ACT", name: 'ACT', isNative: true }, //Amino X Testnet
}

const WETHByChainId = Object.keys(DefaultERC20Tokens).reduce((result: {[chainId: number]: ITokenObject}, key: string) => {
  let weth = DefaultERC20Tokens[Number(key)].find(v => v.isWETH);
  if (!weth) console.log(`No Default Wrapped Native Token on chain ${key}`);
  result[Number(key)] = weth!;
  return result
}, {});

const getOpenSwapToken = (chainId:number) => {
  let tokens = DefaultERC20Tokens[chainId];
  if (!tokens) return null;
  for (const token of tokens) {
    if (token.name == "OpenSwap" && token.symbol == "OSWAP") return token;
  }
  return null;
}

const DefaultTokens = Object.keys(ChainNativeTokenByChainId).reduce((result: {[chainId: number]: ITokenObject[]}, key: string) => {
  result[Number(key)] = [...DefaultERC20Tokens[Number(key)], ChainNativeTokenByChainId[Number(key)]]
  return result
}, {});
//not adjusted for cronos and its testnet
const ToUSDPriceFeedAddressesMap: { [chainId: number]: {[token:string]:string} } = {
  56: {
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE', //BNB
    '0x55d398326f99059ff775485246999027b3197955': '0xB97Ad0E74fa7d920791E90258A6E2085088b4320', //USDT
    '0xe9e7cea3dedca5984780bafc599bd69add087d56': '0xcBb98864Ef56E9042e7d2efef76141f15731B82f', //BUSD
  },
  97: {
    '0xae13d989dac2f0debff460ac112a837c89baa7cd': '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526', //BNB
    '0x29386b60e0a9a1a30e1488ada47256577ca2c385': '0xEca2605f0BCF2BA5966372C99837b1F182d3D620', //USDT
    '0xde9334c157968320f26e449331d6544b89bbd00f': '0x9331b55D9830EF609A2aBCfAc0FBCE050A52fdEa', //BUSD
    '0xb78daa2f1a2de8270a5641f052fafc4b2b3ea3b1': '0x9331b55D9830EF609A2aBCfAc0FBCE050A52fdEa', //BUSD       
  },
  43113: {
    '0xd00ae08403b9bbb9124bb305c09058e32c39a48c': '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD', //AVAX
    '0xb9c31ea1d475c25e58a1be1a46221db55e5a7c6e': '0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad', //USDT.e  
  },
  43114: {
    '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7': '0x0A77230d17318075983913bC2145DB16C7366156', //AVAX
    '0xc7198437980c041c805a1edcba50c1ce5db95118': '0xEBE676ee90Fe1112671f19b6B7459bC678B67e8a', //USDT.e  
    '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664': '0xF096872672F44d6EBA71458D74fe67F9a77a23B9', //USDC.e  
  }
}
//not adjusted for cronos and its testnet
const tokenPriceAMMReference: { [chainId: number]: {[token:string]:string}} = { //lowercase on token address only
  56: {
    "0xb32ac3c79a94ac1eb258f3c830bbdbc676483c93": "0x6AA3eC903176df556e8D8473A002b6A807399351", // OSWAP: OSWAP & BNB (Oswap-LP)
    "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16", // BNB : BNB & BUSD (Pancake-LP)
    "0x0b15ddf19d47e6a86a56148fb4afffc6929bcb89": "0x71E6de81381eFE0Aa98f56b3B43eB3727D640715", // IDIA : IDIA & BUSD (Pancake-LP)
    "0x416947e6fc78f158fd9b775fa846b72d768879c2" : "0xe6A97E7B5EB2FA72A8B4BeDaaf4CdE85E015DAbf",// OGS : OGS & BUSD (IF)
    "0x31720b2276df3b3b757b55845d17eea184d4fc8f" : "0x0DBCe9e7b634B5eAAAb483194CC3224Fde9624CF" // OAX : OAX & BNB (OSWAP-LP)
  },
  97: {
    "0x45eee762aaea4e5ce317471bda8782724972ee19": "0xb0094FfE387da1739FB95bAbCAF01B105FD0D887", // OSWAP: OSWAP & BNB
    "0xae13d989dac2f0debff460ac112a837c89baa7cd": "0x4A63235712c5F56796b8120DE9195626cf7496f1", // BNB : BNB & BUSD
    "0xc2c76387eb1cd15f2f55d2463b5aad6fca062eb1": "0xd2401ED7A6444CB96EE78424a222A51788E90060", // mOSWAP: mOSWAP & OSWAP
    "0x52423b7f0769d0365ebdd79342ce167eb9c29ae2": "0x34aE455fC2d8C808471f7A6967eee858C61cc838", // IDIA: IDIA & BUSD
    "0xb79aa5c1730ad78dd958f05fd87022aef3e50721": "0x902d79f7Dc980D9b21D691F5F0737ce11f352eB9", // TT: BNB & TT
    "0x8677048f3ed472610514ba6ef6ec2f03b550ebdb": "0x095307dEac764FDC521fE2E3cf8EDf0f40B00F17", // Oax: Oax & BNB
  },
  43113: {
    "0x78d9d80e67bc80a11efbf84b7c8a65da51a8ef3c": "0x239b4EaF1746051b1bED34dC2963f053c4649f88", // OSWAP : OSWAP & AVAX
    "0xd00ae08403B9bbb9124bB305C09058E32C39A48c": "0x0f98073122cc43596eF645Ae51FE085f355C487e"  // AVAX : AVAX & USDT.e
  },
  43114: {
    "0xb32ac3c79a94ac1eb258f3c830bbdbc676483c93": "0xBeaE5AaA6d76ABe711336801D590850e18cB3C6b", // OSWAP : OSWAP & AVAX      
  }
}

const TokenFolderName: { [key: number]: string } = {
  1: "ethereum",
  25: "cronos",
  42: "kovan",
  56: "bsc",
  97: "bsc-testnet",
  137: "polygon",
  338: "cronos-testnet",
  31337: "amino",
  80001: "mumbai",
  43113: "fuji",
  43114: "avalanche",
  250: "fantom",
  4002: "fantom-testnet",
  13370: "aminox-testnet"
}

const getTokenIconPath = (tokenObj: any, chainId?: number) => {
  const tokenPath = 'img/tokens';
  if (!tokenObj || tokenObj.isCustom) {
    return `${tokenPath}/token-placeholder.svg`;
  }
  else if (chainId != null && chainId != undefined) {
    let folderName = TokenFolderName[chainId];
    let fileName = (!tokenObj.isNative ? tokenObj.address.toLowerCase() : tokenObj.symbol) + '.png';
    return `${tokenPath}/${folderName}/${fileName}`;
  }
  else {
    return `${tokenPath}/${tokenObj.symbol}.png`;
  }
}

export {
  DefaultERC20Tokens,
  ChainNativeTokenByChainId,
  WETHByChainId,
  DefaultTokens,
  ToUSDPriceFeedAddressesMap,
  tokenPriceAMMReference,
  getTokenIconPath,
  getOpenSwapToken,
}

