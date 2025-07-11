import { useEffect } from "react";
import { Worker, Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const normalizeText = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const PDFViewerComponent = ({ source, onClose }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    if (!source?.snippet || source.page === undefined) return;

    const highlightMatchingText = async (targetText, pageNum) => {
      const waitForTextLayer = () =>
        new Promise((resolve) => {
          const check = () => {
            const layer = document.querySelector(
              `.rpv-core__page-layer[data-virtual-index="${pageNum - 1}"] .rpv-core__text-layer`
            );
            layer && layer.childNodes.length > 0 ? resolve(layer) : setTimeout(check, 100);
          };
          check();
        });

      const scrollToHighlight = (element) => {
        element?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest"
        });
      };

      try {
        const textLayer = await waitForTextLayer();
        const spans = Array.from(textLayer.querySelectorAll("span"));
        const fullTextRaw = spans.map((s) => s.textContent).join(" ");
        
        // Extract meaningful chunks (paragraphs or sections)
        const chunks = fullTextRaw.split(/\n\s*\n/); // Split by double newlines
        const targetNorm = normalizeText(targetText);
        const targetKeywords = targetNorm.split(/\s+/).filter(w => w.length > 3);
        
        // Find the best matching chunk
        let bestChunk = null;
        let bestScore = 0;
        let bestChunkIndex = 0;
        
        chunks.forEach((chunk, index) => {
          const chunkNorm = normalizeText(chunk);
          let score = 0;
          
          // Score based on keyword matches
          targetKeywords.forEach(keyword => {
            if (chunkNorm.includes(keyword)) {
              score += keyword.length * 2; // Longer keywords get more weight
              
              // Bonus for exact phrase matches
              if (chunkNorm.includes(targetNorm)) {
                score += targetNorm.length * 3;
              }
            }
          });
          
          if (score > bestScore) {
            bestScore = score;
            bestChunk = chunk;
            bestChunkIndex = index;
          }
        });

        if (!bestChunk || bestScore < targetKeywords.length * 3) {
          console.warn("No strong match found. Best score:", bestScore);
          return;
        }

        // Find the position of this chunk in the full text
        let chunkStart = 0;
        for (let i = 0; i < bestChunkIndex; i++) {
          chunkStart += chunks[i].length + 2; // +2 for the newlines
        }
        const chunkEnd = chunkStart + bestChunk.length;

        // Highlight the matching spans
        let charCount = 0;
        let firstHighlightedSpan = null;
        
        for (const span of spans) {
          const spanStart = charCount;
          const spanEnd = charCount + span.textContent.length;
          
          if (spanEnd > chunkStart && spanStart < chunkEnd) {
            span.innerHTML = `<mark style="
              background-color: rgba(255, 255, 0, 0.6);
              border-radius: 2px;
              padding: 0 2px;
              transition: background-color 0.3s;
            ">${span.textContent}</mark>`;
            
            if (!firstHighlightedSpan) {
              firstHighlightedSpan = span;
            }
          }
          charCount = spanEnd;
        }

        if (firstHighlightedSpan) {
          scrollToHighlight(firstHighlightedSpan);
          // Smooth highlight effect
          setTimeout(() => {
            firstHighlightedSpan.querySelector('mark').style.backgroundColor = 'rgba(255, 255, 0, 0.8)';
          }, 300);
        }

        console.log("Best match:", bestChunk);
        
      } catch (err) {
        console.error("Highlighting error:", err);
      }
    };

    const timer = setTimeout(() => {
      highlightMatchingText(source.snippet, source.page + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [source]);

  const fileUrl = `http://localhost:8000/api/files/${source.filename}`;

  return (
    <div className="relative h-full w-full">
      <button
        className="absolute top-2 right-2 z-10 bg-gray-200 px-2 py-1 rounded text-sm"
        onClick={onClose}
      >
        Close
      </button>

      <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
        <Viewer
          fileUrl={fileUrl}
          defaultScale={SpecialZoomLevel.PageFit}
          plugins={[defaultLayoutPluginInstance]}
        />
      </Worker>
    </div>
  );
};

export default PDFViewerComponent;