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

require_once "classes/exception/HttpError.class.php";
require_once  "classes/controller/Controller.class.php";
require_once  "classes/controller/SessionController.class.php";

//require_once "classes/data-collection/DataCollectionTypeSafe.class.php";
//require_once "classes/data-collection/PotentialLogin.class.php";
//require_once "classes/data-collection/Login.class.php";
//require_once "classes/data-collection/Person.class.php";
//require_once "classes/data-collection/SessionChangeMessage.class.php";
//require_once "classes/data-collection/SessionChangeMessageArray.class.php";
//
//require_once "classes/dao/DAO.class.php";
//require_once "classes/dao/SessionDAO.class.php";
//require_once "classes/workspace/WorkspaceController.class.php";
//require_once "classes/workspace/TesttakersFolder.class.php";

use PHPUnit\Framework\TestCase;



/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class SessionControllerTest extends TestCase {


    function setUp() {



        parent::setUp();
    }

    /**
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    function test_registerGroup() {

            require_once "Mock.php";

            SessionController::registerGroup(
                new Login('monitor', 'group-monitor'), new Person()
            );

            print_r(BroadcastService::$log);

        }

}
