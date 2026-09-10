import { Component, Input } from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { AssetService } from '../../services/asset.service';

@Component({
  selector: 'tc-loading-progress',
  imports: [MatProgressBar],
  template: `
    <h2>{{ heading }}</h2>
    <img [src]="imgSrc" class="progress-image" [style.left.%]="progress" />
    <mat-progress-bar [value]="progress"></mat-progress-bar>
    <p class="loading-progress-text">{{ progress.toFixed(0) }}%</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 64px;
    }
    h2 {
      font-size: 57px;
      font-weight: 400;
    }
    .progress-image {
      align-self: start;
      width: 250px;
      height: 250px;
      aspect-ratio: 1/1;
      position: relative;
      transform: translateX(-50%);
      transition: left 0.2s linear;
      object-fit: contain;
    }
    .loading-progress-text {
      margin-top: -20px;
      font-size: 30px;
    }
  `
})
export class LoadingProgressComponent {
  @Input() progress: number = 0;
  @Input() heading: string = '';

  protected readonly imgSrc = this.assetService.getAssetSrc('loadingProgress');

  constructor(private assetService: AssetService) { }
}