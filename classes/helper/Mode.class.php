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
        ],
        'monitor-group' => [],
    ];

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
        'run-trial' => [],
        'run-review' => [],
        'monitor-group' => []
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


    static function getCapabilities(string $role): array {

        $roles = Mode::withChildren($role);

        $capabilities = [];
        foreach ($roles as $role) {
            $newCapabilities = isset(Mode::capabilities[$role]) ? Mode::capabilities[$role] : [];
            $capabilities = array_merge($capabilities, $newCapabilities);
        }

        return $capabilities;
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
