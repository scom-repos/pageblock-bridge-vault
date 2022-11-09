import { Erc20, Wallet } from '@ijstech/eth-wallet';
import {
  ITokenObject,
  SITE_ENV,
  TokenMapType,
  getERC20Amount,
  INetwork,
  EventId,
} from '@staking/global';

import Assets from '@staking/assets';
import { Contracts } from '@openswap/sdk';
import { isWalletConnected } from './wallet';
import {
  DefaultTokens,
  CoreContractAddressesByChainId,
  ChainNativeTokenByChainId,
  WETHByChainId,
  getTokenIconPath,
} from './data';
import { application } from '@ijstech/components';

export {isWalletConnected, hasWallet, hasMetaMask, truncateAddress, switchNetwork, connectWallet, logoutWallet} from './wallet';
export {walletList} from './walletList';
export {
  //token
  DefaultERC20Tokens,
  ChainNativeTokenByChainId,
  WETHByChainId,
  DefaultTokens,
  ToUSDPriceFeedAddressesMap,
  tokenPriceAMMReference,
  getTokenIconPath,
  getOpenSwapToken,

  //networks
  Networks,
  InfuraId,

  //core
  CoreContractAddressesByChainId,
  
  //staking
  StakingCampaign,
  Staking,
  Reward,
  RewardNeeded,
  LockTokenType,
  LockTokenTypeList,
  USDPeggedTokenAddressMap,
  
  //cross-chain
  baseRoute,
  crossChainNativeTokenList,
  getBridgeVaultVersion,
  BridgeVaultGroupList,
  ChainTrollRegistryMap,
  CrossChainAddressMap,
  MockOracleMap,
  VaultOrderStatus,
  VaultType,
  TrollType,
  TrollTypeStringEnumMap,
  TrollStatus,
  VaultActionType,
  TrollManagementActionType,
  BridgeVaultConstant,

} from './data'

export const fallBackUrl = Assets.fullPath('img/tokens/token-placeholder.svg');

export const nullAddress = "0x0000000000000000000000000000000000000000";

const TOKENS = "oswap_user_tokens_";

export const getUserTokens:(chainId: number) => any[] | null = (chainId: number) => {
  let tokens = localStorage[TOKENS + chainId];
  if (tokens) {
    tokens = JSON.parse(tokens);
  } else {
    tokens = [];
  }
  const userTokens = state.userTokens[chainId];
  if (userTokens && userTokens.length) {
    tokens = tokens.concat(userTokens);
  }
  return tokens.length ? tokens : null;
}

export const addUserTokens = (token: ITokenObject) => {
  const chainId = getChainId();
  let tokens = localStorage[TOKENS + chainId];
  let i = -1;
  if (tokens) {
    tokens = JSON.parse(tokens);
    i = tokens.findIndex((item: ITokenObject) => item.address == token.address);
  } else {
    tokens = [];
  }
  if (i == -1) {
    tokens.push(token);
  }
  localStorage[TOKENS + chainId] = JSON.stringify(tokens);
}

export const setSiteEnv = (value: string) => {
  if (Object.values(SITE_ENV).includes(value as SITE_ENV)) {
    state.siteEnv = value as SITE_ENV;
  } else {
    state.siteEnv = SITE_ENV.TESTNET;
  }
}

export const getSiteEnv = (): SITE_ENV => {
  return state.siteEnv;
}

export const setCurrentChainId = (value: number) => {
  state.currentChainId = value;
}

export const getCurrentChainId = (): number => {
  return state.currentChainId;
}

export function getAddresses(chainId: number) {
  return CoreContractAddressesByChainId[chainId];
};

export const getChainNativeToken = (chainId: number): ITokenObject => {
  return ChainNativeTokenByChainId[chainId];
};

export const getWETH = (chainId: number): ITokenObject => {
  let wrappedToken = WETHByChainId[chainId];
  return wrappedToken;
};

export function getChainId() {
  return Wallet.getInstance().chainId;
}

