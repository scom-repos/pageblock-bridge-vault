import { Styles, Button, Container, HStack, Panel, customElements, ControlElement, Module, Icon, IEventBus, application, Label, VStack, Modal } from '@ijstech/components';
import { downloadJsonFile, EventId, registerSendTxEvents } from '@staking/global';
import { Result } from '../../result';
import './panel-config.css';
import { CampaignConfig } from './campaign';
import { getChainId, getNetworkInfo, isWalletConnected, StakingCampaign } from '@staking/store';
import { deployCampaign } from '@staking/staking-utils';
import { Wallet } from '@ijstech/eth-wallet';
import { isMultiple } from '../../config';
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['panel-config']: ControlElement;
    }
  }
};

@customElements('panel-config')
export class PanelConfig extends Module {
  private backElm: HStack;
  private configCampaignsElm: Panel;
  private wapperCampaignsButton: VStack;
  private wrapperNetworkElm: HStack;
  private networkElm: HStack;
  private lbNetworkName: Label;
  private campaignElm: HStack;
  private listCampaignButton: HStack;
  private pnlInfoElm: Panel;
  private campaignConfig: CampaignConfig[] = [];
  private currentCampaign = 0;
  private btnAdd: Button;
  private stakingResult: Result;
  private groupBtnSaveElm: HStack;
  private groupBtnDeployElm: HStack;
  private btnSave: Button;
  private btnDownload: Button;
  private btnExport: Button;
  private btnDeployExport: Button;
  private $eventBus: IEventBus;
  private isNew: boolean;
  private campaigns: {[chainId:number]: StakingCampaign[]};
  private importFileElm: Label;
  private importFileErrModal: Modal;
  private importFileErr: Label;
  onConfigSave: any;
  onReset: any;

  constructor(parent?: Container, options?: any) {
    super(parent, options);
    this.$eventBus = application.EventBus;
    this.registerEvent();
  }

  private registerEvent = () => {
    this.$eventBus.register(this, EventId.EmitInput, this.updateButton);
    this.$eventBus.register(this, EventId.IsWalletConnected, this.renderUI);
    this.$eventBus.register(this, EventId.IsWalletDisconnected, this.renderUI);
    this.$eventBus.register(this, EventId.chainChanged, this.onChangeChanged);
  }

  private renderUI = () => {
    const isConnected = isWalletConnected();
    this.networkElm.visible = !isConnected;
    this.campaignElm.visible = isConnected;
    this.updateNetworkName(getChainId());
  }

  private onChangeChanged = () => {
    const chainId = getChainId();
    this.updateNetworkName(chainId);
    if (this.isNew) {
      for (const campaign of this.campaignConfig) {
        campaign.chainId = chainId;
      }
    }
    this.updateButton();
  }

  showInputCampaign = async (isNew: boolean, campaigns?: StakingCampaign[]) => {
    this.wrapperNetworkElm.visible = isNew;
    this.wapperCampaignsButton.visible = isMultiple && !isNew;
    this.btnAdd.enabled = !isNew;
    this.groupBtnSaveElm.visible = !isNew;
    this.groupBtnDeployElm.visible = isNew;
    this.isNew = isNew;
    this.initInputFile();
    this.pnlInfoElm.clearInnerHTML();
    this.listCampaignButton.clearInnerHTML();
    this.campaignConfig = [];
    if (campaigns && campaigns.length) {
      for (const campaign of campaigns) {
        await this.onAddCampaign(false, campaign);
      }
    } else {
      this.onAddCampaign(true);
    }
  }

  onBack = () => {
    this.pnlInfoElm.clearInnerHTML();
    this.listCampaignButton.clearInnerHTML();
    this.campaignConfig = [];
    if (this.onReset) {
      this.onReset();
    }
  }

  private updateNetworkName = (chainId: number) => {
    const network = getNetworkInfo(chainId);
    this.lbNetworkName.caption = network ? network.name : 'Unknown Network';
  }

