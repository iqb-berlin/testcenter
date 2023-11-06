<?php

declare(strict_types=1);

enum ReportType: string {
  case SYSCHECK = 'syscheck';
  case RESPONSE = 'response';
  case LOG = 'log';
  case REVIEW = 'review';
}
