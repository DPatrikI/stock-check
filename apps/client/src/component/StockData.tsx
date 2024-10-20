'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const minute = 60000;

interface StockInfo {
    symbol: string;
    currentPrice: number;
    lastUpdated: string;
    movingAverage: number;
    beingWatched: boolean;
}

export default function StockData({ symbol }: { symbol: string }) {
    const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    const SERVER_URL = process.env.SERVER_URL;

    const fetchStockData = async () => {
        setError('');
        try {
            setLoading(true);
            const response = await axios.get<StockInfo>(
                `${SERVER_URL}/stock/${symbol}`
            );
            console.log(response);
            setStockInfo(response.data);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const errorMessage = err.response.data.message || 'Error fetching stock data.';
                setError(errorMessage);
            } else {
                setError('Error fetching stock data.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStockData();
        const interval = setInterval(fetchStockData, minute);

        return () => clearInterval(interval);
    }, [symbol]);

    const handleStartTracking = async () => {
        try {
            await axios.put(`${SERVER_URL}/stock/${symbol}`);
            fetchStockData();
        } catch (err) {
            console.error('Error starting tracking:', err);
            setError('Failed to start tracking. Please try again.');
        }
    };

    const handleStopTracking = async () => {
        try {
            await axios.delete(`${SERVER_URL}/stock/${symbol}`);
            fetchStockData();
        } catch (err) {
            console.error('Error stopping tracking:', err);
            setError('Failed to stop tracking. Please try again.');
        }
    };

    if (loading) {
        return <div className="text-center text-white">Loading...</div>;
    }

    if (error || !stockInfo) {
        return <div className="text-red-500 text-center">{error || 'No data available.'}</div>;
    }

    return (
        <div className="StockCard p-6 bg-white shadow-lg rounded-lg text-black max-w-lg">
            <h2 className="text-3xl font-bold mb-4 text-center">{stockInfo.symbol}</h2>
            <div className="mb-2">
                <span className="font-semibold">Current Price:</span> ${stockInfo.currentPrice.toFixed(2)}
            </div>
            <div className="mb-2">
                <span className="font-semibold">Last Updated:</span> {new Date(stockInfo.lastUpdated).toLocaleString()}
            </div>
            <div className="mb-4">
                <span className="font-semibold">Moving Average:</span> ${stockInfo.movingAverage.toFixed(2)}
            </div>
            {stockInfo.beingWatched ? (
                <button
                    onClick={handleStopTracking}
                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded w-full"
                >
                    Stop Tracking
                </button>
            ) : (
                <button
                    onClick={handleStartTracking}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded w-full"
                >
                    Start Tracking
                </button>
            )}
        </div>
    );
}