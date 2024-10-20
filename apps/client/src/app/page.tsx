'use client';

import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [price, setPrice] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const getPrice = async () => {
    try {
      const result = await axios.get(
        `${process.env.SERVER_URL}/stock/${symbol}`
      );
      setPrice(result.data.currentPrice);
      setError('');
    } catch (error) {
      console.error('Error getting price:', error);
      setError('Failed to get price. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Stock Price Checker</h1>
      <div className="mb-4">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="border p-2 mr-2 text-black"
        />
        <button
          onClick={getPrice}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Get current price
        </button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {price > 0 && (
        <>
          <p>symbol: {symbol} price: {price}</p>
        </>
      )}
    </div>
  );
}
