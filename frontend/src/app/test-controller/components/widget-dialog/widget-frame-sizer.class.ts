export class WidgetFrameSizer {
  private readonly hostObserver: ResizeObserver;
  private readonly contentObserver: ResizeObserver;
  private readonly mutationObserver: MutationObserver;
  private document: Document | null = null;
  private animationFrame: number | undefined;
  private lastLayout = '';

  constructor(private readonly iframe: HTMLIFrameElement, private readonly host: HTMLElement) {
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
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (!width || !height) return;

    // Always measure at the modal's current size, so content can shrink again
    // after closing an expanded panel without accumulating previous measurements.
    this.iframe.style.width = `${width}px`;
    this.iframe.style.height = `${height}px`;
    const [contentWidth, contentHeight] = this.measureContent(width, height);
    this.iframe.style.width = `${contentWidth}px`;
    this.iframe.style.height = `${contentHeight}px`;
    this.iframe.style.transform = `scale(${Math.min(1, width / contentWidth, height / contentHeight)})`;
    this.lastLayout = this.layoutSignature();
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
