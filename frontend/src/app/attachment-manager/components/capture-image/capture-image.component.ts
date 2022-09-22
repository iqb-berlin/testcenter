import {
  OnDestroy, ElementRef, ViewChild, Component, OnInit, NgZone
} from '@angular/core';
// eslint-disable-next-line import/no-extraneous-dependencies
import QrScanner from 'qr-scanner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { VideoRegion } from '../../interfaces/video.interfaces';
import { BackendService } from '../../services/backend/backend.service';

@Component({
  templateUrl: './capture-image.component.html',
  styleUrls: [
    '../../../../monitor-layout.css',
    './capture-image.component.css'
  ]
})
export class CaptureImageComponent implements OnInit, OnDestroy {
  @ViewChild('video') video: ElementRef;
  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('sidenav', { static: true }) sidenav: MatSidenav;

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
  private qrScanner: QrScanner;

  state: 'capture' | 'confirm' | 'error' | 'wait' = 'capture';

  error: any;

  cameras: { [id: string]: string } = {};
  flashOn: boolean = false;
  hasFlash: boolean = false;
  attachmentLabel: string = '';
  attachmentId: string;
  mobileView: boolean;

  constructor(
    private bs: BackendService,
    private ngZone: NgZone,
    public snackBar: MatSnackBar,
    breakpointObserver: BreakpointObserver
  ) {
    breakpointObserver
      .observe([
        Breakpoints.Medium,
        Breakpoints.Small,
        Breakpoints.XSmall
      ])
      .subscribe(result => {
        if (result.matches) {
          this.sidenav.close();
          this.mobileView = true;
        } else {
          this.sidenav.open();
          this.mobileView = false;
        }
      });
  }

  async ngOnInit() {
    setTimeout(() => { this.runCamera(); });
  }

  ngOnDestroy(): void {
    this.qrScanner.stop();
    this.qrScanner.destroy();
  }

  private runCamera() {
    this.qrScanner = new QrScanner(
      this.video.nativeElement,
      result => {
        this.ngZone.run(() => {
          this.capture(result.data);
        });
      },
      {
        calculateScanRegion: videoElem => {
          this.calculateSizes();
          if (!this.videoSize) {
            return {};
          }
          const { page } = this.videoSize;
          const scanRegionX = (this.pageDesign.qrCode.left * 0.9 * page.full.width) / this.pageDesign.width;
          const scanRegionY = (this.pageDesign.qrCode.top * 0.9 * page.full.height) / this.pageDesign.height;
          const scanRegionWidth = (this.pageDesign.qrCode.size * 1.1 * page.full.width) / this.pageDesign.width;
          const scanRegionHeight = (this.pageDesign.qrCode.size * 1.1 * page.full.height) / this.pageDesign.height;
          return {
            x: videoElem.videoWidth + scanRegionX - page.full.width, // (0|0) is top-right in this context
            y: scanRegionY,
            width: scanRegionWidth,
            height: scanRegionHeight
          };
        },
        highlightScanRegion: true,
        highlightCodeOutline: false,
        returnDetailedScanResult: true
      }
    );
    this.qrScanner.start()
      .then(
        () => {
          this.listCameras();
          this.updateFlashAvailability();
        },
        err => {
          this.state = 'error';
          this.error = err;
        }
      );
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
      .then(
        cameras => {
          if (cameras.length) {
            cameras.forEach(camera => { this.cameras[camera.id] = camera.label; });
          } else {
            this.state = 'error';
            this.error = 'Keine Kamera gefunden';
          }
        }
      );
  }

  updateFlashAvailability(): void {
    this.qrScanner.hasFlash().then(hasFlash => {
      this.hasFlash = hasFlash;
    });
  }

  capture(code: string): void {
    this.state = 'wait';
    this.qrScanner.stop();
    this.drawImageToCanvas();
    this.capturedImage = this.canvas.nativeElement.toDataURL('image/png');

    this.state = 'confirm';
    this.bs.getAttachmentData(code)
      .subscribe(
        attachmentData => {
          this.attachmentId = code;
          this.attachmentLabel = `${attachmentData.personLabel}: ${attachmentData.testLabel}`;
        },
        () => {
          this.state = 'error';
          this.error = 'QR code konnte nicht gelesen oder nicht zugeordnet werden.';
        }
      );
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

  async reset() {
    this.attachmentLabel = null;
    this.attachmentId = null;
    this.capturedImage = '';
    this.state = 'capture';
    await this.runCamera();
  }

  selectCamera(camId: string): void {
    this.qrScanner.setCamera(camId).then(
      () => {
        this.updateFlashAvailability();
        this.calculateSizes();
      }
    );
  }

  uploadImage(): void {
    this.bs.postAttachment(this.attachmentId, CaptureImageComponent.dataURItoFile(this.capturedImage))
      .subscribe(ok => {
        if (!ok) {
          return;
        }
        this.snackBar.open('Anhang erfolgreich Hochgeladen!', 'Info', { duration: 3000 });
        this.reset();
      });
  }

  private static dataURItoFile(dataURI: string): File {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    let fileName = 'file';
    // eslint-disable-next-line default-case
    switch (mimeString) {
      case 'image/jpeg':
        fileName += '.jpg';
        break;
      case 'image/png':
        fileName += '.png';
        break;
    }

    return new File(
      [ab],
      fileName,
      {
        type: mimeString
      }
    );
  }
}
