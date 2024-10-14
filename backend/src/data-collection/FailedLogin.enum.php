<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

enum FailedLogin {
  case wrongPassword;
  case usernameNotFound;
  case wrongPasswordProtectedLogin;
}