export function getWallet() {
  return isWalletConnected() ? Wallet.getInstance() : new Wallet(getNetworkInfo(state.currentChainId || getDefaultChainId()).rpc);
}

export function getWalletProvider() {
  return localStorage.getItem('walletProvider') || '';
}

export function getErc20(address: string) {
  const wallet = getWallet();
  return new Erc20(wallet, address);
}

export const isExpertMode = (): boolean => {
  return state.isExpertMode;
}

export function toggleExpertMode() {
  state.isExpertMode = !state.isExpertMode
}

export const getTokenList = (chainId: number) => {
  const tokenList = [...DefaultTokens[chainId]];
  const userCustomTokens = getUserTokens(chainId);
  if (userCustomTokens) {
    userCustomTokens.forEach(v => tokenList.push({...v, isNew: false, isCustom: true}));
  }
  return tokenList;
}

export interface TokenBalancesType { [token: string]: string }
export async function updateAllTokenBalances(): Promise<TokenBalancesType> {
  const wallet = getWallet();
  let allTokenBalancesMap: TokenBalancesType = {};
  if (!wallet.chainId || !DefaultTokens[wallet.chainId]) return allTokenBalancesMap;
  const tokenList = getTokenList(wallet.chainId);
  let promises: Promise<void>[] = []
  promises.push(...tokenList.map(async (token, index) => {
      try {
        if (token.address) {
          let balance = (await getERC20Amount(wallet, token.address, token.decimals)).toFixed()
          allTokenBalancesMap[token.address.toLowerCase()] = balance;
        } else {
          let balance = (await getWallet().balance).toFixed();
          allTokenBalancesMap[token.symbol] = balance;
        }
      } catch (error) {}
  }));
  
  await Promise.all(promises);
  state.tokenBalances = allTokenBalancesMap;
  return allTokenBalancesMap;
}


export const getTokenBalances = (): TokenBalancesType => {
  return state.tokenBalances;
}
export const getTokenBalance = (token: ITokenObject): string => {
  let balance = '0';
  if (!token) return balance;
  if (token.address) {
    balance = state.tokenBalances[token.address.toLowerCase()];
  } else {
    balance = state.tokenBalances[token.symbol];
  }
  return balance;
}
export const setTokenBalances = async (value?: TokenBalancesType) => {
  state.tokenBalances = value ? value : await updateAllTokenBalances();
}

export const state = {
  siteEnv: SITE_ENV.TESTNET,
  currentChainId: 0,
  isExpertMode: false,
  slippageTolerance: 0.5,
  transactionDeadline: 30,
  tokenBalances: {} as TokenBalancesType,
  tokenMap: {} as TokenMapType,
  userTokens: {} as {[key: string]: ITokenObject[]},
  infuraId: "",
  networkMap: {} as { [key: number]: INetwork },
  stakingStatusMap: {} as {[key: string]: {value: boolean, text: string}},
}

export const setDataFromSCConfig = (networkList: INetwork[], infuraId: string) => {
  if (infuraId) {
    setInfuraId(infuraId)
  }			
  if (networkList) {
    setNetworkList(networkList)
  }
}

export const getDefaultChainId = () => {
  switch (getSiteEnv()) {
    case SITE_ENV.TESTNET:
      return 97
    case SITE_ENV.DEV:
    case SITE_ENV.MAINNET:
    default:
      return 56
  }
}

const setInfuraId = (infuraId: string) => {
  state.infuraId = infuraId;
}

export const getInfuraId = () => {
  return state.infuraId;
}

const setNetworkList = (networkList: INetwork[]) => {
  let networkFullList = Object.keys(networkList);
  for (const key of networkFullList) {
    let network = networkList[Number(key)]
    state.networkMap[network.chainId] = network;
  }
}

export const getNetworkInfo = (chainId: number) => {
  return state.networkMap[chainId];
}

