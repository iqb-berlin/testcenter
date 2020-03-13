<?php

class Role {

    const list = [
        'RW' => ['RO'],
        'RO' => ['MO'],
        'MO' => []
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
