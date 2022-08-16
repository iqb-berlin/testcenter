import {
  AfterViewInit, ElementRef, ViewChild, Component
} from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  templateUrl: './add-attachment-dialog.component.html',
  styleUrls: ['./add-attachment-dialog.component.css']
})
export class AddAttachmentDialogComponent implements AfterViewInit {
  width = 210;
  height = 297;

  @ViewChild('video') video: ElementRef;
  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('shapePage') shapePage: ElementRef;

  capturedImage: string = '';
  error: any;

  state: 'capture' | 'confirm' | 'error' | 'init' = 'capture';

  async ngAfterViewInit() {
    await this.setupDevices();
  }

  async setupDevices() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true // { facingMode: 'environment' }
        });
        // stream.
        // let g = stream.getVideoTracks();
        // g.forEach(gg => {
        //   console.log([
        //     gg.label,
        //     gg.id,
        //     gg.kind,
        //     gg.getConstraints(),
        //     gg.getSettings()
        //   ]);
        // });
        if (stream) {
          this.video.nativeElement.srcObject = stream;
          this.video.nativeElement.play();
          this.error = null;
          this.state = 'capture';
          console.log('go');
        } else {
          this.error = 'You have no output video device';
          this.state = 'error';
        }
      } catch (e) {
        this.state = 'error';
        this.error = e;
      }
    }
  }

  capture(): void {
    this.drawImageToCanvas(this.video.nativeElement);
    this.capturedImage = this.canvas.nativeElement.toDataURL('image/png');
    this.state = 'confirm';
  }

  private drawImageToCanvas(image: any) {
    const clientRects = this.shapePage.nativeElement.getClientRects()[0];

    console.log(clientRects);

    this.canvas.nativeElement.width = clientRects.width;
    this.canvas.nativeElement
      .getContext('2d')
      .drawImage(image, 0, 0);
  }

  newCapture() {
    this.capturedImage = '';
    this.state = 'capture';
  }
}
