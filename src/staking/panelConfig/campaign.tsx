import { Styles, Button, Modal, Container, VStack, Panel, customElements, ControlElement, Module, HStack, Icon, Input, Checkbox, application, Label, Control, Datepicker, Upload } from '@ijstech/components';
import { BigNumber } from '@ijstech/eth-wallet';
import { DefaultDateTimeFormat, EventId, isAddressValid } from '@staking/global';
import { getChainId, getDefaultChainId, getTokenBalance, getTokenMap, Networks, Staking, StakingCampaign } from '@staking/store';
import moment from 'moment';
import { StakingConfig } from './staking';
import { isMultiple, isThemeApplied } from '../../config';

declare global {
	namespace JSX {
		interface IntrinsicElements {
			['campaign-config']: ControlElement;
		}
	}
};

@customElements('campaign-config')
export class CampaignConfig extends Module {
	private networkSelection: Panel;
	private btnNetwork: Button;
	private network: number;
	private listStakingButton: HStack;
	private pnlInfoElm: Panel;
	private stakingConfig: StakingConfig[] = [];
	private btnAdd: Button;
	private currentStaking = 0;
	private inputName: Input;
	private inputDesc: Input;
	private inputURL: Input;
	private uploadLogo: Upload;
	private logoUrl: string = '';
	private inputCampaignStart: Datepicker;
	private inputCampaignEnd: Datepicker;
	private lbCampaignStartErr: Label;
	private lbCampaignEndErr: Label;
	private checkboxContract: Checkbox;
	private inputAdmin: Input;
	private lbErrAdmin: Label;
	private isAdminValid = false;
	private inputMainColor: Input;
	private inputBg: Input;
	private inputColorText: Input;
	private inputCountdownBg: Input;
	private inputStakingBg: Input;
	private inputStakingBtn: Input;
	private _isNew: boolean;
	private _data?: StakingCampaign;
	private campaignStart: number;
	private campaignEnd: number;
	private wapperNetworkElm: HStack;
	private lbErrBalance: Label;
	private isInitialized = false;

	constructor(parent?: Container, options?: any) {
		super(parent, options);
	}

	set chainId(chainId: number) {
		for (const elm of this.stakingConfig) {
			elm.chainId = chainId;
		}
	}

	set isNew(value: boolean) {
		this._isNew = value;
		this.setupInput();
	}

	get isNew() {
		return this._isNew;
	}

	set data(value: StakingCampaign | undefined) {
		this._data = value;
		this.setupData();
	}

	get data() {
		return this._data;
	}

	private setupInput = () => {
		if (this.wapperNetworkElm) {
			this.wapperNetworkElm.visible = !this.isNew;
			if (this.btnNetwork) {
				this.btnNetwork.enabled = this.isNew;
			}
			this.inputCampaignStart.enabled = this.isNew;
			this.inputCampaignEnd.enabled = this.isNew;
			if (!this.isNew) {
				this.inputCampaignStart.classList.add('input-disabled');
				this.inputCampaignEnd.classList.add('input-disabled');
			}
			this.inputAdmin.enabled = this.isNew;
			this.btnAdd.visible = isMultiple && this.isNew;
			this.btnAdd.enabled = isMultiple && this.isNew;
		}
	}

