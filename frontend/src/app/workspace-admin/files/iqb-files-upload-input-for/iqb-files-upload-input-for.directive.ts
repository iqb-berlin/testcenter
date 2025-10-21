import {
  Directive, ElementRef, HostListener, Input
} from '@angular/core';
import { IqbFilesUploadQueueComponent } from '../iqb-files-upload-queue/iqb-files-upload-queue.component';

@Directive({
    selector: 'input[iqbFilesUploadInputFor], div[iqbFilesUploadInputFor]',
    standalone: false
})
export class IqbFilesUploadInputForDirective {
  private queue: IqbFilesUploadQueueComponent | null = null;
  private _element: HTMLElement;

  constructor(private element: ElementRef) {
    this._element = this.element.nativeElement;
  }

  @Input('iqbFilesUploadInputFor')
  set filesUploadQueue(value: IqbFilesUploadQueueComponent) {
    if (value) {
      this.queue = value;
    }
  }

  @HostListener('change')
  onChange(): void {
    const { files } = this.element.nativeElement;
    // this.onFileSelected.emit(files);

    for (let i = 0; i < files.length; i++) {
      this.queue?.add(files[i]);
    }
    this.element.nativeElement.value = '';
  }
}