  private onRenderCampaign = (button: Button, idx: number) => {
    for (const elm of this.campaignConfig) {
      elm.visible = false;
    }
    this.campaignConfig[idx].visible = true;
    const active = this.listCampaignButton.querySelector('.btn-active');
    if (active) {
      active.classList.remove('btn-active');
    }
    button.classList.add('btn-active');
    this.currentCampaign = idx;
  }

  private removeCampaign = (idx: number) => {
    this.listCampaignButton.removeChild(this.listCampaignButton.childNodes[idx]);
    this.pnlInfoElm.removeChild(this.campaignConfig[idx]);
    this.campaignConfig.splice(idx, 1);
    for (let i = 0; i < this.listCampaignButton.childElementCount; i++) {
      const elm = this.listCampaignButton.childNodes[i];
      const button = (elm.firstChild as Button);
      button.caption = `Campaign ${i + 1}`;
      button.onClick = () => this.onRenderCampaign(button, i);
      (elm.lastChild as Icon).onClick = () => this.removeCampaign(i);
      if (this.currentCampaign === idx && i === 0) {
        this.onRenderCampaign(button, 0);
      }
    }
  }

  private addCampaign = async (idx: number, showLast: boolean, campaign?: StakingCampaign) => {
    if ((idx && !campaign) || showLast) {
      for (const elm of this.campaignConfig) {
        elm.visible = false;
      }
    }
    const campaigns = [...this.campaignConfig];
    campaigns[idx] = new CampaignConfig();
    campaigns[idx].isNew = this.isNew;
    campaigns[idx].data = campaign;
    campaigns[idx].visible = !(idx && campaign) || showLast;
    this.campaignConfig = [...campaigns];
    this.pnlInfoElm.appendChild(this.campaignConfig[idx]);
    this.currentCampaign = idx;
  }

  private onAddCampaign = async (showLast: boolean, campaign?: StakingCampaign) => {
    const idx = Number(this.campaignConfig.length);
    if (!this.isNew) {
      this.btnAdd.enabled = false;
      const pnl = await Panel.create({ position: 'relative' });
      pnl.classList.add('pnl-label');
      const icon = await Icon.create({ name: 'times', fill: '#181e3e', height: 12, width: 12, position: 'absolute', top: 1, right: 1 });
      icon.onClick = () => this.removeCampaign(idx);
      const button = await Button.create({ caption: `Campaign ${idx + 1}`, padding: { top: 6, bottom: 6, left: 16, right: 16 }});
      button.classList.add('btn-item');
      if (!campaign || !idx || showLast) {
        button.classList.add('btn-active');
      }
      button.onClick = () => this.onRenderCampaign(button, idx);
      const active = this.listCampaignButton.querySelector('.btn-active');
      if ((!campaign || showLast) && active) {
        active.classList.remove('btn-active');
      }
      pnl.appendChild(button);
      pnl.appendChild(icon);
      this.listCampaignButton.appendChild(pnl);
    }
    await this.addCampaign(idx, showLast, campaign);
    if (!this.isNew) {
      this.btnAdd.enabled = true;
    }
  }

  private onAddCampaignByClick = () => {
    if (this.isNew || !isMultiple) return;
    (this.importFileElm.firstChild?.firstChild as HTMLElement)?.click();
    // this.onAddCampaign();
  }

  private onClose = () => {
    this.importFileErrModal.visible = false;
  }

