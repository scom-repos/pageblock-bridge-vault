import { Button, Input, Container, VStack, HStack, customElements, ControlElement, Module, Label } from '@ijstech/components';
import { formatNumber, ITokenObject, IERC20ApprovalAction, limitInputNumber } from '@staking/global';
import { getTokenMap, getTokenBalances, isWalletConnected, setTokenBalances, LockTokenType, setStakingStatus } from '@staking/store';
import { Result } from '../../result';
import {
  lockToken,
  withdrawToken,
  getLPObject,
  getLPBalance,
  getVaultObject,
  getVaultBalance,
  getApprovalModelAction,
  getStakingTotalLocked,
} from '@staking/staking-utils';
import {
  getLockedTokenObject,
  getLockedTokenSymbol,
} from '../common';
import { BigNumber } from '@ijstech/eth-wallet';
import './manage-stake.css';
import moment from 'moment';
import { isThemeApplied } from '../../config';

enum CurrentMode {
  STAKE,
  UNLOCK
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['manage-stake']: ControlElement;
    }
  }
};

@customElements('manage-stake')
export class ManageStake extends Module {
  private stakingInfo: any = {};
  private address: string;
  private lockedTokenObject: any = {};
  private maxQty = 0;
  private availableQty = '0';
  private balance = '0';
  private perAddressCap = '0';
  private stakeQty = '0';
  private tokenSymbol = '';
  private currentMode = CurrentMode.STAKE;
  private tokenBalances: any = {};
  private tokenMap: any = {};
  private lbToken: Label;
  private wrapperInputAmount: HStack;
  private inputAmount: Input;
  private btnApprove: Button;
  private btnStake: Button;
  private btnUnstake: Button;
  private btnMax: Button;
  private stakingResult: Result;
  private approvalModelAction: IERC20ApprovalAction;
  public onRefresh: any;

  constructor(parent?: Container, options?: any) {
    super(parent, options);
  }

  setData = (data: any) => {
    this.address = data.address;
    this.stakingInfo = data;
    this.onSetupPage(isWalletConnected());
  }

  getBalance = () => {
    return this.balance;
  }

  needToBeApproval = () => {
    return this.btnApprove && this.btnApprove.visible;
  }

  get actionKey() {
    if (this.currentMode === CurrentMode.STAKE) {
      return `#btn-stake-${this.address}`;
    }
    return `#btn-unstake-${this.address}`;
  }

  private showResultMessage = (result: Result, status: 'warning' | 'success' | 'error', content?: string | Error) => {
    if (!result) return;
    let params: any = { status };
    if (status === 'success') {
      params.txtHash = content;
    } else {
      params.content = content;
    }
    result.message = { ...params };
    result.showModal();
  }

  private onApproveToken = async () => {
    this.showResultMessage(this.stakingResult, 'warning', `Approve ${this.tokenSymbol}`);
    this.approvalModelAction.doApproveAction(this.lockedTokenObject, this.inputAmount.value);
  }

  private onStake = async () => {
    this.currentMode = CurrentMode.STAKE;
    this.approvalModelAction.doPayAction();
  }

  private onUnstake = () => {
    this.currentMode = CurrentMode.UNLOCK;
    this.approvalModelAction.doPayAction();
  }

  private onInputAmount = () => {
    if (!this.inputAmount.enabled) return;
    this.currentMode = CurrentMode.STAKE;
    limitInputNumber(this.inputAmount, this.lockedTokenObject?.decimals || 18);
    this.approvalModelAction.checkAllowance(this.lockedTokenObject, this.inputAmount.value);
  }

  private setMaxBalance = () => {
    this.currentMode = CurrentMode.STAKE;
    this.inputAmount.value = BigNumber.min(this.availableQty, this.balance, this.perAddressCap).toFixed();
    limitInputNumber(this.inputAmount, this.lockedTokenObject?.decimals || 18);
    this.approvalModelAction.checkAllowance(this.lockedTokenObject, this.inputAmount.value);
  };

