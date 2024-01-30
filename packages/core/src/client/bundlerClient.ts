import {
  createClient,
  http,
  publicActions,
  type Chain,
  type Client,
  type FallbackTransport,
  type HttpTransportConfig,
  type PublicActions,
  type PublicClient,
  type PublicClientConfig,
  type PublicRpcSchema,
  type Transport,
} from "viem";
import { VERSION } from "../version.js";
import {
  bundlerActions,
  type BundlerActions,
  type BundlerRpcSchema,
} from "./decorators/bundlerClient.js";

export type BundlerClient<T extends Transport = Transport> = Client<
  T,
  Chain,
  undefined,
  [...PublicRpcSchema, ...BundlerRpcSchema],
  PublicActions<T, Chain> & BundlerActions
>;

export const createBundlerClientFromExisting: <
  T extends Transport | FallbackTransport = Transport
>(
  client: PublicClient<T, Chain>
) => BundlerClient<T> = <T extends Transport | FallbackTransport = Transport>(
  client: PublicClient<T, Chain>
): BundlerClient<T> => {
  return client.extend(bundlerActions);
};

/**
 * Creates a PublicClient with methods for calling Bundler RPC methods
 * @returns
 */
export function createBundlerClient<TTransport extends Transport>(
  args: PublicClientConfig<TTransport, Chain>
): BundlerClient<TTransport>;

export function createBundlerClient(args: PublicClientConfig): BundlerClient {
  if (!args.chain) {
    throw new Error("Chain must be provided");
  }
  const { key = "bundler-public", name = "Public Bundler Client" } = args;

  const { transport, ...opts } = args;
  const resolvedTransport = transport({
    chain: args.chain,
    pollingInterval: opts.pollingInterval,
  });

  const baseParameters = {
    ...args,
    key,
    name,
    type: "bundlerClient",
  };

  const client = (() => {
    if (resolvedTransport.config.type === "http") {
      const { url, fetchOptions } = resolvedTransport.value as {
        fetchOptions: HttpTransportConfig["fetchOptions"];
        url: string;
      };

      return createClient<Transport, Chain>({
        ...baseParameters,
        transport: http(url, {
          ...resolvedTransport.config,
          fetchOptions: {
            ...fetchOptions,
            headers: {
              ...fetchOptions?.headers,
              "Alchemy-AA-Sdk-Version": VERSION,
            },
          },
        }),
      });
    }

    return createClient<Transport, Chain>(baseParameters);
  })();

  return client.extend(publicActions).extend(bundlerActions);
}
