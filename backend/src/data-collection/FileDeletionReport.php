<?php

declare(strict_types=1);

class FileDeletionReport
{
  public function __construct(
    public array $deleted = [],
    public array $did_not_exist = [],
    public array $not_allowed = [],
    public array $was_used = [],
    public array $incorrect_path = [],
    public array $error = []
  ) {
  }
}