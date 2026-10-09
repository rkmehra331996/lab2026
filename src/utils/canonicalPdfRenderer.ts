import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  try {
    // Configure worker via standard URL resolution
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  } catch (e) {
    console.warn('PDF.js worker initialization:', e);
  }
}

export interface RenderedPdfPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export interface RenderPdfOptions {
  scale?: number;
  blurBody?: boolean;
}

/**
 * Loads a PDF document from an ArrayBuffer and renders all its pages to data URLs or canvases.
 * Supports blurBody option to completely blur the Report Body while keeping Header and Footer 100% sharp.
 */
export async function renderPdfPages(
  arrayBuffer: ArrayBuffer,
  optionsOrScale: number | RenderPdfOptions = 1.5
): Promise<RenderedPdfPage[]> {
  const scale = typeof optionsOrScale === 'number' ? optionsOrScale : (optionsOrScale.scale ?? 1.5);
  const blurBody = typeof optionsOrScale === 'object' ? Boolean(optionsOrScale.blurBody) : false;

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages: RenderedPdfPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      continue;
    }

    // @ts-expect-error: PDF.js render parameters
    await page.render({ canvasContext: ctx, viewport }).promise;

    // If blurBody is requested (e.g. pending patient payment), blur the Report Body region
    if (blurBody) {
      const bodyY = Math.round(viewport.height * 0.27);
      const bodyH = Math.round(viewport.height * 0.685);
      const bodyW = viewport.width;

      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = bodyW;
        offscreen.height = bodyH;
        const offCtx = offscreen.getContext('2d');
        if (offCtx) {
          offCtx.drawImage(canvas, 0, bodyY, bodyW, bodyH, 0, 0, bodyW, bodyH);

          ctx.save();
          try {
            (ctx as any).filter = 'blur(16px)';
            ctx.drawImage(offscreen, 0, 0, bodyW, bodyH, 0, bodyY, bodyW, bodyH);
          } catch {
            ctx.drawImage(offscreen, 0, 0, bodyW, bodyH, 0, bodyY, bodyW, bodyH);
          }
          ctx.restore();

          // Frosted clinical overlay to make text completely illegible
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fillRect(0, bodyY, bodyW, bodyH);
        }
      } catch (err) {
        console.warn('Canvas blur error:', err);
      }
    }

    pages.push({
      pageNumber: i,
      dataUrl: canvas.toDataURL('image/png'),
      width: viewport.width,
      height: viewport.height,
    });
  }

  return pages;
}

export { pdfjsLib };
