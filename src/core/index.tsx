import * as React from "react";
import * as ReactDOM from "react-dom";
import Modal from "../components/Modal";
import InlineSelector from "../components/InlineSelector";
import { ICoreOptions, IProviderCallback } from "../helpers/types";

import EventController from "./controllers/events";
import ProviderController from "./controllers/providers";
import {
  WEB3_CONNECT_MODAL_ID,
  CONNECT_EVENT,
  ERROR_EVENT,
  CLOSE_EVENT
} from "../helpers/constants";

const INITIAL_STATE = { show: false };

const defaultOpts = {
  lightboxOpacity: 0.4,
  cacheProvider: false,
  providerOptions: {},
  network: "",
  renderStyle: "modal",
};

class Core {
  private show: boolean = INITIAL_STATE.show;
  private eventController: EventController = new EventController();
  private lightboxOpacity: number;
  private providerController: ProviderController;
  private providers: IProviderCallback[];

  // "modal" by default
  public readonly renderStyle: string;

  constructor(opts?: Partial<ICoreOptions>) {

    console.log(opts);
    const options: ICoreOptions = {
      ...defaultOpts,
      ...opts
    };

    this.lightboxOpacity = options.lightboxOpacity;

    this.renderStyle = options.renderStyle;

    this.providerController = new ProviderController({
      cacheProvider: options.cacheProvider,
      providerOptions: options.providerOptions,
      network: options.network
    });

    this.providerController.on(CONNECT_EVENT, provider =>
      this.onConnect(provider)
    );
    this.providerController.on(ERROR_EVENT, error => this.onError(error));

    this.providers = this.providerController.getProviders();

    if(this.renderStyle == "inline") {
      // Do nothing...
      // The user must manually call web3modal.renderInline() and drop the result in
      // their template
    } else if(this.renderStyle == "modal") {
      this.renderModal();
    } else {
      throw new Error(`Invalid renderStyle ${this.renderStyle}`);
    }
  }

  get cachedProvider(): string {
    return this.providerController.cachedProvider;
  }

  // --------------- PUBLIC METHODS --------------- //

  public clearCachedProvider(): void {
    this.providerController.clearCachedProvider();
  }

  public setCachedProvider(id: string): void {
    this.providerController.setCachedProvider(id);
  }

  public on(event: string, callback: (result: any) => void): () => void {
    this.eventController.on({
      event,
      callback
    });

    return () =>
      this.eventController.off({
        event,
        callback
      });
  }

  public off(event: string, callback?: (result: any) => void): void {
    this.eventController.off({
      event,
      callback
    });
  }

  public toggleModal = async () => {
    if (this.cachedProvider) {
      await this.providerController.connectToCachedProvider();
      return;
    }
    if (
      this.providers &&
      this.providers.length === 1 &&
      this.providers[0].name
    ) {
      await this.providers[0].onClick();
      return;
    }
    await this._toggleModal();
  };

  public connect = () =>
    new Promise(async (resolve, reject) => {
      this.on(CONNECT_EVENT, provider => resolve(provider));
      await this.toggleModal();
    });

  public connectTo = (id: string) =>
    new Promise(async (resolve, reject) => {
      this.on(CONNECT_EVENT, provider => resolve(provider));
      const provider = this.providerController.getProviderMappingEntry(id);
      if (!provider) {
        return reject(
          new Error(
            `Cannot connect to provider (${id}), check provider options`
          )
        );
      }
      await this.providerController.connectTo(provider.id, provider.connector);
    });

  public renderModal() {
    const el = document.createElement("div");
    el.id = WEB3_CONNECT_MODAL_ID;
    document.body.appendChild(el);

    ReactDOM.render(
      <Modal
        providers={this.providers}
        onClose={this.onClose}
        resetState={this.resetState}
        lightboxOpacity={this.lightboxOpacity}
      />,
      document.getElementById(WEB3_CONNECT_MODAL_ID)
    );
  }

  /**
   * Renders the InlineSelector using JSX.
   *
   * The caller must be a React JSX context.
   */
  public renderInline() {
    return (
      <InlineSelector
        providers={this.providers}
        resetState={this.resetState}
        onClose={this.onClose}
      />
    );
  }
  // --------------- PRIVATE METHODS --------------- //

  private _toggleModal = async () => {
    const d = typeof window !== "undefined" ? document : "";
    const body = d ? d.body || d.getElementsByTagName("body")[0] : "";
    if (body) {
      if (this.show) {
        body.style.overflow = "";
      } else {
        body.style.overflow = "hidden";
      }
    }
    await this.updateState({ show: !this.show });
  };

  private onError = async (error: any) => {
    if (this.show) {
      await this._toggleModal();
    }
    this.eventController.trigger(ERROR_EVENT, error);
  };

  private onConnect = async (provider: any) => {
    if (this.show) {
      await this._toggleModal();
    }
    this.eventController.trigger(CONNECT_EVENT, provider);
  };

  private onClose = async () => {
    if (this.show) {
      await this._toggleModal();
    }
    this.eventController.trigger(CLOSE_EVENT);
  };

  private updateState = async (state: any) => {
    Object.keys(state).forEach(key => {
      this[key] = state[key];
    });
    await window.updateWeb3Modal(state);
  };

  private resetState = () => this.updateState({ ...INITIAL_STATE });
}

export default Core;
