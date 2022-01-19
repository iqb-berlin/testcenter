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

    protected static array $_bookletFolders = [];

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

            $personSession = self::sessionDAO()->getOrCreatePersonSession($loginSession, '');
            $accessObject = Session::createFromPersonSession($personSession);

            if ($loginSession->getLogin()->getMode() == 'monitor-group') {

                self::registerGroup($loginSession);

                $booklets = $loginSession->getLogin()->getBooklets()[''];
                $accessObject->addAccessObjects('test', ...$booklets);
            }

        } else {

            $accessObject = new Session(
                $loginSession->getToken(),
                "{$loginSession->getLogin()->getGroupName()}/{$loginSession->getLogin()->getName()}",
                ['codeRequired'],
                $loginSession->getLogin()->getCustomTexts()
            );
        }

        return $response->withJson($accessObject);
    }


    public static function putSessionPerson(Request $request, Response $response): Response {

        $body = RequestBodyParser::getElements($request, [
            'code' => ''
        ]);
        $loginSession = self::sessionDAO()->getLoginSessionByToken(self::authToken($request)->getToken());
        $personSession = self::sessionDAO()->getOrCreatePersonSession($loginSession, $body['code']);
        $session = Session::createFromPersonSession($personSession);
        return $response->withJson($session);
    }


    public static function registerGroup(LoginSession $login): void { // TODO make private

        if ($login->getLogin()->getMode() == 'monitor-group') {

            $bookletsFolder = self::getBookletFolder($login->getLogin()->getWorkspaceId());
            $bookletLabels = [];

            $members = self::sessionDAO()->getLoginsByGroup($login->getLogin()->getGroupName(), $login->getLogin()->getWorkspaceId());

            foreach ($members as $member) { /* @var $member LoginSession */

                if (in_array($member->getLogin()->getMode(), Mode::getByCapability('alwaysNewSession'))) {
                    continue;
                }

                if (!$member->getToken()) {
                    $member = SessionController::sessionDAO()->createLoginSession($member->getLogin());
                }

                foreach ($member->getLogin()->getBooklets() as $code => $booklets) {

                    $memberPersonSession = SessionController::sessionDAO()->getOrCreatePersonSession($member, $code, false);

                    foreach ($booklets as $booklet) {

                        if (!isset($bookletLabels[$booklet])) {
                            $bookletLabels[$booklet] = $bookletsFolder->getBookletLabel($booklet) ?? "LABEL OF $booklet";
                        }
                        $test = self::testDAO()->getOrCreateTest($memberPersonSession->getPerson()->getId(), $booklet, $bookletLabels[$booklet]);
                        $sessionMessage = SessionChangeMessage::session((int) $test['id'], $memberPersonSession);
                        $sessionMessage->setTestState([], $booklet);
                        BroadcastService::sessionChange($sessionMessage);
                    }
                }
            }
        }
    }


    private static function getBookletFolder(int $workspaceId): BookletsFolder {

        if (!self::$_bookletFolders[$workspaceId]) {

            self::$_bookletFolders[$workspaceId] = new BookletsFolder($workspaceId);
        }

        return self::$_bookletFolders[$workspaceId];
    }


    public static function getSession(Request $request, Response $response): Response {

        $authToken = self::authToken($request);

        if ($authToken->getType() == "login") {

            $loginSession = self::sessionDAO()->getLoginSessionByToken($authToken->getToken());
            $session = Session::createFromLoginSession($loginSession);

            return $response->withJson($session);
        }

        if ($authToken->getType() == "person") {

            $loginWithPerson = self::sessionDAO()->getPersonSessionFromToken($authToken->getToken());
            $session = Session::createFromPersonSession($loginWithPerson);

            if ($authToken->getMode() == 'monitor-group') {

                $booklets = $loginWithPerson->getLoginSession()->getLogin()->getBooklets()[''];
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