export const getFilteredNetworks = (filter:(value: INetwork, index: number, array: INetwork[])=>boolean) => {
  let networkFullList = Object.values(state.networkMap);
  return networkFullList.filter(filter);
}

interface NetworkConditions {
  isDisabled?:boolean,
  isTestnet?:boolean,
  isCrossChainSupported?:boolean,
  isMainChain?:boolean
}

function matchFilter<O extends {[keys:string]:any}>(list:O[], filter:Partial<O>):O[] {
  let filters = Object.keys(filter); 
  return list.filter(item=>filters.every(f=>{
    switch (typeof filter[f]) {
      case 'boolean':
        if (filter[f] === false) {
          return item[f] === undefined || item[f] === null;
        }
      // also case for filter[f] === true 
      case 'string':
      case 'number':
        return filter[f] === item[f];
      case 'object': // have not implemented yet
      default:  
        console.log(`matchFilter do not support ${typeof filter[f]} yet!`)
        return false;
    }  
  }));
}

export const getMatchNetworks = (conditions:NetworkConditions):INetwork[] => {
  let networkFullList = Object.values(state.networkMap);
  let out = matchFilter(networkFullList,conditions);
  return out;
}

export const getSiteSupportedNetworks = ()  => {
  let networkFullList = Object.values(state.networkMap);
  let list = networkFullList.filter(network => !getNetworkInfo(network.chainId).isDisabled);
  const siteEnv = getSiteEnv();
  if (siteEnv === SITE_ENV.TESTNET) {
    return list.filter((network) => network.isTestnet);
  }
  if (siteEnv === SITE_ENV.DEV) {
    return list;
  }
  return list.filter((network) => !network.isTestnet);
}

export const getNetworkExplorerName = (chainId: number) => {
  if (getNetworkInfo(chainId)) {
    return getNetworkInfo(chainId).explorerName;
  }
  return 'Unknown';
}

export const getNetworkImg = (chainId: number) => {
  try {
    const network = getNetworkInfo(chainId);
    if (network) {
      return Assets.fullPath(network.img);
    }
  } catch { }
  return Assets.fullPath('img/tokens/token-placeholder.svg');
}

export const projectNativeToken = (): ITokenObject & { address: string } | null => {
  let chainId = getChainId();
  if (chainId == null || chainId == undefined) return null;
  let stakeToken = DefaultTokens[chainId].find(v => v.symbol == 'OSWAP')
  return stakeToken ? { ...stakeToken, address: stakeToken.address!.toLowerCase() } : null;
}

export const projectNativeTokenSymbol = () => {
  const token = projectNativeToken();
  return token ? token.symbol : ''
};

export const getTokenObject = async (address: string, showBalance?: boolean) => {
  const ERC20Contract = new Contracts.ERC20(Wallet.getInstance(), address);
  const symbol = await ERC20Contract.symbol();
  const name = await ERC20Contract.name();
  const decimals = (await ERC20Contract.decimals()).toFixed();
  let balance;
  if (showBalance && getWallet().isConnected) {
    balance =  (await (ERC20Contract.balanceOf(getWallet().account.address))).shiftedBy(-decimals).toFixed();
  }
  return {
    address: address.toLowerCase(),
    decimals: +decimals,
    name,
    symbol,
    balance
  }
}

export const getTokenMapData = (targetChain?: number): TokenMapType => {
  let allTokensMap: TokenMapType = {};
  let chainId = targetChain || getChainId();
  if (DefaultTokens[chainId]) {
    let defaultTokenList = DefaultTokens[chainId].sort((a, b) => {
      if (a.symbol.toLowerCase() < b.symbol.toLowerCase()) { return -1; }
      if (a.symbol.toLowerCase() > b.symbol.toLowerCase()) { return 1; }
      return 0;
    })
    for (let i = 0; i < defaultTokenList.length; i++) {
      let defaultTokenItem = defaultTokenList[i];
      if (defaultTokenItem.address)
        allTokensMap[defaultTokenItem.address.toLowerCase()] = defaultTokenItem;
      else
        allTokensMap[defaultTokenItem.symbol] = defaultTokenItem;
    }
    const userCustomTokens = getUserTokens(chainId);
    if (userCustomTokens) {
      userCustomTokens.forEach(v => allTokensMap[v.address] = {...v, isCustom: true});
    }
  }
  return allTokensMap;
}
let tokenMapChainId = 0;
export const setTokenMap = () => {
  state.tokenMap = getTokenMapData()
}
export const getTokenMap = () => {
  let chainId = getChainId();
  if (tokenMapChainId != chainId) {
    state.tokenMap = getTokenMapData()
    tokenMapChainId = chainId;
  }
  return state.tokenMap
}

