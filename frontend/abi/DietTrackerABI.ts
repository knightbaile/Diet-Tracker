
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const DietTrackerABI = {
  "abi": [
    {
      "inputs": [],
      "name": "ZamaProtocolUnsupported",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "numRecords",
          "type": "uint256"
        }
      ],
      "name": "calculateAverageBalance",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "avgBalance",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "confidentialProtocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllTimestamps",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "timestamps",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getLatestRecord",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "caloriesIn",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "caloriesOut",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "balance",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "getRecord",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "caloriesIn",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "caloriesOut",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "balance",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getRecordCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "count",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "encCaloriesIn",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "encCaloriesOut",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "submitDailyData",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;

