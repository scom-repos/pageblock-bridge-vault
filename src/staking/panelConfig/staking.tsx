import { Styles, Button, Modal, Container, VStack, Panel, customElements, ControlElement, Module, HStack, Icon, Input, Control, application, Label } from '@ijstech/components';
import { BigNumber } from '@ijstech/eth-wallet';
import { EventId, isAddressValid, isValidNumber, ITokenObject, limitInputNumber } from '@staking/global';
import { getChainId, getDefaultChainId, getTokenMapData, LockTokenType, LockTokenTypeList, Reward, RewardNeeded, Staking } from '@staking/store';
import { TokenSelection } from '../../token-selection';
import { RewardConfig } from './reward';
import { isMultiple } from '../../config';

declare global {
	namespace JSX {
		interface IntrinsicElements {
			['staking-config']: ControlElement;
		}
	}
};

@customElements('staking-config')
export class StakingConfig extends Module {
	private tokenSelection: TokenSelection;
	private token?: ITokenObject;
	private pnlTokenSelection: Panel;
	private pnlTimeSelection: Panel;
	private btnTime: Button;
	private unit: number = 1;
	private typeSelection: Panel;
	private btnType: Button;
	private lockType: LockTokenType;
	private listRewardButton: HStack;
	private pnlInfoElm: Panel;
	private rewardConfig: RewardConfig[] = [];
	private btnAdd: Button;
	private currentReward = 0;
	private _chainId: number;
	private inputLockingTime: Input;
	private inputPerAddressCap: Input;
	private inputMaxTotalLock: Input;
	private inputDesc: Input;
	private wrapperAddressElm: HStack;
	private _isNew: boolean;
	private _data?: Staking;
	private _campaignEnd: number;
	private inputAddress: Input;
	private lbAddressErr: Label;
	private isAddressValid: boolean;
	private isInitialized = false;

	private hourVal = 60 * 60;
	private units = [
		{
			name: 'Hour(s)',
			value: 1
		},
		{
			name: 'Day(s)',
			value: 24
		},
		{
			name: 'Week(s)',
			value: 7 * 24
		},
	];

	constructor(parent?: Container, options?: any) {
		super(parent, options);
	}

	set chainId(chainId: number) {
		this._chainId = chainId;
		this.tokenSelection.token = undefined;
		this.token = undefined;
		this.tokenSelection.targetChainId = chainId;
		for (const elm of this.rewardConfig) {
			elm.chainId = chainId;
			elm.stakingToken = undefined;
		}
	}

	get chainId() {
		return this._chainId || getChainId() || getDefaultChainId();
	}

	set isNew(value: boolean) {
		this._isNew = value;
		this.setupInput();
	}

	get isNew() {
		return this._isNew;
	}

	set data(value: Staking | undefined) {
		this._data = value;
		this.setupData();
	}

	get data() {
		return this._data;
	}

	set campaignEnd(value: number) {
		this._campaignEnd = value;
		this.updateCampaignEndLockTime();
	}

	get campaignEnd() {
		return this._campaignEnd || 0;
	}

	get minLockTime() {
		if (this.inputLockingTime) {
			return new BigNumber(this.inputLockingTime.value || 0).multipliedBy(this.unit).multipliedBy(this.hourVal);
		}
		return new BigNumber(0);
	}

	private updateCampaignEndLockTime() {
		const val = this.minLockTime.plus(this.campaignEnd).toNumber();
		for (const reward of this.rewardConfig) {
			reward.campaignEndLockTime = val;
		}
	}

	private updateMaxReward() {
		const val = this.inputMaxTotalLock.value;
		for (const reward of this.rewardConfig) {
			reward.maxTotal = val;
		}
	}

	private updateStakingToken() {
		for (const reward of this.rewardConfig) {
			reward.stakingToken = this.token;
		}
	}

	private setupInput = () => {
		if (this.wrapperAddressElm) {
			this.wrapperAddressElm.visible = !this.isNew;
			this.inputAddress.enabled = this.isNew;
			this.inputLockingTime.enabled = this.isNew;
			this.inputPerAddressCap.enabled = this.isNew;
			this.inputMaxTotalLock.enabled = this.isNew;
			if (this.btnType) {
				this.btnType.enabled = this.isNew;
			}
			if (this.btnTime) {
				this.btnTime.enabled = this.isNew;
			}
			if (this.tokenSelection) {
				this.tokenSelection.enabled = this.isNew;
			}
			this.btnAdd.visible = isMultiple && this.isNew;
			this.btnAdd.enabled = isMultiple && this.isNew;
		}
	}

