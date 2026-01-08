import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  static saveBlobToFile(fileData: Blob, fileName: string): void {
    const anchor = document.createElement('a');
    anchor.download = fileName;
    anchor.href = window.URL.createObjectURL(fileData);
    anchor.click();
    window.URL.revokeObjectURL(anchor.href);
  }
}
