---
title: Plan Viewer
description: OCR pipeline that extracts plan numbers from scanned construction drawings.
pubDate: 2026-07-29
---

![Plan Viewer sample sheet](/plan-viewer/plan-viewer-sample.png)

Plan Viewer is a TypeScript pipeline that extracts plan numbers from scanned construction/engineering drawing PDFs using OCR. Large sets of drawings are often distributed as a single unlabeled PDF, making it hard to programmatically identify which page corresponds to which plan number — this automates that lookup instead of relying on manual page-by-page inspection. Given a multi-page PDF, it returns a structured array of results indexed by page.

The pipeline loads each PDF with `pdfjs-dist`, running entirely on bundled WASM builds with no native dependencies. Every page is rendered to a canvas and cropped using a fixed transform to isolate the title-block corner of the sheet where the plan number lives, avoiding the cost of processing the full-resolution page. That cropped region is passed to Tesseract.js, which OCRs the image and parses the plan number out of the recognized text. Pages are processed concurrently via `p-limit`, capping simultaneous OCR jobs so throughput stays high without exhausting memory.

It started as an Express service and was later simplified into a local pipeline that returns plan numbers directly, cutting out the HTTP layer for faster iteration on the extraction logic itself. Recent work focused on performance: replacing sequential rendering with bounded parallelism, dropping a sharp-based post-processing step in favor of doing the crop directly on the canvas transform, and tuning the OCR worker pool size — cutting render time by roughly a third.

Built with TypeScript in strict mode on NodeNext modules, using `pdfjs-dist` for PDF parsing/rendering, `tesseract.js` for OCR, `p-limit` for bounded concurrency, and Biome for linting and formatting.
