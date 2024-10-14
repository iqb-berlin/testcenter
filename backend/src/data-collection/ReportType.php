<?php

declare(strict_types=1);

enum ReportType: string {
  case LOG = 'log';
  case RESPONSE = 'response';
  case REVIEW = 'review';
  case SYSCHECK = 'sys-check';
}
