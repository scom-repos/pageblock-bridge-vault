import moment from "moment";
import { Wallet, BigNumber, Utils, Erc20 } from "@ijstech/eth-wallet";
import { Contracts as TimeIsMoneyContracts } from '@validapp/time-is-money-sdk';
import { Contracts } from "@openswap/sdk";
import { Contracts as UtilsContracts } from "@validapp/chainlink-sdk";
import { Contracts as CrossChainContracts } from "@ijstech/cross-chain-bridge";
import { 
  ERC20ApprovalModel, 
  IERC20ApprovalEventOptions, 
  ITokenObject,
} from "../global";
import { 
  getTokenMap,
  USDPeggedTokenAddressMap,
  ToUSDPriceFeedAddressesMap,
  WETHByChainId,
  tokenPriceAMMReference,
  StakingCampaign,
  Staking,
  Reward,
  getWallet,
  getTokenDecimals,
} from "@staking/store";

export const getTokenPrice = async (token: string) => { // in USD value
  let wallet = Wallet.getInstance();
  let chainId = wallet.chainId;
  let tokenPrice: string;

  // get price from price feed 
  let tokenPriceFeedAddress = ToUSDPriceFeedAddressesMap[chainId][token.toLowerCase()];
  if (tokenPriceFeedAddress) {
    let aggregator = new UtilsContracts.EACAggregatorProxy(wallet, tokenPriceFeedAddress);
    let tokenLatestRoundData = await aggregator.latestRoundData();
    let tokenPriceFeedDecimals = await aggregator.decimals();
    return tokenLatestRoundData.answer.shiftedBy(-tokenPriceFeedDecimals).toFixed();
  }

  // get price from AMM
  let referencePair = tokenPriceAMMReference[chainId][token.toLowerCase()]
  if (!referencePair) return null;
  let pair = new Contracts.OSWAP_Pair(wallet, referencePair);
  let token0 = await pair.token0();
  let token1 = await pair.token1();
  let reserves = await pair.getReserves()
  let token0PriceFeedAddress = ToUSDPriceFeedAddressesMap[chainId][token0.toLowerCase()]
  let token1PriceFeedAddress = ToUSDPriceFeedAddressesMap[chainId][token1.toLowerCase()]

  if (token0PriceFeedAddress || token1PriceFeedAddress) {
    if (token0PriceFeedAddress) {
      let aggregator = new UtilsContracts.EACAggregatorProxy(wallet, token0PriceFeedAddress);
      let token0LatestRoundData = await aggregator.latestRoundData();
      let token0PriceFeedDecimals = await aggregator.decimals();
      let token0USDPrice = new BigNumber(token0LatestRoundData.answer).shiftedBy(-token0PriceFeedDecimals).toFixed();
      if (new BigNumber(token.toLowerCase()).lt(token0.toLowerCase())) {
        tokenPrice = new BigNumber(reserves._reserve1).div(reserves._reserve0).times(token0USDPrice).toFixed()
      } else {
        tokenPrice = new BigNumber(reserves._reserve0).div(reserves._reserve1).times(token0USDPrice).toFixed()
      }
    } else {
      let aggregator = new UtilsContracts.EACAggregatorProxy(wallet, token1PriceFeedAddress);
      let token1LatestRoundData = await aggregator.latestRoundData();
      let token1PriceFeedDecimals = await aggregator.decimals();
      let token1USDPrice = new BigNumber(token1LatestRoundData.answer).shiftedBy(-token1PriceFeedDecimals).toFixed();
      if (new BigNumber(token.toLowerCase()).lt(token1.toLowerCase())) {
        tokenPrice = new BigNumber(reserves._reserve1).div(reserves._reserve0).times(token1USDPrice).toFixed()
      } else {
        tokenPrice = new BigNumber(reserves._reserve0).div(reserves._reserve1).times(token1USDPrice).toFixed()
      }
    }
  } else {
    if (token0.toLowerCase() == token.toLowerCase()) {//for other reference pair
      let token1Price = await getTokenPrice(token1);
      if (!token1Price) return null;
      tokenPrice = new BigNumber(token1Price).times(reserves._reserve1).div(reserves._reserve0).toFixed()
    } else {
      let token0Price = await getTokenPrice(token0);
      if (!token0Price) return null;
      tokenPrice = new BigNumber(token0Price).times(reserves._reserve0).div(reserves._reserve1).toFixed()
    }
  }
  return tokenPrice;
}

