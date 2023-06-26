import { InjectionToken } from '@angular/core';
import { GroupMonitorConfig } from './group-monitor.interfaces';

export const GROUP_MONITOR_CONFIG = new InjectionToken<GroupMonitorConfig>('groupMonitor.config');
