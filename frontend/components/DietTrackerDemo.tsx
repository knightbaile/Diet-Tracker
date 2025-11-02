"use client";

import { useState } from "react";
import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useDietTracker } from "../hooks/useDietTracker";

/**
 * Format a clear value to display, handling signed integers correctly
 * Supports both encodings by choosing the value with the smallest absolute magnitude.
 */
function formatClearValue(value: string | bigint | boolean | undefined): string {
  if (value === undefined || value === null) {
    return "N/A";
  }

  if (typeof value === "boolean") {
    return value.toString();
  }

  const MOD_32 = 2n ** 32n;  // 2^32
  const PIVOT = 2n ** 31n;   // 2^31
  const MAX_INT32 = 2147483647n; // 2^31 - 1

  let bigIntValue: bigint;
  if (typeof value === "bigint") {
    bigIntValue = value;
  } else if (typeof value === "string") {
    try {
      bigIntValue = BigInt(value);
    } catch {
      return value; // Not numeric string
    }
  } else {
    return String(value);
  }

  const tc = bigIntValue > MAX_INT32 ? bigIntValue - MOD_32 : bigIntValue; // two's complement
  const centered = bigIntValue - PIVOT;                                    // centered at 2^31

  const abs = (x: bigint) => (x < 0n ? -x : x);
  const chosen = abs(tc) <= abs(centered) ? tc : centered;
  return chosen.toString();
}

