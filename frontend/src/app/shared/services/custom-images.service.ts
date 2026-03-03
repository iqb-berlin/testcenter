import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from '../../superadmin/backend.service';
import { CustomImages } from '../interfaces/custom-images.interface';

@Injectable({
  providedIn: 'root'
})
export class CustomImagesService {
  images: Record<string, string> = {};

  constructor(private backendService: BackendService) { }

  registerImages(customImages?: Record<keyof CustomImages, string>): void {
    this.images = customImages || {};
  }

  save(images: Record<string, string>): Observable<void> {
    this.images = images;
    return this.backendService.setCustomImages(images);
  }
}