const getStakingRewardInfoByAddresses = async (option: Reward, providerAddress: string, releaseTime: number) => {
  try {
    let rewardAddress = option.address;
    let isCommonStartDate = option.isCommonStartDate;
    let reward = '0';
    let claimSoFar = '0';
    let claimable = '0';
    let admin = '';
    if (!rewardAddress) {
      return {
        reward,
        claimSoFar,
        claimable,
        multiplier: option.multiplier
      }
    }

    let wallet = Wallet.getInstance();
    let rewardsContract;
    if (isCommonStartDate) {
      rewardsContract = new TimeIsMoneyContracts.RewardsCommonStartDate(wallet, rewardAddress);
    }
    else {
      rewardsContract = new TimeIsMoneyContracts.Rewards(wallet, rewardAddress);
    }

    try {
      admin = await rewardsContract.admin();
      let rewardWei = await rewardsContract.reward();
      let unclaimedWei = await rewardsContract.unclaimed();
      let claimSoFarWei = await rewardsContract.claimSoFar(providerAddress);

      reward = Utils.fromDecimals(rewardWei).toFixed();
      claimSoFar = Utils.fromDecimals(claimSoFarWei).toFixed();
      claimable = Utils.fromDecimals(unclaimedWei).toFixed();
    } catch (err) {
    }

    let vestingPeriod = (await rewardsContract.vestingPeriod()).toNumber();
    let vestingStart;

    if (rewardsContract instanceof TimeIsMoneyContracts.RewardsCommonStartDate) {
      let vestingStartDateRaw = (await rewardsContract.vestingStartDate()).toNumber();
      vestingStart = moment.unix(vestingStartDateRaw);
    }
    else {
      vestingStart = moment.unix(releaseTime);
    }

    let vestingEnd = moment(vestingStart).add(vestingPeriod, 'seconds');
    let multiplierWei = await rewardsContract.multiplier();
    let multiplier = Utils.fromDecimals(multiplierWei).toFixed();

    return {
      vestingPeriod,
      vestingStart,
      vestingEnd,
      reward,
      claimSoFar,
      claimable,
      multiplier,
      admin
    }
  }
  catch (err) {
    console.log('err', err)
    return null
  }
}

