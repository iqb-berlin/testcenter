import {
  OnDestroy, AfterViewInit, ElementRef, ViewChild, Component, ViewEncapsulation
} from '@angular/core';
import QrScanner from 'qr-scanner';

@Component({
  templateUrl: './add-attachment-dialog.component.html',
  styleUrls: [
    './add-attachment-dialog.component.css'
  ],
  encapsulation: ViewEncapsulation.None
})
export class AddAttachmentDialogComponent implements AfterViewInit, OnDestroy {

  width = 210;
  height = 297;

  @ViewChild('video') video: ElementRef;
  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('shapePage') shapePage: ElementRef;

  capturedImage: string = '';
  error: any;
  code: string = '';
  qrScanner: QrScanner;

  cameras: { [id: string]: string } = {};

  state: 'capture' | 'confirm' | 'error' | 'init' = 'capture';
  hasFlash: boolean = false;
  flashOn: boolean = false;

  async ngAfterViewInit() {
    setTimeout(async () => { await this.setupDevices(); });
  }

  ngOnDestroy(): void {
    this.qrScanner.stop();
    this.qrScanner.destroy();
  }

  async setupDevices() {
    // this.video.nativeElement
    //   .onplaying = () => {
    //     var width = this.video.nativeElement.videoWidth;
    //     var height = this.video.nativeElement.videoHeight;
    //     console.log(`video dimens loaded w=${width} h=${height}`);
    //   };

    this.qrScanner = new QrScanner(
      this.video.nativeElement,
      result => {
        this.capture(result.data);
      },
      {
        calculateScanRegion: videoElem => {
          const qrMarginLeft = 18;
          const qrMarginTop = 18;
          const qrSize = 44;

          const videoScaledSize = this.video.nativeElement.getClientRects()[0];

          if (!videoScaledSize) { // when video-elem is not loaded yet. this will be retried anyway
            return {};
          }

          const pageScaledWidth = (videoScaledSize.height * this.width) / this.height;
          const pageScaledHeight = 500;

          const pageRealWidth = (videoElem.videoWidth / videoScaledSize.width) * pageScaledWidth;
          const pageRealHeight = videoElem.videoHeight;
          const cropX = (qrMarginLeft * pageRealWidth) / this.width;
          const cropY = (qrMarginTop * pageRealHeight) / this.height;
          const cropWidth = (qrSize * pageRealWidth) / this.width;
          const cropHeight = (qrSize * pageRealHeight) / this.height;

          return {
            x: videoElem.videoWidth + cropX - pageRealWidth, // (0|0) is top-right in this context
            y: cropY,
            width: cropWidth,
            height: cropHeight
          };
        },
        highlightScanRegion: true,
        highlightCodeOutline: false,
        returnDetailedScanResult: true,
        onDecodeError: console.log
      }
    );
    this.qrScanner.start()
      .then(() => {
        this.listCameras();
        this.updateFlashAvailability();
      });
  }

  listCameras(): void {
    QrScanner.listCameras(true)
      .then(cameras => cameras.forEach(camera => { this.cameras[camera.id] = camera.label; }));
  }

  selectCamera(camId: string): void {
    this.qrScanner.setCamera(camId).then(() => this.updateFlashAvailability());
  }

  updateFlashAvailability(): void {
    this.qrScanner.hasFlash().then(hasFlash => {
      this.hasFlash = hasFlash;
    });
  }

  capture(code: string): void {
    this.qrScanner.stop();
    this.code = code;
    this.drawImageToCanvas();
    this.capturedImage = this.canvas.nativeElement.toDataURL('image/png');
    this.state = 'confirm';
  }

  private drawImageToCanvas() {
    const videoElem: HTMLVideoElement = this.video.nativeElement;
    const videoScaledSize = this.video.nativeElement.getClientRects()[0];

    const pageScaledWidth = (videoScaledSize.height * this.width) / this.height;

    const pageRealWidth = (videoElem.videoWidth / videoScaledSize.width) * pageScaledWidth;
    const pageRealHeight = videoElem.videoHeight;

    this.canvas.nativeElement.width = pageRealWidth;
    this.canvas.nativeElement.height = pageRealHeight;
    const ctx: CanvasRenderingContext2D = this.canvas.nativeElement.getContext('2d');
    ctx.scale(-1, 1);
    ctx.drawImage(
      videoElem,
      videoElem.videoWidth - pageRealWidth,
      0,
      pageRealWidth,
      pageRealHeight,
      0,
      0,
      -pageRealWidth,
      pageRealHeight
    );
  }

  async newCapture() {
    this.capturedImage = '';
    this.state = 'capture';
    await this.setupDevices();
  }
}
