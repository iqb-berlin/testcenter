import { Injectable } from '@angular/core';
import { MainDataService } from '../maindata/maindata.service';

@Injectable({
  providedIn: 'root'
})
export class KbDetectionService {
  private keyPressSpeeds: number[] = [];

  constructor(
    private mainDataService: MainDataService
  ) { }

  pushKeyPressSpeeds(speed: number): void {
    this.keyPressSpeeds.push(speed);

    if (this.keyPressSpeeds.length === 10) {
      const sumKeyPressSpeeds = this.keyPressSpeeds.reduce((x: number, y: number) => x + y);
      const averageKeyPressSpeed = sumKeyPressSpeeds / this.keyPressSpeeds.length;

      if (averageKeyPressSpeed < 50) {
        this.mainDataService.isExtendedKbUsed = false;
      } else {
        this.mainDataService.isExtendedKbUsed = true;
      }
    }
  }
}
