import {
  WalletClientSigner,
  type SignTypedDataParams,
  type SmartAccountAuthenticator,
} from "@alchemy/aa-core";
import Capsule, { createCapsuleViemClient } from "@usecapsule/web-sdk";
import { createWalletClient, custom, type Hash, type WalletClient } from "viem";
import type {
  CapsuleAuthenticationParams,
  CapsuleConfig,
  CapsuleUserInfo,
} from "./types.js";

/**
 * This class requires the `@usecapsule/web-sdk` dependency.
 * `@alchemy/aa-signers` lists it as an optional dependency.
 *
 * @see: https://docs.usecapsule.com/getting-started/initial-setup
 */
export class CapsuleSigner
  implements
    SmartAccountAuthenticator<
      CapsuleAuthenticationParams,
      CapsuleUserInfo,
      Capsule
    >
{
  inner: Capsule;
  private client: WalletClient;
  private signer: WalletClientSigner | undefined;

  constructor(
    params: CapsuleConfig | { inner: Capsule; client: WalletClient }
  ) {
    if ("inner" in params) {
      this.inner = params.inner;
      this.client = params.client;
      return;
    }

    this.inner = new Capsule(params.env, params.apiKey, params.opts);
    this.client = createCapsuleViemClient(
      this.inner,
      params.walletConfig as any, // TODO: Capsule team to address lint error
      params.viemClientOpts
    ) as unknown as WalletClient; // TODO: Capsule team to address lint error
  }

  readonly signerType = "capsule";

  getAddress = async () => {
    if (!this.signer) throw new Error("Not authenticated");

    const address = await this.signer.getAddress();
    if (address == null) throw new Error("No address found");

    return address as Hash;
  };

  signMessage = async (msg: Uint8Array | string) => {
    if (!this.signer) throw new Error("Not authenticated");

    return this.signer.signMessage(msg);
  };

  signTypedData = (params: SignTypedDataParams) => {
    if (!this.signer) throw new Error("Not authenticated");

    return this.signer.signTypedData(params);
  };

  authenticate = async () => {
    if (this.inner == null) throw new Error("No provider found");

    this.signer = new WalletClientSigner(
      createWalletClient({
        transport: custom(this.client),
      }),
      this.signerType
    );

    return this.inner.getWallets();
  };

  getAuthDetails = async () => {
    if (!this.signer) throw new Error("Not authenticated");

    return this.inner.getWallets();
  };
}
