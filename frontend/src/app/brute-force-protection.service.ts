import { Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { AppError, AuthData } from './app.interfaces';
import { BackendService, Challenge, ChallengeRequest } from './backend.service';

@Injectable({
  providedIn: 'root'
})
export class BruteForceProtectionService {
  constructor(private backendService: BackendService, private mainDataService: MainDataService) { }

  /** Whether the backend requires a solved challenge for this login type (env var BRUTE_FORCE_PROTECTION). */
  isActive(loginType: 'admin' | 'login' | 'person'): boolean {
    return !!this.mainDataService.appConfig?.bruteForceProtection.includes(loginType);
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
