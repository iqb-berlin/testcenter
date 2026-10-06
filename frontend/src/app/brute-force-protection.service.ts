import { Injectable } from '@angular/core';
import {
  from, map, Observable, switchMap
} from 'rxjs';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { AppError, AuthData } from './app.interfaces';
import { BackendService, Challenge, ChallengeRequest } from './backend.service';

type LoginType = 'admin' | 'login' | 'person';

@Injectable({
  providedIn: 'root'
})
export class BruteForceProtectionService {
  constructor(private backendService: BackendService, private mainDataService: MainDataService) { }

  static readonly insecureContextMessage =
    'Die Anmeldung ist nur über eine verschlüsselte Verbindung (HTTPS) möglich. ' +
    'Bitte wenden Sie sich an den Betreiber dieses Servers.';

  /** Whether the backend requires a solved challenge for this login type (env var BRUTE_FORCE_PROTECTION). */
  isActive$(loginType: LoginType): Observable<boolean> {
    return this.mainDataService.appConfig$
      .pipe(map(appConfig => appConfig.bruteForceProtection.includes(loginType)));
  }

  /**
   * Whether this login type is protected but the challenge cannot be solved, because browsers provide the
   * Web Crypto API only in secure contexts (HTTPS or localhost).
   */
  isUnavailable$(loginType: LoginType): Observable<boolean> {
    return this.isActive$(loginType)
      .pipe(map(isActive => isActive && !window.isSecureContext));
  }

  /**
   * Logs in via proof of work: the backend issues a challenge for the given credentials, the browser solves it,
   * and the solution is exchanged for a session. The credentials are only checked in the last step.
   */
  createSession(request: ChallengeRequest): Observable<AuthData> {
    return this.backendService.createChallenge(request)
      .pipe(
        switchMap(challenge => from(this.solve(challenge))
          .pipe(
            switchMap(number => this.backendService.createSession(
              challenge.algorithm,
              challenge.challenge,
              challenge.salt,
              challenge.signature,
              number
            ))
          ))
      );
  }

  /** Finds the number the challenge hash was built from by brute force, spread over several web workers. */
  private async solve(challenge: Challenge): Promise<number> {
    const { solveChallengeWorkers } = await import('altcha-lib');
    const solution = await solveChallengeWorkers(
      `${window.document.baseURI}/altcha-lib/dist/worker.js`,
      8,
      challenge.challenge,
      challenge.salt,
      challenge.algorithm,
      challenge.maxNumber
    );
    if (!solution) {
      throw new AppError({
        label: 'Problem bei der Anmeldung.',
        description: 'Die Anmelde-Challenge konnte nicht gelöst werden.'
      });
    }
    return solution.number;
  }
}
