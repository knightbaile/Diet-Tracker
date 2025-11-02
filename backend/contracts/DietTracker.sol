// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Diet Tracker Contract
/// @notice A privacy-preserving diet tracking system using FHEVM
/// @dev All calorie data is encrypted and calculations are performed on encrypted values
contract DietTracker is ZamaEthereumConfig {
    // User's daily diet records
    struct DailyRecord {
        euint32 caloriesIn;   // Encrypted calories consumed
        euint32 caloriesOut;  // Encrypted calories burned
        euint32 balance;      // Encrypted balance (caloriesIn - caloriesOut)
        uint256 timestamp;   // Plain timestamp for date tracking
    }

    // Mapping from user address to array of daily records
    mapping(address => DailyRecord[]) private userRecords;

    // Mapping from user address to their record count
    mapping(address => uint256) private userRecordCount;

    /// @notice Submit daily diet data (calories in and out)
    /// @param encCaloriesIn Encrypted calories consumed
    /// @param encCaloriesOut Encrypted calories burned
    /// @param inputProof Input proof for encrypted values
    function submitDailyData(
        externalEuint32 encCaloriesIn,
        externalEuint32 encCaloriesOut,
        bytes calldata inputProof
    ) external {
        // Convert external encrypted inputs to internal encrypted types
        euint32 caloriesIn = FHE.fromExternal(encCaloriesIn, inputProof);
        euint32 caloriesOut = FHE.fromExternal(encCaloriesOut, inputProof);

        // Calculate encrypted balance (caloriesIn - caloriesOut)
        euint32 balance = FHE.sub(caloriesIn, caloriesOut);

        // Create new daily record
        DailyRecord memory newRecord = DailyRecord({
            caloriesIn: caloriesIn,
            caloriesOut: caloriesOut,
            balance: balance,
            timestamp: block.timestamp
        });

        // Store the record
        userRecords[msg.sender].push(newRecord);
        userRecordCount[msg.sender]++;

        // Set ACL permissions for the user to decrypt their own data
        FHE.allowThis(caloriesIn);
        FHE.allow(caloriesIn, msg.sender);
        
        FHE.allowThis(caloriesOut);
        FHE.allow(caloriesOut, msg.sender);
        
        FHE.allowThis(balance);
        FHE.allow(balance, msg.sender);
    }

    /// @notice Get the latest daily record for the caller
    /// @return caloriesIn Encrypted calories consumed
    /// @return caloriesOut Encrypted calories burned
    /// @return balance Encrypted balance
    /// @return timestamp Plain timestamp
    function getLatestRecord() external view returns (
        euint32 caloriesIn,
        euint32 caloriesOut,
        euint32 balance,
        uint256 timestamp
    ) {
        require(userRecordCount[msg.sender] > 0, "No records found");
        DailyRecord memory record = userRecords[msg.sender][userRecordCount[msg.sender] - 1];
        return (record.caloriesIn, record.caloriesOut, record.balance, record.timestamp);
    }

    /// @notice Get a specific record by index
    /// @param index Index of the record (0-based)
    /// @return caloriesIn Encrypted calories consumed
    /// @return caloriesOut Encrypted calories burned
    /// @return balance Encrypted balance
    /// @return timestamp Plain timestamp
    function getRecord(uint256 index) external view returns (
        euint32 caloriesIn,
        euint32 caloriesOut,
        euint32 balance,
        uint256 timestamp
    ) {
        require(index < userRecordCount[msg.sender], "Index out of bounds");
        DailyRecord memory record = userRecords[msg.sender][index];
        return (record.caloriesIn, record.caloriesOut, record.balance, record.timestamp);
    }

    /// @notice Get the total number of records for the caller
    /// @return count Number of records
    function getRecordCount() external view returns (uint256 count) {
        return userRecordCount[msg.sender];
    }

    /// @notice Calculate encrypted average balance for recent records
    /// @param numRecords Number of recent records to include in average
    /// @return avgBalance Encrypted average balance
    /// @dev This function calculates the average of encrypted balances
    ///      The result is encrypted and can only be decrypted by the user
    function calculateAverageBalance(uint256 numRecords) external returns (euint32 avgBalance) {
        require(userRecordCount[msg.sender] > 0, "No records found");
        require(numRecords > 0, "numRecords must be greater than 0");
        
        uint256 count = numRecords;
        if (count > userRecordCount[msg.sender]) {
            count = userRecordCount[msg.sender];
        }

        // Start with zero (use 64-bit to prevent overflow during accumulation)
        // We compute average(caloriesIn) - average(caloriesOut) to avoid signed division on encrypted negatives.
        euint64 sumIn64 = FHE.asEuint64(0);
        euint64 sumOut64 = FHE.asEuint64(0);
        
        // Sum all balances
        uint256 startIndex = userRecordCount[msg.sender] - count;
        for (uint256 i = startIndex; i < userRecordCount[msg.sender]; i++) {
            sumIn64 = FHE.add(sumIn64, FHE.asEuint64(userRecords[msg.sender][i].caloriesIn));
            sumOut64 = FHE.add(sumOut64, FHE.asEuint64(userRecords[msg.sender][i].caloriesOut));
        }

        // Calculate per-component averages with rounding to nearest integer: (sum + count/2) / count
        uint64 half = uint64(count / 2);
        euint64 avgIn64 = FHE.div(FHE.add(sumIn64, half), uint64(count));
        euint64 avgOut64 = FHE.div(FHE.add(sumOut64, half), uint64(count));

        // Bring back to 32-bit domain, then compute difference (may be negative in two's complement)
        euint32 avgIn32 = FHE.asEuint32(avgIn64);
        euint32 avgOut32 = FHE.asEuint32(avgOut64);
        avgBalance = FHE.sub(avgIn32, avgOut32);
        
        // Set ACL permissions
        FHE.allowThis(avgBalance);
        FHE.allow(avgBalance, msg.sender);
    }

    /// @notice Get all record timestamps for the caller
    /// @return timestamps Array of timestamps
    function getAllTimestamps() external view returns (uint256[] memory timestamps) {
        uint256 count = userRecordCount[msg.sender];
        timestamps = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            timestamps[i] = userRecords[msg.sender][i].timestamp;
        }
    }
}

