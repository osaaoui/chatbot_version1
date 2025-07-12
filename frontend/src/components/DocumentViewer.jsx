import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/build/pdf";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";

// PDF.js worker setup
GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";

function DocumentViewer({ source, onClose, headerHeight = 64 }) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filename = source?.metadata?.source;
  const [pageNumber, setPageNumber] = useState((source?.metadata?.page || 0) + 1);
  const [totalPages, setTotalPages] = useState(null);
  const snippet = source?.snippet || "";

  useEffect(() => {
  async function renderPdf() {
    if (!filename) return;
    if (!snippet || snippet.length < 10) {
      console.warn("🛑 Skipping render: empty or too short snippet");
      return;
    }

      const url = `http://localhost:8001/files/${filename}`;

      try {
        setLoading(true);
        setError(null);

        const pdf = await getDocument(url).promise;
        setTotalPages(pdf.numPages);

        const page = await pdf.getPage(pageNumber);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = canvas.parentElement;
        if (!container) return;

      [...container.querySelectorAll(".textLayer")].forEach((el) => el.remove());

      [...container.querySelectorAll(".textLayer")].forEach((el) => el.remove());

      const dpi = window.devicePixelRatio || 1;
      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = container.offsetWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width * dpi;
      canvas.height = viewport.height * dpi;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(dpi, 0, 0, dpi, 0, 0);

      if (renderTaskRef.current) renderTaskRef.current.cancel();
      const renderTask = page.render({ canvasContext: context, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;

      const textLayerDiv = document.createElement("div");
      textLayerDiv.className = "textLayer";
      Object.assign(textLayerDiv.style, {
        position: "absolute",
        top: "0px",
        left: "0px",
        width: `${viewport.width}px`,
        height: `${viewport.height}px`,
        zIndex: 10,
        pointerEvents: "none",
      });
      textLayerDiv.style.setProperty("--scale-factor", viewport.scale.toString());
      container.appendChild(textLayerDiv);

      const textContent = await page.getTextContent();
      const rawStrings = textContent.items.map(item => item.str);

      const normalize = (text) =>
  text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // 👈 insert space in camelCase
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.,;:!?]/g, "")
    .trim();

let rawMatch = null;
let anchor = null;

// Try full sentence match
const snippetSentences = snippet.split(/[.?!]\s?/);
for (const sentence of snippetSentences) {
  const wordCount = sentence.split(/\s+/).length;
  if (wordCount < 5) continue; // 🚫 Skip trivial or numeric snippets

  const candidate = normalize(sentence);
  const found = textContent.items.find(item =>
    normalize(item.str).includes(candidate)
  );
  if (found) {
    rawMatch = sentence.trim();
    anchor = candidate;
    break;
  }
}


      // Fallback
      if (!anchor) {
        const fallback = normalize(snippet).split(" ").slice(0, 8).join(" ");
        if (fallback.length > 10) {
          anchor = fallback;
          rawMatch = snippet;
        }
      }

      console.log("🪝 Anchor phrase to match:", anchor);
      console.log("🎯 Full sentence to highlight:", rawMatch);

      await pdfjsLib.renderTextLayer({
        textContent,
        container: textLayerDiv,
        viewport,
        textDivs: [],
        enhanceTextSelection: true,
      });

      if (!anchor || !rawMatch) {
        console.warn("⚠️ Skipping highlight: no anchor/rawMatch.");
        return;
      }

      const fullPageNorm = normalize(rawStrings.join(" "));
      const anchorTokens = new Set(anchor.split(" "));
const pageTokens = new Set(fullPageNorm.split(" "));

const overlap = [...anchorTokens].filter(t => pageTokens.has(t));
if (overlap.length < Math.floor(anchorTokens.size * 0.6)) {
  console.log("🚫 Not enough token overlap for anchor match.");
  return;
}


      const textLayerRaw = textLayerDiv.innerText;
      const normTextLayer = normalize(textLayerRaw);

      let highlighted = false;
      if (anchor && normTextLayer.includes(anchor)) {
        const safeAnchorRegex = new RegExp(
          anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i"
        );

        textLayerDiv.innerHTML = textLayerDiv.innerHTML.replace(
          safeAnchorRegex,
          `<span style="background-color: #facc15; color: black; font-weight: bold; padding: 0 2px; border-radius: 2px;">$&</span>`
        );
        console.log("✅ Highlighted anchor across full text layer.");
        highlighted = true;
      }

      if (!highlighted) {
        console.log("⚠️ No matching span found for anchor.");
      }

    } catch (err) {
      console.error(err);
      setError("Failed to load PDF.");
    } finally {
      setLoading(false);
    }
  }

  renderPdf();

  return () => {
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }
  };
}, [filename, pageNumber, snippet]);




  const goPrev = () => setPageNumber((p) => Math.max(1, p - 1));
  const goNext = () => setPageNumber((p) => Math.min(totalPages, p + 1));

  return (
    <div 
      className="w-[50%] border-l bg-white flex flex-col shadow-lg "
      style={{ 
        height: `calc(100vh - ${headerHeight}px)`,
        marginTop: '10px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700 truncate">
          {filename} ({t('documents.page')} {pageNumber}{totalPages ? ` ${t('documents.pageOf', { current: pageNumber, total: totalPages }).replace(`${t('documents.page')} ${pageNumber}`, '')}` : ""})
        </h2>
        <button
          onClick={onClose}
          className="text-xs text-purple-600 hover:underline"
        >
          {t('common.close')} ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto relative p-4">
        {loading && <p className="italic text-gray-400">{t('common.loading')}</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="relative">
          <canvas ref={canvasRef} className="border shadow max-w-full h-auto block" />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-sm">
        <button onClick={goPrev} disabled={pageNumber <= 1} className="text-purple-600 disabled:text-gray-400">◀ Prev</button>
        <button onClick={goNext} disabled={totalPages && pageNumber >= totalPages} className="text-purple-600 disabled:text-gray-400">Next ▶</button>
      </div>
    </div>
  );
}

export default DocumentViewer;