	private setupData = async () => {
		if (this.data) {
			const { chainId, customName, customDesc, customLogo, getTokenURL, campaignStart, campaignEnd, showContractLink, admin, customColorCampaign, customColorBackground, customColorStakingBackground, customColorButton, customColorText, customColorTimeBackground, stakings } = this.data;
			const interval = setInterval(async () => {
				if (this.isInitialized) {
					clearInterval(interval);
					this.network = chainId || getChainId();
					this.inputName.value = customName;
					this.inputDesc.value = customDesc || '';
					this.inputURL.value = getTokenURL || '';
					if (customLogo) {
						this.uploadLogo.preview(customLogo);
					}
					const start = new BigNumber(campaignStart).toNumber();
					const end = new BigNumber(campaignEnd).toNumber();
					this.campaignStart = start;
					this.campaignEnd = end;
					const startElm = this.inputCampaignStart.querySelector('input[type="text"]') as HTMLInputElement
					const endElm = this.inputCampaignEnd.querySelector('input[type="text"]') as HTMLInputElement
					startElm.value = moment.unix(start).format(DefaultDateTimeFormat);
					endElm.value = moment.unix(end).format(DefaultDateTimeFormat);
					this.checkboxContract.checked = !!showContractLink;
					this.inputAdmin.value = admin;
					if (admin) {
						this.isAdminValid = await isAddressValid(admin);
						this.lbErrAdmin.visible = !this.isAdminValid;
					}
					this.inputMainColor.value = customColorCampaign || '';
					this.inputBg.value = customColorBackground || '';
					this.inputColorText.value = customColorText || '';
					this.inputCountdownBg.value = customColorTimeBackground || '';
					this.inputStakingBg.value = customColorStakingBackground || '';
					this.inputStakingBtn.value = customColorButton || '';
					const networkObj = Networks.find(f => f.chainId === this.network);
					this.btnNetwork.caption = networkObj ? `${networkObj.name} (${networkObj.chainId})` : 'Unknown Network'
					this.listStakingButton.clearInnerHTML();
					this.pnlInfoElm.clearInnerHTML();
					this.stakingConfig = [];
					for (const staking of stakings) {
						await this.onAddStaking(staking);
					}
				}
			}, 200);
		} else if (!this.stakingConfig.length) {
			const interval = setInterval(() => {
				if (this.isInitialized) {
					clearInterval(interval);
					this.onAddStaking();
				}
			}, 200);
		}
	}

	private setAttrDatePicker = () => {
		this.inputCampaignStart.dateTimeFormat = DefaultDateTimeFormat;
		this.inputCampaignEnd.dateTimeFormat = DefaultDateTimeFormat;
    this.inputCampaignStart.onChanged = (datepickerElm: any) => this.changeStartDate(datepickerElm.inputElm.value);
    this.inputCampaignEnd.onChanged = (datepickerElm: any) => this.changeEndDate(datepickerElm.inputElm.value);
		// const minDate = moment();
    const startTextElm = this.inputCampaignStart.querySelector('input[type="text"]') as HTMLInputElement;
    // const startDateElm = this.inputCampaignStart.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    const endTextElm = this.inputCampaignEnd.querySelector('input[type="text"]') as HTMLInputElement;
    // const endDateElm = this.inputCampaignEnd.querySelector('input[type="datetime-local"]') as HTMLInputElement;
		// if (startDateElm) {
    //   startDateElm.min = minDate.add(300, 'seconds').format('YYYY-MM-DD HH:mm:ss');
    // }
    if (startTextElm) {
      startTextElm.placeholder = DefaultDateTimeFormat;
    }
		// if (endDateElm) {
    //   endDateElm.min = minDate.add(360, 'seconds').format('YYYY-MM-DD HH:mm:ss');
    // }
    if (endTextElm) {
      endTextElm.placeholder = DefaultDateTimeFormat;
    }
  }

	private checkCampaignDate = () => {
		const date = moment();
		// if (date.unix() > this.campaignStart) {
		// 	this.lbCampaignStartErr.visible = true;
		// 	this.lbCampaignStartErr.caption = `The campaign start must be after <b>${date.add(300, 'seconds').format(DefaultDateTimeFormat)}</b>`;
		// } else
		if (this.campaignEnd && this.campaignStart >= this.campaignEnd) {
			this.lbCampaignStartErr.visible = true;
			this.lbCampaignStartErr.caption = `The campaign start must be before the campaign end`;
		} else {
			this.lbCampaignStartErr.visible = false;
		}
		// if (this.campaignEnd <= date.unix()) {
		// 	this.lbCampaignEndErr.visible = true;
		// 	this.lbCampaignEndErr.caption = `The campaign end must be after the <b>${date.add(360, 'seconds').format(DefaultDateTimeFormat)}</b>`;
		// } else
		if (this.campaignStart >= this.campaignEnd) {
			this.lbCampaignEndErr.visible = true;
			this.lbCampaignEndErr.caption = `The campaign end must be after the campaign start`;
		} else {
			this.lbCampaignEndErr.visible = false;
		}
	}