  private initInputFile = () => {
    this.importFileElm.caption = '<input type="file" accept=".json" />';
    const inputElm = this.importFileElm.firstChild?.firstChild as HTMLElement;
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
            this.initInputFile();
            this.convertJSONToObj(reader.result);
          }
        }
      }
    }
  }

	private convertJSONToObj = async (result: any) => {
    if (!result) this.showImportJsonError('Data is corrupted. No data were recovered.');
		try {
			const obj = JSON.parse(result);
			const length = Object.keys(obj).length;
			if (!length) {
				this.showImportJsonError('No data found in the imported file.');
			} else {
        const keys = Object.keys(obj);
        let campaigns = [];
        for (const key of keys) {
          const arr = obj[key].map((item: StakingCampaign) => {
            item.chainId = Number(key);
            return item;
          });
          campaigns.push(...arr)
        }
        for (const campaign of campaigns) {
          await this.onAddCampaign(true, campaign);
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

  private updateButton = () => {
    const valid = this.checkValidation();
    if (this.isNew) {
      if (this.btnDeployExport.rightIcon.visible) return;
      const currentAddress = Wallet.getInstance().address || '';
      const data = this.campaignConfig && this.campaignConfig[0].getData();
      this.btnExport.enabled = valid;
      this.btnDeployExport.enabled = valid && currentAddress.toLowerCase() === data?.admin?.toLowerCase();
    } else {
      this.btnSave.enabled = valid;
      this.btnDownload.enabled = valid;
    }
  }

  private checkValidation = () => {
    if (!this.campaignConfig.length) return false;
    for (const campaign of this.campaignConfig) {
      if (!campaign.checkValidation()) {
        return false;
      }
    }
    return true;
  }

  private getStakingCampaignData = () => {
    const campaignData: StakingCampaign[] = [];
    for (const campaign of this.campaignConfig) {
      const data = campaign.getData();
      campaignData.push(data);
    }
    return campaignData;
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

  private parseData = () => {
    const arr = this.getStakingCampaignData();
    this.campaigns = arr.reduce((result: any, currentValue: any) => {
      (result[currentValue['chainId']] = result[currentValue['chainId']] || []).push(
        currentValue
      );
      return result;
    }, {});
  }

  private onSave = () => {
    if (!this.isNew && this.checkValidation()) {
      this.parseData();
      const campaigns = { ...this.campaigns };
      this.onConfigSave(campaigns);
    }
  }

  private onDownload = (data?: any) => {
    if (this.isNew && data) {
      downloadJsonFile('campaign.json', { ...data });
      return;
    }
    if (this.checkValidation()) {
      this.parseData();
      const campaigns = { ...this.campaigns };
      downloadJsonFile('campaign.json', campaigns);
    }
  }

  private onDeployCampaign = async () => {
    if (this.isNew && this.checkValidation()) {
      const campaign = this.campaignConfig[0].getData();
      const chainId = getChainId();
      let result: StakingCampaign | null;
      this.showResultMessage(this.stakingResult, 'warning', `Deploying ${campaign.customName}`);

      const onUpdateBtn = () => {
        this.btnDeployExport.rightIcon.visible = false;
        this.btnDeployExport.caption = 'Deploy and Export JSON';
        this.updateButton();
        this.backElm.classList.add('cursor-pointer');
        this.backElm.onClick = () => this.onBack();
      }

      const callBack = async (err: any, reply: any) => {
        if (err) {
          this.showResultMessage(this.stakingResult, 'error', err);
          onUpdateBtn();
        } else {
          this.showResultMessage(this.stakingResult, 'success', reply);
          this.backElm.classList.remove('cursor-pointer');
          this.backElm.onClick = () => {};
          this.btnExport.enabled = false;
          this.btnDeployExport.enabled = false;
          this.btnDeployExport.caption = 'Deploying & Exporting';
          this.btnDeployExport.rightIcon.visible = true;
        }
      };

      const confirmationCallBack = async (receipt: any) => {
        if (!result) return;
        onUpdateBtn();
      };

      registerSendTxEvents({
        transactionHash: callBack,
        confirmation: confirmationCallBack
      });

      result = await deployCampaign(campaign, callBack);
      if (result) {
        this.stakingResult.closeModal();
        const obj = {[chainId]: [{ ...result }]};
        this.onConfigSave(obj);
        confirmationCallBack(true);
        this.onDownload(obj);
      }
    }
  }

  onConfirm() {
    if (this.isNew) {
      this.onDeployCampaign();
    } else {
      this.onSave();
    }
  }

  init() {
    super.init();
    this.stakingResult = new Result();
    this.appendChild(this.stakingResult);
  }

  render() {
    return (
      <i-panel class="panel-config custom-scroll">
        <i-panel id="configCampaignsElm" margin={{ left: 'auto', right: 'auto' }} width="100%" maxWidth={800}>
          <i-hstack id="backElm" gap={4} width="fit-content" margin={{ top: 5, bottom: 15, left: 'auto' }} verticalAlignment="center" class="cursor-pointer" onClick={this.onBack}>
            <i-icon name="arrow-left" fill='#FFFFFF' width={20} height={20} />
            <i-label caption="Back" font={{ size: '20px', bold: true, color: '#FFFFFF' }} />
          </i-hstack>
          <i-hstack id="networkElm" width="100%" height={150} verticalAlignment="center" horizontalAlignment="center">
            <i-label caption="Please connect with your network!" font={{ color: '#FFFFFF' }} />
          </i-hstack>
          <i-panel visible={false} id="campaignElm" width="100%">
            <i-vstack id="wapperCampaignsButton" visible={isMultiple} verticalAlignment="center">
              <i-hstack gap={10} margin={{ bottom: 10 }} width="100%" verticalAlignment="center" horizontalAlignment="space-between" wrap="wrap-reverse">
                <i-hstack id="listCampaignButton" verticalAlignment="center" />
                <i-button id="btnAdd" class="btn-os" margin={{ left: 'auto' }} caption="Add Campaigns" onClick={() => this.onAddCampaignByClick()} />
                <i-label id="importFileElm" visible={false} />
                <i-modal id="importFileErrModal" maxWidth="100%" width={420} title="Import Campaign Error" closeIcon={{ name: 'times' }}>
									<i-vstack gap={20} margin={{ bottom: 10 }} verticalAlignment="center" horizontalAlignment="center">
										<i-label id="importFileErr" font={{ size: '16px', color: '#fff' }} />
										<i-button caption="Close" class="btn-os btn-stake" width={120} onClick={this.onClose} />
									</i-vstack>
								</i-modal>
              </i-hstack>
              <i-panel width="100%" height={2} margin={{ bottom: 10 }} background={{ color: '#6573c3' }} />
            </i-vstack>
            <i-hstack id="wrapperNetworkElm" width="100%" margin={{ bottom: 10 }} verticalAlignment="center" horizontalAlignment="center">
              <i-label id="lbNetworkName" font={{ color: '#F15E61', size: '20px', bold: true }} />
            </i-hstack>
            <i-vstack gap={10} verticalAlignment="center" class="main-content">
              <i-panel id="pnlInfoElm" />
              <i-hstack horizontalAlignment="center">
                <i-hstack id="groupBtnSaveElm" gap={10} margin={{ top: 20 }} verticalAlignment="center" horizontalAlignment="center" wrap="wrap">
                  <i-button
                    id="btnSave"
                    caption="Save"
                    enabled={false}
                    width={200}
                    maxWidth="100%"
                    class="btn-os"
                    onClick={this.onSave}
                  />
                  <i-button
                    id="btnDownload"
                    caption="Export JSON"
                    enabled={false}
                    width={200}
                    maxWidth="100%"
                    class="btn-os"
                    onClick={() => this.onDownload()}
                  />
                </i-hstack>
                <i-hstack id="groupBtnDeployElm" gap={10} margin={{ top: 10 }} verticalAlignment="center" horizontalAlignment="center" wrap="wrap">
                  <i-vstack width="100%" margin={{ bottom: 10 }} verticalAlignment="center" horizontalAlignment="start">
                    <i-label caption="Only the admin can deploy the campaign!" font={{ size: '12px', color: '#f50057' }} />
                    <i-label caption="You need to confirm on your wallet for each staking/reward!" font={{ size: '12px', color: '#f50057' }} />
                  </i-vstack>
                  <i-button
                    id="btnExport"
                    caption="Export JSON"
                    enabled={false}
                    width={200}
                    maxWidth="100%"
                    class="btn-os"
                    onClick={() => this.onDownload()}
                  />
                  <i-button
                    id="btnDeployExport"
                    caption="Deploy & Export JSON"
                    enabled={false}
                    width={300}
                    maxWidth="100%"
                    rightIcon={{ spin: true, visible: false, fill: '#FFFFFF' }}
                    class="btn-os"
                    onClick={this.onDeployCampaign}
                  />
                </i-hstack>
              </i-hstack>
            </i-vstack>
          </i-panel>
        </i-panel>
      </i-panel>
    )
  }
}
