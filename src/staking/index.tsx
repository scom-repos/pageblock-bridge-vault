import { Module, Panel, Icon, Button, Label, VStack, HStack, Container, customElements, ControlElement, IEventBus, application, customModule, Modal, Input } from '@ijstech/components';
import { formatNumber, formatDate, registerSendTxEvents, TokenMapType, PageBlock, EventId } from '@staking/global';
import { InfuraId, Networks, getChainId, getTokenMap, getTokenIconPath, viewOnExplorerByAddress, isWalletConnected, getNetworkInfo, setTokenMap, getDefaultChainId, hasWallet, connectWallet, setDataFromSCConfig, setCurrentChainId, tokenSymbol, LockTokenType, getStakingStatus, StakingCampaign, fallBackUrl } from '@staking/store';
import {
	getStakingTotalLocked,
	getLPObject,
	getVaultObject,
	getERC20RewardCurrentAPR,
	getLPRewardCurrentAPR,
	getVaultRewardCurrentAPR,
	claimToken,
	getAllCampaignsInfo,
} from '@staking/staking-utils';
import {
	getLockedTokenObject,
	getLockedTokenSymbol,
	getLockedTokenIconPaths,
} from './common';
import Assets from '@staking/assets';
import moment from 'moment';
import { BigNumber, Wallet, WalletPlugin } from '@ijstech/eth-wallet';
import { Result } from '../result';
import { getTokenUrl, isThemeApplied, maxHeight, maxWidth } from '../config';
import './staking.css';
import { ManageStake } from './manageStake';
import { PanelConfig } from './panelConfig';
import { Contracts } from '@validapp/time-is-money-sdk';

declare global {
	namespace JSX {
		interface IntrinsicElements {
			['i-section-staking']: StakingBlock
		}
	}
}

@customModule
@customElements('i-section-staking')
export class StakingBlock extends Module implements PageBlock {
	private data: any;
	readonly onEdit: () => Promise<void>;
	readonly onConfirm: () => Promise<void>;
	readonly onDiscard: () => Promise<void>;

	private pnlConfig: PanelConfig;
	private $eventBus: IEventBus;
	private loadingElm: Panel;
	private campaigns: any = [];
	private stakingComponent: Panel;
	private stakingLayout: Panel;
	private stakingElm: Panel;
	private noCampaignSection: Panel;
	private stakingResult: Result;
	private manageStakeElm: Panel;
	private listAprTimer: any = [];
	private listActiveTimer: any = [];
	private tokenMap: TokenMapType = {};
	private importFileErrModal: Modal;
  private importFileErr: Label;
	private isImportNewCampaign = false;
	private btnAddNew: Button;
	private btnImportNew: Button;
	private btnImportExisting: Button;

	validateConfig() {

	}

	async getData() {
		return this.data;
	}

	async setData(value: any) {
		this.data = value;
		this.pnlConfig.visible = false;
		this.stakingLayout.visible = true;
		this.onSetupPage(isWalletConnected());
	}

	async getTag() {
		return this.tag;
	}

	async setTag(value: any) {
		this.tag = value;
	}

	async edit() {
		this.pnlConfig.showInputCampaign(!this.data, this.getCampaign());
		this.stakingLayout.visible = false;
		this.pnlConfig.visible = true;
	}

	async confirm() {
		if (this.pnlConfig) {
			this.pnlConfig.onConfirm();
		}
	}

	async discard() {
		this.pnlConfig.visible = false;
		this.stakingLayout.visible = true;
	}

	async config() {

	}

	async onConfigSave(campaign: StakingCampaign) {
		this.data = campaign;
		this.pnlConfig.visible = false;
		this.stakingLayout.visible = true;
		this.onSetupPage(isWalletConnected());
	}

	async onEditCampaign(isNew: boolean, data?: { [key: string]: StakingCampaign[] }) {
		this.pnlConfig.showInputCampaign(isNew, this.getCampaign(data));
		this.stakingLayout.visible = false;
		this.pnlConfig.visible = true;
	}

	private initInputFile = (importFileElm: Label) => {
    importFileElm.caption = '<input type="file" accept=".json" />';
    const inputElm = importFileElm.firstChild?.firstChild as HTMLElement;
    if (inputElm) {
      inputElm.onchange = (event: any) => {
        const reader = new FileReader();
        const files = event.target.files;
        if (!files.length) {
          return;
        }
        const file = files[0];
        reader.readAsBinaryString(file);
        reader.onload = (event) => {
          const { loaded, total } = event;
          const isCompleted = loaded === total;
          if (isCompleted) {
            this.initInputFile(importFileElm);
            this.convertJSONToObj(reader.result);
          }
        }
      }
    }
  }

	private setEnableImportButton = (enabled: boolean) => {
		this.btnAddNew.enabled = enabled;
		this.btnImportNew.enabled = enabled;
		this.btnImportExisting.enabled = enabled;
		this.btnImportExisting.rightIcon.visible = !enabled;
	}

