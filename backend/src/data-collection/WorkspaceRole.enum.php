<?php

declare(strict_types=1);

/**
 * The role of an admin on a workspace, as stored in `workspace_users.role`.
 */
enum WorkspaceRole: string {
  case RW = 'RW';
  case RO = 'RO';

  public function includes(WorkspaceRole $role): bool {
    return ($this === $role) || ($this === self::RW);
  }
}
