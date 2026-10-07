<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Mode {
  /** @var array<string, array<string, bool>>|null mode (upper case) => option => enabled */
  private static ?array $capabilities = null;

  static function hasCapability(string $mode, ModeCapability $capability): bool {
    return self::capabilities()[strtoupper($mode)][$capability->value] ?? false;
  }

  static function requiresPassword(string $role): bool {
    return SystemConfig::$login_requirePassword && ($role !== 'sys-check-login');
  }

  /**
   * @return string[] - the modes (lower case, as used in Testtakers files) that have the capability
   */
  static function getByCapability(ModeCapability $capability): array {
    $modes = array_filter(self::capabilities(), fn(array $options) => $options[$capability->value] ?? false);
    return array_map('strtolower', array_keys($modes));
  }

  /**
   * @return array<string, array<string, bool>> - mode (upper case) => option => enabled
   */
  private static function capabilities(): array {
    if (self::$capabilities === null) {
      $definition = JSON::decode(file_get_contents(ROOT_DIR . '/definitions/testtaker/test-mode.json'), true);
      self::$capabilities = array_map(fn(array $mode) => $mode['config'], $definition);
    }
    return self::$capabilities;
  }
}
