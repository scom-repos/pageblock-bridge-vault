const InfuraId = "adc596bf88b648e2a8902bc9093930c5";
const Networks = [
  {
    name: "Ethereum",
    chainId: 1,
    img: "img/network/ethereumNetwork.svg",
    rpc: `https://mainnet.infura.io/v3/${InfuraId}`,
    explorerName: "Etherscan",
    explorerTxUrl: "https://etherscan.io/tx/",
    explorerAddressUrl: "https://etherscan.io/address/"
  },
  {
    name: "Cronos Mainnet",
    chainId: 25,
    img: "img/network/cronosMainnet.svg",
    isDisabled: true
  },
  {
    name: "Kovan Test Network",
    chainId: 42,
    img: "img/network/ethereumNetwork.svg",
    rpc: `https://kovan.infura.io/v3/${InfuraId}`,
    isCrossChainSupported: true,
    explorerName: "Etherscan",
    explorerTxUrl: "https://kovan.etherscan.io/tx/",
    explorerAddressUrl: "https://kovan.etherscan.io/address/",
    isTestnet: true
  },    
  {
    name: "Binance Smart Chain",
    chainId: 56,
    img: "img/network/bscMainnet.svg",
    rpc: "https://bsc-dataseed.binance.org/",
    isMainChain: true,
    isCrossChainSupported: true,
    explorerName: "BSCScan",
    explorerTxUrl: "https://bscscan.com/tx/",
    explorerAddressUrl: "https://bscscan.com/address/"
  },
  {
    name: "Polygon",
    chainId: 137,
    img: "img/network/polygon.svg",
    explorerName: "PolygonScan",
    explorerTxUrl: "https://polygonscan.com/tx/",
    explorerAddressUrl: "https://polygonscan.com/address/"
  },    
  {
    name: "Fantom Opera",
    chainId: 250,
    img: "img/network/fantom-ftm-logo.svg",
    rpc: "https://rpc.ftm.tools/",
    explorerName: "FTMScan",
    explorerTxUrl: "https://ftmscan.com/tx/",
    explorerAddressUrl: "https://ftmscan.com/address/"
  },    
  {
    name: "BSC Testnet",
    chainId: 97,
    img: "img/network/bscMainnet.svg",
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    isCrossChainSupported: true,
    explorerName: "BSCScan",
    explorerTxUrl: "https://testnet.bscscan.com/tx/",
    explorerAddressUrl: "https://testnet.bscscan.com/address/",
    isTestnet: true
  },
  {
    name: "Cronos Mainnet",
    chainId: 338,
    img: "img/network/cronosMainnet.svg",
    isDisabled: true
  },  
  {
    name: "Amino Testnet",
    chainId: 31337,
    img: "img/network/animoTestnet.svg",
    isDisabled: true,
    isTestnet: true
  },
  {
    name: "Mumbai",
    chainId: 80001,
    img: "img/network/polygon.svg",
    rpc: "https://matic-mumbai.chainstacklabs.com",
    isCrossChainSupported: true,
    explorerName: "PolygonScan",
    explorerTxUrl: "https://mumbai.polygonscan.com/tx/",
    explorerAddressUrl: "https://mumbai.polygonscan.com/address/",
    isTestnet: true
  },    
  {
    name: "Avalanche FUJI C-Chain",
    chainId: 43113,
    img: "img/network/avax.svg",	
    rpc: "https://api.avax-test.network/ext/bc/C/rpc",
    isCrossChainSupported: true,
    isMainChain: true,
    explorerName: "SnowTrace",
    explorerTxUrl: "https://testnet.snowtrace.io/tx/",
    explorerAddressUrl: "https://testnet.snowtrace.io/address/",
    isTestnet: true
  },    
  {
    name: "Avalanche Mainnet C-Chain",
    chainId: 43114,
    img: "img/network/avax.svg",
    rpc: "https://api.avax.network/ext/bc/C/rpc",
    isCrossChainSupported: true,
    explorerName: "SnowTrace",
    explorerTxUrl: "https://snowtrace.io/tx/",
    explorerAddressUrl: "https://snowtrace.io/address/"
  },
  {
    name: "Fantom Testnet",
    chainId: 4002,
    img: "img/network/fantom-ftm-logo.svg",
    rpc: "https://rpc.testnet.fantom.network/",
    explorerName: "FTMScan",
    explorerTxUrl: "https://testnet.ftmscan.com/tx/",
    explorerAddressUrl: "https://testnet.ftmscan.com/address/",
    isDisabled: true,
    isTestnet: true
  },
  {
    name: "AminoX Testnet",
    chainId: 13370,
    img: "img/network/aminoXTestnet.svg",
    isDisabled: true,
    explorerName: "AminoX Explorer",
    explorerTxUrl: "https://aminoxtestnet.blockscout.alphacarbon.network/tx/",
    explorerAddressUrl: "https://aminoxtestnet.blockscout.alphacarbon.network/address/",
    isTestnet: true
  }
]

export {
  InfuraId,
  Networks,
}