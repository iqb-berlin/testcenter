import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Verona5ValidPages, Verona6ValidPage, Verona6ValidPages } from '../interfaces/verona.interfaces';

@Injectable({
  providedIn: 'root'
})
export class PageService {
  pagesUpdated: Subject<void> = new Subject<void>();
  pages: Array<Verona6ValidPage> = [];
  currentPageIndex: number = -1;

  getCurrentPage(): Verona6ValidPage {
    return this.pages[this.currentPageIndex];
  }

  update(validPages: Verona5ValidPages | Verona6ValidPages, currentPageID?: string): void {
    if (!Array.isArray(validPages)) {
      this.pages = Object.entries(validPages)
        .map(([id, label]) => ({ id, label }));
    } else {
      this.pages = validPages;
    }
    this.currentPageIndex = currentPageID ? this.pages
      .map(page => page.id)
      .indexOf(currentPageID) : -1;
    this.pagesUpdated.next();
  }

  isFirstPage() {
    return this.currentPageIndex === 0;
  }

  isLastPage() {
    return this.currentPageIndex === this.pages.length - 1;
  }
}
