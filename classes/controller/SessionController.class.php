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

        $loginSession = self::sessionDAO()->getOrCreateLoginSession($body['name'], $body['password']);

        if (!$loginSession) {
            $shortPw = Password::shorten($body['password']);
            throw new HttpBadRequestException($request, "No Login for `{$body['name']}` with `{$shortPw}`.");
        }

        if (!$loginSession->getLogin()->isCodeRequired()) {

            $person = self::sessionDAO()->getOrCreatePerson($loginSession, '');
            $session = Session::createFromPersonSession(new PersonSession($loginSession, $person));

            if ($loginSession->getLogin()->getMode() == 'monitor-group') {

                self::registerGroup($loginSession);

                $booklets = self::getBookletsOfMonitor($loginSession->getLogin());

                $session->addAccessObjects('test', ...$booklets);
            }

        } else {

            $session = new Session(
                $loginSession->getToken(),
                "{$loginSession->getLogin()->getGroupName()}/{$loginSession->getLogin()->getName()}",
                ['codeRequired'],
                $loginSession->getLogin()->getCustomTexts()
            );
        }

        return $response->withJson($session);
    }


    public static function putSessionPerson(Request $request, Response $response): Response {

        $body = RequestBodyParser::getElements($request, [
            'code' => ''
        ]);
        $loginSession = self::sessionDAO()->getLoginSessionByToken(self::authToken($request)->getToken());
        $person = self::sessionDAO()->getOrCreatePerson($loginSession, $body['code']);
        $session = Session::createFromPersonSession(new PersonSession($loginSession, $person));
        return $response->withJson($session);
    }


    // TODO write unit test
    // TODO make private
    public static function getBookletsOfMonitor(Login $login): array {

        $testtakersFolder = new TesttakersFolder($login->getWorkspaceId());
        $members = $testtakersFolder->getPersonsInSameGroup($login->getName());
        $booklets = [];

        foreach ($members as $member) { /* @var $member Login */

            $codes2booklets = $member->getBooklets();
            $codes2booklets = !$codes2booklets ? [] : $codes2booklets;

            foreach ($codes2booklets as $bookletList) {

                foreach ($bookletList as $booklet) {

                    $booklets[] = $booklet;
                }
            }
        }

        return array_unique($booklets);
    }


    public static function registerGroup(LoginSession $login): void { // TODO make private

        if ($login->getLogin()->getMode() == 'monitor-group') {

            $testtakersFolder = new TesttakersFolder($login->getLogin()->getWorkspaceId());
            $bookletsFolder = new BookletsFolder($login->getLogin()->getWorkspaceId());
            $members = $testtakersFolder->getPersonsInSameGroup($login->getLogin()->getName());
            $bookletLabels = [];

            foreach ($members as $member) { /* @var $member Login */

                if (in_array($member->getMode(), Mode::getByCapability('alwaysNewSession'))) {
                    continue;
                }

                $memberLogin = SessionController::sessionDAO()->getOrCreateLoginSession($member->getName(), $member->getPassword());

                foreach ($member->getBooklets() as $code => $booklets) {

                    // TODO validity?
                    $memberPerson = SessionController::sessionDAO()->getOrCreatePerson($memberLogin, $code, false);

                    foreach ($booklets as $booklet) {

                        if (!isset($bookletLabels[$booklet])) {
                            $bookletLabels[$booklet] = $bookletsFolder->getBookletLabel($booklet) ?? "LABEL OF $booklet";
                        }
                        $test = self::testDAO()->getOrCreateTest($memberPerson->getId(), $booklet, $bookletLabels[$booklet]);
                        $sessionMessage = SessionChangeMessage::newSession($memberLogin->getLogin(), $memberPerson, (int) $test['id']);
                        $sessionMessage->setTestState([], $booklet);
                        BroadcastService::sessionChange($sessionMessage);
                    }
                }
            }
        }
    }


    public static function getSession(Request $request, Response $response): Response {

        $authToken = self::authToken($request);

        if ($authToken->getType() == "login") {

            $loginSession = self::sessionDAO()->getLoginSessionByToken($authToken->getToken());
            $session = Session::createFromLoginSession($loginSession);

            return $response->withJson($session);
        }

        if ($authToken->getType() == "person") {

            $loginWithPerson = self::sessionDAO()->getPersonSession($authToken->getToken());
            $session = Session::createFromPersonSession($loginWithPerson);

            if ($authToken->getMode() == 'monitor-group') {

                $booklets = self::getBookletsOfMonitor($loginWithPerson->getLoginSession()->getLogin());
                $session->addAccessObjects('test', ...$booklets);
            }

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
