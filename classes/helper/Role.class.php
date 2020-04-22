<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test


class Role {

    const list = [
        'RW' => ['RO'],
        'RO' => ['MO'],
        'MO' => [],
        'monitor' => [
            'monitor-group',
            'monitor-study'
        ],
        'monitor-group' => [],
        'monitor-study' => []
    ];

    static function withChildren(string $role) {

        if (!isset(Role::list[$role])) {

            return [];
        }

        $roles = [$role];

        foreach (Role::list[$role] as $childRole) {

            $roles = array_merge($roles, Role::withChildren($childRole));
        }

        return $roles;
    }
}