	private changeStartDate = (value: any) => {
    const inputEndDate = this.inputCampaignEnd.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    const date = moment(value, DefaultDateTimeFormat);
		this.campaignStart = date.unix();
		if (inputEndDate) {
      inputEndDate.min = date.add(60, 'seconds').format('YYYY-MM-DD HH:mm:ss');
			this.checkCampaignDate();
    }
		this.emitInput();
  }

	private changeEndDate = (value: any) => {
		const inputStartDate = this.inputCampaignStart.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    const date = moment(value, DefaultDateTimeFormat);
		this.campaignEnd = date.unix();
		if (inputStartDate) {
      inputStartDate.max = date.subtract(60, 'seconds').format('YYYY-MM-DD HH:mm:ss');
			this.checkCampaignDate();
    }
		for (const staking of this.stakingConfig) {
			staking.campaignEnd = this.campaignEnd;
		}
		this.emitInput();
	}

	private renderNetworkButton = async () => {
		const vstack = await VStack.create({ gap: 8 });
		const dropdownModal = await Modal.create({
			showBackdrop: false,
			width: '100%',
			maxWidth: 300,
			popupPlacement: 'bottom',
		});
		const listNetwork = Networks.filter(f => !f.isDisabled);
		const networkObj = listNetwork.find(f => f.chainId === this.network);
		this.btnNetwork = await Button.create({
			caption: networkObj ? `${networkObj.name} (${networkObj.chainId})` : 'Select Network',
			background: { color: '#0C1234' },
			font: { color: '#FFFFFF' },
			border: { style: 'none', radius: 12 },
			padding: { top: '0.5rem', bottom: '0.5rem', left: '0.75rem', right: '0.75rem' },
			rightIcon: { name: 'caret-down', fill: '#F15E61' },
			width: '100%',
			height: 40,
			maxWidth: 300,
			enabled: this.isNew,
		});
		this.btnNetwork.classList.add('btn-select');
		this.btnNetwork.onClick = () => { dropdownModal.visible = !dropdownModal.visible }
		for (const network of listNetwork) {
			const dropdownItem = await Button.create({
				caption: `${network.name} (${network.chainId})`,
				background: { color: 'transparent' },
				height: 36,
			});
			dropdownItem.onClick = () => {
				dropdownModal.visible = false;
				if (this.network === network.chainId) return;
				this.btnNetwork.caption = `${network.name} (${network.chainId})`;
				this.network = network.chainId;
				for (const elm of this.stakingConfig) {
					elm.chainId = this.network;
				}
				this.emitInput();
			};
			vstack.appendChild(dropdownItem);
		}
		dropdownModal.item = vstack;
		this.networkSelection.clearInnerHTML();
		this.networkSelection.appendChild(this.btnNetwork);
		this.networkSelection.appendChild(dropdownModal);
	}

	private onRenderStaking = (button: Button, idx: number) => {
		for (const elm of this.stakingConfig) {
			elm.visible = false;
		}
		this.stakingConfig[idx].visible = true;
		const active = this.listStakingButton.querySelector('.btn-active');
		if (active) {
			active.classList.remove('btn-active');
		}
		button.classList.add('btn-active');
		this.currentStaking = idx;
	}

