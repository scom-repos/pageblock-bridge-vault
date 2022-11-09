import {
  application
} from '@ijstech/components';
import { getWalletOptions, walletList } from './walletList';
import { Wallet, WalletPlugin } from '@ijstech/eth-wallet';
import { getCurrentChainId, getDefaultChainId, setCurrentChainId, updateAllTokenBalances } from '@staking/store';
import { EventId } from '../global';

export function isWalletConnected() {
  const wallet = Wallet.getInstance();
  return wallet.isConnected;
}

export async function connectWallet(walletPlugin: WalletPlugin, eventHandlers?: { [key: string]: Function }) {
  // let walletProvider = localStorage.getItem('walletProvider') || '';
  let wallet = Wallet.getInstance();
  const walletOptions = getWalletOptions();
  let providerOptions = walletOptions[walletPlugin];
  if (!wallet.chainId) {
    wallet.chainId = getDefaultChainId();
  }
  await wallet.connect(walletPlugin, {
    onAccountChanged: async (account: string) => {
      if (eventHandlers && eventHandlers.accountsChanged) {
        eventHandlers.accountsChanged(account);
      }
      const connected = !!account;
      if (connected) {
        localStorage.setItem('walletProvider', Wallet.getInstance()?.clientSideProvider?.walletPlugin || '');
        if (wallet.chainId !== getCurrentChainId()) {
          setCurrentChainId(wallet.chainId);
          application.EventBus.dispatch(EventId.chainChanged, wallet.chainId);
        }
        await updateAllTokenBalances();
      }
      application.EventBus.dispatch(EventId.IsWalletConnected, connected);
    },
    onChainChanged: async (chainIdHex: string) => {
      //console.log('onChainChanged', chainIdHex);
      const chainId = Number(chainIdHex);

      if (eventHandlers && eventHandlers.chainChanged) {
        eventHandlers.chainChanged(chainId);
      }
      setCurrentChainId(chainId);
      await updateAllTokenBalances();
      application.EventBus.dispatch(EventId.chainChanged, chainId);
    }
  }, providerOptions)
  return wallet;
}

export async function switchNetwork(chainId: number) {
  if (!isWalletConnected()) {
    setCurrentChainId(chainId);
    Wallet.getInstance().chainId = chainId;
    application.EventBus.dispatch(EventId.chainChanged, chainId);
    return;
  }
  const wallet = Wallet.getInstance();
  if (wallet?.clientSideProvider?.walletPlugin === WalletPlugin.MetaMask) {
    await wallet.switchNetwork(chainId);
  }
}

export async function logoutWallet() {
  const wallet = Wallet.getInstance();
  await wallet.disconnect();
  localStorage.setItem('walletProvider', '');
  application.EventBus.dispatch(EventId.IsWalletDisconnected, false);
}

export const hasWallet = function () {
  let hasWallet = false;
  for (let wallet of walletList) {
    if (Wallet.isInstalled(wallet.name)) {
      hasWallet = true;
      break;
    } 
  }
  return hasWallet;
}

export const hasMetaMask = function () {
  return Wallet.isInstalled(WalletPlugin.MetaMask);
}

export const truncateAddress = (address: string) => {
  if (address === undefined || address === null) return '';
  return address.substr(0, 6) + '...' + address.substr(-4);
}