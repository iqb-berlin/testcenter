<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

enum ExpirationStateType {
  case Expired;
  case Scheduled;
  case None;
}