<?php
declare(strict_types=1);

use Slim\Exception\HttpBadRequestException;
use Slim\Route;
use Slim\Http\Request;
use Slim\Http\Response;


$app->get('/', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) use ($app) {

    return $response->withJson(['version' => Version::get()]);
});


$app->get('/workspaces', function (/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) {

    $superAdminDAO = new SuperAdminDAO();
    $workspaces = $superAdminDAO->getWorkspaces();
    return $response->withJson($workspaces);
})
    ->add(new IsSuperAdmin())
    ->add(new RequireAdminToken());


$app->delete('/workspaces', function (Request $request, Response $response) {

    $superAdminDAO = new SuperAdminDAO();
    $bodyData = JSON::decode($request->getBody()->getContents());
    $workspaceList = isset($bodyData->ws) ? $bodyData->ws : [];

    if (!is_array($workspaceList)) {
        throw new HttpBadRequestException($request);
    }

    $superAdminDAO->deleteWorkspaces($workspaceList);

    return $response;
})
    ->add(new IsSuperAdmin())
    ->add(new RequireAdminToken());


$app->get('/users', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) {

    $superAdminDAO = new SuperAdminDAO();

    return $response->withJson($superAdminDAO->getUsers());
})
    ->add(new IsSuperAdmin())
    ->add(new RequireAdminToken());


$app->delete('/users', function(Request $request, Response $response) {

    $superAdminDAO = new SuperAdminDAO();
    $bodyData = JSON::decode($request->getBody()->getContents());
    $userList = isset($bodyData->u) ? $bodyData->u : [];

    $superAdminDAO->deleteUsers($userList);

    return $response;
})
    ->add(new IsSuperAdmin())
    ->add(new RequireAdminToken());


$app->get('/list/routes', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) use ($app) {

    $routes = array_reduce($app->getContainer()->get('router')->getRoutes(), function($target, Route $route) {
        foreach ($route->getMethods() as $method) {
            $target[] = "[$method] " . $route->getPattern();
        }
        return $target;
    }, []);

    return $response->withJson($routes);
});


$app->get('/version', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) use ($app) {

    return $response->withJson(['version' => Version::get()]);
});


$app->get('/system/config', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) use ($app) {

    $customTextsFilePath = ROOT_DIR . '/config/customTexts.json';

    if (file_exists($customTextsFilePath)) {
        $customTexts = JSON::decode(file_get_contents($customTextsFilePath));
    } else {
        $customTexts = [];
    }

    return $response->withJson(['version' => Version::get(), 'customTexts' => $customTexts]);
});


// TODO write spec
$app->get('/sys-checks', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) use ($app) {

    $availableSysChecks = [];

    foreach (WorkspaceController::getAll() as $workspaceController) { /* @var WorkspaceController $workspaceController */

        $availableSysChecks = array_merge($availableSysChecks, $workspaceController->findAvailableSysChecks());
    }

    if (!count($availableSysChecks)) {

        return $response->withStatus(204, "No SysChecks found.");
    }

    return $response->withJson($availableSysChecks);
});

