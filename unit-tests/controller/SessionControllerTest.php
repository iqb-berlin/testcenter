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
 * problem:
 * * bei der Monitor-Anmeldung könnten alle personen der gruppe bereits angelegt werden
 * aber: wie können wir dann wissen, welche person, welchen test starten wird
 *
 * a) test auch bereits anlegen in einem ungestarteten zustand
 * - ungestartete und nicht vorhandene tests müssen gleich behandelt werden...
 * b) beim test starten wird eine freue person für diesen test ausgesucht
 * - kompliziert
 * + index könnte weiterhin personId sein
 * c) bei person eine weitere Spalte, die sagt welcher Test hier kommen wird, sonst wie b
 * d) der monitor hat information über alle potentiellen tests gecached, dann wird das jedes Mal gebroadcastet
 * (ohne personId - kein problem nach neuem index?)
 *
 * PROBLEM:
 * 1 person >> mehrere tests!!! wir wollen nicht pro booklet eine person anlegen
 * * wiederspricht b, c, auch d (weil das mit dem neuen Index ein Problem für sich ist)
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
                new Login('monitor', 'monitor-group'), new Person()
            );

//            print_r(BroadcastService::$log);

        }

}
