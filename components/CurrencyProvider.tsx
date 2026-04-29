"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface CurrencyContextType {
  currency: string;
  changeCurrency: (newCurr: string) => void;
  formatPrice: (priceInSAR: number) => string;
  rates: Record<string, number>;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrency] = useState("SAR");
  const [rates, setRates] = useState<Record<string, number>>({});

  useEffect(() => {
    // 1. Get saved currency from localStorage
    const saved = localStorage.getItem("currency");
    if (saved) setCurrency(saved);

    // 2. Fetch exchange rates based on SAR
    fetch("https://www.floatrates.com/daily/sar.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch rates");
        return res.json();
      })
      .then((data) => {
        const fetchedRates: Record<string, number> = {};
        if (data.usd) fetchedRates.USD = data.usd.rate;
        if (data.gbp) fetchedRates.GBP = data.gbp.rate;
        if (data.eur) fetchedRates.EUR = data.eur.rate;
        if (data.cad) fetchedRates.CAD = data.cad.rate;
        if (data.aud) fetchedRates.AUD = data.aud.rate;
        setRates(fetchedRates);
      })
      .catch((err) => console.error("Error fetching currency rates:", err));
  }, []);

  const changeCurrency = (newCurr: string) => {
    setCurrency(newCurr);
    localStorage.setItem("currency", newCurr);
  };

  const formatPrice = (priceInSAR: number) => {
    if (!Number.isFinite(priceInSAR)) return "-";
    
    if (currency === "SAR") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "SAR",
        maximumFractionDigits: 2,
      }).format(priceInSAR);
    }

    const rate = rates[currency] || 1;
    const converted = priceInSAR * rate;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency, formatPrice, rates }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
