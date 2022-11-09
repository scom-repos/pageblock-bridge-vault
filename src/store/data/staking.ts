import { BigNumber } from "@ijstech/eth-wallet";

const baseUrl = 'https://openswap.xyz/#';

enum LockTokenType {
  ERC20_Token,
  LP_Token,
  VAULT_Token
}

const LockTokenTypeList = [
  { name: 'ERC20_Token', value: LockTokenType.ERC20_Token },
  { name: 'LP_Token', value: LockTokenType.LP_Token },
  { name: 'VAULT_Token', value: LockTokenType.VAULT_Token },
]

interface StakingCampaign {
  //custom
  chainId?: number,
  customName: string,
  customDesc?: string,
  customLogo?: string,
  getTokenURL?: string,
  campaignStart: BigNumber, //unix
  campaignEnd: BigNumber, //unix
  showContractLink?: boolean,
  admin: string, // can only withdraw remaining fund after claimDeadline.
  customColorCampaign?: string, // 1 campaign main color
  customColorBackground?: string, // 2 campign background
  customColorStakingBackground?: string, // 3 staking background
  customColorButton?: string, // 4 staking button
  customColorText?: string, // 5 text
  customColorTimeBackground? :string, //6 string end countdown background

  stakings: Staking[],
}

interface RewardNeeded {
  value: BigNumber,
  tokenAddress: string,
}

interface Staking {
  //contract
  address?: string,
  lockTokenAddress: string,
  minLockTime: BigNumber, //in second 
  perAddressCap: BigNumber,
  maxTotalLock: BigNumber,

  //custom
  customDesc?: string,
  lockTokenType: LockTokenType,
  decimalsOffset?: number,
  totalRewardAmount?: RewardNeeded[], // total reward needed

  rewards: Reward[]
}

interface Reward {
  //contract
  address?: string,
  rewardTokenAddress: string,
  multiplier: BigNumber, //lockAmount * multiplier = rewardAmount
  rewardAmount?: BigNumber, // reward needed
  initialReward: BigNumber, // 0 <= initialReward <= 1; lockAmount * initialReward = initialRewardAmount;
  vestingPeriod: BigNumber, // in second
  claimDeadline: BigNumber, //unix
  admin: string, // can only withdraw remaining fund after claimDeadline.
  isCommonStartDate?: boolean,
  vestingStartDate?: BigNumber //unix
}