const getDefaultStakingByAddress = async (option: Staking) => {
  try {
    let wallet = Wallet.getInstance();
    let stakingAddress = option.address;
    let rewards = option.rewards;
    let hasRewardAddress = rewards.length && rewards[0].address;

    let timeIsMoney = new TimeIsMoneyContracts.TimeIsMoney(wallet, stakingAddress);

    let minimumLockTime = await timeIsMoney.minimumLockTime();
    let maximumTotalLock = await timeIsMoney.maximumTotalLock();

    let startOfEntryPeriod = '0';
    try {
      startOfEntryPeriod = (await timeIsMoney.startOfEntryPeriod()).toFixed();
    } catch (err) { }
    let tokenAddress = await timeIsMoney.token();
    let stakingDecimals = 18 - getTokenDecimals(tokenAddress.toLocaleLowerCase());
    let endOfEntryPeriod = (await timeIsMoney.endOfEntryPeriod()).toFixed();
    let perAddressCapWei = await timeIsMoney.perAddressCap();
    let maxTotalLock = Utils.fromDecimals(maximumTotalLock).shiftedBy(stakingDecimals).toFixed();
    let perAddressCap = Utils.fromDecimals(perAddressCapWei).shiftedBy(stakingDecimals).toFixed();

    let obj = {
      minLockTime: minimumLockTime.toNumber(),
      maxTotalLock,
      startOfEntryPeriod: parseInt(startOfEntryPeriod) * 1000,
      endOfEntryPeriod: parseInt(endOfEntryPeriod) * 1000,
      perAddressCap,
      lockTokenAddress: tokenAddress,
    };

    if (hasRewardAddress) {
      let rewardsData: any[] = [];
      let promises = rewards.map(async (reward, index) => {
        return new Promise<void>(async (resolve, reject) => {
          let rewardsContract, admin, multiplier, initialReward, rewardTokenAddress, vestingPeriod, vestingStartDate, claimDeadline;
          try {
            if (reward.isCommonStartDate) {
              rewardsContract = new TimeIsMoneyContracts.RewardsCommonStartDate(wallet, reward.address);
            } else {
              rewardsContract = new TimeIsMoneyContracts.Rewards(wallet, reward.address);
            }
            admin = await rewardsContract.admin();
            let multiplierWei = await rewardsContract.multiplier();
            multiplier = Utils.fromDecimals(multiplierWei).toFixed();
            initialReward = Utils.fromDecimals(await rewardsContract.initialReward()).toFixed();
            rewardTokenAddress = await rewardsContract.token();
            vestingPeriod = (await rewardsContract.vestingPeriod()).toNumber();
            claimDeadline = (await rewardsContract.claimDeadline()).toNumber();
            if (reward.isCommonStartDate) {
              vestingStartDate = (await (rewardsContract as any).vestingStartDate()).toNumber();
            }
            let rewardAmount = new BigNumber(multiplier).multipliedBy(maxTotalLock).toFixed();
            rewardsData.push({
              ...reward,
              rewardTokenAddress,
              multiplier,
              initialReward,
              vestingPeriod,
              admin,
              vestingStartDate,
              rewardAmount,
              index
            });
          } catch {}
          resolve();
        })
      });
      await Promise.all(promises);
      return {
        ...option,
        ...obj,
        rewards: rewardsData.sort((a, b) => a.index - b.index)
      }
    }
    else {
      return obj;
    }
  }
  catch (err) {
    console.log('err', err);
    return null;
  }
}

const getStakingOptionExtendedInfoByAddress = async (option: Staking) => {
  try {
    let wallet = Wallet.getInstance();
    let chainId = wallet.chainId;
    let stakingAddress = option.address;
    let rewardOptions = option.rewards;
    let currentAddress = wallet.address;
    let hasRewardAddress = rewardOptions.length > 0 && rewardOptions[0].address;

    let timeIsMoney = new TimeIsMoneyContracts.TimeIsMoney(wallet, stakingAddress);

    let totalCreditWei = await timeIsMoney.getCredit(currentAddress);
    let lockAmountWei = await timeIsMoney.lockAmount(currentAddress);
    let withdrawn = await timeIsMoney.withdrawn(currentAddress);
    let totalCredit = Utils.fromDecimals(totalCreditWei).toFixed();
    let lockAmount = Utils.fromDecimals(lockAmountWei).toFixed();
    let stakeQty = withdrawn ? '0' : lockAmount;
    let mode = '';

    if (new BigNumber(totalCredit).gt(0) && hasRewardAddress) {
      mode = 'Claim';
    }
    else if (new BigNumber(stakeQty).isZero()) {
      mode = 'Stake';
    }
    else {
      mode = 'Unlock';
    }

    let minimumLockTime = await timeIsMoney.minimumLockTime();
    let releaseTime = await timeIsMoney.releaseTime(currentAddress);
    let maximumTotalLock = await timeIsMoney.maximumTotalLock();
    let totalLockedWei = await timeIsMoney.totalLocked();

    let startOfEntryPeriod = '0';
    try {
      startOfEntryPeriod = (await timeIsMoney.startOfEntryPeriod()).toFixed();
    } catch (err) { }

    let endOfEntryPeriod = (await timeIsMoney.endOfEntryPeriod()).toFixed();
    let perAddressCapWei = await timeIsMoney.perAddressCap();
    let lockedTime = releaseTime.minus(minimumLockTime);

    let maxTotalLock = Utils.fromDecimals(maximumTotalLock).toFixed();
    let totalLocked = Utils.fromDecimals(totalLockedWei).toFixed();
    let perAddressCap = Utils.fromDecimals(perAddressCapWei).toFixed();
    let tokenAddress = await timeIsMoney.token();

    let obj = {
      mode: mode,
      minLockTime: minimumLockTime.toNumber(),
      releaseTime: releaseTime.toNumber() * 1000,
      lockedTime: lockedTime.toNumber() * 1000,
      maxTotalLock: maxTotalLock,
      totalLocked: totalLocked,
      totalCredit: totalCredit,
      stakeQty: stakeQty,
      withdrawn: withdrawn,
      lockAmount: lockAmount,
      startOfEntryPeriod: parseInt(startOfEntryPeriod) * 1000,
      endOfEntryPeriod: parseInt(endOfEntryPeriod) * 1000,
      perAddressCap: perAddressCap,
      tokenAddress: tokenAddress.toLowerCase(),
    };

    if (hasRewardAddress) {
      let rewardsData: any[] = [];
      let promises = rewardOptions.map(async (option, index) => {
        return new Promise<void>(async (resolve, reject) => {
          try {
            let referencePair = '';
            if (option.rewardTokenAddress && tokenPriceAMMReference[chainId]) {
              referencePair = tokenPriceAMMReference[chainId][option.rewardTokenAddress.toLowerCase()];
            }
            if (mode === 'Claim') {
              let stakingRewardInfo = await getStakingRewardInfoByAddresses(option, currentAddress, releaseTime.toNumber());
              if (stakingRewardInfo) {
                let vestedReward = new BigNumber(totalCredit).times(stakingRewardInfo.multiplier).minus(stakingRewardInfo.claimSoFar).toFixed();
                rewardsData.push({
                  ...option,
                  ...stakingRewardInfo,
                  referencePair,
                  vestedReward,
                  index
                });
              }
            } else {
              let rewardsContract;
              if (option.isCommonStartDate) {
                rewardsContract = new TimeIsMoneyContracts.RewardsCommonStartDate(wallet, option.address);
              } else {
                rewardsContract = new TimeIsMoneyContracts.Rewards(wallet, option.address);
              }
              let admin = await rewardsContract.admin();
              let multiplierWei = await rewardsContract.multiplier();
              let multiplier = Utils.fromDecimals(multiplierWei).toFixed();
              rewardsData.push({
                ...option,
                referencePair,
                multiplier,
                admin,
                index
              });
            }
          }
          catch (error) { }
          resolve();
        })
      });
      await Promise.all(promises);
      return {
        ...obj,
        rewardsData: rewardsData.sort((a, b) => a.index - b.index)
      }
    }
    else {
      return obj;
    }
  }
  catch (err) {
    console.log('err', err);
    return null;
  }
}