	private setupData = async () => {
		if (this.data) {
			const { address, lockTokenAddress, minLockTime, maxTotalLock, perAddressCap, customDesc, lockTokenType, rewards } = this.data;
			this.lockType = lockTokenType;
			const interval = setInterval(async () => {
				if (this.isInitialized && this.tokenSelection.isInitialized) {
					clearInterval(interval);
					const tokenMap = getTokenMapData(this.chainId);
					const token = tokenMap[lockTokenAddress] || tokenMap[lockTokenAddress.toLowerCase()];
					const lockingTime = new BigNumber(minLockTime);
					this.inputAddress.value = address;
					this.isAddressValid = true;
					this.token = token;
					this.tokenSelection.token = token;
					this.inputLockingTime.value = lockingTime.dividedBy(this.hourVal).toFixed();
					// this.lbMinLockTime.caption = lockingTime.isEqualTo(1) ? '1 second' : `${formatNumber(minLockTime)} seconds`;
					this.inputPerAddressCap.value = new BigNumber(perAddressCap).toFixed();
					this.inputMaxTotalLock.value = new BigNumber(maxTotalLock).toFixed();
					this.inputDesc.value = customDesc || '';
					this.btnType.caption = LockTokenTypeList.find(f => f.value === this.lockType)?.name || 'Select Type';
					this.listRewardButton.clearInnerHTML();
					this.pnlInfoElm.clearInnerHTML();
					this.rewardConfig = [];
					for (const reward of rewards) {
						await this.onAddReward(reward);
					}
				}
			}, 200)
		} else if (!this.rewardConfig.length) {
			const interval = setInterval(() => {
				if (this.isInitialized) {
					clearInterval(interval);
					this.onAddReward();
				}
			}, 200);
		}
	}

	renderTimeButton = async () => {
		const vstack = await VStack.create({ gap: 8 });
		const dropdownModal = await Modal.create({
			showBackdrop: false,
			maxWidth: 80,
			minWidth: 'auto',
			popupPlacement: 'bottom'
		});
		this.btnTime = await Button.create({
			caption: 'Hour(s)',
			font: { color: '#FFFFFF' },
			background: { color: '#0C1234' },
			border: { style: 'none', radius: 12 },
			padding: { top: '0.5rem', bottom: '0.5rem', left: '0.75rem', right: '0.75rem' },
			rightIcon: { name: 'caret-down', fill: '#F15E61' },
			width: '100%',
			height: 40,
			maxWidth: 80,
		});
		this.btnTime.classList.add('btn-select');
		this.btnTime.onClick = () => { dropdownModal.visible = !dropdownModal.visible }
		for (const unit of this.units) {
			const dropdownItem = await Button.create({
				caption: unit.name,
				background: { color: 'transparent' },
				height: 36,
			});
			dropdownItem.onClick = () => {
				dropdownModal.visible = false;
				if (this.unit === unit.value) return;
				this.btnTime.caption = unit.name;
				this.unit = unit.value;
				this.updateCampaignEndLockTime();
			};
			vstack.appendChild(dropdownItem);
		}
		dropdownModal.item = vstack;
		this.pnlTimeSelection.clearInnerHTML();
		this.pnlTimeSelection.appendChild(this.btnTime);
		this.pnlTimeSelection.appendChild(dropdownModal);
	}

	renderTypeButton = async () => {
		const vstack = await VStack.create({ gap: 8 });
		const dropdownModal = await Modal.create({
			showBackdrop: false,
			width: '100%',
			maxWidth: 300,
			popupPlacement: 'bottom'
		});
		if (this.lockType === undefined) {
			this.lockType = LockTokenTypeList[0]?.value;
		}

		const type = LockTokenTypeList.find(f => f.value === this.lockType);
		this.btnType = await Button.create({
			caption: type?.name || 'Select Type',
			background: { color: '#0C1234' },
			font: { color: '#FFFFFF' },
			border: { style: 'none', radius: 12 },
			padding: { top: '0.5rem', bottom: '0.5rem', left: '0.75rem', right: '0.75rem' },
			rightIcon: { name: 'caret-down', fill: '#F15E61' },
			width: '100%',
			height: 40,
			maxWidth: 300,
		});
		this.btnType.classList.add('btn-select');
		this.btnType.onClick = () => { dropdownModal.visible = !dropdownModal.visible }
		for (const type of LockTokenTypeList) {
			const dropdownItem = await Button.create({
				caption: `${type.name} (${type.value})`,
				background: { color: 'transparent' },
				height: 36,
			});
			dropdownItem.onClick = () => {
				dropdownModal.visible = false;
				if (this.lockType === type.value) return;
				this.btnType.caption = `${type.name} (${type.value})`;
				this.lockType = type.value;
			};
			vstack.appendChild(dropdownItem);
		}
		dropdownModal.item = vstack;
		this.typeSelection.clearInnerHTML();
		this.typeSelection.appendChild(this.btnType);
		this.typeSelection.appendChild(dropdownModal);
	}