	private removeStaking = (idx: number) => {
		this.listStakingButton.removeChild(this.listStakingButton.childNodes[idx]);
		this.pnlInfoElm.removeChild(this.stakingConfig[idx]);
		this.stakingConfig.splice(idx, 1);
		for (let i = 0; i < this.listStakingButton.childElementCount; i++) {
			const elm = this.listStakingButton.childNodes[i];
			const button = (elm.firstChild as Button);
			button.caption = `Staking ${i + 1}`;
			button.onClick = () => this.onRenderStaking(button, i);
			(elm.lastChild as Icon).onClick = () => this.removeStaking(i);
			if (this.currentStaking === idx && i === 0) {
				this.onRenderStaking(button, 0);
			}
		}
		this.emitInput();
	}

	private addStaking = async (idx: number, staking?: Staking) => {
		if (idx && !staking) {
			for (const elm of this.stakingConfig) {
				elm.visible = false;
			}
		}
		const stakings = [...this.stakingConfig];
		stakings[idx] = new StakingConfig();
		stakings[idx].isNew = this.isNew;
		stakings[idx].visible = !(idx && staking);
		this.stakingConfig = [...stakings];
		this.pnlInfoElm.appendChild(this.stakingConfig[idx]);
		this.stakingConfig[idx].chainId = this.network;
		this.stakingConfig[idx].data = staking;
		this.currentStaking = idx;
		this.emitInput();
	}

	private onAddStaking = async (staking?: Staking) => {
		this.btnAdd.enabled = false;
		const idx = Number(this.stakingConfig.length);
		const pnl = await Panel.create({ position: 'relative' });
		pnl.classList.add('pnl-label');
		const icon = await Icon.create({ name: 'times', fill: '#181e3e', height: 12, width: 12, position: 'absolute', top: 1, right: 1 });
		icon.onClick = () => this.removeStaking(idx);
		const button = await Button.create({ caption: `Staking ${ isMultiple ? idx + 1 : '' }`, padding: { top: 6, bottom: 6, left: 16, right: 16 } });
		button.classList.add('btn-item');
		if (!staking || !idx) {
			button.classList.add('btn-active');
		}
		button.onClick = () => this.onRenderStaking(button, idx);
		const active = this.listStakingButton.querySelector('.btn-active');
		if (!staking && active) {
			active.classList.remove('btn-active');
		}
		pnl.appendChild(button);
		if (isMultiple)
			pnl.appendChild(icon);
		this.listStakingButton.appendChild(pnl);
		await this.addStaking(idx, staking);
		this.btnAdd.enabled = true;
	}

	private onAddStakingByClick = () => {
		if (!isMultiple) return;
		this.onAddStaking();
	}

	private emitInput = () => {
		application.EventBus.dispatch(EventId.EmitInput);
	}

	private onInputText = () => {

	}

	private onInputAdmin = async () => {
		this.isAdminValid = await isAddressValid(this.inputAdmin.value);
		this.lbErrAdmin.visible = !this.isAdminValid;
		this.emitInput();
	}