const composeCampaignInfoList = async (stakingCampaignInfoList: StakingCampaign[], addDurationOption: (options: any[], defaultOption: Staking) => void) => {
  let campaigns: any[] = [];
  for (let i = 0; i < stakingCampaignInfoList.length; i++) {
    let stakingCampaignInfo = stakingCampaignInfoList[i];
    let durationOptionsWithExtendedInfo: any[] = [];
    let durationOptions = stakingCampaignInfo.stakings;
    for (let j = 0; j < durationOptions.length; j++) {
      let durationOption = durationOptions[j];
      addDurationOption(durationOptionsWithExtendedInfo, durationOption);
    }

    let campaignObj: any = {
      ...stakingCampaignInfo,
      campaignName: stakingCampaignInfo.customName,
      campaignDesc: stakingCampaignInfo.customDesc,
      getTokenURL: stakingCampaignInfo.getTokenURL,
      options: durationOptionsWithExtendedInfo,
    }
    if (durationOptionsWithExtendedInfo.length > 0) {
      const extendedInfo = durationOptionsWithExtendedInfo[0];
      const admin = extendedInfo.rewards && extendedInfo.rewards[0] ? extendedInfo.rewards[0].admin : '';
      campaignObj = {
        ...campaignObj,
        admin,
        campaignStart: extendedInfo.startOfEntryPeriod / 1000,
        campaignEnd: extendedInfo.endOfEntryPeriod / 1000,
        tokenAddress: extendedInfo.tokenAddress?.toLowerCase()
      }
    }
    campaigns.push(campaignObj);
  }
  return campaigns;
}

