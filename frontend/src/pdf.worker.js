import { GlobalWorkerOptions } from "pdfjs-dist/build/pdf";
import PdfWorker from "pdfjs-dist/build/pdf.worker.mjs?worker"; // ✅ correct loader

GlobalWorkerOptions.workerPort = new PdfWorker(); // ✅ use workerPort instead of workerSrc
