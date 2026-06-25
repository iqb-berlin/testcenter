import { Injectable } from '@angular/core';
import { ViewSettings } from '@app/app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ViewSettingsService {
  viewSettings?: ViewSettings;
}
