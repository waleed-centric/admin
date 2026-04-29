"use client";

import { useMemo, useEffect, useState } from "react";
import type { NusukPackage } from "../services/nusukPackages";
import { useCurrency } from "./CurrencyProvider";

// Icons
const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

export function PackageDetailClient({ pkg: p }: { pkg: NusukPackage }) {
  const { formatPrice } = useCurrency();
  const [mounted, setMounted] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const fancyboxTrigger = target.closest('[data-fancybox="gallery"]');
    
    if (fancyboxTrigger) {
      e.preventDefault();
      const container = document.getElementById("package-external-content");
      if (!container) return;

      const items = Array.from(container.querySelectorAll('[data-fancybox="gallery"]'));
      const urls: string[] = [];
      let clickedIdx = 0;

      items.forEach((item) => {
        const url = item.getAttribute("data-src") || item.getAttribute("href");
        if (url) {
          // ensure absolute url
          const finalUrl = url.startsWith("/") ? `https://hajj.nusuk.sa${url}` : url;
          if (!urls.includes(finalUrl)) {
            urls.push(finalUrl);
          }
          if (item === fancyboxTrigger) {
            clickedIdx = urls.indexOf(finalUrl);
          }
        }
      });

      if (urls.length > 0) {
        setGalleryImages(urls);
        setCurrentImageIndex(clickedIdx);
        setGalleryOpen(true);
      }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Effect to hide specific text sections and unwanted buttons after HTML is injected
  useEffect(() => {
    if (mounted && p.detailed_html) {
      const container = document.getElementById("package-external-content");
      if (!container) return;

      // 1. Hide buttons except "See all images" / gallery triggers
      const buttons = container.querySelectorAll('button, .btn, a[class*="btn"], a[class*="button"], [role="button"]');
      buttons.forEach(btn => {
        const text = btn.textContent?.trim().toLowerCase() || "";
        const isGallery = btn.hasAttribute("data-fancybox") && btn.getAttribute("data-fancybox") === "gallery";
        const isSeeAllImages = text.includes("see all images") || text.includes("images");
        
        if (!isGallery && !isSeeAllImages) {
          (btn as HTMLElement).style.setProperty("display", "none", "important");
        }
      });

      // 2. Hide sections for Support Email, Website, Contact Us
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
      let node;
      const nodesToHide: HTMLElement[] = [];
      
      while ((node = walker.nextNode())) {
        const text = node.nodeValue?.trim().toLowerCase() || "";
        if (
          text === "support email" || 
          text === "website" || 
          text === "contact us" ||
          text.includes("support email:") ||
          text.includes("contact us:")
        ) {
          const parentElem = node.parentElement;
          if (parentElem) {
            // Try to find a logical wrapper to hide
            const wrapper = parentElem.closest('li') || 
                            parentElem.closest('tr') || 
                            parentElem.closest('.col-md-6') || 
                            parentElem.closest('.col-12') || 
                            parentElem.closest('.contact-info');
            
            if (wrapper && wrapper !== container) {
              nodesToHide.push(wrapper as HTMLElement);
            } else {
              const p = parentElem.parentElement;
              if (p && p !== container) {
                nodesToHide.push(p);
              } else {
                nodesToHide.push(parentElem);
              }
            }
          }
        }
      }

      nodesToHide.forEach(el => {
        el.style.setProperty("display", "none", "important");
      });
    }
  }, [mounted, p.detailed_html]);

  const details = useMemo(() => {
    if (!p.detailed_html) return null;

    const baseUrl = "https://hajj.nusuk.sa";
    const fixedHtml = p.detailed_html
      .replace(/href="(\/[^"]+)"/g, `href="${baseUrl}$1"`)
      .replace(/src="(\/[^"]+)"/g, `src="${baseUrl}$1"`)
      .replace(/url\((['"]?)(\/[^'"]+)\1\)/g, `url($1${baseUrl}$2$1)`);
    
    // Inject CSS directly to the HTML string. We scope it to #package-external-content
    // so it doesn't break our own Next.js layout.
    const injectedCSS = `
      <style>
        #package-external-content #preloader,
        #package-external-content .preloader,
        #package-external-content #loader,
        #package-external-content .loader,
        #package-external-content .loading,
        #package-external-content .spinner,
        #package-external-content .dimmer,
        #package-external-content .ui.dimmer,
        #package-external-content [class*="loader" i],
        #package-external-content [class*="loading" i],
        #package-external-content [class*="spinner" i],
        #package-external-content [class*="dimmer" i],
        #package-external-content [class*="backdrop" i],
        #package-external-content [class*="overlay" i],
        #package-external-content [id*="loader" i],
        #package-external-content [id*="loading" i],
        #package-external-content [id*="spinner" i],
        #package-external-content [id*="overlay" i] { 
          display: none !important; 
          opacity: 0 !important;
          visibility: hidden !important;
          z-index: -9999 !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
        }
        #package-external-content header,
        #package-external-content footer,
        #package-external-content nav,
        #package-external-content .header,
        #package-external-content .footer,
        #package-external-content .navbar,
        #package-external-content .site-header,
        #package-external-content .site-footer,
        #package-external-content .main-header,
        #package-external-content .main-footer,
        #package-external-content [data-testid="header"],
        #package-external-content [data-testid="footer"],
        #package-external-content #header,
        #package-external-content #footer { 
          display: none !important; 
        }
        /* Overrides for cleaner embedded view */
        #package-external-content {
          overflow-x: auto;
          width: 100%;
          max-width: 100%;
        }
        #package-external-content img,
        #package-external-content table {
          max-width: 100% !important;
          height: auto !important;
        }
        #package-external-content body {
          background: transparent !important;
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
        /* Hide Google Translate UI inside injected HTML if any */
        #package-external-content .goog-te-banner-frame { display: none !important; }
        #package-external-content #google_translate_element { display: none !important; }
        
        /* Hide all buttons and button-like links globally */
        #package-external-content button:not([data-fancybox="gallery"]),
        #package-external-content .btn:not([data-fancybox="gallery"]),
        #package-external-content a.btn:not([data-fancybox="gallery"]),
        #package-external-content a[class*="btn"]:not([data-fancybox="gallery"]),
        #package-external-content a[class*="button"]:not([data-fancybox="gallery"]),
        #package-external-content [role="button"]:not([data-fancybox="gallery"]) {
          display: none !important;
        }

        /* Hide specific floating summary area */
        #package-external-content .package-summary-floating-area {
          display: none !important;
        }
      </style>
    `;
    
    // Attempt to extract the body content to avoid injecting multiple <head> and <html> tags.
    // This helps prevent their CSS from bleeding too much into our app.
    let innerContent = fixedHtml;
    const bodyMatch = fixedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let styles = '';
    if (bodyMatch && bodyMatch[1]) {
      // Also try to grab the <style> tags from <head> to keep the page looking somewhat correct
      const headMatch = fixedHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      if (headMatch && headMatch[1]) {
        // Extract all <style> and <link rel="stylesheet">
        const styleTags = headMatch[1].match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
        const linkTags = headMatch[1].match(/<link[^>]*rel="stylesheet"[^>]*>/gi) || [];
        styles = styleTags.join('\n') + '\n' + linkTags.join('\n');
      }
      innerContent = styles + '\n' + bodyMatch[1];
    }

    return {
      isHtml: true,
      htmlContent: injectedCSS + innerContent,
      fullHtml: fixedHtml
    };
  }, [p.detailed_html]);

  return (
    <div className="w-full max-w-7xl mx-auto bg-gray-50 min-h-screen pb-12 font-sans">
      
      {/* Hero Section */}
      <div className="relative w-full h-80 md:h-[400px] lg:h-[500px] bg-zinc-800 overflow-hidden shadow-lg">
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={p.image_url} 
            alt={p.name} 
            className="absolute inset-0 w-full h-full object-cover opacity-80" 
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900" />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 lg:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <span className="inline-block px-3 py-1 bg-amber-500/90 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4 shadow-sm">
                {p.category_name}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-2 drop-shadow-md">
                {p.name}
              </h1>
              <div className="flex items-center gap-3 text-gray-200 text-sm md:text-base font-medium mb-3">
                <span className="bg-black/30 px-3 py-1 rounded-md backdrop-blur-sm">
                  {p.provider_name}
                </span>
                <span className={`px-3 py-1 rounded-md backdrop-blur-sm font-bold ${
                  p.isSoldOut ? "bg-red-500/80 text-white" : p.available ? "bg-emerald-500/80 text-white" : "bg-zinc-500/80 text-white"
                }`}>
                  {p.isSoldOut ? "Sold Out" : p.available ? "Available" : "Full"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {p.makkah_rating ? (
                  <span className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-md backdrop-blur-sm">
                    {p.makkah_rating} <StarIcon />
                  </span>
                ) : null}
              </div>
            </div>

            {/* Price and Seats in Hero */}
            <div className="flex flex-col items-end gap-3 bg-black/40 p-4 md:p-6 rounded-2xl backdrop-blur-md border border-white/10 shrink-0">
              <div className="text-right">
                <span className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1">Total Price</span>
                <div className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">
                  {formatPrice(p.total_price)}
                </div>
              </div>
              {p.available_seats !== undefined && (
                <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl">
                  <span className="text-sm font-medium text-gray-200">Available Seats</span>
                  <span className="font-bold text-emerald-400 bg-emerald-900/50 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                    {p.available_seats}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col gap-8">
          
          {/* Main Content - Details */}
          <div className="w-full space-y-8">
            
            {/* Description */}
            {p.description && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About this Package</h2>
                <p className="text-gray-600 leading-relaxed text-base">
                  {p.description}
                </p>
              </div>
            )}

            {/* External HTML Content rendered directly */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 overflow-hidden">
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
                Detailed Package Content
              </h2>
              {mounted && details?.htmlContent ? (
                <div 
                  id="package-external-content"
                  className="prose max-w-none w-full"
                  dangerouslySetInnerHTML={{ __html: details.htmlContent }}
                  onClick={handleContentClick}
                />
              ) : !mounted ? (
                <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500 font-medium">No detailed content available for this package.</p>
                  <p className="text-sm text-gray-400 mt-1">Please ensure the details have been scraped.</p>
                </div>
              )}
            </div>

            {/* Iframe for detailed HTML */}
            {/* {mounted && details?.fullHtml && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
                  Original Package View (Iframe)
                </h2>
                <iframe 
                  srcDoc={details.fullHtml}
                  className="w-full h-[800px] border-0 rounded-xl bg-white"
                  title="Original Detailed HTML"
                />
              </div>
            )} */}

          </div>

        </div>
      </div>

      {/* Gallery Modal */}
      {galleryOpen && galleryImages.length > 0 && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setGalleryOpen(false)}
        >
          <button 
            onClick={() => setGalleryOpen(false)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 z-50 p-2"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1)); 
            }}
            className="absolute left-4 md:left-8 text-white hover:text-gray-300 z-50 p-2 bg-black/40 rounded-full"
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={galleryImages[currentImageIndex]} 
            alt={`Gallery image ${currentImageIndex + 1}`} 
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setCurrentImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0)); 
            }}
            className="absolute right-4 md:right-8 text-white hover:text-gray-300 z-50 p-2 bg-black/40 rounded-full"
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <div className="absolute bottom-6 text-white font-medium text-lg bg-black/40 px-4 py-1 rounded-full">
            {currentImageIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
