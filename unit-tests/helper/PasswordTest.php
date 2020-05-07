<?php

use PHPUnit\Framework\TestCase;
require_once "classes/helper/Password.class.php";
require_once "classes/exception/HttpError.class.php";

class PasswordTest extends TestCase {

    function test_encrypt_normal() {

        $password = "some_password";
        $pepper= "whatever";

        $exampleHash = '$2y$10$b8ltS296rsG2hQQDwwc8g.Q86MRR1vieRY/gkMXMq4D0KzivMIjpa';

        $hash = Password::encrypt($password, $pepper);

        $this->assertEquals(substr($exampleHash, 0, 7), substr($hash, 0, 7));
        $this->assertEquals(strlen($exampleHash), strlen($hash));
    }


    function test_encrypt_insecure() {

        $password = "some_password";
        $salt = "whatever";

        $expectation = '4084d373341366b4a4ddf782007181f501ea9767';
        $hash = Password::encrypt($password, $salt, true);

        $this->assertEquals($expectation, $hash);
    }


    function test_validate_too_short() {

        $this->expectException('HttpError');
        Password::validate('ts');
    }


    function test_validate_too_long() {

        $this->expectException('HttpError');
        Password::validate(str_repeat('x', 61));
    }


    function test_validate() {

        /** @noinspection PhpVoidFunctionResultUsedInspection */
        $this->assertNull(Password::validate(str_repeat('x', 30)));
    }


    function test_verify_normal() {

        $password = "some_password";
        $wrongPassword = "wrong_password";
        $pepper = "whatever";
        $wrongPepper = "wrong_pepper";
        $hash = Password::encrypt($password, $pepper);
        $wrongHash = "Wrong_hash";

        $result = Password::verify($password, $hash, $pepper);
        $this->assertTrue($result);

        $result = Password::verify($wrongPassword, $hash, $pepper);
        $this->assertFalse($result);

        $result = Password::verify($password, $hash, $wrongPepper);
        $this->assertFalse($result);

        $result = Password::verify($password, $wrongHash, $pepper);
        $this->assertFalse($result);
    }


    function test_verify_insecure() {

        $password = "some_password";
        $wrongPassword = "wrong_password";
        $salt = "whatever";
        $wrongSalt = "wrong_pepper";
        $hash = '4084d373341366b4a4ddf782007181f501ea9767';
        $wrongHash = "wrong_hash";

        $result = Password::verify($password, $hash, $salt);
        $this->assertTrue($result);

        $result = Password::verify($wrongPassword, $hash, $salt);
        $this->assertFalse($result);

        $result = Password::verify($password, $hash, $wrongSalt);
        $this->assertFalse($result);

        $result = Password::verify($password, $wrongHash, $salt);
        $this->assertFalse($result);
    }
}
