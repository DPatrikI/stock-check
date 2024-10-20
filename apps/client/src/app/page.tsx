'use client';

import { useState } from 'react';
import StockData from '@/component/StockData';

export default function Home() {
  const [symbol, setSymbol] = useState<string>('');
  const [symbolToFetch, setSymbolToFetch] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handlePriceFetch = async () => {
    setSymbolToFetch(symbol);
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
          onClick={handlePriceFetch}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Get current price
        </button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {symbolToFetch && (
        <StockData symbol={symbolToFetch} />
      )}
    </div>
  );
}
