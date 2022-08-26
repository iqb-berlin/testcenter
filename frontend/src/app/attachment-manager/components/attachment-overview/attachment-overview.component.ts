import { Component, OnInit } from '@angular/core';
import { BackendService } from '../../services/backend/backend.service';
import { AttachmentData } from '../../interfaces/users.interfaces';

@Component({
  templateUrl: './attachment-overview.component.html',
  styleUrls: [
    '../../../../monitor-layout.css',
    './attachment-overview.component.css'
  ]
})
export class AttachmentOverviewComponent implements OnInit {
  constructor(
    private bs: BackendService
  ) {
  }

  attachmentData: AttachmentData[];
  displayedColumns: string[] = ['personLabel', 'testLabel', 'unitLabel', 'type', 'lastModified'];

  ngOnInit(): void {
    this.bs.getAttachmentsData([])
      .subscribe(attachmentData => {
        console.log(attachmentData);
        this.attachmentData = attachmentData;
      });
  }
}
