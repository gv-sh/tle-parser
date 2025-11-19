"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFromFile = parseFromFile;
exports.parseFromFileList = parseFromFileList;
exports.parseFromDragEvent = parseFromDragEvent;
exports.parseFromBlob = parseFromBlob;
exports.parseFromURL = parseFromURL;
exports.createDownloadLink = createDownloadLink;
exports.downloadTLEFile = downloadTLEFile;
const index_1 = require("../index");
/**
 * Parse TLE data from a File object
 * @param file - File object to parse
 * @param options - Parse options
 * @returns Parse result with metadata
 */
async function parseFromFile(file, options) {
    const startTime = performance.now();
    try {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        const tles = [];
        const errors = [];
        // Parse TLEs from the file
        let i = 0;
        while (i < lines.length) {
            const currentLine = lines[i];
            const nextLine = lines[i + 1];
            const nextNextLine = lines[i + 2];
            // Check if this is a 3-line TLE (with name)
            if (currentLine && nextLine && nextNextLine && !currentLine.startsWith('1 ')) {
                const tleLine = `${currentLine}\n${nextLine}\n${nextNextLine}`;
                try {
                    const parsed = (0, index_1.parseTLE)(tleLine, options);
                    tles.push(parsed);
                    i += 3;
                }
                catch (error) {
                    errors.push({
                        line: i + 1,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    i += 1; // Skip this line and try next
                }
            }
            // Check if this is a 2-line TLE
            else if (currentLine && nextLine && currentLine.startsWith('1 ')) {
                const tleLine = `${currentLine}\n${nextLine}`;
                try {
                    const parsed = (0, index_1.parseTLE)(tleLine, options);
                    tles.push(parsed);
                    i += 2;
                }
                catch (error) {
                    errors.push({
                        line: i + 1,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    i += 1;
                }
            }
            else {
                i += 1;
            }
        }
        const endTime = performance.now();
        return {
            fileName: file.name,
            fileSize: file.size,
            tleCount: tles.length,
            tles,
            errors,
            processingTime: endTime - startTime
        };
    }
    catch (error) {
        throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Parse TLE data from a FileList (e.g., from input[type="file"])
 * @param fileList - FileList to parse
 * @param options - Parse options
 * @returns Array of parse results
 */
async function parseFromFileList(fileList, options) {
    const files = Array.from(fileList);
    const results = [];
    for (const file of files) {
        const result = await parseFromFile(file, options);
        results.push(result);
    }
    return results;
}
/**
 * Parse TLE data from a drag and drop event
 * @param event - Drag event
 * @param options - Parse options
 * @returns Array of parse results
 */
async function parseFromDragEvent(event, options) {
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
        throw new Error('No files in drag event');
    }
    return parseFromFileList(files, options);
}
/**
 * Parse TLE data from a Blob
 * @param blob - Blob to parse
 * @param fileName - Optional file name for metadata
 * @param options - Parse options
 */
async function parseFromBlob(blob, fileName = 'unknown.tle', options) {
    // Create a temporary File object from the Blob
    const file = new File([blob], fileName, { type: blob.type || 'text/plain' });
    return parseFromFile(file, options);
}
/**
 * Parse TLE data from a URL (fetches the file first)
 * @param url - URL to fetch
 * @param options - Parse options
 */
async function parseFromURL(url, options) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const fileName = url.split('/').pop() || 'remote.tle';
        return parseFromBlob(blob, fileName, options);
    }
    catch (error) {
        throw new Error(`Failed to fetch TLE from URL: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Create a download link for TLE data
 * @param tles - Array of parsed TLEs
 * @returns Blob URL
 */
function createDownloadLink(tles) {
    const tleStrings = tles.map(tle => {
        // Reconstruct TLE lines from parsed data
        const line1 = `1 ${tle.satelliteNumber1}${tle.classification} ${tle.internationalDesignatorYear}${tle.internationalDesignatorLaunchNumber}${tle.internationalDesignatorPiece} ${tle.epochYear}${tle.epoch} ${tle.firstDerivative} ${tle.secondDerivative} ${tle.bStar} ${tle.ephemerisType} ${tle.elementSetNumber}${tle.checksum1}`;
        const line2 = `2 ${tle.satelliteNumber2} ${tle.inclination} ${tle.rightAscension} ${tle.eccentricity} ${tle.argumentOfPerigee} ${tle.meanAnomaly} ${tle.meanMotion}${tle.revolutionNumber}${tle.checksum2}`;
        return tle.satelliteName ? `${tle.satelliteName}\n${line1}\n${line2}` : `${line1}\n${line2}`;
    });
    const content = tleStrings.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    return URL.createObjectURL(blob);
}
/**
 * Download TLE data as a file
 * @param tles - Array of parsed TLEs
 * @param fileName - File name for download
 */
function downloadTLEFile(tles, fileName = 'tles.txt') {
    const url = createDownloadLink(tles);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
//# sourceMappingURL=fileAPI.js.map