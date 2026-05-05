"use client";

import { useState, useEffect, ChangeEvent } from "react";

type PackageItem = {
  uuid?: string | null;
  detailed_html?: string | null;
};

export default function ScraperPage() {
  const [cookie, setCookie] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const savedCookie = localStorage.getItem("nusuk_cookie");
    if (savedCookie) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCookie(savedCookie);
    }
  }, []);

  const handleScrape = async () => {
    setLoading(true);
    setResult(null);
    try {
      localStorage.setItem("nusuk_cookie", cookie);
      
      const res = await fetch("/api/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Success! ${data.message} (Count: ${data.count}). Now fetching details...`);
        // Automatically trigger details scraping
        await handleScrapeDetails();
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (err: unknown) {
      setResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeDetails = async () => {
    setLoadingDetails(true);
    setResult("Starting to fetch detailed data. This may take a while...");
    setProgress({ current: 0, total: 0 });
    
    try {
      localStorage.setItem("nusuk_cookie", cookie);
      
      // Step 1: Get all packages
      const pkgRes = await fetch("/api/packages", {
        headers: { "Cache-Control": "no-store" }
      });
      const pkgData = await pkgRes.json();
      
      if (!pkgRes.ok || !pkgData.packages || pkgData.packages.length === 0) {
        setResult("Error: No packages found. Please scrape packages first.");
        setLoadingDetails(false);
        return;
      }
      
      // Filter packages that do NOT have detailed_html yet
      const packagesToScrape = (pkgData.packages as PackageItem[]).filter(
        (pkg) => !pkg.detailed_html
      );
      const total = packagesToScrape.length;
      
      if (total === 0) {
        setResult(`Success! All ${pkgData.packages.length} packages already have their details scraped.`);
        setLoadingDetails(false);
        return;
      }
      
      setProgress({ current: 0, total });
      
      let updatedCount = 0;
      const errors: string[] = [];
      
      // Step 2: Iterate and scrape each package detail
      for (let i = 0; i < total; i++) {
        const pkg = packagesToScrape[i];
        
        if (pkg.uuid) {
          try {
            const res = await fetch("/api/scrape-single-detail", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cookie, uuid: pkg.uuid }),
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
              updatedCount++;
            } else if (res.status === 401) {
              errors.push(`Package ${pkg.uuid}: Session expired or login required`);
              break; // Stop loop if session expired
            } else {
              errors.push(`Package ${pkg.uuid}: ${data.error || 'Failed'}`);
            }
          } catch (err: unknown) {
            errors.push(`Package ${pkg.uuid}: ${err instanceof Error ? err.message : String(err)}`);
          }
          
          setProgress({ current: i + 1, total });
          
          // Small delay (2.5 seconds) to prevent server overload
          if (i < total - 1) {
            await new Promise(resolve => setTimeout(resolve, 2500));
          }
        } else {
          setProgress({ current: i + 1, total });
        }
      }
      
      let msg = `Success! Detailed data fetched. (Updated: ${updatedCount}/${total})`;
      if (errors.length > 0) {
        msg += ` | Errors: ${errors.slice(0, 5).join(" | ")}${errors.length > 5 ? '...' : ''}`;
      }
      setResult(msg);
      
    } catch (err: unknown) {
      setResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingDetails(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 font-sans">
      <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900">Nusuk Packages Scraper</h1>
        <p className="mb-6 text-sm text-zinc-600">
          Enter your cookie details to scrape the data. The API URL is now handled automatically.
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Cookie</label>
            <textarea 
              value={cookie} 
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCookie(e.target.value)}
              placeholder="Paste the complete cookie string here (e.g. sessionId=...)"
              rows={6}
              className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            />
          </div>
          <div className="flex gap-4 mt-4">
            <button 
              onClick={handleScrape}
              disabled={loading || loadingDetails || !cookie.trim()}
              className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Scraping..." : "Scrape Packages"}
            </button>
            {/* <button 
              onClick={handleScrapeDetails}
              disabled={loading || loadingDetails || !cookie.trim()}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingDetails ? "Fetching Details..." : "Scrape All Details"}
            </button> */}
          </div>
          
          {progress.total > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs text-zinc-600">
                <span>Progress: {progress.current} / {progress.total} packages</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-in-out" 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {result && (
            <div className={`mt-4 rounded-md p-3 text-sm ${result.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