  private renderStakingInfo = async (info: any) => {
    if (!info || !Object.keys(info).length) {
      this.btnApprove.visible = false;
      if (!isWalletConnected()) {
        this.btnMax.visible = false;
        this.inputAmount.enabled = false;
      }
      return;
    };
    const colorButton = isThemeApplied ? info.customColorButton : undefined;
    const colorText = isThemeApplied ? info.customColorText || '#fff' : '#fff';
    this.btnApprove.background = { color: `${colorButton} !important` };
    this.btnStake.background = { color: `${colorButton} !important` };
    this.btnUnstake.background = { color: `${colorButton} !important` };
    this.btnMax.background = { color: `${colorButton} !important` };
    this.lbToken.font = { color: colorText };
    this.btnStake.id = `btn-stake-${this.address}`;
    this.btnUnstake.id = `btn-unstake-${this.address}`;
    this.inputAmount.id = `input-${this.address}`;
    let lpTokenData: any = {};
    let vaultTokenData: any = {};
    const { tokenAddress, lockTokenType, mode } = info;
    if (tokenAddress && mode === 'Stake') {
      if (lockTokenType == LockTokenType.LP_Token) {
        lpTokenData = {
          'object': await getLPObject(tokenAddress),
          'balance': await getLPBalance(tokenAddress)
        }
      } else if (lockTokenType == LockTokenType.VAULT_Token) {
        vaultTokenData = {
          'object': await getVaultObject(tokenAddress),
          'balance': await getVaultBalance(tokenAddress)
        }
      }
    }
    const tokenInfo = {
      tokenAddress: tokenAddress,
      lpToken: lpTokenData,
      vaultToken: vaultTokenData
    }
    this.lockedTokenObject = getLockedTokenObject(info, tokenInfo, this.tokenMap);
    const defaultDecimalsOffset = 18 - (this.lockedTokenObject?.decimals || 18);
    const symbol = getLockedTokenSymbol(info, this.lockedTokenObject);
    this.tokenSymbol = symbol;
    this.perAddressCap = new BigNumber(info.perAddressCap).shiftedBy(defaultDecimalsOffset).toFixed();
    this.maxQty = new BigNumber(info.maxTotalLock).shiftedBy(defaultDecimalsOffset).toNumber();
    this.stakeQty = new BigNumber(info.stakeQty).shiftedBy(defaultDecimalsOffset).toFixed();
    const totalLocked = new BigNumber(info.totalLocked).shiftedBy(defaultDecimalsOffset);
    this.availableQty = new BigNumber(this.maxQty).minus(totalLocked).toFixed();
    this.btnApprove.visible = false;
    // Unstake
    if ((CurrentMode as any)[mode.toUpperCase()] !== CurrentMode.STAKE) {
      this.approvalModelAction.checkAllowance(this.lockedTokenObject, this.stakeQty);
      this.btnStake.visible = false;
      this.wrapperInputAmount.visible = false;
      this.btnUnstake.visible = true;
    } else {
      this.btnStake.visible = true;
      this.wrapperInputAmount.visible = true;
      this.btnUnstake.visible = false;
    }
    // Stake
    if (tokenAddress && mode === 'Stake') {
      if (lockTokenType == LockTokenType.ERC20_Token) {
        await setTokenBalances();
        let balances = getTokenBalances();
        this.tokenBalances = Object.keys(balances).reduce((accumulator: any, key) => {
          accumulator[key.toLowerCase()] = balances[key];
          return accumulator;
        }, {});
        this.balance = this.tokenBalances[tokenAddress] || '0';
      } else if (lockTokenType == LockTokenType.LP_Token) {
        this.balance = new BigNumber(lpTokenData.balance || 0).shiftedBy(defaultDecimalsOffset).toFixed();
      } else if (lockTokenType == LockTokenType.VAULT_Token) {
        this.balance = new BigNumber(vaultTokenData.balance || 0).shiftedBy(defaultDecimalsOffset).toFixed();
      }
      this.btnMax.visible = true;
      this.lbToken.caption = symbol;
    }
    this.updateEnableInput();
  }

  private onSetupPage = async (connected: boolean) => {
    if (!connected) {
      this.btnStake.enabled = false;
      this.btnUnstake.enabled = false;
      this.btnApprove.visible = false;
      this.inputAmount.enabled = false;
      this.renderStakingInfo(null);
      return;
    }
    this.tokenMap = getTokenMap();
    await this.initApprovalModelAction();
    await this.renderStakingInfo(this.stakingInfo);
  }