	private onRenderReward = (button: Button, idx: number) => {
		for (const elm of this.rewardConfig) {
			elm.visible = false;
		}
		this.rewardConfig[idx].visible = true;
		const active = this.listRewardButton.querySelector('.btn-active');
		if (active) {
			active.classList.remove('btn-active');
		}
		button.classList.add('btn-active');
		this.currentReward = idx;
	}

	private removeReward = (idx: number) => {
		this.listRewardButton.removeChild(this.listRewardButton.childNodes[idx]);
		this.pnlInfoElm.removeChild(this.rewardConfig[idx]);
		this.rewardConfig.splice(idx, 1);
		for (let i = 0; i < this.listRewardButton.childElementCount; i++) {
			const elm = this.listRewardButton.childNodes[i];
			const button = (elm.firstChild as Button);
			button.caption = `Reward ${i + 1}`;
			button.onClick = () => this.onRenderReward(button, i);
			(elm.lastChild as Icon).onClick = () => this.removeReward(i);
			if (this.currentReward === idx && i === 0) {
				this.onRenderReward(button, 0);
			}
		}
		this.emitInput();
	}

	private addReward = async (idx: number, reward?: Reward) => {
		if (idx && !reward) {
			for (const elm of this.rewardConfig) {
				elm.visible = false;
			}
		}
		const rewards = [...this.rewardConfig];
		rewards[idx] = new RewardConfig();
		rewards[idx].isNew = this.isNew;
		rewards[idx].visible = !(idx && reward);
		this.rewardConfig = [...rewards];
		this.pnlInfoElm.appendChild(this.rewardConfig[idx]);
		this.rewardConfig[idx].chainId = this.chainId;
		this.rewardConfig[idx].data = reward;
		this.rewardConfig[idx].campaignEndLockTime = this.minLockTime.plus(this._campaignEnd).toNumber();
		this.rewardConfig[idx].maxTotal = this.inputMaxTotalLock.value || 0;
		this.rewardConfig[idx].stakingToken = this.token;
		this.currentReward = idx;
		this.emitInput();
	}

	private onAddReward = async (reward?: Reward) => {
		this.btnAdd.enabled = false;
		const idx = Number(this.rewardConfig.length);
		const pnl = await Panel.create({ position: 'relative' });
		pnl.classList.add('pnl-label');
		const icon = await Icon.create({ name: 'times', fill: '#181e3e', height: 12, width: 12, position: 'absolute', top: 1, right: 1 });
		icon.onClick = () => this.removeReward(idx);
		const button = await Button.create({ caption: `Reward ${ isMultiple ? idx + 1 : '' }`, padding: { top: 6, bottom: 6, left: 16, right: 16 } });
		button.classList.add('btn-item');
		if (!reward || !idx) {
			button.classList.add('btn-active');
		}
		button.onClick = () => this.onRenderReward(button, idx);
		const active = this.listRewardButton.querySelector('.btn-active');
		if (!reward && active) {
			active.classList.remove('btn-active');
		}
		pnl.appendChild(button);
		if (isMultiple)
			pnl.appendChild(icon);
		this.listRewardButton.appendChild(pnl);
		await this.addReward(idx, reward);
		this.btnAdd.enabled = true;
	}

	private onAddRewardByClick = () => {
		if (!isMultiple) return;
		this.onAddReward();
	}

	private emitInput = () => {
		application.EventBus.dispatch(EventId.EmitInput);
	}

	private onInputAddress = async () => {
		this.isAddressValid = await isAddressValid(this.inputAddress.value);
		this.lbAddressErr.visible = !this.isAddressValid;
		this.emitInput();
	}

	private onInputToken = (token: ITokenObject) => {
		this.token = token;
		this.updateStakingToken();
		this.emitInput();
	}

	private onInputLockingTime = (input: Control) => {
		const _input = input as Input;
		let value = _input.value;
		value = value.replace(/[^0-9]+/g, "");
		_input.value = value;
		this.updateCampaignEndLockTime();
		this.emitInput();
	}

