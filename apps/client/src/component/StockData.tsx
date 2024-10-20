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
            setStockInfo(response.data);
        } catch (err) {
            setError('Error fetching stock data.');
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
        return <div>Loading...</div>;
    }

    if (error || !stockInfo) {
        return <div className="text-red-500">{error || 'No data available.'}</div>;
    }

    return (
        <div className="p-4 bg-white shadow rounded text-black">
            <h2 className="text-2xl font-bold mb-2">{stockInfo.symbol}</h2>
            <p>Current Price: ${stockInfo.currentPrice.toFixed(2)}</p>
            <p>Last Updated: {new Date(stockInfo.lastUpdated).toLocaleString()}</p>
            <p>Moving Average: ${stockInfo.movingAverage.toFixed(2)}</p>
            {stockInfo.beingWatched ? (
                <button
                    onClick={handleStopTracking}
                    className="bg-red-500 text-white p-2 rounded mt-4"
                >
                    Stop Tracking
                </button>
            ) : (
                <button
                    onClick={handleStartTracking}
                    className="bg-blue-500 text-white p-2 rounded mt-4"
                >
                    Start Tracking
                </button>
            )}
        </div>
    );
};