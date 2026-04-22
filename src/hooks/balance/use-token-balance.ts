import { useQuery } from "@tanstack/react-query";
import { useChainId, useConnection } from "wagmi";
import { readContract, getBalance } from "wagmi/actions";
import { config } from "@/lib/wagmi";
import { formatUnits } from "viem/utils";
import { erc20Abi, zeroAddress } from "viem";
import { getAddresses, type ChainAddresses } from "@/lib/addresses/addresses";
import type { HexAddress } from "@/lib/utils/tx-types";

const NATIVE_TOKEN_ALT = "0x0000000000000000000000000000000000000001";

export type TokenKey = keyof ChainAddresses;

export const tokenBalanceKeys = {
  all: ["tokenBalance"] as const,
  token: (chainId: number, tokenKey: string, userAddress: string | undefined) =>
    [...tokenBalanceKeys.all, chainId, tokenKey, userAddress] as const,
};

const DISPLAY_DECIMALS = 6;

/** On-chain decimals per token symbol */
export const TOKEN_DECIMALS: Record<string, number> = {
  cUSD: 18,
  USDT: 6,
};

export const useUserTokenBalance = (
  tokenKey: TokenKey,
  decimals: number,
  enabled = true,
) => {
  const { address } = useConnection();
  const chainId = useChainId();
  const tokenAddress = getAddresses(chainId)[tokenKey] as HexAddress;

  const {
    data: rawBalance,
    isLoading,
    error,
  } = useQuery({
    queryKey: tokenBalanceKeys.token(chainId, tokenKey, address),
    queryFn: async () => {
      if (!address || !tokenAddress) return BigInt(0);
      try {
        if (tokenAddress === zeroAddress || tokenAddress === NATIVE_TOKEN_ALT) {
          const result = await getBalance(config, {
            address: address,
          });
          return result.value;
        }

        const result = await readContract(config, {
          abi: erc20Abi,
          address: tokenAddress,
          functionName: "balanceOf",
          args: [address],
        });
        return result;
      } catch {
        return BigInt(0);
      }
    },
    enabled: enabled && !!address && !!tokenAddress,
    staleTime: 5000,
  });

  const formatted = rawBalance
    ? parseFloat(formatUnits(rawBalance as bigint, decimals)).toFixed(
        DISPLAY_DECIMALS,
      )
    : "0";

  const parsed = rawBalance
    ? parseFloat(formatUnits(rawBalance as bigint, decimals))
    : 0;

  return {
    tokenAddress,
    userTokenBalanceFormatted: formatted,
    userTokenBalanceParsed: parsed,
    tokenBalanceLoading: isLoading,
    tokenBalanceError: error,
  };
};