	private convertJSONToObj = async (result: any) => {
    if (!result) this.showImportJsonError('Data is corrupted. No data were recovered.');
		try {
			const obj = JSON.parse(result);
			const length = Object.keys(obj).length;
			const chainId = getChainId();
			const campaignObj = obj[chainId];
			const network = getNetworkInfo(chainId);
			if (!length) {
				this.showImportJsonError('No data found in the imported file.');
			} else if (this.isImportNewCampaign && !campaignObj) {
				this.showImportJsonError(`No data found in ${network?.name} network.`);
			} else {
				if (this.isImportNewCampaign) {
					const data = { [chainId]: [campaignObj[0]] };
					this.onEditCampaign(true, data);
				} else {
					this.setEnableImportButton(false);
					const info: any = await getAllCampaignsInfo(obj, true);
					this.setEnableImportButton(true);
					if (!info || !info.length) {
						this.showImportJsonError(`No data found in ${network?.name} network.`);
					} else {
						this.onEditCampaign(false, { [chainId]: info });
					}
				}
			}
		} catch {
			this.showImportJsonError('Data is corrupted. No data were recovered.');
		}
  }

	private showImportJsonError(message: string) {
    this.importFileErrModal.visible = true;
    this.importFileErr.caption = message;
  }

	private getCampaign(data?: { [key: string]: StakingCampaign[] }) {
		const _data = data ? data : this.data;
		if (_data) {
			const keys = Object.keys(_data);
			let campaigns = [];
			for (const key of keys) {
				const arr = _data[key].map((item: StakingCampaign) => {
					item.chainId = Number(key)
					return item;
				});
				campaigns.push(...arr)
			}
			return campaigns;
		}
		return _data;
	}

	constructor(parent?: Container, options?: ControlElement) {
		super(parent, options);
		this.$eventBus = application.EventBus;
		this.registerEvent();
	}

	private registerEvent = () => {
		this.$eventBus.register(this, EventId.IsWalletConnected, this.onWalletConnect);
		this.$eventBus.register(this, EventId.IsWalletDisconnected, this.onWalletConnect);
		this.$eventBus.register(this, EventId.chainChanged, this.onChainChange);
		this.$eventBus.register(this, EventId.EmitButtonStatus, this.updateButtonStatus);
	}

	private onWalletConnect = async (connected: boolean) => {
		this.onSetupPage(connected);
	}

	private onChainChange = async () => {
		const isConnected = isWalletConnected();
		if (await this.isWalletValid(isConnected)) {
			this.onSetupPage(isConnected);
		}
	}

	private isWalletValid = async (isConnected: boolean) => {
		if (this.data && isConnected) {
			try {
				const wallet = Wallet.getInstance();
				const infoList = this.data[wallet.chainId];
				const stakingAddress = infoList && infoList[0].stakings[0]?.address;
				if (stakingAddress) {
					const timeIsMoney = new Contracts.TimeIsMoney(wallet, stakingAddress);
					await timeIsMoney.getCredit(wallet.address);
				}
				return true;
			} catch {
				return false;
			}
		}
		return false;
	}

	private initWalletData = async () => {
		let accountsChangedEventHandler = async (account: string) => {
			setTokenMap();
		}
		let chainChangedEventHandler = async (hexChainId: number) => {
			setTokenMap();
		}
		const selectedProvider = localStorage.getItem('walletProvider') as WalletPlugin;
		const isValidProvider = Object.values(WalletPlugin).includes(selectedProvider);
		if (!Wallet.getInstance().chainId) {
			Wallet.getInstance().chainId = getDefaultChainId();
		}
		if (hasWallet() && isValidProvider) {
			await connectWallet(selectedProvider, {
				'accountsChanged': accountsChangedEventHandler,
				'chainChanged': chainChangedEventHandler
			});
		}
	}

