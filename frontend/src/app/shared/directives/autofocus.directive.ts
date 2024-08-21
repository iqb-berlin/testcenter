import { Directive, OnInit, ElementRef } from '@angular/core';

@Directive({
  selector: '[customAutofocus]'
})
export class AutofocusDirective implements OnInit {
  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    this.elementRef.nativeElement.focus();
  }
}
