import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { LoggerService } from '@nestjs/common/services/logger.service';

@Injectable({ scope: Scope.TRANSIENT })
export class BsLogger extends ConsoleLogger implements LoggerService {
  log(message: any, context?: string): void {
      if (['RouterExplorer', 'RoutesResolver', 'InstanceLoader', ''].includes(context || '')) {
        return;
      }
      super.log(message, context);
    }
}