	private onBeforeUpload(target: Upload, file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        reject('File size can not exceed 2MB!')
      }
      resolve(isLt2M)
    })
  }

  private async onChangeFile(source: Control, files: File[]) {
    if (!files.length) return;
    const data: any = await this.uploadLogo.toBase64(files[0]);
    this.logoUrl = data || '';
  }

  private onRemove(source: Control, file: File) {
    this.logoUrl = '';
  }

	private isStakingValid = () => {
		if (!this.stakingConfig.length) return false;
		for (const staking of this.stakingConfig) {
			if (!staking.checkValidation()) {
				return false;
			}
		}
		return true;
	}

	private checkBalances = () => {
		if (!this.isNew) return true;
		const stakings = this.getStakingData();
		let listRewardNeeded: {[key: string]: BigNumber } = {};
		for (const staking of stakings) {
			const totalRewards = staking.totalRewardAmount;
			if (totalRewards) {
				for (const rewardNeeded of totalRewards) {
					const { tokenAddress, value } = rewardNeeded;
					if (listRewardNeeded[tokenAddress]) {
						listRewardNeeded[tokenAddress] = new BigNumber(listRewardNeeded[tokenAddress]).plus(value);
					} else {
						listRewardNeeded[tokenAddress] = value;
					}
				}
			}
		}
		const tokenMap = getTokenMap();
		let isValid = true;
		let invalidTokens = [];
		for (const key of Object.keys(listRewardNeeded)) {
			const token = tokenMap[key.toLowerCase()];
			const amount = listRewardNeeded[key];
			const balance = getTokenBalance(token);
			if (amount.gt(balance)) {
				invalidTokens.push(token.symbol);
				isValid = false;
			}
		}
		this.lbErrBalance.caption = `Insufficient ${invalidTokens.join(', ')} balance${invalidTokens.length > 1 ? 's' : ''}`;
		this.lbErrBalance.visible = !isValid;
		return isValid;
	}

	checkValidation = () => {
		return this.checkBalances() &&
			!!this.inputName.value &&
			this.campaignStart &&
			// this.campaignStart >= moment().unix() &&
			this.campaignStart < this.campaignEnd &&
			this.isAdminValid &&
			this.isStakingValid();
	}

	getStakingData = () => {
		const stakingData: Staking[] = [];
		for (const staking of this.stakingConfig) {
			const data = staking.getData();
			stakingData.push(data);
		}
		return stakingData;
	}

	getData = () => {
		const campaign: StakingCampaign = {
			chainId: this.network,
			customName: this.inputName.value,
			customDesc: this.inputDesc.value || undefined,
			customLogo: this.logoUrl || undefined,
			getTokenURL: this.inputURL.value || undefined,
			campaignStart: new BigNumber(this.campaignStart),
			campaignEnd: new BigNumber(this.campaignEnd),
			showContractLink: this.checkboxContract.checked || undefined,
			admin: `${this.inputAdmin.value}`,
			customColorCampaign: isThemeApplied ? undefined : this.inputMainColor.value || undefined,
			customColorBackground: isThemeApplied ? undefined : this.inputBg.value || undefined,
			customColorStakingBackground: isThemeApplied ? undefined : this.inputStakingBg.value || undefined,
			customColorButton: isThemeApplied ? undefined : this.inputStakingBtn.value || undefined,
			customColorText: isThemeApplied ? undefined : this.inputColorText.value || undefined,
			customColorTimeBackground: isThemeApplied ? undefined : this.inputCountdownBg.value || undefined,
			stakings: this.getStakingData(),
		}
		return campaign;
	}

	async init() {
		this.network = getChainId() || getDefaultChainId();
		super.init();
		this.setAttrDatePicker();
		this.setupInput();
		await this.renderNetworkButton();
		this.isInitialized = true;
	}

	render() {
		return (
			<i-panel class="custom-scroll">
				<i-vstack gap={10} verticalAlignment="center" class="main-content">
					<i-hstack id="wapperNetworkElm" gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Network" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-panel id="networkSelection" class="network-selection w-input" />
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Campaign Name" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-input id="inputName" class="input-text w-input" onChanged={this.emitInput} />
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-label class="lb-title" caption="Campaign Description" />
						<i-input id="inputDesc" class="input-area w-input" inputType="textarea" rows={3} onChanged={this.onInputText} />
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-label class="lb-title" caption="Campaign Logo" />
						<i-vstack gap={4} verticalAlignment="center" class="w-input" position="relative">
							<i-upload
								id="uploadLogo"
								class="input-text w-input cs-upload"
								accept="image/*"
								onUploading={this.onBeforeUpload.bind(this)}
								onChanged={this.onChangeFile.bind(this)}
								onRemoved={this.onRemove.bind(this)}
							/>
						</i-vstack>
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-label class="lb-title" caption="Token Trade URL" />
						<i-input id="inputURL" class="input-text w-input" onChanged={this.onInputText} />
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Campaign Start" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-vstack gap={4} verticalAlignment="center" class="w-input" position="relative">
							<i-datepicker id="inputCampaignStart" width="100%" height={40} type="dateTime" class="cs-datepicker" />
							<i-label id="lbCampaignStartErr" visible={false} font={{ color: '#F15E61', size: '12px' }} />
						</i-vstack>
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Campaign End" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-vstack gap={4} verticalAlignment="center" class="w-input" position="relative">
							<i-datepicker id="inputCampaignEnd" width="100%" height={40} type="dateTime" class="cs-datepicker" />
							<i-label id="lbCampaignEndErr" visible={false} font={{ color: '#F15E61', size: '12px' }} />
						</i-vstack>
					</i-hstack>
					<i-hstack gap={10} class="row-mobile" margin={{ top: 5, bottom: 5 }} verticalAlignment="center" horizontalAlignment="space-between">
						<i-label class="lb-title" caption="Show Contract Link" />
						<i-vstack verticalAlignment="center" horizontalAlignment="start" class="w-input">
							<i-checkbox
								id="checkboxContract"
								height="auto"
								checked={false}
							/>
						</i-vstack>
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Admin" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-vstack gap={4} class="w-input" verticalAlignment="center">
							<i-input id="inputAdmin" class="input-text w-input w-100" onChanged={this.onInputAdmin} />
							<i-label id="lbErrAdmin" visible={false} caption="The address is invalid!" font={{ color: '#F15E61', size: '12px' }} />
						</i-vstack>
					</i-hstack>
					<i-vstack visible={isThemeApplied} gap={10} width="100%" verticalAlignment="center">
						<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
							<i-label class="lb-title" caption="Campaign Main Color" />
							<i-input id="inputMainColor" placeholder="#f15e61" class="input-text w-input" onChanged={this.onInputText} />
						</i-hstack>
						<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
							<i-label class="lb-title" caption="Campaign Background" />
							<i-input id="inputBg" placeholder="#ffffff26" class="input-text w-input" onChanged={this.onInputText} />
						</i-hstack>
						<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
							<i-label class="lb-title" caption="Color Text" />
							<i-input id="inputColorText" placeholder="#ffffff" class="input-text w-input" onChanged={this.onInputText} />
						</i-hstack>
						<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
							<i-label class="lb-title" caption="Countdown Background" />
							<i-input id="inputCountdownBg" placeholder="#b14781" class="input-text w-input" onChanged={this.onInputText} />
						</i-hstack>
						<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
							<i-label class="lb-title" caption="Staking Background" />
							<i-input id="inputStakingBg" placeholder="#ffffff07" class="input-text w-input" onChanged={this.onInputText} />
						</i-hstack>
						<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
							<i-label class="lb-title" caption="Staking Button" />
							<i-input id="inputStakingBtn" placeholder="linear-gradient(90deg, #AC1D78 0%, #E04862 100%)" class="input-text w-input" onChanged={this.onInputText} />
						</i-hstack>
					</i-vstack>
					<i-hstack gap={10} margin={{ top: 10, bottom: 5 }} width="100%" verticalAlignment="center" horizontalAlignment="space-between" wrap="wrap-reverse">
						<i-hstack id="listStakingButton" verticalAlignment="center" />
						<i-button visible={isMultiple} id="btnAdd" class="btn-os" margin={{ left: 'auto' }} caption="Add Staking" onClick={() => this.onAddStakingByClick()} />
					</i-hstack>
					<i-panel width="100%" height={2} margin={{ bottom: 10 }} background={{ color: '#6573C3' }} />
					<i-panel id="pnlInfoElm" />
					<i-label id="lbErrBalance" visible={false} font={{ size: '14px', color: '#f50057', bold: true }} display="flex" margin={{ top: 10 }} />
				</i-vstack>
			</i-panel>
		)
	}
}
