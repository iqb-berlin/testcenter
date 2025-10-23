import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Component } from '@angular/core';

@Component({
    selector: 'tc-save-report',
    templateUrl: './save-report.component.html',
    standalone: false
})

export class SaveReportComponent {
  savereportform = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(3)]),
    key: new FormControl('', [Validators.required, Validators.minLength(3)])
  });

  showPassword: boolean = false;
}
