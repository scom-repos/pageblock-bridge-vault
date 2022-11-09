import { getTokenMap, getTokenIconPath, DefaultTokens, LockTokenType } from '@staking/store';

const getLockedTokenObject = (info: any, tokenInfo: any, tokenMap?: any) => {
  if (info) {
    if (info.lockTokenType == LockTokenType.ERC20_Token) {
      if (!tokenMap) {
        tokenMap = getTokenMap();
      }
      return tokenMap[tokenInfo.tokenAddress];
    }
    if (info.lockTokenType == LockTokenType.LP_Token && tokenInfo.lpToken) {
      return tokenInfo.lpToken.object;
    }
    else if (info.lockTokenType == LockTokenType.VAULT_Token && tokenInfo.vaultToken) {
      return tokenInfo.vaultToken.object;
    }
  }
  return null;
}

const getLockedTokenSymbol = (info: any, token: any) => {
  if (info) {
    if (info.lockTokenType == LockTokenType.ERC20_Token) {
      return token ? token.symbol : '';
    }
    if (info.lockTokenType == LockTokenType.LP_Token) {
      return 'LP';
    }
    if (info.lockTokenType == LockTokenType.VAULT_Token) {
      return token ? `vt${token.assetToken.symbol}` : '';
    }
  }
  return '';
}

const getLockedTokenIconPaths = (info: any, tokenObject: any, chainId: number, tokenMap?: any) => {
  if (info && tokenObject) {
    if (!tokenMap) {
      tokenMap = getTokenMap();
    }
    if (info.lockTokenType == LockTokenType.ERC20_Token) {
      return [getTokenIconPath(tokenObject, chainId)];
    }
    if (info.lockTokenType == LockTokenType.LP_Token) {
      const nativeToken = DefaultTokens[chainId]?.find((token) => token.isNative);
      const token0 = tokenMap[tokenObject.token0] || nativeToken;
      const token1 = tokenMap[tokenObject.token1] || nativeToken;
      return [getTokenIconPath(token0, chainId), getTokenIconPath(token1, chainId)];
    }
    if (info.lockTokenType == LockTokenType.VAULT_Token) {
      return [getTokenIconPath(tokenObject.assetToken, chainId)];
    }
  }
  return [];
}

export {
  getLockedTokenObject,
  getLockedTokenSymbol,
  getLockedTokenIconPaths,
}