  private updateEnableInput = async () => {
    if (this.stakingInfo?.mode !== 'Stake') return;
    const totalLocked = await getStakingTotalLocked(this.address);
    const activeStartTime = this.stakingInfo ? this.stakingInfo.startOfEntryPeriod : 0;
    const activeEndTime = this.stakingInfo ? this.stakingInfo.endOfEntryPeriod : 0;
    const lockedTokenDecimals = this.lockedTokenObject?.decimals || 18;
    const defaultDecimalsOffset = 18 - lockedTokenDecimals;
    const optionQty = new BigNumber(this.stakingInfo.maxTotalLock).minus(totalLocked).shiftedBy(defaultDecimalsOffset);
    const isStarted = moment(activeStartTime).diff(moment()) <= 0;
    const isClosed = moment(activeEndTime).diff(moment()) <= 0;
    const enabled = (isStarted && !(optionQty.lte(0) || isClosed));
    this.inputAmount.enabled = enabled;
    this.btnMax.enabled = enabled && new BigNumber(this.balance).gt(0);
  }

  async initApprovalModelAction() {
    this.approvalModelAction = getApprovalModelAction(this.address, {
      sender: this,
      payAction: async () => {
        this.showResultMessage(this.stakingResult, 'warning', `${this.currentMode === CurrentMode.STAKE ? 'Stake' : 'Unlock'} ${this.tokenSymbol}`);
        if (this.currentMode === CurrentMode.STAKE) {
          lockToken(this.lockedTokenObject, this.inputAmount.value, this.address);
        } else {
          withdrawToken(this.address);
        }
      },
      onToBeApproved: async (token: ITokenObject) => {
        if (new BigNumber(this.inputAmount.value).lte(BigNumber.min(this.availableQty, this.balance, this.perAddressCap))) {
          this.btnApprove.caption = `Approve ${token.symbol}`;
          this.btnApprove.visible = true;
          this.btnApprove.enabled = true;
        } else {
          this.btnApprove.visible = false;
        }
        this.btnStake.enabled = false;
        this.btnUnstake.enabled = false;
      },
      onToBePaid: async (token: ITokenObject) => {
        this.btnApprove.visible = false;
        const isClosed = moment(this.stakingInfo?.endOfEntryPeriod || 0).diff(moment()) <= 0;
        if (this.currentMode === CurrentMode.STAKE) {
          const amount = new BigNumber(this.inputAmount.value);
          if (amount.gt(this.balance)) {
            this.btnStake.caption = 'Insufficient Balance';
            this.btnStake.enabled = false;
            return;
          }
          this.btnStake.caption = 'Stake';
          if (amount.isNaN() || amount.lte(0) || amount.gt(BigNumber.min(this.availableQty, this.balance, this.perAddressCap))) {
            this.btnStake.enabled = false;
          } else {
            this.btnStake.enabled = !isClosed;
          }
        }
        this.btnUnstake.enabled = this.stakingInfo.mode !== 'Stake' && new BigNumber(this.stakeQty).gt(0);
      },
      onApproving: async (token: ITokenObject, receipt?: string) => {
        if (receipt) {
          this.showResultMessage(this.stakingResult, 'success', receipt);
          this.btnApprove.caption = `Approving`;
          this.btnApprove.enabled = false;
          this.btnApprove.rightIcon.visible = true;
          this.btnMax.enabled = false;
          this.inputAmount.enabled = false;
        }
      },
      onApproved: async (token: ITokenObject) => {
        await setTokenBalances();
        await this.updateEnableInput();
        this.btnApprove.rightIcon.visible = false;
        this.btnApprove.visible = false;
      },
      onApprovingError: async (token: ITokenObject, err: Error) => {
        this.showResultMessage(this.stakingResult, 'error', err);
        this.btnApprove.rightIcon.visible = false;
        this.btnMax.enabled = new BigNumber(this.balance).gt(0);
        this.inputAmount.enabled = true;
      },
      onPaying: async (receipt?: string) => {
        if (receipt) {
          this.showResultMessage(this.stakingResult, 'success', receipt);
          this.inputAmount.enabled = false;
          this.btnMax.enabled = false;
          if (this.currentMode === CurrentMode.STAKE) {
            this.btnStake.caption = 'Staking';
            this.btnStake.rightIcon.visible = true;
            setStakingStatus(this.actionKey, true, 'Staking');
            this.btnUnstake.enabled = false;
          } else {
            this.btnUnstake.caption = 'Unstaking';
            this.btnUnstake.rightIcon.visible = true;
            setStakingStatus(this.actionKey, true, 'Unstaking');
            this.btnStake.enabled = false;
          }
        }
      },
      onPaid: async () => {
        const caption = this.currentMode === CurrentMode.STAKE ? 'Unstake' : 'Stake';
        if (this.onRefresh) {
          await setTokenBalances();
          await this.onRefresh();
          setStakingStatus(this.actionKey, false, caption);
        }
        if (this.currentMode === CurrentMode.STAKE) {
          this.btnStake.caption = 'Stake';
          this.btnStake.rightIcon.visible = false;
        } else {
          this.btnUnstake.caption = 'Unstake';
          this.btnUnstake.rightIcon.visible = false;
        }
        await this.updateEnableInput();
        this.inputAmount.value = '';
        this.btnStake.enabled = false;
        this.btnUnstake.enabled = this.stakingInfo.mode !== 'Stake' && new BigNumber(this.stakeQty).gt(0);
      },
      onPayingError: async (err: Error) => {
        await this.updateEnableInput();
        const caption = this.currentMode === CurrentMode.STAKE ? 'Stake' : 'Unstake';
        if (this.currentMode === CurrentMode.STAKE) {
          this.btnStake.caption = 'Stake';
          this.btnStake.rightIcon.visible = false;
        } else {
          this.btnUnstake.caption = 'Unstake';
          this.btnUnstake.rightIcon.visible = false;
        }
        this.showResultMessage(this.stakingResult, 'error', err);
        setStakingStatus(this.actionKey, false, caption);
      }
    });
  }

