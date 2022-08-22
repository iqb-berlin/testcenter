import {
  OnDestroy, AfterViewInit, ElementRef, ViewChild, Component, ViewEncapsulation
} from '@angular/core';
// eslint-disable-next-line import/no-extraneous-dependencies
import QrScanner from 'qr-scanner';
import { VideoRegion } from '../../interfaces/video.interfaces';

@Component({
  templateUrl: './capture-image.component.html',
  styleUrls: [
    './capture-image.component.css'
  ],
  encapsulation: ViewEncapsulation.None
})
export class CaptureImageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') video: ElementRef;
  @ViewChild('canvas') canvas: ElementRef;
  // @ViewChild('shapePage') shapePage: ElementRef;

  pageDesign = {
    width: 210, // mm
    height: 297, // mm
    qrCode: {
      top: 20, // mm
      left: 20, // mm
      size: 40 // mm
    }
  };

  display = {
    forcedHeight: 500 // px
  };

  videoSize: null | {
    video: VideoRegion,
    page: VideoRegion
  };

  private capturedImage: string = '';
  code: string = '';
  private qrScanner: QrScanner;

  state: 'capture' | 'confirm' | 'error' = 'capture';

  error: any;

  cameras: { [id: string]: string } = {};
  flashOn: boolean = false;
  hasFlash: boolean = false;

  async ngAfterViewInit() {
    setTimeout(() => { this.setupDevices(); });
  }

  ngOnDestroy(): void {
    this.qrScanner.stop();
    this.qrScanner.destroy();
  }

  setupDevices() {
    this.qrScanner = new QrScanner(
      this.video.nativeElement,
      result => {
        this.capture(result.data);
      },
      {
        calculateScanRegion: videoElem => {
          this.calculateSizes();
          if (!this.videoSize) {
            console.log('SKIP');
            return {};
          }
          const { page } = this.videoSize;
          const scanRegionX = (this.pageDesign.qrCode.left * 0.9 * page.full.width) / this.pageDesign.width;
          const scanRegionY = (this.pageDesign.qrCode.top * 0.9 * page.full.height) / this.pageDesign.height;
          const scanRegionWidth = (this.pageDesign.qrCode.size * 1.1 * page.full.width) / this.pageDesign.width;
          const scanRegionHeight = (this.pageDesign.qrCode.size * 1.1 * page.full.height) / this.pageDesign.height;
          console.log({ page });
          return {
            x: videoElem.videoWidth + scanRegionX - page.full.width, // (0|0) is top-right in this context
            y: scanRegionY,
            width: scanRegionWidth,
            height: scanRegionHeight
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

  private calculateSizes(): void {
    const videoElem: HTMLVideoElement = this.video.nativeElement;

    const videoScaledSize = this.video.nativeElement.getClientRects()[0];

    if (!videoScaledSize) { // when video-elem is not loaded yet. this will be retried anyway
      this.videoSize = null;
      return;
    }

    const pageScaledWidth = (videoScaledSize.height * this.pageDesign.width) / this.pageDesign.height;

    this.videoSize = {
      video: {
        full: {
          height: videoElem.videoHeight,
          width: videoElem.videoWidth
        },
        scaled: {
          height: videoScaledSize.height,
          width: videoScaledSize.width
        }
      },
      page: {
        full: {
          height: videoElem.videoHeight,
          width: (videoElem.videoWidth / videoScaledSize.width) * pageScaledWidth
        },
        scaled: {
          height: this.display.forcedHeight,
          width: pageScaledWidth
        }
      }
    };
  }

  listCameras(): void {
    QrScanner.listCameras(true)
      .then(cameras => cameras.forEach(camera => { this.cameras[camera.id] = camera.label; }));
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
    const { page, video } = this.videoSize;
    this.canvas.nativeElement.width = page.full.width;
    this.canvas.nativeElement.height = page.full.height;
    const ctx: CanvasRenderingContext2D = this.canvas.nativeElement.getContext('2d');
    ctx.scale(-1, 1);
    ctx.drawImage(
      this.video.nativeElement,
      video.full.width - page.full.width,
      0,
      page.full.width,
      page.full.height,
      0,
      0,
      -page.full.width,
      page.full.height
    );
  }

  async newCapture() {
    this.capturedImage = '';
    this.state = 'capture';
    await this.setupDevices();
  }

  selectCamera(camId: string): void {
    this.qrScanner.setCamera(camId).then(
      () => {
        this.updateFlashAvailability();
        this.calculateSizes();
      }
    );
  }
}
