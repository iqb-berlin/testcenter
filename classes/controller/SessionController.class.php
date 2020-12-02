<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit tests !

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Exception\HttpException;


class SessionController extends Controller {

    const restartModes = ['run-hot-restart', 'run-demo'];

    public static function putSessionAdmin(Request $request, Response $response): Response {

        $body = RequestBodyParser::getElements($request, [
            "name" => null,
            "password" => null
        ]);

        $token = self::adminDAO()->createAdminToken($body['name'], $body['password']);

        $session = self::adminDAO()->getAdminSession($token);

        self::adminDAO()->refreshAdminToken($token);

        if (!$session->hasAccess('workspaceAdmin') and !$session->hasAccess('superAdmin')) {

            throw new HttpException($request, "You don't have any workspaces and are not allowed to create some.", 204);
        }

        return $response->withJson($session);
    }


    public static function putSessionLogin(Request $request, Response $response): Response {

        $body = RequestBodyParser::getElements($request, [
            "name" => null,
            "password" => ''
        ]);

        $potentialLogin = TesttakersFolder::searchAllForLogin($body['name'], $body['password']);

        if ($potentialLogin == null) {
            $shortPw = Password::shorten($body['password']);
            throw new HttpBadRequestException($request, "No Login for `{$body['name']}` with `{$shortPw}`");
        }

        $forceCreate = in_array($potentialLogin->getMode(), self::restartModes);
        $login = self::sessionDAO()->getOrCreateLogin($potentialLogin, $forceCreate);

        if (!$login->isCodeRequired()) {

            $session = self::getOrCreatePersonSession($login, '');

            if ($login->getMode() == 'monitor-group') {

                self::registerGroup($login, $body['password']);

                $booklets = self::getBookletsOfMonitor($login, $body['password']);

                $session->addAccessObjects('test', ...$booklets);
            }

        } else {

            $session = new Session(
                $login->getToken(),
                "{$login->getGroupName()}/{$login->getName()}",
                ['codeRequired'],
                $login->getCustomTexts()
            );
        }

        return $response->withJson($session);
    }


    public static function putSessionPerson(Request $request, Response $response): Response {

        $body = RequestBodyParser::getElements($request, [
            'code' => ''
        ]);
        $login = self::sessionDAO()->getLogin(self::authToken($request)->getToken());
        $session = self::getOrCreatePersonSession($login, $body['code']);
        return $response->withJson($session);
    }


    private static function getOrCreatePersonSession(Login $login, string $code): Session {

        $person = self::sessionDAO()->getOrCreatePerson($login, $code);
        $session = Session::createFromLogin($login, $person);
        BroadcastService::sessionChange(SessionChangeMessage::login($login, $person));
        return $session;
    }


    // TODO write unit test
    // TODO make private
    public static function getBookletsOfMonitor(Login $login, string $password): array {

        $testtakersFolder = new TesttakersFolder($login->getWorkspaceId());
        $members = $testtakersFolder->getMembersOfLogin($login->getName(), $password);
        $booklets = [];

        foreach ($members as $member) { /* @var $member PotentialLogin */

            $codes2booklets = $member->getBooklets();
            $codes2booklets = !$codes2booklets ? [] : $codes2booklets;

            foreach ($codes2booklets as $code => $bookletList) {

                foreach ($bookletList as $booklet) {

                    $booklets[] = $booklet;
                }
            }
        }

        return array_unique($booklets);
    }


    public static function registerGroup(Login $login, string $password): void { // TODO make private

        $testtakersFolder = new TesttakersFolder($login->getWorkspaceId());
        $bookletsFolder = new BookletsFolder($login->getWorkspaceId());
        $members = $testtakersFolder->getMembersOfLogin($login->getName(), $password);
        $bookletLabels = [];

        foreach ($members as $member) { /* @var $member PotentialLogin */

            if (in_array($member->getMode(), self::restartModes)) {
                continue;
            }

            $memberLogin = SessionController::sessionDAO()->getOrCreateLogin($member);

            foreach ($member->getBooklets() as $code => $booklets) {

                // TODO validity?
                $memberPerson = SessionController::sessionDAO()->getOrCreatePerson($memberLogin, $code);

                foreach ($booklets as $booklet) {

                    if (!isset($bookletLabels[$booklet])) {
                        $bookletLabels[$booklet] = $bookletsFolder->getBookletLabel($booklet) ?? "LABEL OF $booklet";
                    }
                    $test = self::testDAO()->getOrCreateTest($memberPerson->getId(), $booklet, $bookletLabels[$booklet]);
                    $sessionMessage = SessionChangeMessage::login($memberLogin, $memberPerson);
                    $sessionMessage->setTestState((int) $test['id'], [], $booklet);
                    BroadcastService::sessionChange($sessionMessage);
                }
            }
        }
    }


    public static function getSession(Request $request, Response $response): Response {

        $authToken = self::authToken($request);

        if ($authToken->getType() == "login") {

            $session = self::sessionDAO()->getLoginSession($authToken->getToken());
            return $response->withJson($session);
        }

        if ($authToken->getType() == "person") {

            $loginWithPerson = self::sessionDAO()->getPersonLogin($authToken->getToken());
            $session = Session::createFromLogin($loginWithPerson->getLogin(), $loginWithPerson->getPerson());

            if ($authToken->getMode() == 'monitor-group') {

                $booklets = self::getBookletsOfMonitor($loginWithPerson->getLogin(), "");

                $session->addAccessObjects('test', ...$booklets);
            }

            BroadcastService::sessionChange(SessionChangeMessage::login($loginWithPerson->getLogin(), $loginWithPerson->getPerson()));

            return $response->withJson($session);
        }

        if ($authToken->getType() == "admin") {

            $session = self::adminDAO()->getAdminSession($authToken->getToken());
            self::adminDAO()->refreshAdminToken($authToken->getToken());
            return $response->withJson($session);
        }

        throw new HttpUnauthorizedException($request);
    }
}
