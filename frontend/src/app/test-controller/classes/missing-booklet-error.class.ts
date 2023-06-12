import { AppErrorInterface, AppErrorType } from '../../app.interfaces';

export class MissingBookletError extends Error implements AppErrorInterface {
  label = 'Booklet not Loaded';
  description = 'Booklet not loaded';
  type: AppErrorType = 'script';
}
