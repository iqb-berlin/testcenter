import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FooterService {
  showFooter = signal(false);
}
