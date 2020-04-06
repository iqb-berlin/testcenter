<?php
declare(strict_types=1);


use Slim\App;
use Slim\Exception\HttpForbiddenException;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('/booklet', function(App $app) {

    $sessionDAO = new SessionDAO();

    $app->get('/{booklet_name}/state', function (Request $request, Response $response) use ($sessionDAO) {

        /* @var $authToken PersonAuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $personToken = $authToken->getToken();

        $bookletName = $request->getAttribute('booklet_name');

        if (!$sessionDAO->personHasBooklet($personToken, $bookletName)) {

            throw new HttpForbiddenException($request, "Booklet `$bookletName` is not allowed for $personToken");
        }

        $bookletStatus = $sessionDAO->getBookletStatus($personToken, $bookletName);

        if (!$bookletStatus['running']) {

            $workspaceController = new BookletsFolder((int) $authToken->getWorkspaceId());
            $bookletStatus['label'] = $workspaceController->getBookletName($bookletName);
        }

        return $response->withJson($bookletStatus);
    });
})
    ->add(new RequirePersonToken());
