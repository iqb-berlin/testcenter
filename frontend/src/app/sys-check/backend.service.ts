import { Injectable, Inject, SkipSelf } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CheckConfig,
  NetworkRequestTestResult,
  UnitAndPlayerContainer,
  SysCheckReport, ServerTime
} from './sys-check.interfaces';
import { AppError } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('BACKEND_URL') readonly serverUrl: string,
    @SkipSelf() private http: HttpClient
  ) {}

  getCheckConfigData(workspaceId: number, sysCheckName: string): Observable<CheckConfig> {
    return this.http.get<CheckConfig>(`${this.serverUrl}workspace/${workspaceId}/sys-check/${sysCheckName}`);
  }

  saveReport(workspaceId: number, sysCheckName: string, sysCheckReport: SysCheckReport): Observable<void> {
    const url = `${this.serverUrl}workspace/${workspaceId}/sys-check/${sysCheckName}/report`;
    return this.http
      .put<void>(url, { ...sysCheckReport })
      .pipe(
        catchError((err: AppError) => {
          if (err.code === 403) {
            throw new AppError({
              description: 'Bitte geben Sie unten das Kennwort ein, das Sie von der Projektleitung erhalten haben!',
              label: 'Falsches Kennwort'
            });
          }
          throw err;
        })
      );
  }

  getUnitAndPlayer(workspaceId: number, sysCheckId: string): Observable<UnitAndPlayerContainer> {
    return this.http
      .get<UnitAndPlayerContainer>(`${this.serverUrl}workspace/${workspaceId}/sys-check/${sysCheckId}/unit-and-player`);
  }

  getServerTime(): Observable<ServerTime> {
    return this.http.get<ServerTime>(`${this.serverUrl}system/time`);
  }

  benchmarkDownloadRequest(requestedDownloadSize: number): Promise<NetworkRequestTestResult> {
    const { serverUrl } = this;
    const cacheKiller = `&uid=${new Date().getTime()}`;
    const testResult: NetworkRequestTestResult = {
      type: 'downloadTest',
      size: requestedDownloadSize,
      duration: 5000,
      error: null,
      speedInBPS: 0
    };

    return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      const startingTime = BackendService.getMostPreciseTimestampBrowserCanProvide();
      xhr.open('GET', `${serverUrl}speed-test/random-package/${requestedDownloadSize}${cacheKiller}`, true);

      xhr.timeout = 45000;

      xhr.onload = () => {
        if (xhr.status !== 200) {
          testResult.error = `Error ${xhr.statusText} (${xhr.status}) `;
        }
        // eslint-disable-next-line eqeqeq
        if (xhr.response.toString().length != requestedDownloadSize) {
          testResult.error = 'Error: Data package has wrong size!' +
            `(${requestedDownloadSize} !== ${xhr.response.toString().length})`;
        }
        const currentTime = BackendService.getMostPreciseTimestampBrowserCanProvide();
        testResult.duration = currentTime;
        testResult.duration = currentTime - startingTime;
        resolve(testResult);
      };

      xhr.onerror = () => {
        testResult.error = `Network Error ${xhr.statusText} (${xhr.status}) `;
        resolve(testResult);
      };

      xhr.ontimeout = () => {
        testResult.duration = xhr.timeout;
        testResult.error = 'timeout';
        resolve(testResult);
      };

      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(`{"size":"${requestedDownloadSize}"}`);
    });
  }

  benchmarkUploadRequest(requestedUploadSize: number): Promise<NetworkRequestTestResult> {
    const { serverUrl } = this;
    const randomContent = BackendService.generateRandomContent(requestedUploadSize);
    const testResult: NetworkRequestTestResult = {
      type: 'uploadTest',
      size: requestedUploadSize,
      duration: 10000,
      error: null,
      speedInBPS: 0
    };

    return new Promise(resolve => {
      const startingTime = BackendService.getMostPreciseTimestampBrowserCanProvide();
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${serverUrl}speed-test/random-package`, true);
      xhr.timeout = 10000;
      xhr.setRequestHeader('Content-Type', 'text/plain');

      xhr.onload = () => {
        if (xhr.status !== 200) {
          testResult.error = `Error ${xhr.statusText} (${xhr.status}) `;
        }

        const currentTime = BackendService.getMostPreciseTimestampBrowserCanProvide();
        testResult.duration = currentTime - startingTime;

        try {
          const response = JSON.parse(xhr.response);

          const arrivingSize = parseFloat(response.packageReceivedSize);
          // eslint-disable-next-line eqeqeq
          if (arrivingSize != requestedUploadSize) {
            testResult.error = `Error: Data package has wrong size! ${requestedUploadSize} != ${arrivingSize}`;
          }
        } catch (e) {
          testResult.error = 'bogus server response';
        }

        resolve(testResult);
      };

      xhr.onerror = () => {
        testResult.error = `Network Error ${xhr.statusText} (${xhr.status}) `;
        resolve(testResult);
      };

      xhr.ontimeout = () => {
        testResult.duration = xhr.timeout;
        testResult.error = 'timeout';
        resolve(testResult);
      };

      xhr.send(randomContent);
    });
  }

  private static getMostPreciseTimestampBrowserCanProvide(): number {
    if (typeof performance !== 'undefined') {
      const timeOrigin = (typeof performance.timeOrigin !== 'undefined') ?
        performance.timeOrigin :
        performance.timing.navigationStart;
      if (typeof timeOrigin !== 'undefined' && timeOrigin) {
        return timeOrigin + performance.now();
      }
    }
    return Date.now(); // milliseconds
  }

  private static generateRandomContent(length: number): string {
    const base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcefghijklmnopqrstuvwxyz0123456789+/';
    let randomString = '';
    for (let i = 1; i <= length; i++) {
      const randomCharacterID = Math.floor(Math.random() * 63);
      randomString += base64Characters[randomCharacterID];
    }
    return randomString;
  }
}
