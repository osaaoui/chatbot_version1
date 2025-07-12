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

const PDFViewerComponent = ({ source }) => {
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
        
        // Split by double newlines to get meaningful chunks
        const chunks = fullTextRaw.split(/\n\s*\n/);
        const targetNorm = normalizeText(targetText);
        const targetKeywords = targetNorm.split(/\s+/).filter(w => w.length > 3);
        
        // Find best matching chunk using keyword scoring
        let bestChunk = null;
        let bestScore = 0;
        let bestChunkIndex = 0;
        
        chunks.forEach((chunk, index) => {
          const chunkNorm = normalizeText(chunk);
          let score = 0;
          
          targetKeywords.forEach(keyword => {
            if (chunkNorm.includes(keyword)) {
              score += keyword.length * 2;
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

        if (!bestChunk || bestScore < targetKeywords.length * 3) return;

        // Calculate chunk position in full text
        let chunkStart = 0;
        for (let i = 0; i < bestChunkIndex; i++) {
          chunkStart += chunks[i].length + 2;
        }
        const chunkEnd = chunkStart + bestChunk.length;

        // Highlight matching spans
        let charCount = 0;
        let firstHighlightedSpan = null;
        
        for (const span of spans) {
          const spanStart = charCount;
          const spanEnd = charCount + span.textContent.length;
          
          if (spanEnd > chunkStart && spanStart < chunkEnd) {
            span.innerHTML = `<mark class="pdf-highlight">${span.textContent}</mark>`;
            
            if (!firstHighlightedSpan) {
              firstHighlightedSpan = span;
            }
          }
          charCount = spanEnd;
        }

        if (firstHighlightedSpan) {
          scrollToHighlight(firstHighlightedSpan);
          setTimeout(() => {
            const mark = firstHighlightedSpan.querySelector('mark');
            if (mark) {
              mark.classList.add('pdf-highlight-active');
            }
          }, 300);
        }
        
      } catch (err) {
        console.error("Highlighting error:", err);
      }
    };

    const timer = setTimeout(() => {
      highlightMatchingText(source.snippet, source.page + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [source]);

  const fileUrl = `http://localhost:8001/api/files/${source.filename}`;

  return (
    <div className="pdf-viewer-container h-full w-full overflow-hidden border-l border-border-light">
      <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
        <div className="h-full w-full">
          <Viewer
            fileUrl={fileUrl}
            defaultScale={SpecialZoomLevel.PageFit}
            plugins={[defaultLayoutPluginInstance]}
          />
        </div>
      </Worker>
    </div>
  );
};

export default PDFViewerComponent;