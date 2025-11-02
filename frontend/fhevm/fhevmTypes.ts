export type HandleContractPair = {
  handle: string;
  contractAddress: `0x${string}`;
};

export type UserDecryptResults = Record<string, string | bigint | boolean>;
// Backward compatibility alias
export type DecryptedResults = UserDecryptResults;

export type FhevmStoredPublicKey = {
  publicKeyId: string;
  publicKey: Uint8Array;
};

export type FhevmStoredPublicParams = {
  publicParamsId: string;
  publicParams: Uint8Array;
};

export type FhevmInstanceConfig = {
  aclContractAddress: `0x${string}`;
  network: unknown;
  publicKey?:
    | { data: Uint8Array | null; id: string | null }
    | FhevmStoredPublicKey
    | null;
  publicParams?: { "2048": FhevmStoredPublicParams } | null;
  [key: string]: unknown;
};

export type FhevmInstance = {
  createEncryptedInput: (
    contractAddress: string,
    userAddress: string
  ) => {
    add32: (value: bigint) => void;
    encrypt: () => Promise<{ handles: string[]; inputProof: string }>;
  };
  userDecrypt: (
    pairs: HandleContractPair[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: readonly `0x${string}`[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<UserDecryptResults>;
  createEIP712: (
    publicKey: string,
    contractAddresses: readonly string[]
  ) => EIP712Type;
  generateKeypair: () => { publicKey: string; privateKey: string };
  getPublicKey: () => FhevmStoredPublicKey | null;
  getPublicParams: (bits: number) => FhevmStoredPublicParams | null;
};

export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number; // Unix timestamp in seconds
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};

export type EIP712Type = {
  domain: {
    chainId: number;
    name: string;
    verifyingContract: `0x${string}`;
    version: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any;
  primaryType: string;
  types: {
    [key: string]: {
      name: string;
      type: string;
    }[];
  };
};

