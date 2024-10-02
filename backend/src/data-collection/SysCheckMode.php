<?php

declare(strict_types=1);

enum SysCheckMode: string
{
  case SYSCHECK = 'sysCheck';
  case TEST = 'test';
  case MIXED = 'mixed';
}