	private onSetupPage = async (connected: boolean, hideLoading?: boolean) => {
		if (!hideLoading && this.loadingElm) {
			this.loadingElm.visible = true;
		}
		if (!connected || !this.data) {
			await this.renderEmpty();
			return;
		}
		this.campaigns = await getAllCampaignsInfo(this.data);
		await this.renderCampaigns(hideLoading);
		if (!hideLoading && this.loadingElm) {
			this.loadingElm.visible = false;
		}
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

	private onClaim = async (btnClaim: Button, data: any) => {
		this.showResultMessage(this.stakingResult, 'warning', `Claim ${data.rewardSymbol}`);
		const callBack = async (err: any, reply: any) => {
			if (err) {
				this.showResultMessage(this.stakingResult, 'error', err);
			} else {
				this.showResultMessage(this.stakingResult, 'success', reply);
				btnClaim.enabled = false;
				btnClaim.rightIcon.visible = true;
			}
		};

		const confirmationCallBack = async (receipt: any) => {
			await this.onSetupPage(isWalletConnected(), true);
			if (!btnClaim) return;
			btnClaim.rightIcon.visible = false;
			btnClaim.enabled = true;
		};

		registerSendTxEvents({
			transactionHash: callBack,
			confirmation: confirmationCallBack
		});

		claimToken(data.reward.address, callBack);
	}

	private removeTimer = () => {
		for (const timer of this.listAprTimer) {
			clearInterval(timer);
		}
		this.listAprTimer = [];
		for (const timer of this.listActiveTimer) {
			clearInterval(timer);
		}
		this.listActiveTimer = [];
	}

	private getRewardToken = (tokenAddress: string) => {
		return this.tokenMap[tokenAddress] || this.tokenMap[tokenAddress?.toLocaleLowerCase()] || {};
	}

	private getLPToken = (campaign: any, token: string, chainId?: number) => {
		if (campaign.getTokenURL) {
			window.open(campaign.getTokenURL);
		} else {
			window.open(getTokenUrl ? getTokenUrl : `#/swap?chainId=${chainId}&fromToken=BNB&toToken=${token}&fromAmount=1&showOptimizedRoutes=false`);
		}
	}

	init = async () => {
		super.init();
		this.pnlConfig = new PanelConfig();
		this.pnlConfig.visible = false;
		this.pnlConfig.onConfigSave = (campaign: StakingCampaign) => this.onConfigSave(campaign);
		this.pnlConfig.onReset = () => {
			this.pnlConfig.visible = false;
			this.stakingLayout.visible = true;
		}
		this.stakingComponent.appendChild(this.pnlConfig);
		this.stakingResult = new Result();
		this.stakingComponent.appendChild(this.stakingResult);
		this.stakingResult.visible = false;
		this.showResultMessage(this.stakingResult, 'warning', '');
		setTimeout(() => {
			this.stakingResult.closeModal();
			this.stakingResult.visible = true;
		}, 100)
		this.initWalletData();
		setDataFromSCConfig(Networks, InfuraId);
		setCurrentChainId(getDefaultChainId());
		if (!this.data) {
			await this.renderEmpty();
		}
	}

	private updateButtonStatus = async (data: any) => {
		if (data) {
			const { value, key, text } = data;
			const elm = this.stakingElm?.querySelector(key) as Button;
			if (elm) {
				elm.rightIcon.visible = value;
				elm.caption = text;
			}
		}
	}

	private getBtnText = (key: string, text: string) => {
		const data = getStakingStatus(key);
		if (data.value) {
			return data.text;
		}
		return text;
	}

	private initEmptyUI = async () => {
		if (!this.noCampaignSection) {
			this.noCampaignSection = await Panel.create({ height: '100%' });
		}
		const isConnected = isWalletConnected();
		const isBtnShown = !this.data && isConnected;
		let importFileElm: any;
		let onImportCampaign: any;
		let onClose: any;
		if (isBtnShown) {
			importFileElm = await Label.create({ visible: false });
			onImportCampaign = (isNew: boolean) => {
				this.isImportNewCampaign = isNew;
				(importFileElm.firstChild?.firstChild as HTMLElement)?.click();
			}
			onClose = () => {
				this.importFileErrModal.visible = false;
			}
			this.initInputFile(importFileElm);
		}
		this.noCampaignSection.clearInnerHTML();
		this.noCampaignSection.appendChild(
			<i-panel class="no-campaign" height="100%" background={{ color: '#192046' }}>
				<i-vstack gap={10} verticalAlignment="center">
					<i-image url={Assets.fullPath('img/staking/TrollTrooper.svg')} />
					<i-label font={{ color: '#FFFFFF' }} caption={ isConnected ? 'No Campaigns' : 'Please connect with your wallet!' } />
					{
						isBtnShown ? (
							<i-hstack gap={10} margin={{ top: 10 }} verticalAlignment="center" horizontalAlignment="center">
								<i-button id="btnAddNew" maxWidth={220} caption="Add New Campaign" class="btn-os btn-stake" font={{ size: '14px' }} onClick={() => this.onEditCampaign(true)} />
								<i-button id="btnImportNew" maxWidth={220} caption="Import New Campaign" class="btn-os btn-stake" font={{ size: '14px' }} onClick={() => onImportCampaign(true)} />
								<i-button id="btnImportExisting" maxWidth={220} caption="Import Existing Campaign" class="btn-os btn-stake" font={{ size: '14px' }} rightIcon={{ visible: false, spin: true, fill: '#fff' }} onClick={() => onImportCampaign(false)} />
								{ importFileElm }
								<i-modal id="importFileErrModal" maxWidth="100%" width={420} title="Import Campaign Error" closeIcon={{ name: 'times' }}>
									<i-vstack gap={20} margin={{ bottom: 10 }} verticalAlignment="center" horizontalAlignment="center">
										<i-label id="importFileErr" font={{ size: '16px', color: '#fff' }} />
										<i-button caption="Close" class="btn-os btn-stake" width={120} onClick={onClose} />
									</i-vstack>
								</i-modal>
							</i-hstack>
						) : []
					}
				</i-vstack>
			</i-panel>
		);
		this.noCampaignSection.visible = true;
	}

	private renderEmpty = async () => {
		await this.initEmptyUI();
		if (this.stakingElm) {
			this.stakingElm.clearInnerHTML();
			this.stakingElm.appendChild(this.noCampaignSection);
		}
		if (this.loadingElm) {
			this.loadingElm.visible = false;
		}
	}

	private renderCampaigns = async (hideLoading?: boolean) => {
		if (!hideLoading) {
			this.stakingElm.clearInnerHTML();
		}
		this.tokenMap = getTokenMap();
		const chainId = getChainId();
		const network = getNetworkInfo(chainId);
		await this.initEmptyUI();
		this.noCampaignSection.visible = false;
		if (this.campaigns && !this.campaigns.length) {
			this.stakingElm.clearInnerHTML();
			this.stakingElm.appendChild(this.noCampaignSection);
			this.noCampaignSection.visible = true;
			this.removeTimer();
			return;
		}

		const currentAddress = Wallet.getInstance().address;
		let nodeItems: HTMLElement[] = [];
		this.removeTimer();
		const campaigns = [this.campaigns[0]];
		for (let idx = 0; idx < campaigns.length; idx++) {
			const campaign = this.campaigns[idx];
			const colorCampaignLine = isThemeApplied ? campaign.customColorCampaign || '#0000001f' : '#0000001f';
			const colorCampaignText = isThemeApplied ? campaign.customColorCampaign || '#f15e61' : '#f15e61';
			const colorCampaignBackground = isThemeApplied ? campaign.customColorBackground || '#ffffff26' : '#ffffff26';
			const colorStakingBackground = isThemeApplied ? campaign.customColorStakingBackground || '#ffffff07' : '#ffffff07';
			const colorButton = isThemeApplied ? campaign.customColorButton : undefined;
			const colorText = isThemeApplied ? campaign.customColorText || '#fff' : '#fff';
			const colorTimeBackground = isThemeApplied ? campaign.customColorTimeBackground || '#F15E61' : '#F15E61';
			const containerSection = await Panel.create();
			containerSection.id = `campaign-${idx}`;
			const options = campaign.options;
			for (let optIdx = 0; optIdx < options.length; optIdx++) {
				const opt = options[optIdx];
				let lpTokenData: any = {};
				let vaultTokenData: any = {};
				if (opt.tokenAddress) {
					if (opt.lockTokenType == LockTokenType.LP_Token) {
						lpTokenData = {
							'object': await getLPObject(opt.tokenAddress)
						}
					} else if (opt.lockTokenType == LockTokenType.VAULT_Token) {
						vaultTokenData = {
							'object': await getVaultObject(opt.tokenAddress)
						}
					}
				}
				const tokenInfo = {
					tokenAddress: campaign.tokenAddress,
					lpToken: lpTokenData,
					vaultToken: vaultTokenData
				}
				options[optIdx] = {
					...options[optIdx],
					tokenInfo
				}
			}
			const stakingInfo = options ? options[0] : null;
			const lockedTokenObject = getLockedTokenObject(stakingInfo, stakingInfo.tokenInfo, this.tokenMap);
			const lockedTokenSymbol = getLockedTokenSymbol(stakingInfo, lockedTokenObject);
			const lockedTokenIconPaths = getLockedTokenIconPaths(stakingInfo, lockedTokenObject, chainId, this.tokenMap);
			const lockedTokenDecimals = lockedTokenObject?.decimals || 18;
			const defaultDecimalsOffset = 18 - lockedTokenDecimals;
			const activeStartTime = stakingInfo ? stakingInfo.startOfEntryPeriod : 0;
			const activeEndTime = stakingInfo ? stakingInfo.endOfEntryPeriod : 0;
			let isStarted = moment(activeStartTime).diff(moment()) <= 0;
			let isClosed = moment(activeEndTime).diff(moment()) <= 0;
			let totalLocked: any = {};
			const stakingElms: VStack[] = [];
			const optionTimer = { background: { color: colorTimeBackground }, font: { color: colorText } };
			const activeTimerRows: VStack[] = [];
			const activeTimerElms: VStack[] = [];
			const endHours: Label[] = [];
			const endDays: Label[] = [];
			const endMins: Label[] = [];
			const stickerSections: Panel[] = [];
			const stickerLabels: Label[] = [];
			const stickerIcons: Icon[] = [];
			for (let i = 0; i < options.length; i++) {
				stakingElms[i] = await VStack.create({ visible: i === 0 });
				activeTimerRows[i] = await VStack.create({ gap: 2, width: '25%', verticalAlignment: 'center' });
				activeTimerElms[i] = await VStack.create();
				activeTimerRows[i].appendChild(<i-label caption="End Date" font={{ size: '14px', color: colorText }} class="opacity-50" />);
				activeTimerRows[i].appendChild(activeTimerElms[i]);
				endHours[i] = await Label.create(optionTimer);
				endDays[i] = await Label.create(optionTimer);
				endMins[i] = await Label.create(optionTimer);
				endHours[i].classList.add('timer-value');
				endDays[i].classList.add('timer-value');
				endMins[i].classList.add('timer-value');
				activeTimerElms[i].appendChild(
					<i-hstack gap={4} class="custom-timer">
						{endDays[i]}
						<i-label caption="D" class="timer-unit" font={{ color: colorText }} />
						{endHours[i]}
						<i-label caption="H" class="timer-unit" font={{ color: colorText }} />
						{endMins[i]}
						<i-label caption="M" class="timer-unit" font={{ color: colorText }} />
					</i-hstack>
				);

				// Sticker
				stickerSections[i] = await Panel.create({ visible: false });
				stickerLabels[i] = await Label.create();
				stickerIcons[i] = await Icon.create();
				stickerSections[i].classList.add('sticker');
				stickerSections[i].appendChild(
					<i-vstack class="sticker-text">
						{stickerIcons[i]}
						{stickerLabels[i]}
					</i-vstack>
				);
			}

			const onChangeStake = (index: number) => {
				stakingElms.forEach((elm: VStack) => {
					elm.visible = false;
				});
				stakingElms[index].visible = true;
			}

			const setAvailableQty = async () => {
				if (!isWalletConnected()) return;
				let i = 0;
				for (const o of options) {
					const _totalLocked = await getStakingTotalLocked(o.address);
					totalLocked[o.address] = _totalLocked;
					const optionQty = new BigNumber(o.maxTotalLock).minus(_totalLocked).shiftedBy(defaultDecimalsOffset);
					if (o.mode === 'Stake') {
						const keyStake = `#btn-stake-${o.address}`;
						const btnStake = this.querySelector(keyStake) as Button;
						const isStaking = getStakingStatus(keyStake).value;
						if (btnStake) {
							let isValidInput = false;
							const inputElm = this.querySelector(`#input-${o.address}`) as Input;
							if (inputElm) {
								const manageStake = this.querySelector(`#manage-stake-${o.address}`) as ManageStake;
								const inputVal = new BigNumber(inputElm.value || 0);
								isValidInput = inputVal.gt(0) && inputVal.lte(manageStake.getBalance()) && !manageStake?.needToBeApproval();
							}
							btnStake.enabled = !isStaking && isValidInput && (isStarted && !(optionQty.lte(0) || isClosed));
						}
					} else {
						const keyUnstake = `#btn-unstake-${o.address}`;
						const btnUnstake = this.querySelector(keyUnstake) as Button;
						const isUnstaking = getStakingStatus(keyUnstake).value;
						if (btnUnstake) {
							const manageStake = this.querySelector(`#manage-stake-${o.address}`) as ManageStake;
							btnUnstake.enabled = !isUnstaking && o.mode !== 'Stake' && Number(o.stakeQty) != 0 && !manageStake?.needToBeApproval();
						}
					}
					if (isClosed) {
						if (stickerLabels[i].caption !== 'Closed') {
							stickerSections[i].classList.add('closed');
							stickerSections[i].classList.remove('sold-out');
							stickerLabels[i].caption = 'Closed';
							stickerIcons[i].name = 'check-square';
						}
					} else if (optionQty.lte(0)) {
						if (stickerLabels[i].caption !== 'Sold Out') {
							stickerLabels[i].caption = 'Sold Out';
							stickerIcons[i].name = 'star';
							stickerSections[i].classList.add('sold-out');
						}
					} else {
						if (stickerLabels[i].caption !== 'Active') {
							stickerLabels[i].caption = 'Active';
							stickerIcons[i].name = 'star';
						}
					}
					if (!stickerSections[i].visible) {
						stickerSections[i].visible = true;
					}
					i++;
				};
			}

			const setEndRemainingTime = () => {
				isStarted = moment(activeStartTime).diff(moment()) <= 0;
				isClosed = moment(activeEndTime).diff(moment()) <= 0;
				for (let i = 0; i < options.length; i++) {
					activeTimerRows[i].visible = isStarted && !isClosed;
				}
				if (activeEndTime == 0) {
					for (let i = 0; i < options.length; i++) {
						endDays[i].caption = endHours[i].caption = endMins[i].caption = '0';
					}
					if (this.listActiveTimer[idx]) {
						clearInterval(this.listActiveTimer[idx]);
					}
				} else {
					const days = moment(activeEndTime).diff(moment(), 'days');
					const hours = moment(activeEndTime).diff(moment(), 'hours') - days * 24;
					const mins = moment(activeEndTime).diff(moment(), 'minutes') - days * 24 * 60 - hours * 60;
					for (let i = 0; i < options.length; i++) {
						endDays[i].caption = `${days}`;
						endHours[i].caption = `${hours}`;
						endMins[i].caption = `${mins}`;
					}
				}
			}

			const setTimer = () => {
				setEndRemainingTime();
				setAvailableQty();
			}

			setTimer();
			this.listActiveTimer.push(setInterval(setTimer, 2000));

			const stakingsElm = await Promise.all(options.map(async (option: any, optionIdx: number) => {
					const manageStake = new ManageStake();
					manageStake.id = `manage-stake-${option.address}`;
					manageStake.width = '100%';
					manageStake.onRefresh = () => this.onSetupPage(isWalletConnected(), true);
					this.manageStakeElm.clearInnerHTML();
					this.manageStakeElm.appendChild(manageStake);
					manageStake.setData({ ...campaign, ...option });

					const isClaim = option.mode === 'Claim';

					const rewardsData = [option.rewardsData[0]];
					const rewardOptions = !isClaim ? rewardsData : [];
					let aprInfo: any = {};

					const claimStakedRow = await HStack.create({ verticalAlignment: 'center', horizontalAlignment: 'space-between' });
					claimStakedRow.appendChild(<i-label caption="You Staked" font={{ size: '16px', color: colorText }} />);
					claimStakedRow.appendChild(<i-label caption={`${formatNumber(new BigNumber(option.stakeQty).shiftedBy(defaultDecimalsOffset))} ${lockedTokenSymbol}`} font={{ size: '16px', name: 'Montserrat Regular', color: colorText }} />);

					const rowRewards = await VStack.create({ gap: 8, verticalAlignment: 'center' });
					for (let idx = 0; idx < rewardsData.length; idx++) {
						const reward = rewardsData[idx];
						const rewardToken = this.getRewardToken(reward.rewardTokenAddress);
						const rewardTokenDecimals = rewardToken.decimals || 18;
						let decimalsOffset = 18 - rewardTokenDecimals;
						let rewardLockedDecimalsOffset = decimalsOffset;
						if (rewardTokenDecimals !== 18 && lockedTokenDecimals !== 18) {
							rewardLockedDecimalsOffset = decimalsOffset * 2;
						} else if (lockedTokenDecimals !== 18 && rewardTokenDecimals === 18) {
							rewardLockedDecimalsOffset = rewardTokenDecimals - lockedTokenDecimals;
							decimalsOffset = 18 - lockedTokenDecimals;
						}
						const rewardSymbol = rewardToken.symbol || '';
						rowRewards.appendChild(
							<i-hstack horizontalAlignment="space-between">
								<i-label caption={`${rewardSymbol} Locked`} font={{ size: '16px', color: colorText }} />
								<i-label caption={`${formatNumber(new BigNumber(reward.vestedReward || 0).shiftedBy(rewardLockedDecimalsOffset))} ${rewardSymbol}`} font={{ size: '16px', name: 'Montserrat Regular', color: colorText }} />
							</i-hstack>
						);
						// rowRewards.appendChild(
						// 	<i-hstack horizontalAlignment="space-between">
						// 		<i-label caption={`${rewardSymbol} Vesting Start`} font={{ size: '16px', color: colorText }} />
						// 		<i-label caption={reward.vestingStart ? reward.vestingStart.format('YYYY-MM-DD HH:mm:ss') : 'TBC'} font={{ size: '16px', color: colorText }} />
						// 	</i-hstack>
						// );
						// rowRewards.appendChild(
						// 	<i-hstack horizontalAlignment="space-between">
						// 		<i-label caption={`${rewardSymbol} Vesting End`} font={{ size: '16px', color: colorText }} />
						// 		<i-label caption={reward.vestingEnd ? reward.vestingEnd.format('YYYY-MM-DD HH:mm:ss') : 'TBC'} font={{ size: '16px', color: colorText }} />
						// 	</i-hstack>
						// );
						const passClaimStartTime = !(reward.claimStartTime && moment().diff(moment.unix(reward.claimStartTime)) < 0);
						let rewardClaimable = `0 ${rewardSymbol}`;
						if (passClaimStartTime && isClaim) {
							rewardClaimable = `${formatNumber(new BigNumber(reward.claimable).shiftedBy(decimalsOffset))} ${rewardSymbol}`;
						}
						let startClaimingText = '';
						if (!(!reward.claimStartTime || passClaimStartTime) && isClaim) {
							const claimStart = moment.unix(reward.claimStartTime).format('YYYY-MM-DD HH:mm:ss');
							startClaimingText = `(Claim ${rewardSymbol} after ${claimStart})`;
						}
						rowRewards.appendChild(
							<i-hstack horizontalAlignment="space-between">
								<i-label caption={`${rewardSymbol} Claimable`} font={{ size: '16px', color: colorText }} />
								<i-label caption={rewardClaimable} font={{ size: '16px', name: 'Montserrat Regular', color: colorText }} />
								{startClaimingText ? <i-label caption={startClaimingText} font={{ size: '16px', color: colorText }} /> : []}
							</i-hstack>
						);
						const btnClaim = await Button.create({
							rightIcon: { spin: true, fill: colorText, visible: false },
							caption: `Claim ${rewardSymbol}`,
							background: { color: `${colorButton} !important` },
							font: { color: colorText },
							enabled: !(!passClaimStartTime || new BigNumber(reward.claimable).isZero()) && isClaim,
							margin: { left: 'auto', right: 'auto' }
						})
						btnClaim.id = `btnClaim-${idx}-${option.address}`;
						btnClaim.classList.add('btn-os', 'btn-stake');
						btnClaim.onClick = () => this.onClaim(btnClaim, { reward, rewardSymbol });
						rowRewards.appendChild(btnClaim);
					};

					const getAprValue = (rewardOption: any) => {
						if (rewardOption && aprInfo && aprInfo[rewardOption.rewardTokenAddress]) {
							const apr = new BigNumber(aprInfo[rewardOption.rewardTokenAddress]).times(100).toFormat(2, BigNumber.ROUND_DOWN);
							return `${apr}%`;
						}
						return '';
					}

					const durationDays = option.minLockTime / (60 * 60 * 24);
					const _lockedTokenObject = getLockedTokenObject(option, option.tokenInfo, this.tokenMap);
					const _lockedTokenIconPaths = getLockedTokenIconPaths(option, _lockedTokenObject, chainId, this.tokenMap);
					const pathsLength = _lockedTokenIconPaths.length;
					const rewardToken = this.getRewardToken(rewardsData[0].rewardTokenAddress);
					const rewardIconPath = getTokenIconPath(rewardToken, chainId);
					stakingElms[optionIdx].appendChild(
						<i-vstack gap={16} width={maxWidth} height="100%" padding={{ top: 10, bottom: 10, left: 20, right: 20 }} position="relative">
							{ stickerSections[optionIdx] }
							<i-hstack gap={10} width="100%" verticalAlignment="center">
								<i-hstack gap={10} width="50%">
									<i-hstack width={pathsLength === 1 ? 63.5 : 80} position="relative" verticalAlignment="center">
										<i-image width={60} height={60} url={Assets.fullPath(rewardIconPath)} fallbackUrl={fallBackUrl} />
										{
											_lockedTokenIconPaths.map((v: string, idxImg: number) => {
												return <i-image position="absolute" width={28} height={28} bottom={0} left={(idxImg * 20) + 35} url={Assets.fullPath(v)} fallbackUrl={fallBackUrl} />
											})
										}
									</i-hstack>
									<i-vstack gap={2} overflow={{ x: 'hidden' }} verticalAlignment="center">
										<i-label visible={!!campaign.customName} caption={campaign.customName} font={{ size: '20px', name: 'Montserrat Bold', color: colorCampaignText, bold: true }} class="text-overflow" />
										<i-label visible={!!campaign.customDesc} caption={campaign.customDesc} font={{ size: '16px', name: 'Montserrat Regular', color: colorText }} class="opacity-50 text-overflow" />
									</i-vstack>
								</i-hstack>
								{
									await Promise.all(rewardOptions.map(async (rewardOption: any, idx: number) => {
										const lbApr = await Label.create({ font: { size: '40px', name: 'Montserrat Medium', color: '#72F35D' }});
										const lbRate = await Label.create({ font: { size: '16px', name: 'Montserrat Regular', color: colorText }});
										lbApr.classList.add('text-overflow');
										lbRate.classList.add('opacity-50');
										const rewardToken = this.getRewardToken(rewardOption.rewardTokenAddress);
										const rewardTokenDecimals = rewardToken.decimals || 18;
										const decimalsOffset = 18 - rewardTokenDecimals;
										const lockTokenType = option.lockTokenType;
										const rateDesc = `1 ${lockTokenType === LockTokenType.LP_Token ? 'LP' : tokenSymbol(option.lockTokenAddress)} : ${new BigNumber(rewardOption.multiplier).shiftedBy(decimalsOffset).toFixed()} ${tokenSymbol(rewardOption.rewardTokenAddress)}`;
										const updateApr = async () => {
											if (lockTokenType === LockTokenType.ERC20_Token) {
												const apr: any = await getERC20RewardCurrentAPR(rewardOption, lockedTokenObject, durationDays);
												if (!isNaN(parseFloat(apr))) {
													aprInfo[rewardOption.rewardTokenAddress] = apr;
												}
											} else if (lockTokenType === LockTokenType.LP_Token) {
												if (rewardOption.referencePair) {
													aprInfo[rewardOption.rewardTokenAddress] = await getLPRewardCurrentAPR(rewardOption, option.tokenInfo?.lpToken?.object, durationDays);
												}
											} else {
												aprInfo[rewardOption.rewardTokenAddress] = await getVaultRewardCurrentAPR(rewardOption, option.tokenInfo?.vaultToken?.object, durationDays);
											}
											const aprValue = getAprValue(rewardOption);
											lbApr.caption = `APR ${aprValue}`;
											lbRate.caption = rateDesc;
										}
										updateApr();
										this.listAprTimer.push(setInterval(updateApr, 10000));
										const aprValue = getAprValue(rewardOption);
										lbApr.caption = `APR ${aprValue}`;
										lbRate.caption = rateDesc;
										return <i-vstack gap={2} verticalAlignment="center">
											{lbApr}
											{lbRate}
										</i-vstack>
									}))
								}
							</i-hstack>
							<i-hstack width="100%" verticalAlignment="center">
								<i-vstack gap={2} width="25%" verticalAlignment="center">
									<i-label caption="Start Date" font={{ size: '14px', color: colorText }} class="opacity-50" />
									<i-label caption={formatDate(option.startOfEntryPeriod, 'DD MMM, YYYY')} font={{ size: '16px', name: 'Montserrat Regular', color: colorText }} />
								</i-vstack>
								{ activeTimerRows[optionIdx] }
								<i-vstack gap={2} width="25%" verticalAlignment="center">
									<i-label caption="Stake Duration" font={{ size: '14px', color: colorText }} class="opacity-50" />
									<i-hstack gap={4} verticalAlignment="center">
										{
											options.map((_option: any, _optionIdx: number) => {
												const isCurrentIdx = optionIdx === _optionIdx;
												return <i-button
													caption={durationDays < 1 ? '< 1 Day' : `${durationDays} Days`}
													class={`btn-os ${isCurrentIdx ? 'cursor-default' : ''}`}
													border={{ radius: 12, width: 1, style: 'solid', color: isCurrentIdx ? 'transparent' : '#8994A3' }}
													font={{ size: '12px', name: 'Montserrat Regular', color: isCurrentIdx ? colorText : '#8994A3' }}
													padding={{ top: 2.5, bottom: 2.5, left: 8, right: 8 }}
													background={{ color: isCurrentIdx ? '#f15e61 !important' : 'transparent !important' }}
													onClick={() => onChangeStake(_optionIdx)}
												/>
											})
										}
									</i-hstack>
								</i-vstack>
								<i-vstack gap={4} width="25%" margin={{ left: 'auto' }} verticalAlignment="center" horizontalAlignment="end">
									<i-hstack gap={4} class="pointer" width="fit-content" verticalAlignment="center" onClick={() => this.getLPToken(campaign, lockedTokenSymbol, chainId)}>
										<i-icon name="external-link-alt" width={12} height={12} fill={colorText} />
										<i-label caption={`Get ${lockedTokenSymbol}`} font={{ size: '13.6px', color: colorText }} />
										{
											lockedTokenIconPaths.map((v: any) => {
												return <i-image display="flex" width={15} height={15} url={Assets.fullPath(v)} fallbackUrl={fallBackUrl} />
											})
										}
									</i-hstack >
									{
										campaign.showContractLink ?
										<i-hstack gap={4} class="pointer" width="fit-content" verticalAlignment="center" onClick={() => viewOnExplorerByAddress(chainId, option.address)}>
											<i-icon name="external-link-alt" width={12} height={12} fill={colorText} class="inline-block" />
											<i-label caption="View Contract" font={{ size: '13.6px', color: colorText }} />
										</i-hstack> : []
									}
									{/* {
										campaign.showContractLink && isClaim ?
										<i-hstack gap={4} class="pointer" width="fit-content" verticalAlignment="center" onClick={() => viewOnExplorerByAddress(chainId, rewardsData[0].address)}>
											<i-icon name="external-link-alt" width={12} height={12} fill={colorText} class="inline-block" />
											<i-label caption="View Reward Contract" font={{ size: '13.6px', color: colorText }} />
										</i-hstack> : []
									} */}
								</i-vstack>
							</i-hstack>
							<i-vstack gap={8}>
								{ claimStakedRow }
								{/* {
									await Promise.all(rewardOptions.map(async (rewardOption: any, idx: number) => {
										const rewardToken = this.getRewardToken(rewardOption.rewardTokenAddress);
										const rewardTokenDecimals = rewardToken.decimals || 18;
										const decimalsOffset = 18 - rewardTokenDecimals;
										let offset = decimalsOffset;
										if (rewardTokenDecimals !== 18 && lockedTokenDecimals !== 18) {
											offset = offset * 2;
										} else if (lockedTokenDecimals !== 18 && rewardTokenDecimals === 18) {
											offset = 18 - lockedTokenDecimals;
										}
										const earnedQty = formatNumber(new BigNumber(option.totalCredit).times(new BigNumber(rewardOption.multiplier)).shiftedBy(offset));
										const earnedSymbol = this.getRewardToken(rewardOption.rewardTokenAddress).symbol || '';
										const rewardElm = await HStack.create({ verticalAlignment: 'center', horizontalAlignment: 'space-between' });
										rewardElm.appendChild(<i-label caption="You Earned" font={{ size: '16px', color: colorText }} />);
										rewardElm.appendChild(<i-label caption={`${earnedQty} ${earnedSymbol}`} font={{ size: '16px', color: colorText }} />);
										return rewardElm;
									}))
								} */}
								<i-vstack verticalAlignment="center" horizontalAlignment="center">
									{ manageStake }
								</i-vstack>
								{ rowRewards }
							</i-vstack>
						</i-vstack>
					);
					return stakingElms[optionIdx];
				})
			);

			nodeItems.push(containerSection);
			containerSection.appendChild(
				<i-hstack background={{ color: colorCampaignBackground }} width="100%" maxWidth={maxWidth} height={maxHeight}>
					{ stakingsElm }
				</i-hstack>
			)
		};
		this.stakingElm.clearInnerHTML();
		this.stakingElm.append(this.noCampaignSection, ...nodeItems);
	}

	render() {
		return (
			<i-panel id="stakingComponent" class="staking-component" minHeight={200}>
				<i-panel id="stakingLayout" class="staking-layout" width={maxWidth} height={maxHeight}>
					<i-vstack id="loadingElm" class="i-loading-overlay">
						<i-vstack class="i-loading-spinner" horizontalAlignment="center" verticalAlignment="center">
							<i-icon
								class="i-loading-spinner_icon"
								image={{ url: Assets.fullPath('img/loading.svg'), width: 36, height: 36 }}
							/>
							<i-label
								caption="Loading..." font={{ color: '#FD4A4C', size: '1.5em' }}
								class="i-loading-spinner_text"
							/>
						</i-vstack>
					</i-vstack>
					<i-panel id="stakingElm" class="wrapper" />
				</i-panel>
				<i-panel id="manageStakeElm" />
			</i-panel>
		)
	}
}