const getAllCampaignsInfo = async (stakingInfo: { [key: number]: StakingCampaign[] }, imported?: boolean) => {
  let wallet = Wallet.getInstance();
  let chainId = wallet.chainId;
  let stakingCampaignInfoList = stakingInfo[chainId];
  if (!stakingCampaignInfoList) return [];

  let optionExtendedInfoMap: any = {};
  let allCampaignOptions = (stakingCampaignInfoList as any).flatMap((v: any) => v.stakings);
  let promises = allCampaignOptions.map(async (option: any, index: any) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        let optionExtendedInfo;
        if (imported) {
          optionExtendedInfo = await getDefaultStakingByAddress(option);
        } else {
          optionExtendedInfo = await getStakingOptionExtendedInfoByAddress(option);
        }
        if (optionExtendedInfo) optionExtendedInfoMap[option.address] = optionExtendedInfo;
      }
      catch (error) { }
      resolve();
    })
  });
  await Promise.all(promises);

  let campaigns: any[] = await composeCampaignInfoList(stakingCampaignInfoList, (options: any[], defaultOption: Staking) => {
    if (defaultOption.address && optionExtendedInfoMap[defaultOption.address]) {
      options.push({
        ...defaultOption,
        ...optionExtendedInfoMap[defaultOption.address]
      })
    }
  })
  if (imported) {
    return campaigns.map(campaign => {
      return {
        ...campaign,
        stakings: campaign.options,
      }
    })
  }
  return campaigns;
}

const getStakingTotalLocked = async (stakingAddress: string) => {
  let wallet = Wallet.getInstance();
  let timeIsMoney = new TimeIsMoneyContracts.TimeIsMoney(wallet, stakingAddress);
  let totalLockedWei = await timeIsMoney.totalLocked();
  let totalLocked = Utils.fromDecimals(totalLockedWei).toFixed();
  return totalLocked;
}

const getWETH = (wallet: Wallet): ITokenObject => {
  let wrappedToken = WETHByChainId[wallet.chainId];
  return wrappedToken;
};

const getLPObject = async (pairAddress: string) => {
  try {
    let wallet = Wallet.getInstance();
    const WETH = getWETH(wallet);
    let pair = new Contracts.OSWAP_Pair(wallet, pairAddress);

    let getSymbol = await pair.symbol();
    let getName = await pair.name();
    let getDecimal = await pair.decimals();
    let token0 = (await pair.token0()).toLowerCase();
    let token1 = (await pair.token1()).toLowerCase();

    return {
      address: pairAddress.toLowerCase(),
      decimals: getDecimal.toFixed(),
      name: getName,
      symbol: getSymbol,
      token0: token0 == WETH.address!.toLowerCase() ? '' : token0,
      token1: token1 == WETH.address!.toLowerCase() ? '' : token1
    };
  } catch (e) {
    return null;
  }
}

const getLPBalance = async (pairAddress: string) => {
  let wallet = Wallet.getInstance();
  let pair = new Contracts.OSWAP_Pair(wallet, pairAddress);
  let balance = await pair.balanceOf(wallet.address);
  return Utils.fromDecimals(balance).toFixed();
}

const getVaultObject = async (vaultAddress: string) => {
  try {
    let wallet = Wallet.getInstance();
    let vault = new CrossChainContracts.OSWAP_BridgeVault(wallet, vaultAddress);
    let symbol = await vault.symbol();
    let name = await vault.name();
    let decimals = await vault.decimals();
    let tokenMap = getTokenMap();
    let assetToken = tokenMap[vaultAddress.toLowerCase()]
    return {
        address: vaultAddress.toLowerCase(),
        decimals,
        name,
        symbol,
        assetToken
    }
  } catch {
    return {}
  } 
}

const getVaultBalance = async (vaultAddress: string) => {
  let wallet = Wallet.getInstance();
  let vault = new CrossChainContracts.OSWAP_BridgeVault(wallet, vaultAddress);
  let balance = await vault.balanceOf(wallet.address);
  return Utils.fromDecimals(balance).toFixed();
}

