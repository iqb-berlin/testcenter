<?php
declare(strict_types=1);


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

    $sessionDAO = new SessionDAO();

    $app->get('/{booklet_name}/state', function (Request $request, Response $response) use ($sessionDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $personToken = $authToken->getToken();

        /* TODO instead work with personToken and delete from here ... */
        if ($authToken::type == "login") {

            $code = $request->getParam('code', '');

            $login = $sessionDAO->getLogin($authToken->getToken());

            $person = $sessionDAO->getOrCreatePerson($login['id'], $code, $login['validTo']);

            $personToken = $person['token'];
            $personFull = $sessionDAO->getPerson($personToken);
            $workspaceId = $personFull['workspace_id'];

        } else {

            /* @var $authToken PersonAuthToken */
            $workspaceId = $authToken->getWorkspaceId();

        }
        /* ... to here ... */

        $bookletName = $request->getAttribute('booklet_name');

        if (!$sessionDAO->personHasBooklet($personToken, $bookletName)) {

            throw new HttpForbiddenException($request, "Booklet `$bookletName` is not allowed for $personToken");
        }

        $bookletStatus = $sessionDAO->getBookletStatus($personToken, $bookletName);

        if (!$bookletStatus['running']) {

            $workspaceController = new BookletsFolder((int) $workspaceId);
            $bookletStatus['label'] = $workspaceController->getBookletName($bookletName);
        }

        return $response->withJson($bookletStatus);
    });
})
    ->add(new RequireAnyToken());
