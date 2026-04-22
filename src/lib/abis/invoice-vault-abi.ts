export const InvoiceVaultAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "p",
        type: "tuple",
        internalType: "struct IInvoiceVault.InitParams",
        components: [
          {
            name: "creator",
            type: "address",
            internalType: "address",
          },
          {
            name: "factory",
            type: "address",
            internalType: "address",
          },
          {
            name: "token",
            type: "address",
            internalType: "address",
          },
          {
            name: "invoiceId",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "totalAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "dueDate",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "metadataURI",
            type: "string",
            internalType: "string",
          },
          {
            name: "isOpenPayment",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "allowedPayers",
            type: "address[]",
            internalType: "address[]",
          },
          {
            name: "payerAmounts",
            type: "uint256[]",
            internalType: "uint256[]",
          },
          {
            name: "policyContract",
            type: "address",
            internalType: "address",
          },
        ],
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "CLAIM_WINDOW",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "addPayer",
    inputs: [
      {
        name: "payer",
        type: "address",
        internalType: "address",
      },
      {
        name: "amountDue",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allPayersDeclined",
    inputs: [],
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
    name: "cancel",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimDeadline",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createdAt",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "creator",
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
    name: "decline",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "declined",
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
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "dispute",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "dueDate",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "emergencySweep",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "expire",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
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
    name: "invoiceId",
    inputs: [],
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
    name: "isFullyFunded",
    inputs: [],
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
    name: "isOpenPayment",
    inputs: [],
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
    name: "metadataURI",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "payOnBehalfOf",
    inputs: [
      {
        name: "delegate",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "beneficiary",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "payerInfo",
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
        internalType: "struct IInvoiceVault.PayerInfo",
        components: [
          {
            name: "amountDue",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "amountPaid",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "isAllowed",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "paidBy",
            type: "address",
            internalType: "address",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "payerList",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
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
    name: "refund",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "release",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "remaining",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setDelegate",
    inputs: [
      {
        name: "delegate",
        type: "address",
        internalType: "address",
      },
      {
        name: "beneficiary",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setOpenPayment",
    inputs: [
      {
        name: "isOpen",
        type: "bool",
        internalType: "bool",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "status",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum IInvoiceVault.VaultStatus",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "token",
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
    name: "tokenContract",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IERC20",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalAmount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalCollected",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "x402Pay",
    inputs: [
      {
        name: "from",
        type: "address",
        internalType: "address",
      },
      {
        name: "value",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "validAfter",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "validBefore",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "nonce",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "v",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "r",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "s",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "Cancelled",
    inputs: [
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "DelegateSet",
    inputs: [
      {
        name: "delegate",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "beneficiary",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      {
        name: "payer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "recordedAs",
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
        name: "totalCollected",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Disputed",
    inputs: [
      {
        name: "initiator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Expired",
    inputs: [
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "InvoiceDeclined",
    inputs: [
      {
        name: "payer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OpenPaymentChanged",
    inputs: [
      {
        name: "isOpen",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PayerAdded",
    inputs: [
      {
        name: "payer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amountDue",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Refunded",
    inputs: [
      {
        name: "payer",
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
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Released",
    inputs: [
      {
        name: "creator",
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
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "X402PaymentReceived",
    inputs: [
      {
        name: "agent",
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
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "AlreadyDeclined",
    inputs: [],
  },
  {
    type: "error",
    name: "AlreadyPaid",
    inputs: [],
  },
  {
    type: "error",
    name: "ClaimDeadlineExpired",
    inputs: [],
  },
  {
    type: "error",
    name: "ClaimDeadlineNotReached",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidDelegate",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidStatus",
    inputs: [],
  },
  {
    type: "error",
    name: "LengthMismatch",
    inputs: [],
  },
  {
    type: "error",
    name: "NotAuthorizedPayer",
    inputs: [],
  },
  {
    type: "error",
    name: "NotCreator",
    inputs: [],
  },
  {
    type: "error",
    name: "NothingToRefund",
    inputs: [],
  },
  {
    type: "error",
    name: "PastDueDate",
    inputs: [],
  },
  {
    type: "error",
    name: "PayerAlreadyAdded",
    inputs: [],
  },
  {
    type: "error",
    name: "PolicyDenied",
    inputs: [
      {
        name: "reason",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "ReentrancyGuardReentrantCall",
    inputs: [],
  },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "VaultNotPending",
    inputs: [],
  },
  {
    type: "error",
    name: "VaultNotRefundable",
    inputs: [],
  },
  {
    type: "error",
    name: "VaultNotSettleable",
    inputs: [],
  },
  {
    type: "error",
    name: "WrongAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "ZeroAmount",
    inputs: [],
  },
] as const;

export type InvoiceVaultAbiType = typeof InvoiceVaultAbi;