const getERC20RewardCurrentAPR = async (rewardOption: any, lockedToken: any, lockedDays: number) => {
  let wallet = Wallet.getInstance();
  let chainId = wallet.chainId;
  const usdPeggedTokenAddress = USDPeggedTokenAddressMap[chainId];
  if (!usdPeggedTokenAddress) return '';

  let APR = "";
  let rewardPrice = await getTokenPrice(rewardOption.rewardTokenAddress);
  let lockedTokenPrice = await getTokenPrice(lockedToken.address);
  if (!rewardPrice || !lockedTokenPrice) return null;
  APR = new BigNumber(rewardOption.multiplier).times(new BigNumber(rewardPrice).times(365)).div(new BigNumber(lockedTokenPrice).times(lockedDays)).toFixed();
  return APR
}

const getReservesByPair = async (pairAddress: string, tokenInAddress?: string, tokenOutAddress?: string) => {
  let wallet = Wallet.getInstance();
  let reserveObj;
  let pair = new Contracts.OSWAP_Pair(wallet, pairAddress);
  let reserves = await pair.getReserves();
  if (!tokenInAddress || !tokenOutAddress) {
    tokenInAddress = await pair.token0();
    tokenOutAddress = await pair.token1();
  }

  if (tokenInAddress && tokenOutAddress) {
    if (new BigNumber(tokenInAddress.toLowerCase()).lt(tokenOutAddress.toLowerCase())) {
      reserveObj = {
        reserveA: reserves._reserve0,
        reserveB: reserves._reserve1
      };
    } else {
      reserveObj = {
        reserveA: reserves._reserve1,
        reserveB: reserves._reserve0
      };
    }
  }
  return reserveObj;
}

const getLPRewardCurrentAPR = async (rewardOption: any, lpObject: any, lockedDays: number) => {
  if (!lpObject) return '';
  let wallet = Wallet.getInstance();
  const WETH = getWETH(wallet);
  const WETHAddress = WETH.address!;
  let chainId = wallet.chainId;
  const usdPeggedTokenAddress = USDPeggedTokenAddressMap[chainId];
  if (!usdPeggedTokenAddress) return '';

  let APR = '';
  if (lpObject.token0.toLowerCase() == usdPeggedTokenAddress.toLowerCase() || lpObject.token1.toLowerCase() == usdPeggedTokenAddress.toLowerCase()) {
    let rewardPrice = '';
    if (rewardOption.APROption && rewardOption.APROption == 1) {
      let WETH9PriceFeedAddress = ToUSDPriceFeedAddressesMap[chainId][WETHAddress.toLowerCase()];
      if (!WETH9PriceFeedAddress) return '';

      let aggregator = new UtilsContracts.EACAggregatorProxy(wallet, WETH9PriceFeedAddress);
      let WETH9LatestRoundData = await aggregator.latestRoundData();
      let WETH9PriceFeedDecimals = await aggregator.decimals();
      let WETH9USDPrice = new BigNumber(WETH9LatestRoundData.answer).shiftedBy(-WETH9PriceFeedDecimals).toFixed();

      let rewardReserves = await getReservesByPair(rewardOption.referencePair, WETHAddress, rewardOption.rewardTokenAddress);
      if (!rewardReserves) return '';
      rewardPrice = new BigNumber(rewardReserves.reserveA).div(rewardReserves.reserveB).times(WETH9USDPrice).toFixed();
    }
    else {
      let rewardReserves = await getReservesByPair(rewardOption.referencePair, usdPeggedTokenAddress, rewardOption.rewardTokenAddress);
      if (!rewardReserves) return '';
      rewardPrice = new BigNumber(rewardReserves.reserveA).div(rewardReserves.reserveB).toFixed();
    }

    let lpTokenOut = lpObject.token0.toLowerCase() == usdPeggedTokenAddress.toLowerCase() ? lpObject.token1 : lpObject.token0;
    let lockedLPReserves = await getReservesByPair(lpObject.address, usdPeggedTokenAddress, lpTokenOut);
    if (!lockedLPReserves) return '';
    let lockedLPPrice = new BigNumber(lockedLPReserves.reserveA).div(lockedLPReserves.reserveB).times(2).toFixed();
    APR = new BigNumber(rewardOption.multiplier).times(new BigNumber(rewardPrice).times(365)).div(new BigNumber(lockedLPPrice).times(lockedDays)).toFixed();
  }
  else {
    if (!lpObject.token0 || !lpObject.token1 || lpObject.token0.toLowerCase() == WETHAddress.toLowerCase() || lpObject.token1.toLowerCase() == WETHAddress.toLowerCase()) {
      let WETH9PriceFeedAddress = ToUSDPriceFeedAddressesMap[chainId][WETHAddress.toLowerCase()];
      if (!WETH9PriceFeedAddress) return '';

      let aggregator = new UtilsContracts.EACAggregatorProxy(wallet, WETH9PriceFeedAddress);
      let WETH9LatestRoundData = await aggregator.latestRoundData();
      let WETH9PriceFeedDecimals = await aggregator.decimals();
      let WETH9USDPrice = new BigNumber(WETH9LatestRoundData.answer).shiftedBy(-WETH9PriceFeedDecimals).toFixed();

      let rewardReserves = await getReservesByPair(rewardOption.referencePair, WETHAddress, rewardOption.rewardTokenAddress);
      if (!rewardReserves) return '';
      let rewardPrice = new BigNumber(rewardReserves.reserveA).div(rewardReserves.reserveB).times(WETH9USDPrice).toFixed();

      let otherTokenAddress = (!lpObject.token0 || lpObject.token0.toLowerCase() == WETHAddress.toLowerCase()) ? lpObject.token1 : lpObject.token0;
      let lockedLPReserves = await getReservesByPair(lpObject.address, WETHAddress, otherTokenAddress);
      if (!lockedLPReserves) return '';
      let otherTokenPrice = new BigNumber(lockedLPReserves.reserveA).div(lockedLPReserves.reserveB).times(WETH9USDPrice).toFixed();

      let lockedLPPrice = new BigNumber(otherTokenPrice).times(2).div(new BigNumber(otherTokenPrice).div(WETH9USDPrice).sqrt()).toFixed();
      APR = new BigNumber(rewardOption.multiplier).times(new BigNumber(rewardPrice).times(365)).div(new BigNumber(lockedLPPrice).times(lockedDays)).toFixed();
    }
  }
  return APR;
}

