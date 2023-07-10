// eslint-disable-next-line max-classes-per-file
import { Injectable } from '@angular/core';
import {
  HttpBackend, HttpClient, HttpErrorResponse, HttpHeaders
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BugReportResult } from '../interfaces/bug-report.interfaces';
import { MainDataService } from './maindata/maindata.service';

@Injectable({
  providedIn: 'root'
})
export class BugReportService {
  private http: HttpClient;

  constructor(
    private handler: HttpBackend,
    private mainDataService: MainDataService
  ) {
    this.http = new HttpClient(handler); // skip injectors when talking to GitHub
  }

  publishReportAtGithub(title: string, body: string, tag: string): Observable<BugReportResult> {
    const appConfig = this.mainDataService.appConfig.getAppConfig();
    if (!appConfig.bugReportTarget || !appConfig.bugReportAuth) {
      return of({
        message: 'Fehler-Melden-Funktion nicht konfiguriert!',
        success: false
      });
    }

    const url = `https://api.github.com/repos/${appConfig.bugReportTarget}/issues`;

    const msgBody = {
      title,
      body,
      labels: ['Tescenter', tag]
    };
    const headers = new HttpHeaders({
      Authorization: `Bearer ${appConfig.bugReportAuth}`
    });
    const errorText = `Error when reporting issue to GitHub (${appConfig.bugReportTarget}).`;

    return this.http.post<{ html_url: string }>(url, msgBody, { headers })
      .pipe(
        map((data: { html_url: string }): BugReportResult => ({
          uri: data.html_url,
          message: 'Bericht gesendet, vielen Dank!',
          success: true
        })),
        catchError((error: HttpErrorResponse): Observable<BugReportResult> => {
          // eslint-disable-next-line no-console
          console.error(errorText, error);
          return of({
            message: 'Konnte Bericht nicht senden.',
            success: false
          });
        })
      );
  }
}
