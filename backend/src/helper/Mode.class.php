<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class Mode {
  const relations = [
    'RW' => ['RO'],
    'RO' => [],
    'monitor' => [
      'monitor-group',
      'monitor-study'
    ],
    'monitor-group' => [],
    'monitor-study' => [],
  ];

  // capabilities are defined in /definitions/, this is a digest on what concerns the backend TODO use the /definitions/ maybe
  const capabilities = [
    'run-hot-return' => [
      'monitorable'
    ],
    'run-hot-restart' => [
      'alwaysNewSession',
      'monitorable'
    ],
    'run-demo' => [
      'alwaysNewSession'
    ],
    'run-trial' => [
      'monitorable'
    ],
    'run-review' => [],
    'run-simulation' => [],
    'monitor-group' => [],
    'monitor-study' => []
  ];

  static function withChildren(string $role): array {
    if (!isset(Mode::relations[$role])) {
      return [];
    }

    $roles = [$role];

    foreach (Mode::relations[$role] as $childRole) {
      $roles = array_merge($roles, Mode::withChildren($childRole));
    }

    return $roles;
  }

  static function hasCapability(string $role, string $capability): bool {
    return in_array($capability, Mode::capabilities[$role] ?? []);
  }

  static function getByCapability(string $capability): array {
    $roles = [];
    foreach (Mode::capabilities as $role => $capabilities) {
      if (in_array($capability, $capabilities)) {
        $roles[] = $role;
      }
    }
    return $roles;
  }
}
