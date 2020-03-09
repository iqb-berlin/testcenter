<?php


use Slim\App;
use Slim\Exception\HttpForbiddenException;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('/booklet', function(App $app) {

    $dbConnectionStart = new DBConnectionStart();

    $app->get('/{booklet_name}/state', function (Request $request, Response $response) use ($dbConnectionStart) {

        /* @var $authToken PersonAuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $loginToken = $authToken->getToken();

        $bookletName = $request->getAttribute('booklet_name');

        $code = $request->getQueryParam('code', '');

        if (!$dbConnectionStart->loginHasBooklet($loginToken, $bookletName, $code)) {

            throw new HttpForbiddenException($request, "Booklet `$bookletName` is not allowed for $loginToken/$code");
        }

        $bookletStatus = $dbConnectionStart->getBookletStatus($loginToken, $bookletName, $code);

        if (!$bookletStatus['running']) {

            $workspaceController = new WorkspaceController($dbConnectionStart->getWorkspaceId($loginToken));
            $bookletStatus['label'] = $workspaceController->getBookletName($bookletName);
        }

        return $response->withJson($bookletStatus);
    });
})
    ->add(new RequireGroupToken());
