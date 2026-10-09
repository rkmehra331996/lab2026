import { LabReport } from '../types';
import { printCanonicalReportPdf, downloadReportPdf } from './pdfGenerator';

/**
 * Checks if the current document is running inside an iframe
 */
export function isRunningInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Safely trigger print with automatic fallback if sandboxed inside an iframe
 */
export function safePrint(onBlocked?: () => void): boolean {
  try {
    window.print();
    return true;
  } catch (error) {
    console.warn('Direct window.print() failed or blocked in iframe sandbox:', error);
    if (onBlocked) {
      onBlocked();
    }
    return false;
  }
}

/**
 * Prints the exact canonical PDF document so preview, download, and print are 100% identical
 */
export async function printReportSafely(report: LabReport, existingBlobUrl?: string): Promise<void> {
  try {
    await printCanonicalReportPdf(report, existingBlobUrl);
  } catch (err) {
    console.error('Failed to print canonical PDF:', err);
    await downloadReportPdf(report);
  }
}

