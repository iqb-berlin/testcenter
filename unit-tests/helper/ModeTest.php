<?php

use PHPUnit\Framework\TestCase;
require_once "classes/helper/Mode.class.php";


class ModeTest extends TestCase {


    public function test_getWorkspaceName() {

        $result = Mode::withChildren('RW');
        $expectation = ['RW', 'RO'];
        $this->assertEquals($expectation, $result);

        $result = Mode::withChildren('RO');
        $expectation = ['RO'];
        $this->assertEquals($expectation, $result);

        $result = Mode::withChildren('not existing role');
        $expectation = [];
        $this->assertEquals($expectation, $result);
    }
}
