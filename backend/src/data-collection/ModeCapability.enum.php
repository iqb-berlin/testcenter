<?php

declare(strict_types=1);

/**
 * The options of `definitions/testtaker/test-mode.json` the backend acts on. The values are the option keys there.
 */
enum ModeCapability: string {
  case ALWAYS_NEW_SESSION = 'alwaysNewSession';
  case MONITORABLE = 'monitorable';
  case LOCK_AFTER_FAILED_LOGINS = 'lockAfterFailedLogins';
}
