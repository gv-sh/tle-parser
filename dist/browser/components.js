"use strict";
/**
 * Web Components for TLE Parser
 * Reusable custom elements for browser applications
 *
 * @example
 * ```html
 * <script type="module" src="tle-parser-components.js"></script>
 *
 * <tle-parser tle="1 25544U..."></tle-parser>
 * <tle-visualizer></tle-visualizer>
 * <tle-file-upload></tle-file-upload>
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TLEFileUploadElement = exports.TLEParserElement = void 0;
exports.registerTLEComponents = registerTLEComponents;
const index_1 = require("../index");
const fileAPI_1 = require("./fileAPI");
/**
 * TLE Parser Component
 * Displays parsed TLE data in a formatted card
 */
class TLEParserElement extends HTMLElement {
    constructor() {
        super();
        this.parsedData = null;
        this._shadowRoot = this.attachShadow({ mode: 'open' });
    }
    static get observedAttributes() {
        return ['tle'];
    }
    connectedCallback() {
        this.render();
        const tle = this.getAttribute('tle');
        if (tle) {
            this.parse(tle);
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'tle' && oldValue !== newValue) {
            this.parse(newValue);
        }
    }
    parse(tleString) {
        try {
            this.parsedData = (0, index_1.parseTLE)(tleString);
            this.render();
            this.dispatchEvent(new CustomEvent('tle-parsed', {
                detail: this.parsedData,
                bubbles: true
            }));
        }
        catch (error) {
            this.dispatchEvent(new CustomEvent('tle-error', {
                detail: { error: error instanceof Error ? error.message : String(error) },
                bubbles: true
            }));
        }
    }
    render() {
        const styles = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        .tle-card {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 16px;
          margin: 8px 0;
        }
        .tle-header {
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 12px;
          color: #212529;
        }
        .tle-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .tle-field {
          display: flex;
          flex-direction: column;
        }
        .tle-label {
          font-size: 0.75rem;
          color: #6c757d;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .tle-value {
          font-family: monospace;
          font-size: 0.9rem;
          color: #212529;
        }
        .tle-error {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #f5c6cb;
        }
      </style>
    `;
        if (!this.parsedData) {
            this._shadowRoot.innerHTML = `
        ${styles}
        <div class="tle-card">
          <div class="tle-header">No TLE data</div>
        </div>
      `;
            return;
        }
        const data = this.parsedData;
        const intlDesignator = `${data.internationalDesignatorYear}${data.internationalDesignatorLaunchNumber}${data.internationalDesignatorPiece}`;
        this._shadowRoot.innerHTML = `
      ${styles}
      <div class="tle-card">
        <div class="tle-header">${data.satelliteName || 'Satellite'} (${data.satelliteNumber1})</div>
        <div class="tle-grid">
          <div class="tle-field">
            <div class="tle-label">Classification</div>
            <div class="tle-value">${data.classification}</div>
          </div>
          <div class="tle-field">
            <div class="tle-label">Int'l Designator</div>
            <div class="tle-value">${intlDesignator}</div>
          </div>
          <div class="tle-field">
            <div class="tle-label">Epoch</div>
            <div class="tle-value">${data.epochYear}-${data.epoch}</div>
          </div>
          <div class="tle-field">
            <div class="tle-label">Inclination</div>
            <div class="tle-value">${data.inclination}°</div>
          </div>
          <div class="tle-field">
            <div class="tle-label">RAAN</div>
            <div class="tle-value">${data.rightAscension}°</div>
          </div>
          <div class="tle-field">
            <div class="tle-label">Eccentricity</div>
            <div class="tle-value">${data.eccentricity}</div>
          </div>
          <div class="tle-field">
            <div class="tle-label">Arg of Perigee</div>
            <div class="tle-value">${data.argumentOfPerigee}°</div>
          </div>
          <div class="tle-field">
            <div class="tle-label">Mean Anomaly</div>
            <div class="tle-value">${data.meanAnomaly}°</div>
          </div>
          <div class="tle-field">
            <div class="tle-label">Mean Motion</div>
            <div class="tle-value">${data.meanMotion} rev/day</div>
          </div>
        </div>
      </div>
    `;
    }
}
exports.TLEParserElement = TLEParserElement;
/**
 * TLE File Upload Component
 * Drag-and-drop file uploader for TLE files
 */
class TLEFileUploadElement extends HTMLElement {
    constructor() {
        super();
        this._shadowRoot = this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }
    render() {
        this._shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .upload-zone {
          border: 2px dashed #6c757d;
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f8f9fa;
        }
        .upload-zone:hover, .upload-zone.dragover {
          border-color: #007bff;
          background: #e7f3ff;
        }
        .upload-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }
        .upload-text {
          color: #495057;
          margin-bottom: 8px;
        }
        .upload-hint {
          font-size: 0.875rem;
          color: #6c757d;
        }
        input[type="file"] {
          display: none;
        }
      </style>
      <div class="upload-zone" id="dropZone">
        <div class="upload-icon">📁</div>
        <div class="upload-text">Drop TLE files here or click to browse</div>
        <div class="upload-hint">Supports .txt and .tle files</div>
        <input type="file" id="fileInput" accept=".txt,.tle" multiple>
      </div>
    `;
    }
    attachEventListeners() {
        const dropZone = this._shadowRoot.getElementById('dropZone');
        const fileInput = this._shadowRoot.getElementById('fileInput');
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            await this.handleFiles(e.dataTransfer.files);
        });
        fileInput.addEventListener('change', async (e) => {
            await this.handleFiles(e.target.files);
        });
    }
    async handleFiles(files) {
        const fileArray = Array.from(files);
        const results = [];
        for (const file of fileArray) {
            try {
                const result = await (0, fileAPI_1.parseFromFile)(file);
                results.push(result);
            }
            catch (error) {
                results.push({
                    fileName: file.name,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        this.dispatchEvent(new CustomEvent('files-parsed', {
            detail: results,
            bubbles: true
        }));
    }
}
exports.TLEFileUploadElement = TLEFileUploadElement;
/**
 * Register all custom elements
 */
function registerTLEComponents() {
    if (!customElements.get('tle-parser')) {
        customElements.define('tle-parser', TLEParserElement);
    }
    if (!customElements.get('tle-file-upload')) {
        customElements.define('tle-file-upload', TLEFileUploadElement);
    }
}
// Auto-register if in browser environment
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
    registerTLEComponents();
}
//# sourceMappingURL=components.js.map