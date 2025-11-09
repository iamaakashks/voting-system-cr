import React from 'react';
import { Transaction } from '../types';

// A simple utility to format time since an event
const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "a few seconds ago";
}


const TransactionFeed: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg h-full sticky top-24">
            <div className="p-4 border-b border-gray-700">
                <h3 className="font-bold text-lg text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="10" r="10" />
                    </svg>
                    Live Vote Feed
                </h3>
                <p className="text-xs text-gray-400 mt-1">Recent votes across all elections</p>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
                {transactions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No recent votes yet.</p>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.txHash} className="bg-gray-900/50 p-3 rounded-md border border-gray-700/50">
                             <p className="text-sm font-semibold text-blue-300 truncate">{tx.electionTitle}</p>
                             <p className="text-xs text-gray-400 mt-1">{timeSince(new Date(tx.timestamp))}</p>
                             <a 
                                href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-green-400 hover:text-green-300 mt-2 block truncate font-mono"
                             >
                                Tx: {tx.txHash.substring(0, 12)}...{tx.txHash.substring(tx.txHash.length - 10)}
                            </a>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TransactionFeed;