export const PayerPolicyAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "factory_",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "canPay",
    inputs: [
      {
        name: "payer",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "creator",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "ok",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "reason",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "factory",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPolicy",
    inputs: [
      {
        name: "payer",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct PayerPolicy.Policy",
        components: [
          {
            name: "maxPerTx",
            type: "uint128",
            internalType: "uint128",
          },
          {
            name: "maxPerDay",
            type: "uint128",
            internalType: "uint128",
          },
          {
            name: "expiresAt",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "dayStart",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "spentToday",
            type: "uint128",
            internalType: "uint128",
          },
          {
            name: "minReputation",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "useWhitelist",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "active",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isCreatorAllowed",
    inputs: [
      {
        name: "payer",
        type: "address",
        internalType: "address",
      },
      {
        name: "creator",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isCreatorBlocked",
    inputs: [
      {
        name: "payer",
        type: "address",
        internalType: "address",
      },
      {
        name: "creator",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "recordSpend",
    inputs: [
      {
        name: "payer",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "creator",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "remainingToday",
    inputs: [
      {
        name: "payer",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint128",
        internalType: "uint128",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "revokePolicy",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setCreatorAllowed",
    inputs: [
      {
        name: "creator",
        type: "address",
        internalType: "address",
      },
      {
        name: "allowed_",
        type: "bool",
        internalType: "bool",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setCreatorBlocked",
    inputs: [
      {
        name: "creator",
        type: "address",
        internalType: "address",
      },
      {
        name: "blocked_",
        type: "bool",
        internalType: "bool",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setPolicy",
    inputs: [
      {
        name: "maxPerTx",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "maxPerDay",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "expiresAt",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "allowed",
        type: "address[]",
        internalType: "address[]",
      },
      {
        name: "blocked",
        type: "address[]",
        internalType: "address[]",
      },
      {
        name: "minRep",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "useWhitelist",
        type: "bool",
        internalType: "bool",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "CreatorAllowedUpdated",
    inputs: [
      {
        name: "payer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "allowed",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "CreatorBlockedUpdated",
    inputs: [
      {
        name: "payer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "blocked",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PolicyRevoked",
    inputs: [
      {
        name: "payer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PolicySet",
    inputs: [
      {
        name: "payer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "maxPerTx",
        type: "uint128",
        indexed: false,
        internalType: "uint128",
      },
      {
        name: "maxPerDay",
        type: "uint128",
        indexed: false,
        internalType: "uint128",
      },
      {
        name: "expiresAt",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
      {
        name: "minReputation",
        type: "uint8",
        indexed: false,
        internalType: "uint8",
      },
      {
        name: "useWhitelist",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SpendRecorded",
    inputs: [
      {
        name: "payer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint128",
        indexed: false,
        internalType: "uint128",
      },
      {
        name: "spentTodayAfter",
        type: "uint128",
        indexed: false,
        internalType: "uint128",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "ExpiresInPast",
    inputs: [],
  },
  {
    type: "error",
    name: "MaxPerTxExceedsMaxPerDay",
    inputs: [],
  },
  {
    type: "error",
    name: "NotAuthorizedCaller",
    inputs: [],
  },
  {
    type: "error",
    name: "ZeroFactory",
    inputs: [],
  },
  {
    type: "error",
    name: "ZeroMaxPerDay",
    inputs: [],
  },
  {
    type: "error",
    name: "ZeroMaxPerTx",
    inputs: [],
  },
] as const;

export type PayerPolicyAbiType = typeof PayerPolicyAbi;
