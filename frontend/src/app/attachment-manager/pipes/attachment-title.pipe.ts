import { Pipe, PipeTransform } from '@angular/core';
import { CustomtextService } from '../../shared/services/customtext/customtext.service';
import { AttachmentData } from '../interfaces/users.interfaces';

@Pipe({
    name: 'AttachmentTitle',
    standalone: false
})
export class AttachmentTitlePipe implements PipeTransform {
  private template: string | null = null;

  constructor(
    private customtextService: CustomtextService
  ) {
    this.customtextService.getCustomText$('am_page_template_label')
      .subscribe(
        labelTemplate => {
          this.template = labelTemplate;
        });
  }

  transform(attachment: AttachmentData): string {
    if (this.template == null) {
      return '';
    }

    // TODO make missing data available in FE
    return this.template
      // .replace('%GROUP%', attachment)
      // .replace('%LOGIN%', attachment)
      // .replace('%CODE%', attachment.variableId);
      .replace('%TESTTAKER%', attachment.personLabel)
      .replace('%BOOKLET%', attachment.bookletLabel)
      .replace('%UNIT%', attachment.unitLabel)
      .replace('%VAR%', attachment.variableId);
  }
}
