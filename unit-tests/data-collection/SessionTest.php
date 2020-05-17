<?php

use PHPUnit\Framework\TestCase;
require_once "classes/data-collection/Session.class.php";

class SessionTest extends TestCase {

    function test_constructor() {

        $session = new Session(
            "token-string",
            "display-name",
            [1, "2nd flag"],
            (object) [
                "something" => "else"
            ]
        );

        $expected = [
            "token" => "token-string",
            "displayName" => "display-name",
            "flags" => ["1", "2nd flag"],
            "customTexts" => (object) ["something" => "else"],
            "access" => (object) []
        ];

        $this->assertEquals($expected, $session->jsonSerialize());
    }


    function test_addAccessObjects() {

        $session = new Session(
            "token-string",
            "display-name"
        );

        $session->addAccessObjects("test", "1", "2", "3");

        $expected = (object) ["test" => ["1", "2", "3"]];

        $this->assertEquals($expected, $session->jsonSerialize()["access"]);

        $session->addAccessObjects("workspaceAdmin", "1", "2", "3");

        $expected = (object) [
            "workspaceAdmin" => ["1", "2", "3"],
            "test" => ["1", "2", "3"]
        ];

        $this->assertEquals($expected, $session->jsonSerialize()["access"]);
    }


    function test_addAccessObjectsUnknownAccessType() {

        $session = new Session(
            "token-string",
            "display-name"
        );

        $this->expectException('Exception');
        $session->addAccessObjects("something_unknown", "1", "2", "3");
    }


    function test_hasAccess() {

        $session = new Session(
            "token-string",
            "display-name"
        );

        $session->addAccessObjects("test", "1", "2", "3");
        $session->addAccessObjects("superAdmin");

        $this->assertEquals(true, $session->hasAccess("test"));
        $this->assertEquals(true, $session->hasAccess("superAdmin"));
        $this->assertEquals(false, $session->hasAccess("workspaceAdmin"));
        $this->assertEquals(true, $session->hasAccess("test", 1));
        $this->assertEquals(false, $session->hasAccess("test", 5));
        $this->assertEquals(false, $session->hasAccess("superAdmin", 1));
        $this->assertEquals(false, $session->hasAccess("workspaceAdmin", 1));
    }

}
