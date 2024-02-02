import { AppErrorInterface, AppErrorType } from '../../app.interfaces';

export class MissingBookletError extends Error implements AppErrorInterface {
  readonly label = 'Booklet not Loaded';
  readonly description = 'Booklet not loaded';
  readonly type: AppErrorType = 'script';
}
