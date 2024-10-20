'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const minute = 60000;

interface StockInfo {
    symbol: string;
    currentPrice: number;
    lastUpdated: string;
    movingAverage: number;
}

export default function StockData({ symbol }: { symbol: string }) {
    const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchStockData = async () => {
            try {
                setLoading(true);
                const response = await axios.get<StockInfo>(
                    `${process.env.SERVER_URL}/stock/${symbol}`
                );
                setStockInfo(response.data);
            } catch (err) {
                setError('Error fetching stock data.');
            } finally {
                setLoading(false);
            }
        };

        fetchStockData();
        const interval = setInterval(fetchStockData, minute);

        return () => clearInterval(interval);
    }, [symbol]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error || !stockInfo) {
        return <div className="text-red-500">{error || 'No data available.'}</div>;
    }

    return (
        <div className="p-4 bg-white shadow rounded">
            <h2 className="text-2xl font-bold mb-2">{stockInfo.symbol}</h2>
            <p>Current Price: ${stockInfo.currentPrice.toFixed(2)}</p>
            <p>Last Updated: {new Date(stockInfo.lastUpdated).toLocaleString()}</p>
            <p>Moving Average: ${stockInfo.movingAverage.toFixed(2)}</p>
        </div>
    );
};