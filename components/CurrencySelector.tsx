"use client";

import React from "react";
import { useCurrency } from "./CurrencyProvider";

const currencies = [
  { code: "SAR", label: "SAR (Saudi Riyal)" },
  { code: "USD", label: "USD (US Dollar)" },
  { code: "GBP", label: "GBP (British Pound)" },
  { code: "EUR", label: "EUR (Euro)" },
  { code: "CAD", label: "CAD (Canadian Dollar)" },
  { code: "AUD", label: "AUD (Australian Dollar)" },
];

export function CurrencySelector() {
  const { currency, changeCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="currency-select" className="text-sm font-medium text-zinc-700">
        Currency:
      </label>
      <select
        id="currency-select"
        value={currency}
        onChange={(e) => changeCurrency(e.target.value)}
        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white"
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
