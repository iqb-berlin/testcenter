<?php

use Slim\Exception\HttpBadRequestException;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Exception\HttpException;

$app->post('/login/admin', function(Request $request, Response $response) use ($app) {

    $dbConnection = new DBConnectionAdmin();

    $requestBody = JSON::decode($request->getBody()); // TODO call them name and password

    if (isset($requestBody->n) and isset($requestBody->p)) {
        $token = $dbConnection->login($requestBody->n, $requestBody->p);
    } else if (isset($requestBody->at)) {
        $token = $requestBody->at;
    } else {
        throw new HttpBadRequestException($request, "Authentication credentials missing.");
    }

    $tokenInfo = $dbConnection->validateToken($token);

    $workspaces = $dbConnection->getWorkspaces($token);

    if ((count($workspaces) == 0) and !$tokenInfo['user_is_superadmin']) {
        throw new HttpException($request, "You don't have any workspaces and are not allowed to create some.", 202);
    }

    return $response->withJson([
        'admintoken' => $token,
        'user_id' => $tokenInfo['user_id'],
        'name' => $tokenInfo['user_name'],
        'workspaces' => $workspaces,
        'is_superadmin' => $tokenInfo['user_is_superadmin']
    ]);
});

$app->post('/login/group', function(Request $request, Response $response) use ($app) {

    $body = RequestBodyParser::getElements($request, [
        "name" => '',
        "password" => ''
    ]);

//    // do not take the AuthHeader-Data! TODO what is this
//    $loginToken = isset($bodydata->lt) ? $bodydata->lt : '';
//    $personToken = isset($bodydata->pt) ? $bodydata->pt : '';
//    $booklet = isset($bodydata->b) ? $bodydata->b : 0;

    $loginData = [
        'logintoken' => '',
        'persontoken' => '',
        'mode' => '',
        'groupname' => '',
        'loginname' => '',
        'workspaceName' => '',
        'booklets' => [],
        'code' => '',
        'bookletlabel' => '',
        'booklet' => 0,
        'debug' => print_r($body, 1)
    ];


    $myDBConnection = new DBConnectionStart();

    // //////////////////////////////////////////////////////////////////////////////////////////////////
    // CASE A: login by name and password ///////////////////////////////////////////////////////////////
    if (strlen($body['name']) > 0 && strlen($body['password']) > 0) {

        $dataDirPath = ROOT_DIR . '/' . WorkspaceController::dataDirName;

        foreach (Folder::glob($dataDirPath, 'ws_*') as $workspaceDir) {

            $workspaceId = array_pop(explode('_', $workspaceDir));
            error_log('HIHI' . print_r(explode('_', $workspaceDir), 1));
            $workspaceController = new WorkspaceController((int)$workspaceId);
            $availableBookletsForLogin = $workspaceController->findAvailableBookletsForLogin($body['name'], $body['password']);
            if (count($availableBookletsForLogin)) {
                break;
            }
        }

        if (count($availableBookletsForLogin)) {
            $loginToken = $myDBConnection->login(
                $availableBookletsForLogin['workspaceId'],
                $availableBookletsForLogin['groupname'],
                $availableBookletsForLogin['loginname'],
                $availableBookletsForLogin['mode'],
                $availableBookletsForLogin['booklets']
            );
            if (strlen($loginToken) > 0) {
                $loginData = [
                    'logintoken' => $loginToken,
                    'persontoken' => '',
                    'mode' => $availableBookletsForLogin['mode'],
                    'groupname' => $availableBookletsForLogin['groupname'],
                    'loginname' => $availableBookletsForLogin['loginname'],
                    'workspaceName' => $myDBConnection->getWorkspaceName($availableBookletsForLogin['workspaceId']),
                    'booklets' => $availableBookletsForLogin['booklets'],
                    'code' => '',
                    'booklet' => 0,
                    'bookletlabel' => '',
                    'customTexts' => $availableBookletsForLogin['customTexts']
                ];
            }
        }

    /**
     * STAND:
     * case B und C
     * login/group and login/person Auseinanderziehung vorbereiten
     * fall ordner ohne teststaker subfolder abfangen (muss net error)
     * DB connection login fn überarbeiten
     */


//            // //////////////////////////////////////////////////////////////////////////////////////////////////
//            // CASE B: get logindata by persontoken //////////////////////////////////////////////////////////////
//        } elseif (strlen($personToken) > 0) {
//            $dbReturn = $myDBConnection->getAllBookletsByPersonToken($personToken);
//            if (count($dbReturn['booklets']) > 0 ) {
//                $myerrorcode = 0;
//                $loginData = $dbReturn;
//                $loginData['persontoken'] = $personToken;
//                $loginData['booklet'] = $booklet;
//                if ($booklet > 0) {
//                    $loginData['bookletlabel'] = $myDBConnection->getBookletName($booklet);
//                }
//            }
//
//            // //////////////////////////////////////////////////////////////////////////////////////////////////
//            // CASE C: get logindata by logintoken //////////////////////////////////////////////////////////////
//        } elseif (strlen($loginToken) > 0) {
//            $dbReturn = $myDBConnection->getAllBookletsByLoginToken($loginToken);
//            if (count($dbReturn['booklets']) > 0 ) {
//                $myerrorcode = 0;
//                $loginData = $dbReturn;
//                $loginData['persontoken'] = $personToken;
//                $loginData['booklet'] = 0;
//                $loginData['code'] = '';
//
//            }
    }

    return $response->withJson($loginData);

});

$app->post('/login/person', function(Request $request, Response $response) use ($app) {


});
