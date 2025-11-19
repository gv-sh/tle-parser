/**
 * File API Support for TLE Parser
 * Provides utilities for parsing TLE files from various browser sources
 *
 * @example
 * ```typescript
 * import { parseFromFile, parseFromFileList, parseFromDragEvent } from 'tle-parser/browser';
 *
 * // From file input
 * const fileInput = document.querySelector('input[type="file"]');
 * fileInput.addEventListener('change', async (e) => {
 *   const results = await parseFromFileList(e.target.files);
 *   console.log(results);
 * });
 *
 * // From drag and drop
 * dropZone.addEventListener('drop', async (e) => {
 *   e.preventDefault();
 *   const results = await parseFromDragEvent(e);
 *   console.log(results);
 * });
 * ```
 */
import type { ParsedTLE, TLEParseOptions } from '../types';
export interface FileParseResult {
    fileName: string;
    fileSize: number;
    tleCount: number;
    tles: ParsedTLE[];
    errors: Array<{
        line: number;
        error: string;
    }>;
    processingTime: number;
}
/**
 * Parse TLE data from a File object
 * @param file - File object to parse
 * @param options - Parse options
 * @returns Parse result with metadata
 */
export declare function parseFromFile(file: File, options?: TLEParseOptions): Promise<FileParseResult>;
/**
 * Parse TLE data from a FileList (e.g., from input[type="file"])
 * @param fileList - FileList to parse
 * @param options - Parse options
 * @returns Array of parse results
 */
export declare function parseFromFileList(fileList: FileList, options?: TLEParseOptions): Promise<FileParseResult[]>;
/**
 * Parse TLE data from a drag and drop event
 * @param event - Drag event
 * @param options - Parse options
 * @returns Array of parse results
 */
export declare function parseFromDragEvent(event: DragEvent, options?: TLEParseOptions): Promise<FileParseResult[]>;
/**
 * Parse TLE data from a Blob
 * @param blob - Blob to parse
 * @param fileName - Optional file name for metadata
 * @param options - Parse options
 */
export declare function parseFromBlob(blob: Blob, fileName?: string, options?: TLEParseOptions): Promise<FileParseResult>;
/**
 * Parse TLE data from a URL (fetches the file first)
 * @param url - URL to fetch
 * @param options - Parse options
 */
export declare function parseFromURL(url: string, options?: TLEParseOptions): Promise<FileParseResult>;
/**
 * Create a download link for TLE data
 * @param tles - Array of parsed TLEs
 * @returns Blob URL
 */
export declare function createDownloadLink(tles: ParsedTLE[]): string;
/**
 * Download TLE data as a file
 * @param tles - Array of parsed TLEs
 * @param fileName - File name for download
 */
export declare function downloadTLEFile(tles: ParsedTLE[], fileName?: string): void;
//# sourceMappingURL=fileAPI.d.ts.map