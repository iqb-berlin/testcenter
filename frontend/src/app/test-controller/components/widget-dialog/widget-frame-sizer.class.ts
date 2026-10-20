export class WidgetFrameSizer {
  private readonly hostObserver: ResizeObserver;
  private readonly contentObserver: ResizeObserver;
  private readonly mutationObserver: MutationObserver;
  private document: Document | null = null;
  private animationFrame: number | undefined;
  private lastLayout = '';
  private availableWidth = 0;
  private fittedWidth: number | undefined;
  private running = false;
  private initialLayout = '';
  private initialFitComplete = false;

  constructor(
    private readonly iframe: HTMLIFrameElement,
    private readonly host: HTMLElement,
    private readonly fitWindowWidth: (width: number) => number,
    private readonly onInitialFit: () => void
  ) {
    this.hostObserver = new ResizeObserver(this.scheduleFit);
    this.contentObserver = new ResizeObserver(() => {
      // Expanding the iframe also resizes the document. Ignore our own completed layout.
      if (this.layoutSignature() !== this.lastLayout) this.scheduleFit();
    });
    this.mutationObserver = new MutationObserver(this.scheduleFit);
    this.iframe.addEventListener('load', this.documentLoaded);
    this.hostObserver.observe(host);
    this.fit();
  }

  start(): void {
    this.running = true;
    this.scheduleFit();
  }

  destroy(): void {
    this.hostObserver.disconnect();
    this.disconnectDocument();
    this.iframe.removeEventListener('load', this.documentLoaded);
    if (this.animationFrame !== undefined) cancelAnimationFrame(this.animationFrame);
  }

  private readonly documentLoaded = (): void => {
    this.disconnectDocument();
    this.document = this.iframe.contentDocument;
    if (!this.document?.body) return;
    // The full document is fitted below; keep scrolling areas inside widgets intact.
    this.document.documentElement.style.overflow = 'hidden';
    this.contentObserver.observe(this.document.documentElement);
    this.contentObserver.observe(this.document.body);
    this.mutationObserver.observe(this.document.documentElement, {
      subtree: true, childList: true, attributes: true, characterData: true
    });
    this.document.addEventListener('load', this.scheduleFit, true);
    this.document.fonts.addEventListener('loadingdone', this.scheduleFit);
    const loadedDocument = this.document;
    void loadedDocument.fonts.ready.then(() => {
      if (this.document === loadedDocument) this.scheduleFit();
    });
    this.fit();
  };

  private readonly scheduleFit = (): void => {
    if (this.animationFrame !== undefined) return;
    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = undefined;
      this.fit();
    });
  };

  private fit(): void {
    const currentWidth = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (!currentWidth || !height) return;
    // Retain the user's width limit while our automatic fit narrows the window.
    // Content can then grow again when a panel opens or more height is available.
    if (currentWidth !== this.fittedWidth) this.availableWidth = currentWidth;
    const width = this.availableWidth;

    // Always measure at the modal's current size, so content can shrink again
    // after closing an expanded panel without accumulating previous measurements.
    this.iframe.style.width = `${width}px`;
    this.iframe.style.height = `${height}px`;
    if (!this.running || !this.document) return;
    const naturalWidth = this.measureNaturalWidth();
    const layoutWidth = naturalWidth || width;
    this.iframe.style.width = `${layoutWidth}px`;
    const [contentWidth, contentHeight] = this.measureContent(layoutWidth, height);
    this.iframe.style.width = `${contentWidth}px`;
    this.iframe.style.height = `${contentHeight}px`;
    const scale = Math.min(1, width / contentWidth, height / contentHeight);
    this.iframe.style.transform = `scale(${scale})`;
    this.fittedWidth = this.fitWindowWidth(contentWidth * scale);
    this.lastLayout = this.layoutSignature();
    // Ignore temporary width probes, whose final layout was measured above.
    this.mutationObserver.takeRecords();
    if (!this.initialFitComplete) {
      const layout = [this.lastLayout, this.host.clientWidth, this.host.clientHeight,
        this.iframe.style.transform].join(',');
      if (this.document.fonts.status === 'loaded' && layout === this.initialLayout) {
        this.initialFitComplete = true;
        this.onInitialFit();
      } else {
        this.initialLayout = layout;
        if (this.document.fonts.status === 'loaded') this.scheduleFit();
      }
    }
  }

  private measureNaturalWidth(): number {
    if (!this.document?.body) return 0;
    const elements = [this.document.documentElement, this.document.body];
    const widths = elements.map(element => [element.style.getPropertyValue('width'),
      element.style.getPropertyPriority('width')]);
    for (const element of elements) element.style.setProperty('width', 'max-content', 'important');
    const width = Math.ceil(this.document.documentElement.getBoundingClientRect().width);
    elements.forEach((element, index) => element.style.setProperty('width', widths[index][0], widths[index][1]));
    // Canvas layouts with only positioned children have no intrinsic width and
    // continue using the available window width.
    return width;
  }

  private measureContent(width: number, height: number): [number, number] {
    // A widget can clip its own layout inside a nested container. Document scroll
    // dimensions alone then miss controls outside that container, e.g. the molecule
    // editor's 720px minimum height. Include actual HTML layout boxes as well.
    // SVG/MathML contents belong to the widget's drawing/formula viewport.
    const elements = Array.from(this.document?.body.querySelectorAll('*') ?? []);
    if (this.document?.body) elements.unshift(this.document.body);
    for (const element of elements) {
      if (element.namespaceURI !== 'http://www.w3.org/1999/xhtml') continue;
      const visibility = this.document?.defaultView?.getComputedStyle(element).visibility;
      if (visibility === 'hidden' || visibility === 'collapse') continue;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      width = Math.max(width, rect.right);
      height = Math.max(height, rect.bottom);
    }
    return [Math.ceil(width), Math.ceil(height)];
  }

  private layoutSignature(): string {
    if (!this.document?.body) return '';
    const root = this.document.documentElement;
    const body = this.document.body;
    return [root.clientWidth, root.clientHeight, root.scrollWidth, root.scrollHeight,
      body.offsetWidth, body.offsetHeight, body.scrollWidth, body.scrollHeight].join(',');
  }

  private disconnectDocument(): void {
    this.contentObserver.disconnect();
    this.mutationObserver.disconnect();
    this.document?.removeEventListener('load', this.scheduleFit, true);
    this.document?.fonts.removeEventListener('loadingdone', this.scheduleFit);
    this.document = null;
  }
}
