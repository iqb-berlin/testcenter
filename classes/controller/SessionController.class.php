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

        $potentialLogin = TesttakersFolder::searchAllForLogin($body['name'], $body['password']);

        if ($potentialLogin == null) {
            $shortPw = Password::shorten($body['password']);
            throw new HttpBadRequestException($request, "No Login for `{$body['name']}` with `{$shortPw}`");
        }

        $login = self::sessionDAO()->getOrCreateLogin($potentialLogin);

        if (!$login->isCodeRequired()) {

            $session = self::getOrCreatePersonSession($login, '');

            if ($login->getMode() == 'group-monitor') {
                self::registerGroup($login, $body['password']);
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
        self::broadcastPersonLogin($login, $person);
        return $session;
    }


    private static function registerGroup(Login $login, string $password): void {

        if ($login->getMode() == 'group-monitor') {

            // STAND
            // - PROBLEM: getLogin geht nach Name und PW, gibt es den login mehrmals nimmt er den wo das passwort passt
            // - unit tests für session controller
            // - ... funktion unten soll gehen

            // functionksweise der gruppen-anmeldung angerissen:
            $testtakersFolder = new TesttakersFolder($login->getWorkspaceId());
            $members = $testtakersFolder->getMembersOfLogin($login->getName(), $password);

            foreach ($members as $member) {

                /* @var $member PotentialLogin */

                foreach ($member->getBooklets() as $code => $booklets) {

                    // TODO validity?

                    $memberLogin = $memberLogin ?? SessionController::sessionDAO()->getOrCreateLogin($member);
                    $memberPerson = SessionController::sessionDAO()->getOrCreatePerson($memberLogin, $code);
                    $authToken = new AuthToken(
                        $memberPerson->getToken(),
                        $memberPerson->getId(),
                        'person',
                        $login->getWorkspaceId(),
                        $login->getMode(),
                        $login->getGroupName()
                    );
                    BroadcastService::sessionChange(SessionChangeMessage::login($authToken, $login, $memberPerson->getCode()));
                }
            }
        }
    }


    private static function broadcastPersonLogin(Login $login, Person $person) {

        BroadcastService::sessionChange(
            SessionChangeMessage::login(
                new AuthToken(
                    $person->getToken(),
                    $person->getId(),
                    'person',
                    $login->getWorkspaceId(),
                    $login->getMode(),
                    $login->getGroupName()
                ),
                $login,
                $person->getCode()
            )
        );
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

            self::broadcastPersonLogin($loginWithPerson->getLogin(), $loginWithPerson->getPerson());

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
