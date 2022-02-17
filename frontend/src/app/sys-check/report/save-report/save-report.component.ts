import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Component } from '@angular/core';

@Component({
  selector: 'app-save-report',
  templateUrl: './save-report.component.html',
  styleUrls: ['./save-report.component.css']
})

export class SaveReportComponent {
  savereportform = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(3)]),
    key: new FormControl('', [Validators.required, Validators.minLength(3)])
  });
}