export const getTokensDataList = async (tokenMapData: TokenMapType, tokenBalances: any): Promise<any[]> => {
  let dataList: any[] = [];
  for (let i = 0; i < Object.keys(tokenMapData).length; i++) {
    let tokenAddress = Object.keys(tokenMapData)[i];
    let tokenObject = tokenMapData[tokenAddress];
    if (tokenBalances) {
      dataList.push({
        ...tokenObject,
        status: false,
        value: tokenBalances[tokenAddress] ? tokenBalances[tokenAddress] : 0,
      });
    } else {
      dataList.push({
        ...tokenObject,
        status: null,
      })
    }
  }
  return dataList;
}

export const getTokenDecimals = (address: string) => {
  let chainId = getChainId();
  const Address = getAddresses(chainId);
  const ChainNativeToken = getChainNativeToken(chainId);
  const tokenObject = (!address || address.toLowerCase() === Address['WETH9'].toLowerCase()) ?
  ChainNativeToken :
    getTokenMap()[address];
  return tokenObject ? tokenObject.decimals : 18;
}

export const getTokenIcon = (address: string) => {
  if (!address) return '';
  const tokenMap = getTokenMap();
  let ChainNativeToken;
  let tokenObject;
  if (isWalletConnected()){
    ChainNativeToken = getChainNativeToken(getChainId());
    tokenObject = address == ChainNativeToken.symbol ? ChainNativeToken : tokenMap[address.toLowerCase()];
  } else {
    tokenObject = tokenMap[address.toLowerCase()];
  }
  return Assets.fullPath(getTokenIconPath(tokenObject, getChainId()));
}

export const tokenSymbol = (address: string) => {
  if (!address) return '';
  const tokenMap = getTokenMap();
  let tokenObject = tokenMap[address.toLowerCase()];
  if (!tokenObject) {
    tokenObject = tokenMap[address];
  }
  return tokenObject ? tokenObject.symbol : '';
}

export const setUserTokens = (token: ITokenObject, chainId: number) => {
  if (!state.userTokens[chainId]) {
    state.userTokens[chainId] = [token];
  } else {
    state.userTokens[chainId].push(token);
  }
}

export const hasUserToken = (address: string, chainId: number) => {
  return state.userTokens[chainId]?.some((token: ITokenObject) => token.address?.toLocaleLowerCase() === address?.toLocaleLowerCase());
}

export const viewOnExplorerByTxHash = (chainId: number, txHash: string) => {
  let network = getNetworkInfo(chainId);
  if (network && network.explorerTxUrl) {
    let url = `${network.explorerTxUrl}${txHash}`;
    window.open(url);
  }
}

export const viewOnExplorerByAddress = (chainId: number, address: string) => {
  let network = getNetworkInfo(chainId);
  if (network && network.explorerAddressUrl) {
    let url = `${network.explorerAddressUrl}${address}`;
    window.open(url);
  }
}

export const setStakingStatus = (key: string, value: boolean, text: string) => {
  state.stakingStatusMap[key] = { value, text };
  application.EventBus.dispatch(EventId.EmitButtonStatus, {key, value, text});
}

export const getStakingStatus = (key: string) => {
  return state.stakingStatusMap[key] || { value : false, text: 'Stake' };
}
