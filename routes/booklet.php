<?php


use Slim\App;
use Slim\Exception\HttpForbiddenException;
use Slim\Http\Request;
use Slim\Http\Response;

/**
 * TODO this should as well RequirePersonToken instead of RequireLoginToken
 * after https://github.com/iqb-berlin/testcenter-iqb-ng/issues/52 is resolved,
 * remove lines marked below from here
 */
$app->group('/booklet', function(App $app) {

    $dbConnectionStart = new DBConnectionStart();

    $app->get('/{booklet_name}/state', function (Request $request, Response $response) use ($dbConnectionStart) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $personToken = $authToken->getToken();

        /* TODO instead work with personToken and delete from here ... */
        if ($authToken::type == "group") {

            $code = $request->getParam('code', '');

            $loginId = $dbConnectionStart->getLoginId($authToken->getToken());

            if ($loginId == null) {
                throw new HttpForbiddenException($request);
            }
            $person = $dbConnectionStart->getOrCreatePerson($loginId, $code);

            $personToken = $person['token'];

        }
        /* ... to here ... */

        $bookletName = $request->getAttribute('booklet_name');

        if (!$dbConnectionStart->personHasBooklet($personToken, $bookletName)) {

            throw new HttpForbiddenException($request, "Booklet `$bookletName` is not allowed for $personToken");
        }

        $bookletStatus = $dbConnectionStart->getBookletStatus($personToken, $bookletName);

        if (!$bookletStatus['running']) {

            $workspaceController = new WorkspaceController($dbConnectionStart->getWorkspaceId($personToken));
            $bookletStatus['label'] = $workspaceController->getBookletName($bookletName);
        }

        return $response->withJson($bookletStatus);
    });
})
    ->add(new RequireLoginToken());
