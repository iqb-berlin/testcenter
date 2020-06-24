<?php

/**
 * STAND problem: prcess isolation bringt nix, die echten objecte werden trotzdem geladne (evtl. nach setup verlegen?)
 *
 *  clear && vendor/bin/phpunit --process-isolation
 * sehen ob man es hinkriegt, das hier alle Moduel gemocked werden können
 *
 * * testen ob richtig gebroadcatses etc. wird
 * * sampledata teststakers ->!
 * * e2e-tests reparieren
 * * primary index auf booklet+person umstellen
 * * testen....
 * *
 *
 *
 *
 */

use PHPUnit\Framework\TestCase;

//use MockLogin as Login;


class MockingObject {

}

class Login {

}


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class SessionControllerTest extends TestCase {

        static function setUpBeforeClass() {

            require_once "classes/controller/SessionController.class.php";

            parent::setUpBeforeClass();
        }


    function test_registerGroup() {

            SessionController::registerGroup(new Login(), 'some_password');
        }

}