  init() {
    super.init();
    this.stakingResult = new Result();
    this.appendChild(this.stakingResult);
  }

  render() {
    return (
      <i-panel class="staking-manage-stake">
        <i-hstack gap={10} verticalAlignment="center" horizontalAlignment="center">
          <i-hstack id="wrapperInputAmount" gap={4} width={280} height={36} padding={{ right: 8 }} background={{ color: '#232B5A' }} border={{ radius: 8 }} verticalAlignment="center" horizontalAlignment="space-between">
            <i-input
              id="inputAmount"
              inputType="number"
              placeholder="0.0"
              class="staking-token-input"
              width="100%"
              height="100%"
              onChanged={() => this.onInputAmount()}
            />
            <i-hstack gap={4} verticalAlignment="center">
              <i-button
                id="btnMax"
                caption="Max"
                enabled={false}
                class="btn-os"
                width={45}
                minHeight={25}
                onClick={() => this.setMaxBalance()}
              />
              <i-label id="lbToken" font={{ size: '14px' }} class="opacity-50" />
            </i-hstack>
          </i-hstack>
          <i-hstack gap={10} width="calc(100% - 290px)">
            <i-button
              id="btnApprove"
              caption="Approve"
              enabled={false}
              visible={false}
              width="100%"
              minHeight={36}
              border={{ radius: 12 }}
              rightIcon={{ spin: true, visible: false, fill: '#fff' }}
              class="btn-os"
              onClick={() => this.onApproveToken()}
            />
            <i-button
              id="btnStake"
              caption="Stake"
              enabled={false}
              width="100%"
              minHeight={36}
              border={{ radius: 12 }}
              rightIcon={{ spin: true, visible: false, fill: '#fff' }}
              class="btn-os"
              onClick={() => this.onStake()}
            />
            <i-button
              id="btnUnstake"
              caption="Unstake"
              enabled={false}
              width="100%"
              minHeight={36}
              border={{ radius: 12 }}
              rightIcon={{ spin: true, visible: false, fill: '#fff' }}
              class="btn-os"
              onClick={() => this.onUnstake()}
            />
          </i-hstack>
        </i-hstack>
      </i-panel>
    )
  }
}
