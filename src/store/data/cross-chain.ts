  import { getNetworkInfo } from "..";

  const baseRoute = 'https://route.openswap.xyz';
  
  const crossChainNativeTokenList:{[chainId: number]:{address:string,decimals:number,symbol:string,name:string,isNative:boolean,wethAddress:string}} = {
    42: { address: "ETH", decimals: 18, symbol: "ETH", name: 'ETH', isNative: true, wethAddress: "0xd0A1E359811322d97991E03f863a0C30C2cF029C" },
    56: { address:"BNB", decimals:18, symbol:"BNB", name: 'BNB', isNative: true, wethAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"},
    97: { address: "BNB", decimals: 18, symbol: "BNB", name: 'BNB', isNative: true, wethAddress: "0xae13d989dac2f0debff460ac112a837c89baa7cd" },
    43113: { address: "AVAX", decimals: 18, symbol: "AVAX", name: 'AVAX', isNative: true, wethAddress: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c" },
    43114: { address: "AVAX", decimals: 18, symbol: "AVAX", name: 'AVAX', isNative: true, wethAddress: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7" },
    80001: {address:"MATIC",decimals:18,symbol:"MATIC", name: 'MATIC', isNative: true, wethAddress: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"}
  }
  
  enum VaultType {
    Project = 'Project',
    Exchange = 'Exchange',
  };

  interface BridgeVaultConstant {
    tokenAddress: string,
    vaultRegistryAddress: string,
    vaultAddress: string,
    vaultDecimals?: number,
    softCap?: number,
    fixedStakingApr?: string
  }

  interface BridgeVaultGroup {
    name: string;
    vaultType: VaultType;
    vaults: { [key: string]: BridgeVaultConstant };
    deprecated?: boolean;
  }
  
  const getBridgeVaultVersion = (chainId :number):string => {
    let network = getNetworkInfo(chainId);
    const isTestnet = !network.isDisabled && network.isCrossChainSupported && network.isTestnet;
    // Testnet
    if (isTestnet) return '0.1.5';
    // Mainnet
    return '1.1.1';
  }

  const BridgeVaultGroupList: BridgeVaultGroup[] = [
    {
      "name": "USDT",
      "vaultType": VaultType.Exchange,
      "vaults": {
        "42": {
          "tokenAddress": "0xDcdAFd9461c2df544F6E2165481E8174e45fEbD8",
          "vaultRegistryAddress": "0x9580C567daC0EC4D05bB64a078e6fCCDc2103B64",
          "vaultAddress": "0x07578ec965a54bfBdAA83db7261F442d315eC6c2",
          "softCap": 100000,
        },
        "56": {
          "tokenAddress": "0x55d398326f99059fF775485246999027B3197955",
          "vaultRegistryAddress": "0x1026deABF37C452F8aF8672cC9B9181fab709154",
          "vaultAddress": "0xE9CAAFD124831562423FE129b02e938Cc33B45E2",
          "vaultDecimals":18,
          "softCap": 100000,
        },
        "97": {
          "tokenAddress": "0x29386B60e0A9A1a30e1488ADA47256577ca2C385",
          "vaultRegistryAddress": "0xf2B6E0585282ffd10573a566C650f8b57cB7298F",
          "vaultAddress": "0x5d2510192A6F6C46154603c1132499d800BB9785",
          "softCap": 100000,
        },
        "43113": {
          "tokenAddress": "0xb9C31Ea1D475c25E58a1bE1a46221db55E5A7C6e",
          "vaultRegistryAddress": "0x7076d6314aCe8830b07B66D716CceF581629E728",
          "vaultAddress": "0xe9645952f275521875a11EB122E9eF2649162977",
          "softCap": 100000,
        },
        "43114": {
          "tokenAddress": "0xc7198437980c041c805A1EDcbA50c1Ce5db95118",
          "vaultRegistryAddress": "0x2e102E6E9546433aB9c2a32ddd6eAFDfE987910B",
          "vaultAddress": "0x55570d7EcAeFF86a6425815def25447A8b14A222",
          "vaultDecimals":18,
          "softCap": 100000,
        },
        "80001": {
          "tokenAddress": "0xF6Bf7c1213fdCe4AA92e7c91865cD586891B9cF6",
          "vaultRegistryAddress": "0x8E5fcD46C6Dc74180C89572bAd8822cC0Eff3622",
          "vaultAddress": "0x90Dd6EF27dBB77CD55Da6818414F3A3185f6a7f6",
          "softCap": 100000,
        },
      }
    },
    {
      "name": "OSWAP",
      "vaultType": VaultType.Project,
      "vaults": {
        "42": {
          "tokenAddress": "0x28A6a9079fA8e041179cD13F4652af2B315b6fd8",
          "vaultRegistryAddress": "0x911567173f33377784a934DC071a999F1dA4bd0C",
          "vaultAddress": "0x13c682d5F11927c24022a743B0510A7C23649667",
          "softCap": 100000,
        },
        "56": {
          "tokenAddress": "0xb32aC3C79A94aC1eb258f3C830bBDbc676483c93",
          "vaultRegistryAddress": "0xd8f7a9E2cE096670A27238487a62e1e000334F81",
          "vaultAddress": "0x65d6d677e102C2758224a797f7fb2b60DBeA8635",
          "softCap": 100000,
          "vaultDecimals":18
        },
        "97": {
          "tokenAddress": "0x45eee762aaeA4e5ce317471BDa8782724972Ee19",
          "vaultRegistryAddress": "0xA7d49e365C458324bB8F0dEcB9b7292EFAC397a7",
          "vaultAddress": "0x64A3B88cf51d1cc4de145DCf3981B8D8072c3d06",
          "softCap": 100000,
        },
        "43113": {
          "tokenAddress": "0x78d9D80E67bC80A11efbf84B7c8A65Da51a8EF3C",
          "vaultRegistryAddress": "0xc8fC05a8e9D6dA2FF6395202b28eEbA4e5B21004",
          "vaultAddress": "0xc6bBF3DdC2eef54cCB667962Fa37733e0D3CE510",
          "fixedStakingApr": "18.25",
          "softCap": 100000,
        },
        "43114": {
          "tokenAddress": "0xb32aC3C79A94aC1eb258f3C830bBDbc676483c93",
          "vaultRegistryAddress": "0x39dfbdF2a8b4719D009F3CEE1d000899FeD8B00a",
          "vaultAddress": "0x8Af3e8596acE65D9c1EDE6d5356a34eAb46a46f5",
          "vaultDecimals":18,
          "softCap": 100000,
        },
        "80001": {
          "tokenAddress": "0xA9d603421e2777b8BEa685272611A01fF3bc6523",
          "vaultRegistryAddress": "0x4c0f2C0acb7a5728a75EE35820Ed14e98F24e8b9",
          "vaultAddress": "0x2ED4CE8f09F606ea253bF57c45e83d8BD45Ce572",
          "softCap": 100000,
        },
      }
    },
    {
      // DEPRECATED VAULT
      "name": "OSWAP",
      "deprecated": true,
      "vaultType": VaultType.Project,
      "vaults": {
        "43113": {
          "tokenAddress": "0x78d9D80E67bC80A11efbf84B7c8A65Da51a8EF3C",
          "vaultRegistryAddress": "0xc8fC05a8e9D6dA2FF6395202b28eEbA4e5B21004",
          "vaultAddress": "0x67565ACa8abcc5C94b3E934AdC5C6965b3ed7F89"
        },
        "43114": {
          "tokenAddress": "0xb32aC3C79A94aC1eb258f3C830bBDbc676483c93",
          "vaultRegistryAddress": "",
          "vaultAddress": "0x547C8B68Cb36410FFDceE6Ad4bA0c64FD21085Bb",
        },
      }
    },
  ]
  
  const ChainTrollRegistryMap: {[chainId:number]:{registryAddress:string, isMainChain: boolean}} = {
    42: {
      registryAddress: '0x152b19e48BB87dE40cFC2bf7FFAF341d4E2A7eD3',
      isMainChain: false
    },
    56: {
      registryAddress: '0xcd050070b53924e1965418d7d940fa2abb4302f3',
      isMainChain: true
    },
    97: {
      registryAddress: '0x3e2Fa653594273c6C908c1702154D4EAcC6Be7c3',
      isMainChain: false
    },
    43113: {
      registryAddress: '0x63A2c470289bb95DCcdc01EaC080491B72702F8a',
      isMainChain: true
    },
    43114: {
      registryAddress: '0x30ab6C6545Ee09caDB78A16489907B50893270D4',
      isMainChain: false
    },
    80001: {
      registryAddress: '0x75008c73440E93bB1331483F8A22149AD2A61Be9',
      isMainChain: false
    }
  }
  
  const CrossChainAddressMap: {[chainId:number]:{wrapperAddress:string}} = {
    42: {
      wrapperAddress: '0x8ad7a50FA4647995126988c7fCEa242Bae2D832F'
    },
    56: {
      wrapperAddress: '0xce194324a8ddaf43e5c00f38593f37c9f21ed297',
    },
    97: {
      wrapperAddress: '0x7D67DBb5DA525eC3455f075BA1211cDe35FC737d'
    },
    43113: {
      wrapperAddress: '0x960C93958caED9622207edd7f77f2D0E57CFd322'
    },
    43114: {
      wrapperAddress: '0xcd050070b53924e1965418d7d940fa2abb4302f3',
    },
    80001: {
      wrapperAddress: '0x788a9036b682AdB247A30Ec3628DE11735B67718'
    }
  }
  
  // Dependent
  const MockOracleMap: {[chainId:number]: {[token:string]: string} }= {
    42: {
      '0x28a6a9079fa8e041179cd13f4652af2b315b6fd8': '0x226021E3582c89eF9a338be069dEcFD43acF0269',  //OSWAP 
      '0xdcdafd9461c2df544f6e2165481e8174e45febd8': '0xEF4Faa48Ee32E2D47503a821eb7E8607D52489AC', //USDT
    },
    56: {
      '0xb32aC3C79A94aC1eb258f3C830bBDbc676483c93': '0xd9df1285e2effbaaa580513b256bd21c041973f7', // OSWAP
      '0x55d398326f99059fF775485246999027B3197955': '0x6979c00cc49e0b5e77a920b25a0e16445b0f665a', // USDT
    },
    97: {
      '0x45eee762aaea4e5ce317471bda8782724972ee19': '0x50C41443c3F05d469644675235249F375a5AA622',  //OSWAP 
      '0x29386b60e0a9a1a30e1488ada47256577ca2c385': '0x6af1CdfBe372C922405C0CD9003CE7758250E8E5', //USDT
    },
    43113: {
      '0x78d9d80e67bc80a11efbf84b7c8a65da51a8ef3c': '0xe4dfc0E5772405483F71FE1c234290d62C102e02', //OSWAP
      '0xb9c31ea1d475c25e58a1be1a46221db55e5a7c6e': '0xA79D4C012AaeafD45630af1298DC3e18596fF081', //USDT
    },
    43114:{
      '0xb32aC3C79A94aC1eb258f3C830bBDbc676483c93': '0xd9df1285e2effbaaa580513b256bd21c041973f7', // OSWAP
      '0xc7198437980c041c805A1EDcbA50c1Ce5db95118': '0x6979c00cc49e0b5e77a920b25a0e16445b0f665a', // USDT
    },
    80001: {
      '0xA9d603421e2777b8BEa685272611A01fF3bc6523' : '0x7d564Ca1A9fb5a6D2275e62A97333AdaA5d2Cbe6', //OSWAP
      '0xf6bf7c1213fdce4aa92e7c91865cd586891b9cf6' : '0xc2817961e17E24853856cC355E902C5D1B8f07E9', //USDT
    }  
  }
  
  enum VaultOrderStatus {
    pending,
    executed,
    requestCancel,
    approvedCancel,
    cancelled,
    expired
  }
  
  enum TrollType {
    NotSpecified,
    SuperTroll,
    GeneralTroll
  }
  
  const TrollTypeStringEnumMap: { [index: string]: TrollType } = {
    "NotSpecified": TrollType.NotSpecified,
    "SuperTroll": TrollType.SuperTroll,
    "GeneralTroll": TrollType.GeneralTroll,
  }
  
  enum TrollStatus {
    Active,
    Inactive
  }
  
  enum VaultActionType {
    Stake,
    RequestUnstake,
    Unstake
  };
  
  enum TrollManagementActionType {
    StakeNFT,
    UnstakeNFT,
    StakeBond,
    UnstakeBond
  };

export {
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
}
  