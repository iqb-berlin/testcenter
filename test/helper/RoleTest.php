<?php

use PHPUnit\Framework\TestCase;
require_once "classes/helper/Role.class.php";


class RoleTest extends TestCase {


    public function test_getWorkspaceName() {

        $result = Role::withChildren('RW');
        $expectation = ['RW', 'RO', 'MO'];
        $this->assertEquals($expectation, $result);

        $result = Role::withChildren('RO');
        $expectation = ['RO', 'MO'];
        $this->assertEquals($expectation, $result);

        $result = Role::withChildren('MO');
        $expectation = ['MO'];
        $this->assertEquals($expectation, $result);

        $result = Role::withChildren('not existing role');
        $expectation = [];
        $this->assertEquals($expectation, $result);
    }
}