export const DietTrackerDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  // FHEVM instance
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  // DietTracker hook
  const dietTracker = useDietTracker({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  // Form state
  const [caloriesIn, setCaloriesIn] = useState<string>("");
  const [caloriesOut, setCaloriesOut] = useState<string>("");
  const [numRecordsForAvg, setNumRecordsForAvg] = useState<string>("7");

  const buttonPrimaryClass =
    "inline-flex items-center justify-center rounded-md bg-yellow-300 px-6 py-3 font-semibold text-black " +
    "transition-all duration-200 hover:bg-yellow-400 active:bg-yellow-500 " +
    "focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-black " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-yellow-300";

  const buttonSecondaryClass =
    "inline-flex items-center justify-center rounded-md bg-blue-300 px-6 py-3 font-semibold text-black " +
    "transition-all duration-200 hover:bg-blue-400 active:bg-blue-500 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-black " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-300";

  const inputClass =
    "w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-md text-yellow-200 placeholder-gray-500 " +
    "focus:outline-none focus:border-yellow-300 focus:ring-1 focus:ring-yellow-300 transition-colors";

  const cardClass = "bg-gray-900 rounded-lg p-6 border-2 border-gray-800";

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-yellow-300 mb-4">FHE Diet Tracker</h1>
          <p className="text-blue-200 text-lg mb-8">Privacy-Preserving Calorie Tracking</p>
          <button className={buttonPrimaryClass} onClick={connect}>
            <span className="text-xl">Connect Wallet</span>
          </button>
        </div>
      </div>
    );
  }

  if (dietTracker.isDeployed === false) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className={cardClass}>
            <h2 className="text-3xl font-bold text-yellow-300 mb-4">Contract Not Found</h2>
            <p className="text-blue-200 text-lg">
              The DietTracker contract is not deployed on Chain ID {chainId}. Please deploy the contract to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-5xl font-bold text-yellow-300 mb-3">FHE Diet Tracker</h1>
          <p className="text-blue-200 text-xl">Encrypted Calorie Management on Blockchain</p>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-yellow-300 mb-3 uppercase tracking-wide">Network</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Chain ID</span>
                <span className="text-blue-200 font-mono text-sm">{chainId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">FHEVM</span>
                <span className={`text-sm font-semibold ${fhevmInstance ? 'text-yellow-300' : 'text-gray-500'}`}>
                  {fhevmInstance ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-yellow-300 mb-3 uppercase tracking-wide">Account</h3>
            <p className="text-blue-200 font-mono text-xs break-all">{accounts?.[0]}</p>
          </div>
          
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-yellow-300 mb-3 uppercase tracking-wide">Contract</h3>
            <p className="text-blue-200 font-mono text-xs break-all">
              {dietTracker.contractAddress || "Not deployed"}
            </p>
          </div>
        </div>

        {/* Data Entry Section */}
        <div className={cardClass}>
          <h2 className="text-2xl font-bold text-yellow-300 mb-6">Record Daily Intake</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-2 uppercase tracking-wide">
                Calories Consumed
              </label>
              <input
                type="number"
                className={inputClass}
                value={caloriesIn}
                onChange={(e) => setCaloriesIn(e.target.value)}
                placeholder="Enter calories"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-2 uppercase tracking-wide">
                Calories Burned
              </label>
              <input
                type="number"
                className={inputClass}
                value={caloriesOut}
                onChange={(e) => setCaloriesOut(e.target.value)}
                placeholder="Enter calories"
                min="0"
              />
            </div>
          </div>
          <button
            className={buttonPrimaryClass}
            disabled={!dietTracker.canSubmit || !caloriesIn || !caloriesOut}
            onClick={() => {
              const inVal = parseInt(caloriesIn);
              const outVal = parseInt(caloriesOut);
              if (inVal > 0 && outVal >= 0) {
                dietTracker.submitDailyData(inVal, outVal);
                setCaloriesIn("");
                setCaloriesOut("");
              }
            }}
          >
            {dietTracker.isSubmitting ? "Processing..." : "Submit Data"}
          </button>
        </div>

        {/* Records Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest Record */}
          <div className={cardClass}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-300">Latest Entry</h2>
              <button
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-blue-200 text-sm font-medium transition-colors"
                onClick={dietTracker.refreshLatestRecord}
                disabled={dietTracker.isRefreshing}
              >
                {dietTracker.isRefreshing ? "Loading..." : "Refresh"}
              </button>
            </div>

            {dietTracker.recordCount !== undefined && (
              <div className="mb-4 pb-4 border-b border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm uppercase tracking-wide">Total Entries</span>
                  <span className="text-yellow-300 text-2xl font-bold">{dietTracker.recordCount.toString()}</span>
                </div>
              </div>
            )}

            {dietTracker.latestRecord ? (
              <div className="space-y-4">
                {dietTracker.latestRecord.timestamp && (
                  <div className="text-blue-200 text-sm mb-4">
                    {new Date(Number(dietTracker.latestRecord.timestamp) * 1000).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}

                {dietTracker.clearValues ? (
                  <div className="bg-gray-800 border-2 border-yellow-300 rounded-lg p-5 space-y-3">
                    <h3 className="text-yellow-300 font-semibold mb-3 uppercase tracking-wide text-sm">Decrypted Data</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-200">Consumed</span>
                        <span className="text-yellow-300 font-mono text-lg font-bold">
                          {formatClearValue(dietTracker.clearValues.caloriesIn?.clear)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-200">Burned</span>
                        <span className="text-yellow-300 font-mono text-lg font-bold">
                          {formatClearValue(dietTracker.clearValues.caloriesOut?.clear)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                        <span className="text-blue-200 font-semibold">Net Balance</span>
                        <span className="text-yellow-300 font-mono text-xl font-bold">
                          {formatClearValue(dietTracker.clearValues.balance?.clear)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm text-center">Encrypted data available. Click decrypt to view.</p>
                  </div>
                )}

                <button
                  className={buttonSecondaryClass + " w-full"}
                  disabled={!dietTracker.canDecrypt}
                  onClick={dietTracker.decryptLatestRecord}
                >
                  {dietTracker.isDecrypting ? "Decrypting..." : "Decrypt Entry"}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No entries yet. Submit your first record above.</p>
              </div>
            )}
          </div>

          {/* Average Calculation */}
          <div className={cardClass}>
            <h2 className="text-2xl font-bold text-yellow-300 mb-6">Average Balance</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-blue-200 mb-2 uppercase tracking-wide">
                Number of Recent Entries
              </label>
              <input
                type="number"
                className={inputClass}
                value={numRecordsForAvg}
                onChange={(e) => setNumRecordsForAvg(e.target.value)}
                placeholder="e.g., 7 days"
                min="1"
              />
            </div>

            <div className="space-y-4 mb-6">
              <button
                className={buttonPrimaryClass + " w-full"}
                disabled={!dietTracker.canCalculateAvg || !numRecordsForAvg}
                onClick={() => {
                  const num = parseInt(numRecordsForAvg);
                  if (num > 0) {
                    dietTracker.calculateAverageBalance(num);
                  }
                }}
              >
                {dietTracker.isCalculatingAvg ? "Computing..." : "Calculate Average"}
              </button>

              {dietTracker.avgBalanceHandle && (
                <button
                  className={buttonSecondaryClass + " w-full"}
                  disabled={!dietTracker.canDecryptAvg}
                  onClick={dietTracker.decryptAverageBalance}
                >
                  {dietTracker.isDecryptingAvg ? "Decrypting..." : "Decrypt Result"}
                </button>
              )}
            </div>

            {dietTracker.avgBalanceHandle && !dietTracker.clearAvgBalance && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm text-center">Encrypted average available. Click decrypt to view.</p>
              </div>
            )}

            {dietTracker.clearAvgBalance && (
              <div className="bg-gray-800 border-2 border-blue-300 rounded-lg p-6 text-center">
                <h3 className="text-blue-300 font-semibold mb-3 uppercase tracking-wide text-sm">Average Net Balance</h3>
                <p className="text-yellow-300 text-4xl font-bold font-mono">
                  {formatClearValue(dietTracker.clearAvgBalance.clear)}
                </p>
                <p className="text-gray-400 text-xs mt-2">calories per day</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {dietTracker.message && (
          <div className={cardClass}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-yellow-300 rounded-full mt-1.5"></div>
              <p className="text-blue-200 text-sm leading-relaxed">{dietTracker.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

