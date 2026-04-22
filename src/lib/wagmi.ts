import { createConfig, http } from "wagmi";
import { celo, celoSepolia } from "wagmi/chains";
import { supportedChains } from "@/lib/chains";

export const config = createConfig({
  chains: supportedChains,
  transports: {
    [celo.id]: http(),
    [celoSepolia.id]: http(),
  },
});
