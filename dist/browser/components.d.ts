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
/**
 * TLE Parser Component
 * Displays parsed TLE data in a formatted card
 */
export declare class TLEParserElement extends HTMLElement {
    private _shadowRoot;
    private parsedData;
    constructor();
    static get observedAttributes(): string[];
    connectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void;
    parse(tleString: string): void;
    render(): void;
}
/**
 * TLE File Upload Component
 * Drag-and-drop file uploader for TLE files
 */
export declare class TLEFileUploadElement extends HTMLElement {
    private _shadowRoot;
    constructor();
    connectedCallback(): void;
    render(): void;
    attachEventListeners(): void;
    handleFiles(files: FileList): Promise<void>;
}
/**
 * Register all custom elements
 */
export declare function registerTLEComponents(): void;
//# sourceMappingURL=components.d.ts.map