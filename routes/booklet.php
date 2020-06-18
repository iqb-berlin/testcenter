<?php
declare(strict_types=1);

use Slim\App;
use Slim\Exception\HttpForbiddenException;
use Slim\Http\Request;
use Slim\Http\Response;

$app->group('/booklet', function(App $app) {

    $sessionDAO = new SessionDAO();
    $adminDAO = new AdminDAO();

    $app->get('/{booklet_name}/data', function (Request $request, Response $response) use ($sessionDAO, $adminDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $personToken = $authToken->getToken();

        $bookletName = $request->getAttribute('booklet_name');

        if (!$sessionDAO->personHasBooklet($personToken, $bookletName)
            and !$adminDAO->hasMonitorAccessToWorkspace($personToken, $authToken->getWorkspaceId())) {

            throw new HttpForbiddenException($request, "Booklet with name `$bookletName` is not allowed for $personToken");
        }

        $bookletStatus = $sessionDAO->getBookletStatus($personToken, $bookletName);

        $bookletsFolder = new BookletsFolder((int) $authToken->getWorkspaceId());

        if (!$bookletStatus['running']) { // TODO is this OK?

            $bookletStatus['label'] = $bookletsFolder->getBookletLabel($bookletName);
        }

        return $response->withJson($bookletStatus);
    });


    $app->get('/{booklet_name}', function (Request $request, Response $response) use ($sessionDAO, $adminDAO) {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');
        $personToken = $authToken->getToken();

        $bookletName = $request->getAttribute('booklet_name');

        if (!$sessionDAO->personHasBooklet($personToken, $bookletName)
            and !$adminDAO->hasMonitorAccessToWorkspace($personToken, $authToken->getWorkspaceId())) {

            throw new HttpForbiddenException($request, "Booklet with name `$bookletName` is not allowed for $personToken");
        }

        $bookletName = $request->getAttribute('booklet_name');
        $bookletsFolder = new BookletsFolder((int) $authToken->getWorkspaceId());
        $xml = $bookletsFolder->getXMLFileByName('Booklet', $bookletName)->xmlfile->asXML();

        $response->withHeader('Content-Type', 'application/xml')->write($xml);
    });

})
    ->add(new RequireToken('person'));
