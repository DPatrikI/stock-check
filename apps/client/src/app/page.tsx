'use client';

import { useState } from 'react';
import StockData from '@/component/StockData';

export default function Home() {
  const [symbol, setSymbol] = useState<string>('');
  const [symbolToFetch, setSymbolToFetch] = useState<string>('');

  const handlePriceFetch = async () => {
    setSymbolToFetch(symbol);
  };

  return (
    <div className="container mx-auto p-6 bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-white text-center">
        Stock Price Checker
      </h1>
      <div className="flex justify-center mb-6">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="border p-3 mr-3 text-black rounded w-64"
          placeholder="Enter stock symbol"
        />
        <button
          onClick={handlePriceFetch}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded shadow"
        >
          Get current price
        </button>
      </div>
      {symbolToFetch && (
        <div className="flex justify-center">
          <StockData symbol={symbolToFetch} />
        </div>
      )}
    </div>
  );
}
