import { Styles, Container, Panel, customElements, ControlElement, Module, Input, Label, Checkbox, Control, application, HStack, VStack, Modal, Button, Datepicker } from '@ijstech/components';
import { BigNumber } from '@ijstech/eth-wallet';
import { DefaultDateTimeFormat, EventId, formatNumber, isAddressValid, isInvalidInput, isValidNumber, ITokenObject, limitInputNumber } from '@staking/global';
import { getChainId, getDefaultChainId, getTokenMapData, Reward } from '@staking/store';
import moment from 'moment';
import { TokenSelection } from '../../token-selection';

declare global {
	namespace JSX {
		interface IntrinsicElements {
			['reward-config']: ControlElement;
		}
	}
};

@customElements('reward-config')
export class RewardConfig extends Module {
	private pnlTokenSelection: Panel;
	private tokenSelection: TokenSelection;
	private token?: ITokenObject;
	private inputMultiplier: Input;
	private inputInitialReward: Input;
	private lbErrInitialReward: Label;
	private inputRewardVesting: Input;
	private inputAdminClaimDeadline: Datepicker;
	private adminClaimDeadline: number;
	private lbErrAdminClaimDeadline: Label;
	private checkboxStartDate: Checkbox;
	private wrapperStartDateElm: HStack;
	private inputVestingStartDate: Datepicker;
	private vestingStartDate: number;
	private lbStartDateErr: Label;
	private wrapperAddressElm: HStack;
	private _isNew: boolean;
	private _data?: Reward;
	private _campaignEndLockTime: number = 0;
	private _maxTotal: number = 0;
	private _stakingToken: ITokenObject | undefined;
	private inputAddress: Input;
	private lbAddressErr: Label;
	private isAddressValid: boolean;
	private _chainId: number;
	private isInitialized = false;

	private wrapperRewardNeededElm: HStack;
	private lbMaxReward: Label;
	private lbRate: Label;
	private pnlTimeSelection: Panel;
	private btnTime: Button;
	private unit: number = 1;
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

	set data(value: Reward | undefined) {
		this._data = value;
		this.setupData();
	}

	get data() {
		return this._data;
	}

	set campaignEndLockTime(value: number) {
		this._campaignEndLockTime = value;
		this.checkStartDate();
	}

	get campaignEndLockTime() {
		return this._campaignEndLockTime;
	}

	set maxTotal(value: number) {
		this._maxTotal = value;
		this.updateMaxReward();
	}

	get maxTotal() {
		return this._maxTotal || 0;
	}

	set stakingToken(token: ITokenObject | undefined) {
		this._stakingToken = token;
		this.updateRate();
	}

	get stakingToken() {
		return this._stakingToken;
	}

	private setupInput = () => {
		if (this.wrapperAddressElm) {
			this.wrapperAddressElm.visible = !this.isNew;
			this.inputAddress.enabled = this.isNew;
			this.wrapperRewardNeededElm.visible = this.isNew;
			this.inputMultiplier.enabled = this.isNew;
			this.inputInitialReward.enabled = this.isNew;
			this.inputRewardVesting.enabled = this.isNew;
			this.inputAdminClaimDeadline.enabled = this.isNew;
			if (this.tokenSelection) {
				this.tokenSelection.enabled = this.isNew;
			}
			if (this.btnTime) {
				this.btnTime.enabled = this.isNew;
			}
			this.checkboxStartDate.enabled = this.isNew;
			this.inputVestingStartDate.enabled = this.isNew;
			if (!this.isNew) {
				this.inputAdminClaimDeadline.classList.add('input-disabled');
				this.checkboxStartDate.classList.add('input-disabled');
				this.inputVestingStartDate.classList.add('input-disabled');
			}
		}
	}

	private setupData = async () => {
		if (this.data) {
			const { address, rewardTokenAddress, multiplier, initialReward, vestingPeriod, claimDeadline, admin, isCommonStartDate, vestingStartDate } = this.data;
			const interval = setInterval(() => {
				if (this.isInitialized && this.tokenSelection.isInitialized) {
					clearInterval(interval);
					const tokenMap = getTokenMapData(this.chainId);
					const token = tokenMap[rewardTokenAddress] || tokenMap[rewardTokenAddress.toLowerCase()];
					this.inputAddress.value = address;
					this.isAddressValid = true;
					this.token = token;
					this.tokenSelection.token = token;
					this.inputMultiplier.value = new BigNumber(multiplier).toFixed();
					this.inputInitialReward.value = new BigNumber(initialReward).toFixed();
					this.inputRewardVesting.value = new BigNumber(vestingPeriod).dividedBy(this.hourVal).toFixed();
					this.setAdminClaimDeadline(claimDeadline);
					this.checkboxStartDate.checked = !!isCommonStartDate;
					this.onCheckCommonStartDate();
					if (isCommonStartDate) {
						this.setStartDate(vestingStartDate);
					}
					this.updateMaxReward();
					this.updateRate();
					this.emitInput();
				}
			}, 200);
		}
	}