const getVaultRewardCurrentAPR = async (rewardOption: any, vaultObject: any, lockedDays: number) => {
  let APR = '';
  try {
    let rewardPrice = await getTokenPrice(rewardOption.rewardTokenAddress)
    let assetTokenPrice = await getTokenPrice(vaultObject.assetToken.address);
    if (!assetTokenPrice || !rewardPrice) return '';
    let wallet = Wallet.getInstance();
    let vault = new CrossChainContracts.OSWAP_BridgeVault(wallet, vaultObject.address);
    let vaultTokenTotalSupply = await vault.totalSupply();
    let lpAssetBalance = await vault.lpAssetBalance();
    let lpToAssetRatio = new BigNumber(lpAssetBalance).div(vaultTokenTotalSupply).toFixed();
    let VaultTokenPrice = new BigNumber(assetTokenPrice).times(lpToAssetRatio).toFixed()
    APR = new BigNumber(rewardOption.multiplier).times(new BigNumber(rewardPrice).times(365)).div(new BigNumber(VaultTokenPrice).times(lockedDays)).toFixed();
  } catch {}
  return APR; 
}

const withdrawToken = async (contractAddress: string, callback?: any) => {
  if (!contractAddress) return;
  try {
    let wallet = Wallet.getInstance();
    let timeIsMoney = new TimeIsMoneyContracts.TimeIsMoney(wallet, contractAddress);
    let receipt = await timeIsMoney.withdraw(true);
    return receipt;
  } catch (error) {
    if (callback) {
      callback(error);
    }
  }
}

const claimToken = async (contractAddress: string, callback?: any) => {
  if (!contractAddress) return;
  try {
    let wallet = Wallet.getInstance();
    let rewards = new TimeIsMoneyContracts.Rewards(wallet, contractAddress);
    let receipt = await rewards.claim();
    return receipt;
  } catch (error) {
    if (callback) {
      callback(error);
    }
  }
}

const lockToken = async (token: ITokenObject, amount: string, contractAddress: string) => {
  if (!token) return;
  if (!contractAddress) return;
  let wallet = Wallet.getInstance();
  let decimals = typeof token.decimals === 'object' ? (token.decimals as BigNumber).toNumber() : token.decimals;
  let tokenAmount = Utils.toDecimals(amount, decimals);
  let timeIsMoney = new TimeIsMoneyContracts.TimeIsMoney(wallet, contractAddress);
  let receipt = await timeIsMoney.lock(tokenAmount);
  return receipt;
}