// const StakingCampaignByChainId:{[chainId:number]:StakingCampaign[]} = {
//   56:[
//     {
//       customName: 'OpenSwap 1st Anniversary<br>Birthday Staking Campaign',
//       customDesc: 'Wow, Time Flies.. Let\'s Go Bridge Soon<br>Stake Now!',
//       getTokenURL: `${baseUrl}/swap`,
//       campaignStart: new BigNumber("1663074000"), //unix
//       campaignEnd: new BigNumber("1664283600"), //unix
//       stakings: [{
//         address: "0xd2eD1a54Ea2c0621DfE3EB3375a53230138EA0F3",
//         lockTokenAddress: "0xb32ac3c79a94ac1eb258f3c830bbdbc676483c93",
//         minLockTime: new BigNumber("1209600"), //in second, 14 days
//         perAddressCap: new BigNumber("3000"),
//         maxTotalLock: new BigNumber("100000"),
//         customDesc: "Stake OSWAP, Earn OSWAP",
//         lockTokenType: LockTokenType.ERC20_Token,
//         rewards: [{
//           address: '0x0616bf20ceEd4D18cD6cc7C327c21a681A5C3271',
//           rewardTokenAddress: '0xb32aC3C79A94aC1eb258f3C830bBDbc676483c93',
//           multiplier: new BigNumber("0.03"), 
//           initialReward: new BigNumber("1"),
//           vestingPeriod: new BigNumber("0"),
//           claimDeadline: new BigNumber("253402214400"),
//           admin: "0x9F7E5cC944d15Df211d959A270C61C1acb10ae5c",
//         }]  
//       },
//       {
//         address: '0x3826C16625771f670e5a56271B2aB2b8e12B9e20',
//         lockTokenAddress: "0xb32ac3c79a94ac1eb258f3c830bbdbc676483c93",
//         minLockTime: new BigNumber("2592000"), //in second, 30 days
//         perAddressCap: new BigNumber("3000"),
//         maxTotalLock: new BigNumber("100000"),
//         customDesc: "Stake OSWAP, Earn OSWAP",
//         lockTokenType: LockTokenType.ERC20_Token,
//         rewards: [{
//           address: '0x83ff3E08C999684FC936cD12859Bdd6B0EbE5E7f',
//           rewardTokenAddress: '0xb32aC3C79A94aC1eb258f3C830bBDbc676483c93',
//           multiplier: new BigNumber("0.1"), 
//           initialReward: new BigNumber("1"),
//           vestingPeriod: new BigNumber("0"),
//           claimDeadline: new BigNumber("253402214400"),
//           admin: "0x9F7E5cC944d15Df211d959A270C61C1acb10ae5c",
//         }]  
//       }]
//     }
//   ],
//   43113: [
//     {
//       customName: 'Testing 1',
//       customDesc: 'line 1<br>line 2',
//       getTokenURL: `${baseUrl}/swap`,
//       campaignStart: new BigNumber("1663074000"), //unix
//       campaignEnd: new BigNumber("1664283600"), //unix
//       stakings: [{
//         address: "0xcBb388017101f4a7c8710ef01415aF4F4F726E19",
//         lockTokenAddress: "0x78d9D80E67bC80A11efbf84B7c8A65Da51a8EF3C",
//         minLockTime: new BigNumber("300"), //in second, 5 mins.
//         perAddressCap: new BigNumber("100000"),
//         maxTotalLock: new BigNumber("100000"),
//         customDesc: "Stake OSWAP, Earn OSWAP",
//         lockTokenType: LockTokenType.ERC20_Token,
//         rewards: [{
//           address: '0xA4B199b1B4C7C4Ef2d10E1eA11A9DE7F60e84164',
//           rewardTokenAddress: '0x78d9D80E67bC80A11efbf84B7c8A65Da51a8EF3C',
//           multiplier: new BigNumber("0.03"), 
//           initialReward: new BigNumber("1"),
//           vestingPeriod: new BigNumber("0"),
//           claimDeadline: new BigNumber("253402214400"),
//           admin: "0x18a6Ab8742BD46d27B9823c9767522f48ebF26b3",
//         }]  
//       },
//       {
//         address: '0xf9dA3743c57ec64505F27B9822BaFB0f8ab5E90d',
//         lockTokenAddress: "0x78d9D80E67bC80A11efbf84B7c8A65Da51a8EF3C",
//         minLockTime: new BigNumber("86400"), //in second, 1 day.
//         perAddressCap: new BigNumber("100000"),
//         maxTotalLock: new BigNumber("100000"),
//         customDesc: "Stake OSWAP, Earn OSWAP",
//         lockTokenType: LockTokenType.ERC20_Token,
//         rewards: [{
//           address: '0x8820b70EC48B259D83C6E4BB95E5e9955C39F670',
//           rewardTokenAddress: '0x78d9D80E67bC80A11efbf84B7c8A65Da51a8EF3C',
//           multiplier: new BigNumber("0.1"), 
//           initialReward: new BigNumber("1"),
//           vestingPeriod: new BigNumber("0"),
//           claimDeadline: new BigNumber("253402214400"),
//           admin: "0x18a6Ab8742BD46d27B9823c9767522f48ebF26b3",
//         }]  
//       }]
//     }
//   ]
// }


const USDPeggedTokenAddressMap: { [key: number]: string } = {
  56: '0xe9e7cea3dedca5984780bafc599bd69add087d56', //BUSD
  97: '0xDe9334C157968320f26e449331D6544b89bbD00F', //BUSD
  43113: '0xb9c31ea1d475c25e58a1be1a46221db55e5a7c6e', //USDT.e
  43114: '0xc7198437980c041c805a1edcba50c1ce5db95118', //USDT.e
}

export {
  StakingCampaign,
  Staking,
  Reward,
  RewardNeeded,
  LockTokenType,
  LockTokenTypeList,
  USDPeggedTokenAddressMap
}
