export const InvoiceFactoryAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "cUSD_",
        type: "address",
        internalType: "address",
      },
      {
        name: "USDT_",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "USDT",
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
    name: "admin",
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
    name: "cUSD",
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
    name: "confirmInvoiceRequest",
    inputs: [
      {
        name: "requestId_",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "token_",
        type: "address",
        internalType: "address",
      },
      {
        name: "dueDate_",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "metadataURI_",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "invoiceId_",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "vault_",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createInvoice",
    inputs: [
      {
        name: "token_",
        type: "address",
        internalType: "address",
      },
      {
        name: "totalAmount_",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "dueDate_",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "metadataURI_",
        type: "string",
        internalType: "string",
      },
      {
        name: "isOpenPayment_",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "allowedPayers_",
        type: "address[]",
        internalType: "address[]",
      },
      {
        name: "payerAmounts_",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    outputs: [
      {
        name: "invoiceId_",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "vault_",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "invoiceCountOf",
    inputs: [
      {
        name: "user_",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "created",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "paying",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "invoiceRequests",
    inputs: [
      {
        name: "requestId",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "requester",
        type: "address",
        internalType: "address",
      },
      {
        name: "counterparty",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "notes",
        type: "string",
        internalType: "string",
      },
      {
        name: "fulfilled",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "rejected",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "createdAt",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "rejectedAt",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "rejectReason",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "invoicesByCreator",
    inputs: [
      {
        name: "creator_",
        type: "address",
        internalType: "address",
      },
      {
        name: "index_",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "invoicesByPayer",
    inputs: [
      {
        name: "payer_",
        type: "address",
        internalType: "address",
      },
      {
        name: "index_",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "invoicesOfCreator",
    inputs: [
      {
        name: "creator_",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32[]",
        internalType: "bytes32[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "invoicesOfPayer",
    inputs: [
      {
        name: "payer_",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32[]",
        internalType: "bytes32[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isVault",
    inputs: [
      {
        name: "addr",
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
    name: "policyContract",
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
    name: "rejectInvoiceRequest",
    inputs: [
      {
        name: "requestId_",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "reason_",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "requestInvoice",
    inputs: [
      {
        name: "counterparty_",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount_",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "notes_",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "requestId_",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setPolicyContract",
    inputs: [
      {
        name: "policy_",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "vaults",
    inputs: [
      {
        name: "invoiceId",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "vault",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "InvoiceCreated",
    inputs: [
      {
        name: "invoiceId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "vaultAddress",
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
        name: "token",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "totalAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "dueDate",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "isOpenPayment",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
      {
        name: "metadataURI",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "InvoiceRequestCreated",
    inputs: [
      {
        name: "requestId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "requester",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "counterparty",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "notes",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "InvoiceRequestFulfilled",
    inputs: [
      {
        name: "requestId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "invoiceId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "vaultAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "InvoiceRequestRejected",
    inputs: [
      {
        name: "requestId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "rejectedBy",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "reason",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PolicyContractSet",
    inputs: [
      {
        name: "policy",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "InvalidAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidDueDate",
    inputs: [],
  },
  {
    type: "error",
    name: "InvoiceAlreadyExists",
    inputs: [],
  },
  {
    type: "error",
    name: "LengthMismatch",
    inputs: [],
  },
  {
    type: "error",
    name: "NotAdmin",
    inputs: [],
  },
  {
    type: "error",
    name: "NotCounterparty",
    inputs: [],
  },
  {
    type: "error",
    name: "PolicyAlreadySet",
    inputs: [],
  },
  {
    type: "error",
    name: "RequestAlreadyFulfilled",
    inputs: [],
  },
  {
    type: "error",
    name: "RequestAlreadyRejected",
    inputs: [],
  },
  {
    type: "error",
    name: "RequestNotFound",
    inputs: [],
  },
  {
    type: "error",
    name: "UnsupportedToken",
    inputs: [],
  },
] as const;

export type InvoiceFactoryAbiType = typeof InvoiceFactoryAbi;