const getApprovalModelAction = (contractAddress: string, options: IERC20ApprovalEventOptions) => {
  const approvalOptions = {
    ...options,
    spenderAddress: contractAddress
  };
  const approvalModel = new ERC20ApprovalModel(approvalOptions);
  let approvalModelAction = approvalModel.getAction();
  return approvalModelAction;
}

const deployCampaign = async (campaign: StakingCampaign, callback?: any) => {
  let listTransferReward: any[] = [];
  let wallet = getWallet();
  let result: StakingCampaign = { ...campaign, stakings: [] };
  try {
    for (const staking of campaign.stakings) {
      let timeIsMoney = new TimeIsMoneyContracts.TimeIsMoney(wallet);
      let stakingResult: Staking;
      const { campaignStart, campaignEnd, admin } = campaign;
      const { lockTokenAddress, maxTotalLock, minLockTime, perAddressCap } = staking;
      let timeIsMoneyToken = new Erc20(wallet, lockTokenAddress);
      let timeIsMoneyTokenDecimals = await timeIsMoneyToken.decimals;
      const stakingAddress = await timeIsMoney.deploy({
        token: lockTokenAddress,
        maximumTotalLock: Utils.toDecimals(maxTotalLock, timeIsMoneyTokenDecimals),
        minimumLockTime: minLockTime,
        startOfEntryPeriod: campaignStart,
        endOfEntryPeriod: campaignEnd,
        perAddressCap: Utils.toDecimals(perAddressCap, timeIsMoneyTokenDecimals),
      });
      let rewardResult: Reward[] = [];
      for (const reward of staking.rewards) {
        const { multiplier, rewardTokenAddress, initialReward, vestingPeriod, isCommonStartDate, vestingStartDate, claimDeadline } = reward;
        let rewardToken = new Erc20(wallet, rewardTokenAddress);
        let rewardTokenDecimals = await rewardToken.decimals;
        let params: any = {
            timeIsMoney: timeIsMoney.address,
            token: rewardTokenAddress,
            multiplier: Utils.toDecimals(multiplier, rewardTokenDecimals),
            initialReward: Utils.toDecimals(initialReward, rewardTokenDecimals),
            vestingPeriod,
            claimDeadline,
            admin,
        }
        let rewardsContract;
        if (isCommonStartDate) {
          rewardsContract = new TimeIsMoneyContracts.RewardsCommonStartDate(wallet);
          params = {
            ...params,
            vestingStartDate,
          }
        } else {
          rewardsContract = new TimeIsMoneyContracts.Rewards(wallet);
        }
        const rewardAddress = await rewardsContract.deploy(params);
        rewardResult.push({ ...reward, address: rewardAddress });
        listTransferReward.push({
          to: rewardAddress,
          value: Utils.toDecimals(maxTotalLock.multipliedBy(multiplier), rewardTokenDecimals),
          rewardTokenAddress,
        });
      };
      stakingResult = { ...staking, address: stakingAddress, rewards: rewardResult };
      result.stakings.push(stakingResult);
    }
  } catch (error) {
    if (callback) {
      callback(error, null);
    }
    return null;
  }
  try {
    // Transfer max reward from the admin to the reward contract.
    for (const transferReward of listTransferReward) {
      const { to, value, rewardTokenAddress } = transferReward;
      const contract = new Contracts.OSWAP_ERC20(wallet, rewardTokenAddress);
      await contract.transfer_send({ to, value });
    }
  } catch (error) {
    if (callback) {
      callback(error, null);
    }
  }
  return result;
}

export {
  getAllCampaignsInfo,
  getStakingTotalLocked,
  getLPObject,
  getLPBalance,
  getVaultObject,
  getVaultBalance,
  getERC20RewardCurrentAPR,
  getLPRewardCurrentAPR,
  getVaultRewardCurrentAPR,
  withdrawToken,
  claimToken,
  lockToken,
  getApprovalModelAction,
  deployCampaign,
}