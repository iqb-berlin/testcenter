export type ServiceStatus = 'on' | 'off' | 'unreachable' | 'unknown';
export interface SysStatus {
  broadcastingService: ServiceStatus;
  fileService: ServiceStatus;
}