	get maxReward() {
		return new BigNumber(this.inputMultiplier.value || 0).multipliedBy(this.maxTotal);
	}

	get rate() {
		return new BigNumber(this.inputMultiplier.value || 0).multipliedBy(this.maxTotal);
	}

	updateMaxReward = () => {
		if (!this.lbMaxReward) return;
		if (this.token) {
			this.lbMaxReward.caption = `${formatNumber(this.maxReward)} ${this.token.symbol || ''}`;
		} else {
			this.lbMaxReward.caption = '-';
		}
	}

	updateRate = () => {
		if (!this.lbRate || !this.inputMultiplier) return;
		if (this.stakingToken && this.token && this.inputMultiplier.value) {
			this.lbRate.caption = `<span class="mr-0-5">1 ${this.stakingToken.symbol}</span> : <span class="ml-0-5">${this.inputMultiplier.value} ${this.token.symbol}</span>`;
		} else {
			this.lbRate.caption = '-';
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
			background: { color: '#0C1234' },
			font: { color: '#FFFFFF' },
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
			};
			vstack.appendChild(dropdownItem);
		}
		dropdownModal.item = vstack;
		this.pnlTimeSelection.clearInnerHTML();
		this.pnlTimeSelection.appendChild(this.btnTime);
		this.pnlTimeSelection.appendChild(dropdownModal);
	}

	private checkStartDate = () => {
		if (!this.inputVestingStartDate) return;
		const startDateElm = this.inputVestingStartDate.querySelector('input[type="datetime-local"]') as HTMLInputElement;
		if (startDateElm) {
			const minDate = moment.unix(this.campaignEndLockTime);
			const val = minDate.add(60, 'seconds');
			if (this.campaignEndLockTime) {
				startDateElm.min = val.format('YYYY-MM-DD HH:mm:ss');
			}
			if (this.vestingStartDate && this.vestingStartDate <= this.campaignEndLockTime) {
				this.lbStartDateErr.visible = true;
				this.lbStartDateErr.caption = `The start date should be greater than <b>${val.format(DefaultDateTimeFormat)}</b>`;
			} else {
				this.lbStartDateErr.visible = false;
			}
    }
	}

	private setStartDate = (value?: number | BigNumber) => {
		const startDate = new BigNumber(value || 0).toNumber();
		this.vestingStartDate = startDate;
		const startTextElm = this.inputVestingStartDate.querySelector('input[type="text"]') as HTMLInputElement;
		if (startDate) {
			startTextElm.value = moment.unix(startDate).format(DefaultDateTimeFormat)
		}
		this.emitInput();
	}

	private setAdminClaimDeadline = (value: number | BigNumber) => {
		const date = new BigNumber(value || 0).toNumber();
		this.adminClaimDeadline = date;
		const elm = this.inputAdminClaimDeadline.querySelector('input[type="text"]') as HTMLInputElement;
		if (date) {
			elm.value = moment.unix(date).format(DefaultDateTimeFormat);
		}
		this.emitInput();
	}

	private setAttrDatePicker = () => {
		this.inputVestingStartDate.dateTimeFormat = DefaultDateTimeFormat;
		this.inputAdminClaimDeadline.dateTimeFormat = DefaultDateTimeFormat;
		this.inputVestingStartDate.onChanged = (datepickerElm: any) => this.changeStartDate(datepickerElm.inputElm.value);
		this.inputAdminClaimDeadline.onChanged = (datepickerElm: any) => this.changeAdminClaimDeadline(datepickerElm.inputElm.value);
		const startTextElm = this.inputVestingStartDate.querySelector('input[type="text"]') as HTMLInputElement;
    if (startTextElm) {
      startTextElm.placeholder = DefaultDateTimeFormat;
    }
		const adminTextElm = this.inputAdminClaimDeadline.querySelector('input[type="text"]') as HTMLInputElement;
		if (adminTextElm) {
			adminTextElm.placeholder = DefaultDateTimeFormat;
		}
		const adminDateElm = this.inputAdminClaimDeadline.querySelector('input[type="datetime-local"]') as HTMLInputElement;
		if (adminDateElm) {
			adminDateElm.min = moment().add(300, 'seconds').format('YYYY-MM-DD HH:mm:ss');
		}
		this.setAdminClaimDeadline(moment('31/12/9999 23:59:59', DefaultDateTimeFormat).unix());
		this.checkStartDate();
  }

	private changeStartDate = (value: any) => {
    const date = moment(value, DefaultDateTimeFormat);
		this.vestingStartDate = date.unix();
		if (this.vestingStartDate <= this.campaignEndLockTime) {
			const minDate = moment.unix(this.campaignEndLockTime).add(60, 'seconds');
			this.lbStartDateErr.visible = true;
			this.lbStartDateErr.caption = `The start date should be greater than <b>${minDate.format(DefaultDateTimeFormat)}</b>`;
		} else {
			this.lbStartDateErr.visible = false;
		}
		this.emitInput();
  }

	private changeAdminClaimDeadline = (value: any) => {
		const date = moment(value, DefaultDateTimeFormat);
		this.adminClaimDeadline = date.unix();
		const minDate = moment().add(300, 'seconds');
		if (this.adminClaimDeadline <= minDate.unix() && this.isNew) {
			this.lbErrAdminClaimDeadline.visible = true;
			this.lbErrAdminClaimDeadline.caption = `The admin claim deadline should be greater than <b>${minDate.format(DefaultDateTimeFormat)}</b>`;
		} else {
			this.lbErrAdminClaimDeadline.visible = false;
		}
		this.emitInput();
	}

	private emitInput = () => {
		application.EventBus.dispatch(EventId.EmitInput);
	}

	private onCheckCommonStartDate = (isClicked?: boolean) => {
		if (isClicked && !this.checkboxStartDate.enabled) {
			this.checkboxStartDate.checked = !this.checkboxStartDate.checked;
			return;
		}
		this.wrapperStartDateElm.visible = this.checkboxStartDate.checked;
		this.emitInput();
	}

	private onInputToken = (token: ITokenObject) => {
		this.token = token;
		this.updateMaxReward();
		this.updateRate();
		this.emitInput();
	}

	private onInputMultiplier = (input: Control) => {
		limitInputNumber(input, 18);
		this.updateMaxReward();
		this.updateRate();
		this.emitInput();
	}

	private checkInitialReward = () => {
		const initialReward = Number(this.inputInitialReward.value);
		if (isNaN(initialReward)) return false;
		return initialReward >= 0 && initialReward <= 1;
	}

	private onInputInitalReward = (input: Control) => {
		const _value = (input as Input).value;
		if (isInvalidInput(_value)) {
			this.inputInitialReward.value = '0';
		}
		if (!this.checkInitialReward()) {
			this.lbErrInitialReward.visible = true;
			this.lbErrInitialReward.caption = 'The upfront reward ratio must be between 0 and 1';
		} else {
			this.lbErrInitialReward.visible = false;
		}
		this.emitInput();
	}

	private onInputUnix = (input: Control) => {
		const _input = input as Input;
		let value = _input.value;
		value = value.replace(/[^0-9]+/g, "");
		_input.value = value;
		this.emitInput();
	}

	private onInputAddress = async () => {
		this.isAddressValid = await isAddressValid(this.inputAddress.value);
		this.lbAddressErr.visible = !this.isAddressValid;
		this.emitInput();
	}

	checkValidation = () => {
		return this.token &&
			this.checkInitialReward() &&
			isValidNumber(this.inputMultiplier.value) &&
			isValidNumber(this.inputRewardVesting.value) &&
			(!this.isNew || (this.adminClaimDeadline && this.adminClaimDeadline > moment().unix())) &&
			(!this.checkboxStartDate.checked || (this.checkboxStartDate.checked && (!this.campaignEndLockTime || this.vestingStartDate > this.campaignEndLockTime))) &&
			(this.isNew || this.isAddressValid);
	}

	getData = () => {
		const reward: Reward = {
			address: this.inputAddress.value,
			rewardTokenAddress: this.token?.address || '',
			multiplier: new BigNumber(this.inputMultiplier.value),
			initialReward: new BigNumber(this.inputInitialReward.value),
			vestingPeriod: new BigNumber(this.inputRewardVesting.value).multipliedBy(this.unit).multipliedBy(this.hourVal),
			claimDeadline: new BigNumber(this.adminClaimDeadline),
			admin: '',
			isCommonStartDate: this.checkboxStartDate.checked,
			vestingStartDate: new BigNumber(this.vestingStartDate || 0),
			rewardAmount: this.maxReward
		}
		return reward;
	}

	async init() {
		super.init();
		this.tokenSelection = new TokenSelection();
		this.tokenSelection.onSelectToken = this.onInputToken;
		this.pnlTokenSelection.appendChild(this.tokenSelection);
		this.setAttrDatePicker();
		await this.renderTimeButton();
		this.setupInput();
		this.isInitialized = true;
	}

	render() {
		return (
			<i-panel class="custom-scroll">
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
							<i-label class="lb-title" caption="Reward Token Address" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-panel id="pnlTokenSelection" class="w-input" />
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Reward Factor" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-input id="inputMultiplier" inputType="number" class="input-text w-input" onChanged={(src: Control) => this.onInputMultiplier(src)} />
					</i-hstack>
					<i-hstack gap={10} margin={{ bottom: 8, top: 8 }} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Rate" />
							<i-label font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-vstack gap={4} class="w-input" verticalAlignment="center">
							<i-label id="lbRate" caption="-" class="lb-title w-100" font={{ color: '#f6c958' }} />
						</i-vstack>
					</i-hstack>
					<i-hstack id="wrapperRewardNeededElm" visible={false} gap={10} margin={{ bottom: 8 }} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Reward Needed" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-vstack gap={4} class="w-input" verticalAlignment="center">
							<i-label id="lbMaxReward" caption="-" class="lb-title w-100" font={{ color: '#f6c958' }} />
						</i-vstack>
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Upfront Reward Ratio" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-vstack gap={4} verticalAlignment="center" class="w-input" position="relative">
						<i-input id="inputInitialReward" placeholder="0 <= Reward Ratio <= 1" inputType="number" class="input-text w-input" onChanged={(src: Control) => this.onInputInitalReward(src)} />
							<i-label id="lbErrInitialReward" visible={false} font={{ color: '#F15E61', size: '12px' }} />
						</i-vstack>
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Reward Vesting" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-hstack gap={4} class="w-input" verticalAlignment="center" wrap="nowrap">
							<i-input id="inputRewardVesting" inputType="number" width={216} class="input-text" onChanged={(src: Control) => this.onInputUnix(src)} />
							<i-panel id="pnlTimeSelection" class="network-selection" width={80} />
						</i-hstack>
					</i-hstack>
					<i-hstack gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Admin Claim Deadline" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-vstack gap={4} verticalAlignment="center" class="w-input" position="relative">
							<i-datepicker id="inputAdminClaimDeadline" width="100%" height={40} type="dateTime" class="cs-datepicker" />
							<i-label id="lbErrAdminClaimDeadline" visible={false} font={{ color: '#F15E61', size: '12px' }} />
						</i-vstack>
					</i-hstack>
					<i-hstack class="row-mobile" gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-label class="lb-title" caption="Common Start Date" />
						<i-vstack verticalAlignment="center" horizontalAlignment="start" class="w-input">
							<i-checkbox
								id="checkboxStartDate"
								height="auto"
								checked={false}
								onChanged={() => this.onCheckCommonStartDate(true)}
							/>
						</i-vstack>
					</i-hstack>
					<i-hstack id="wrapperStartDateElm" visible={false} gap={10} verticalAlignment="center" horizontalAlignment="space-between">
						<i-hstack gap={4} verticalAlignment="center">
							<i-label class="lb-title" caption="Vesting Start Date" />
							<i-label caption="*" font={{ color: '#F15E61', size: '16px' }} />
						</i-hstack>
						<i-vstack gap={4} verticalAlignment="center" class="w-input" position="relative">
							<i-datepicker id="inputVestingStartDate" width="100%" height={40} type="dateTime" class="cs-datepicker" />
							<i-label id="lbStartDateErr" visible={false} font={{ color: '#F15E61', size: '12px' }} />
						</i-vstack>
					</i-hstack>
				</i-vstack>
			</i-panel>
		)
	}
}
