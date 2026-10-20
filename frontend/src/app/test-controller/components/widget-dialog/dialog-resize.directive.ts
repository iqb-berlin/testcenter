import { Directive, HostListener, Input, inject } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { MatDialogRef } from '@angular/material/dialog';

@Directive({ selector: '[tcDialogResize]' })
export class DialogResizeDirective {
  @Input({ required: true }) tcDialogResize!: CdkDrag;
  private readonly dialogRef = inject(MatDialogRef<unknown>);
  private interaction?: { pointerId: number; x: number; y: number; rect: DOMRect };

  @HostListener('pointerdown', ['$event'])
  beginResize(event: PointerEvent): void {
    if (event.button !== 0 || this.interaction || !(event.currentTarget instanceof HTMLElement)) return;
    event.preventDefault();
    // Capture keeps resize events in the host document when crossing an iframe.
    event.currentTarget.setPointerCapture(event.pointerId);
    this.interaction = {
      pointerId: event.pointerId, x: event.clientX, y: event.clientY,
      rect: this.tcDialogResize.getRootElement().getBoundingClientRect()
    };
  }

  @HostListener('pointermove', ['$event'])
  resize(event: PointerEvent): void {
    const start = this.interaction;
    if (!start || start.pointerId !== event.pointerId) return;
    this.setBounds(start.rect.left, start.rect.top,
                   start.rect.width + event.clientX - start.x, start.rect.height + event.clientY - start.y);
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  @HostListener('lostpointercapture', ['$event'])
  endResize(event: PointerEvent): void {
    if (this.interaction?.pointerId === event.pointerId) this.interaction = undefined;
  }

  @HostListener('keydown', ['$event'])
  resizeWithKeyboard(event: KeyboardEvent): void {
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10]
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    const rect = this.tcDialogResize.getRootElement().getBoundingClientRect();
    this.setBounds(rect.left, rect.top, rect.width + delta[0], rect.height + delta[1]);
  }

  @HostListener('window:resize')
  fitToViewport(): void {
    this.interaction = undefined;
    const rect = this.tcDialogResize.getRootElement().getBoundingClientRect();
    this.setBounds(rect.left, rect.top, rect.width, rect.height);
  }

  private setBounds(left: number, top: number, width: number, height: number): void {
    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.95;
    width = Math.min(maxWidth, Math.max(Math.min(320, maxWidth), width));
    height = Math.min(maxHeight, Math.max(Math.min(240, maxHeight), height));
    left = Math.max(0, Math.min(left, window.innerWidth - width));
    top = Math.max(0, Math.min(top, window.innerHeight - height));
    // Convert CDK's drag translation to dialog coordinates before changing dimensions.
    this.tcDialogResize.reset();
    this.dialogRef.updateSize(`${width}px`, `${height}px`);
    this.dialogRef.updatePosition({ left: `${left}px`, top: `${top}px` });
  }
}
