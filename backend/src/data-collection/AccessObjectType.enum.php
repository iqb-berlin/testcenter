<?php

declare(strict_types=1);

enum AccessObjectType: string {
  case TEST = 'test';
  case SUPER_ADMIN = 'superAdmin';
  case WORKSPACE_ADMIN = 'workspaceAdmin';
  case STUDY_MONITOR = 'studyMonitor';
  case TEST_GROUP_MONITOR = 'testGroupMonitor';
  case ATTACHMENT_MANAGER = 'attachmentManager';
  case SYS_CHECK = 'sysCheck';
}
