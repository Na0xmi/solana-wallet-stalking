import React, { useState } from 'react';
import './SolanaWalletDashboard.css';

const SolanaWalletDashboard = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [balanceData, setBalanceData] = useState(null);
  const [transactionData, setTransactionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState(null);
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const fetchWalletBalances = async (address) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would come from environment variables
      const API_KEY = process.env.REACT_APP_DUNE_API_KEY || 'your-api-key-here';
      const API_URL = `https://api.sim.dune.com/beta/svm/balances/${address}`;
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'X-Sim-Api-Key': API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBalanceData(data);
      
      // Fetch transactions after successfully getting balances
      await fetchWalletTransactions(address);
    } catch (err) {
      console.error('Error fetching wallet balances:', err);
      setError('Failed to fetch wallet balances. Please check the wallet address and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletTransactions = async (address) => {
    setLoadingTransactions(true);
    
    try {
      const API_KEY = process.env.REACT_APP_DUNE_API_KEY || 'your-api-key-here';
      const API_URL = `https://api.sim.dune.com/beta/svm/transactions/${address}`;
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'X-Sim-Api-Key': API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTransactionData(data);
    } catch (err) {
      console.error('Error fetching wallet transactions:', err);
      // Don't set error here as we don't want to override balance success
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSearch = () => {
    if (walletAddress.trim()) {
      // Reset show more states when searching new wallet
      setShowAllTokens(false);
      setShowAllTransactions(false);
      fetchWalletBalances(walletAddress.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatTokenAmount = (amount, decimals) => {
    const actualAmount = parseFloat(amount) / Math.pow(10, decimals || 0);
    return actualAmount.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  const calculateTotalValue = (balances) => {
    if (!balances || !Array.isArray(balances)) return 0;
    
    return balances.reduce((total, balance) => {
      const value = parseFloat(balance.value_usd) || 0;
      return total + value;
    }, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatTimestamp = (timestamp) => {
    // Convert microseconds to milliseconds
    const date = new Date(timestamp / 1000);
    return date.toLocaleString();
  };

  const formatSOL = (lamports) => {
    return (lamports / 1000000000).toFixed(4); // Convert lamports to SOL
  };

  const getTransactionType = (transaction) => {
    const { preBalances, postBalances } = transaction.raw_transaction.meta;
    if (preBalances[0] > postBalances[0]) {
      return { type: 'Sent', color: '#ef4444' };
    } else if (preBalances[0] < postBalances[0]) {
      return { type: 'Received', color: '#10b981' };
    }
    return { type: 'Other', color: '#6b7280' };
  };

  // Constants for pagination
  const TOKENS_PER_PAGE = 15; // 5 rows x 3 columns
  const TRANSACTIONS_PER_PAGE = 10;

  return (
    <div className="dashboard-container">
      {/* Animated Background */}
      <div className="animated-background"></div>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <h1 className="header-title">
            Stalk your frens on Solana 
          </h1>
          <div className="alucard-gif">
            <img 
              src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGdodm5wazYxNTZnbWoxNW03ajNjcXdsNDM4dWlscGhuMWt0YmllaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/if9niVFg4IwAE/giphy.gif" 
              alt="Alucard Approves" 
              className="gif-image"
            />
          </div>
        </div>

        {/* Search Section */}
        <div className="search-container">
          <div className="search-form">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter Solana wallet address (e.g., DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK)"
              className="search-input"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="search-button"
            >
              {loading ? '🔄 Searching...' : '🔍 Search Balances'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Fetching wallet balances...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-container">
            <h3 className="error-title">⚠️ Error</h3>
            <p>{error}</p>
            <p className="error-subtitle">
              Make sure you have a valid API key set and the wallet address is correct.
            </p>
          </div>
        )}

        {/* Results */}
        {balanceData && !loading && (
          <div className="results-container">
            {/* Wallet Info */}
            <div className="wallet-info">
              <h3 className="wallet-title">🔮 Wallet Address:</h3>
              <div className="wallet-address">
                {walletAddress}
              </div>
              <p className="wallet-stats">
                Found {balanceData.balances_count || balanceData.balances?.length || 0} token balance
                {(balanceData.balances_count || balanceData.balances?.length || 0) !== 1 ? 's' : ''}
                {balanceData.processing_time_ms && ` • Processed in ${balanceData.processing_time_ms}ms`}
              </p>
            </div>

            {/* Portfolio Value Summary */}
            <div className="portfolio-summary">
              <div className="portfolio-value-card">
                <div className="portfolio-header">
                  <h3 className="portfolio-title">💰 Total Portfolio Value</h3>
                </div>
                <div className="portfolio-value">
                  {formatCurrency(calculateTotalValue(balanceData.balances))}
                </div>
                <div className="portfolio-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Tokens:</span>
                    <span className="stat-value">{balanceData.balances?.length || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Tokens with Value:</span>
                    <span className="stat-value">
                      {balanceData.balances?.filter(b => parseFloat(b.value_usd) > 0).length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Token Balances */}
            {balanceData.balances && balanceData.balances.length > 0 ? (
              <div>
                <div className="balances-grid">
                  {(showAllTokens ? balanceData.balances : balanceData.balances.slice(0, TOKENS_PER_PAGE)).map((balance, index) => (
                    <div
                      key={index}
                      className="balance-card"
                    >
                      <div className="token-header">
                        <h4 className="token-name">
                          {balance.name || 'Unknown Token'}
                        </h4>
                        <p className="token-symbol">
                          {balance.symbol || 'N/A'}
                        </p>
                      </div>

                      <div className="token-amounts">
                        <p className="token-amount">
                          {formatTokenAmount(balance.amount, balance.decimals)}
                        </p>
                        {balance.value_usd > 0 && (
                          <p className="token-value">
                            ≈ ${balance.value_usd.toFixed(2)} USD
                          </p>
                        )}
                      </div>

                      <div className="token-details">
                        {balance.chain && (
                          <div className="token-detail">
                            <span>Chain:</span>
                            <span>{balance.chain}</span>
                          </div>
                        )}
                        {balance.decimals !== undefined && (
                          <div className="token-detail">
                            <span>Decimals:</span>
                            <span>{balance.decimals}</span>
                          </div>
                        )}
                        {balance.total_supply && (
                          <div className="token-detail">
                            <span>Total Supply:</span>
                            <span>
                              {parseInt(balance.total_supply).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {balance.price_usd && (
                          <div className="token-detail">
                            <span>Price:</span>
                            <span>${balance.price_usd}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {balanceData.balances.length > TOKENS_PER_PAGE && (
                  <div className="show-more-container">
                    <button 
                      className="show-more-btn"
                      onClick={() => setShowAllTokens(!showAllTokens)}
                    >
                      {showAllTokens 
                        ? `🔼 Show Less (${TOKENS_PER_PAGE} tokens)` 
                        : `🔽 Show More (${balanceData.balances.length - TOKENS_PER_PAGE} more tokens)`
                      }
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-results">
                <h3>No token balances found</h3>
                <p>
                  This wallet doesn't appear to have any token balances, or the address might be invalid.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Transactions Section */}
        {balanceData && (
          <div className="transactions-section">
            <div className="section-header">
              <h2 className="section-title">📋 Recent Transactions</h2>
              {loadingTransactions && <div className="mini-spinner"></div>}
            </div>

            {transactionData && transactionData.transactions && transactionData.transactions.length > 0 ? (
              <div>
                <div className="transactions-container">
                  {(showAllTransactions ? transactionData.transactions : transactionData.transactions.slice(0, TRANSACTIONS_PER_PAGE)).map((transaction, index) => {
                    const txType = getTransactionType(transaction);
                    const fee = transaction.raw_transaction.meta.fee;
                    
                    return (
                      <div key={index} className="transaction-card">
                        <div className="transaction-header">
                          <div className="transaction-type" style={{ color: txType.color }}>
                            {txType.type === 'Sent' ? '↗️' : txType.type === 'Received' ? '↙️' : '🔄'} {txType.type}
                          </div>
                          <div className="transaction-time">
                            {formatTimestamp(transaction.block_time)}
                          </div>
                        </div>

                        <div className="transaction-details">
                          <div className="transaction-detail">
                            <span>Block Slot:</span>
                            <span>{transaction.block_slot.toLocaleString()}</span>
                          </div>
                          <div className="transaction-detail">
                            <span>Fee:</span>
                            <span>{formatSOL(fee)} SOL</span>
                          </div>
                          <div className="transaction-detail">
                            <span>Status:</span>
                            <span className={transaction.raw_transaction.meta.err ? 'status-error' : 'status-success'}>
                              {transaction.raw_transaction.meta.err ? 'Failed' : 'Success'}
                            </span>
                          </div>
                        </div>

                        <div className="transaction-signature">
                          <span>Signature:</span>
                          <div className="signature-hash">
                            {transaction.raw_transaction.transaction.signatures[0]}
                          </div>
                        </div>

                        {transaction.raw_transaction.meta.logMessages && transaction.raw_transaction.meta.logMessages.length > 0 && (
                          <div className="transaction-logs">
                            <details>
                              <summary>View Logs ({transaction.raw_transaction.meta.logMessages.length})</summary>
                              <div className="log-messages">
                                {transaction.raw_transaction.meta.logMessages.slice(0, 5).map((log, logIndex) => (
                                  <div key={logIndex} className="log-message">
                                    {log}
                                  </div>
                                ))}
                                {transaction.raw_transaction.meta.logMessages.length > 5 && (
                                  <div className="log-message">
                                    ... and {transaction.raw_transaction.meta.logMessages.length - 5} more
                                  </div>
                                )}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {transactionData.transactions.length > TRANSACTIONS_PER_PAGE && (
                  <div className="show-more-container">
                    <button 
                      className="show-more-btn"
                      onClick={() => setShowAllTransactions(!showAllTransactions)}
                    >
                      {showAllTransactions 
                        ? `🔼 Show Less (${TRANSACTIONS_PER_PAGE} transactions)` 
                        : `🔽 Show More (${transactionData.transactions.length - TRANSACTIONS_PER_PAGE} more transactions)`
                      }
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !loadingTransactions && (
                <div className="no-transactions">
                  <h3>No recent transactions</h3>
                  <p>No transaction history found for this wallet.</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SolanaWalletDashboard;