	private onInputMaxTotalLock = (input: Control) => {
		limitInputNumber(input, 18);
		this.updateMaxReward();
		this.emitInput();
	}

	private onInputNumber = (input: Control) => {
		limitInputNumber(input, 18);
		this.emitInput();
	}

	private isRewardValid = () => {
		if (!this.rewardConfig.length) return false;
		for (const reward of this.rewardConfig) {
			if (!reward.checkValidation()) {
				return false;
			}
		}
		return true;
	}

	checkValidation = () => {
		return this.token && !isNaN(this.lockType) &&
			isValidNumber(this.inputLockingTime.value) &&
			isValidNumber(this.inputPerAddressCap.value) &&
			isValidNumber(this.inputMaxTotalLock.value) &&
			(this.isNew || this.isAddressValid) &&
			this.isRewardValid();
	}

	getRewardData = () => {
		const rewardData: Reward[] = [];
		const totalRewards: RewardNeeded[] = [];
		for (const reward of this.rewardConfig) {
			const data = reward.getData();
			rewardData.push(data);
			totalRewards.push({ value: data.rewardAmount || new BigNumber(0), tokenAddress: data.rewardTokenAddress })
		}
		return { rewardData, totalRewards };
	}

	getData = () => {
		const reward = this.getRewardData();
		const staking: Staking = {
			address: this.inputAddress.value,
			lockTokenAddress: this.token?.address || '',
			minLockTime: this.minLockTime,
			perAddressCap: new BigNumber(this.inputPerAddressCap.value),
			maxTotalLock: new BigNumber(this.inputMaxTotalLock.value),
			customDesc: this.inputDesc.value,
			lockTokenType: this.lockType,
			rewards: reward.rewardData,
			totalRewardAmount: reward.totalRewards,
		}
		return staking;
	}

	async init() {
		super.init();
		this.tokenSelection = new TokenSelection();
		this.tokenSelection.onSelectToken = this.onInputToken;
		this.pnlTokenSelection.appendChild(this.tokenSelection);
		await this.renderTimeButton();
		await this.renderTypeButton();
		this.setupInput();
		this.isInitialized = true;
	}

	render() {
		return (
			<i-panel class="custom-scroll" display="block" minHeight={750}>
				<i-vstack gap={10} verticalAlignment="center" class="main-content">
					<i-hstack id="wrapperAddressElm" gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Address" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-vstack gap={4} class="w-input" verticalAlignment="center">
							<i-input id="inputAddress" class="input-text w-input w-100" onChanged={this.onInputAddress} />
							<i-label id="lbAddressErr" visible={false} caption="The address is invalid!" font={{ color: '#F15E61', size: '12px' }} />
						</i-vstack>
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Lock Token Address" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-panel id="pnlTokenSelection" class="w-input" />
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Locking Time" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-hstack gap={4} class="w-input" verticalAlignment="center" wrap="nowrap">
							<i-input id="inputLockingTime" inputType="number" width={216} class="input-text" onChanged={(src: Control) => this.onInputLockingTime(src)} />
							<i-panel id="pnlTimeSelection" class="network-selection" width={80} />
						</i-hstack>
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Max Total Lock" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-input id="inputMaxTotalLock" inputType="number" class="input-text w-input" onChanged={(src: Control) => this.onInputMaxTotalLock(src)} />
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Per Address Cap" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-input id="inputPerAddressCap" inputType="number" class="input-text w-input" onChanged={(src: Control) => this.onInputNumber(src)} />
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-label class="lb-title" caption="Staking Description" />
						<i-input id="inputDesc" class="input-area w-input" inputType="textarea" rows={3} />
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Lock Token Type" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-panel id="typeSelection" class="network-selection w-input" />
					</i-hstack>
					<i-hstack gap={10} margin={{ top: 10, bottom: 5 }} width="100%" verticalAlignment="center" horizontalAlignment="space-between" wrap="wrap-reverse">
						<i-hstack id="listRewardButton" verticalAlignment="center" />
						<i-button id="btnAdd" visible={isMultiple} class="btn-os" margin={{ left: 'auto' }} caption="Add Reward" onClick={() => this.onAddRewardByClick()} />
					</i-hstack>
					<i-panel width="100%" height={2} margin={{ bottom: 10 }} background={{ color: '#6573c3' }} />
					<i-panel id="pnlInfoElm" />
				</i-vstack>
			</i-panel>
		)
	}
}
