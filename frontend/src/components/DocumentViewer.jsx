import React, { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/build/pdf";

// PDF.js worker setup
GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";

function DocumentViewer({ source, onClose }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlight, setHighlight] = useState(null);

  const filename = source?.metadata?.source;
  const [pageNumber, setPageNumber] = useState((source?.metadata?.page || 0) + 1);
  const [totalPages, setTotalPages] = useState(null);
  const snippet = source?.snippet || "";

  useEffect(() => {
  setHighlight(null); // reset on page or file change

  async function renderPdf() {
    if (!filename) return;

    const url = `http://localhost:8000/files/${filename}`;

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

      const dpi = window.devicePixelRatio || 1;

      // Dynamically calculate scale based on container width
      const unscaledViewport = page.getViewport({ scale: 1 });
      const baseScale = container.offsetWidth / unscaledViewport.width;
      const finalScale = baseScale;

      const viewport = page.getViewport({ scale: finalScale });

      // Resize canvas for high-DPI display
      canvas.width = viewport.width * dpi;
      canvas.height = viewport.height * dpi;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const context = canvas.getContext("2d");
      if (!context) return;

      // Adjust for high DPI rendering
      context.setTransform(dpi, 0, 0, dpi, 0, 0);

      console.log("📄 Rendering page:", pageNumber);
      console.log("📎 Snippet:", snippet);
      console.log("🖼 Canvas size (CSS):", canvas.style.width, canvas.style.height);
      console.log("🖼 Canvas size (pixels):", canvas.width, canvas.height);

      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      // Render PDF page to canvas
      const renderTask = page.render({ canvasContext: context, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;

      // Try to fetch and display highlight box
      if (snippet && snippet.length > 20) {
        try {
          console.log("🔎 Requesting highlight for:", snippet);
          const response = await fetch(
            `http://localhost:8000/api/highlight-snippet?file=${filename}&text=${encodeURIComponent(snippet)}`
          );
          const data = await response.json();
          console.log("📦 Highlight box from API:", data.highlight);

          const box = data.highlight;
          if (box && box.page === pageNumber) {
            setHighlight(box);
          } else {
            setHighlight(null);
          }
        } catch (highlightErr) {
          console.warn("Highlight fetch failed", highlightErr);
        }
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
    <div className="w-[50%] h-full border-l bg-white flex flex-col shadow-lg z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700 truncate">
          {filename} (Page {pageNumber}{totalPages ? ` of ${totalPages}` : ""})
        </h2>
        <button
          onClick={onClose}
          className="text-xs text-purple-600 hover:underline"
        >
          Close ✕
        </button>
      </div>

      {/* Canvas + Highlight Overlay */}
      <div className="flex-1 overflow-y-auto relative p-4">
        {loading && <p className="italic text-gray-400">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="relative">
          <canvas ref={canvasRef} className="border shadow max-w-full h-auto block" />

          {highlight && canvasRef.current ? (
  (() => {
    const canvas = canvasRef.current;
    const scale = 1.5;

    const top = (canvas.height - (highlight.y + highlight.height)) / scale;
    const offset = 0.5 * highlight.width; // Move left by ~30% of the box width
    const left = (highlight.x - offset) / scale
    


    const width = (highlight.width - offset) / scale; // ✅ match shrink on right
    const height = Math.max(highlight.height / scale, 16);

    console.log("🟡 Canvas height:", canvas.height);
    console.log("🟡 Raw highlight box:", highlight);
    console.log("🟡 Converted box:", { top, left, width, height });

    return (
      <div
        className="absolute border-2 border-yellow-500 bg-yellow-300 bg-opacity-50 pointer-events-none"
        style={{
          top: `${top}px`,
          left: `${left}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
    );
  })()
) : null}

        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-sm">
        <button
          onClick={goPrev}
          disabled={pageNumber <= 1}
          className="text-purple-600 disabled:text-gray-400"
        >
          ◀ Prev
        </button>
        <button
          onClick={goNext}
          disabled={totalPages && pageNumber >= totalPages}
          className="text-purple-600 disabled:text-gray-400"
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}

export default DocumentViewer;