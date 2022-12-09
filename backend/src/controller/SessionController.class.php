<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit tests !

use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\ServerRequest as Request;
use Slim\Http\Response;
use Slim\Exception\HttpException;


class SessionController extends Controller {

    protected static array $_workspaces = [];

    /**
     * @codeCoverageIgnore
     */
    public static function putSessionAdmin(Request $request, Response $response): Response {

        $body = RequestBodyParser::getElements($request, [
            "name" => null,
            "password" => null
        ]);

        $token = self::adminDAO()->createAdminToken($body['name'], $body['password']);

        $accessSet = AccessSet::createFromAdminToken($token);

        self::adminDAO()->refreshAdminToken($token);

        if (!$accessSet->hasAccessType('workspaceAdmin') and !$accessSet->hasAccessType('superAdmin')) {

            throw new HttpException($request, "You don't have any workspaces and are not allowed to create some.", 204);
        }

        return $response->withJson($accessSet);
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
            $personSession = self::sessionDAO()->renewPersonToken($personSession);
            $accessSet = AccessSet::createFromPersonSession($personSession);

            if ($loginSession->getLogin()->getMode() == 'monitor-group') {

                self::registerGroup($loginSession);
            }

        } else {

            $accessSet = AccessSet::createFromLoginSession($loginSession);
        }

        return $response->withJson($accessSet);
    }


    /**
     * @codeCoverageIgnore
     */
    public static function putSessionPerson(Request $request, Response $response): Response {

        $body = RequestBodyParser::getElements($request, [
            'code' => ''
        ]);
        $loginSession = self::sessionDAO()->getLoginSessionByToken(self::authToken($request)->getToken());
        $personSession = self::sessionDAO()->getOrCreatePersonSession($loginSession, $body['code']);
        $personSession = self::sessionDAO()->renewPersonToken($personSession);
        return $response->withJson(AccessSet::createFromPersonSession($personSession));
    }


    private static function registerGroup(LoginSession $login): void {

        if (!$login->getLogin()->getMode() == 'monitor-group') {
            return;
        }

        $workspace = self::getWorkspace($login->getLogin()->getWorkspaceId());
        $bookletFiles = [];

        $members = self::sessionDAO()->getLoginsByGroup($login->getLogin()->getGroupName(), $login->getLogin()->getWorkspaceId());

        foreach ($members as $member) { /* @var $member LoginSession */

                if (Mode::hasCapability($member->getLogin()->getMode(), 'alwaysNewSession')) {
                    continue;
                }

                if (!Mode::hasCapability($member->getLogin()->getMode(),'monitorable')) {
                    continue;
                }

                if (!$member->getToken()) {
                    $member = SessionController::sessionDAO()->createLoginSession($member->getLogin());
                }

            foreach ($member->getLogin()->getBooklets() as $code => $booklets) {

                $memberPersonSession = SessionController::sessionDAO()->getOrCreatePersonSession($member, $code, false);

                foreach ($booklets as $bookletId) {

                    if (!isset($bookletLabels[$bookletId])) {
                        $bookletFile = $workspace->findFileById('Booklet', $bookletId);
                        /* @var $bookletFile XMLFileBooklet */
                        $bookletFiles[$bookletId] = $bookletFile;
                    }
                    $test = self::testDAO()->getOrCreateTest(
                        $memberPersonSession->getPerson()->getId(),
                        $bookletId,
                        $bookletFiles[$bookletId]->getLabel()
                    );
                    $sessionMessage = SessionChangeMessage::session((int) $test['id'], $memberPersonSession);
                    $sessionMessage->setTestState([], $bookletId);
                    BroadcastService::sessionChange($sessionMessage);
                }
            }
        }
    }


    private static function getWorkspace(int $workspaceId): Workspace {

        if (!isset(self::$_workspaces[$workspaceId])) {

            self::$_workspaces[$workspaceId] = new Workspace($workspaceId);
        }

        return self::$_workspaces[$workspaceId];
    }


    public static function getSession(Request $request, Response $response): Response {

        $authToken = self::authToken($request);

        if ($authToken->getType() == "login") {

            $loginSession = self::sessionDAO()->getLoginSessionByToken($authToken->getToken());
            return $response->withJson(AccessSet::createFromLoginSession($loginSession));
        }

        if ($authToken->getType() == "person") {

            $personSession = self::sessionDAO()->getPersonSessionByToken($authToken->getToken());
            $accessSet = AccessSet::createFromPersonSession($personSession);
            return $response->withJson($accessSet);
        }

        if ($authToken->getType() == "admin") {

            $accessSet = AccessSet::createFromAdminToken($authToken->getToken());
            self::adminDAO()->refreshAdminToken($authToken->getToken());
            return $response->withJson($accessSet);
        }

        throw new HttpUnauthorizedException($request);
    }
}
