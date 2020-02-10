<?php


use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpException;
use Slim\Route;
use Slim\Http\Request;
use Slim\Http\Response;


$app->get('/', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) use ($app) {

    return $response->withJson(array('version' => Version::get()));
});


$app->get('/workspaces', function (/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) {

    $dbConnectionSuperAdmin = new DBConnectionSuperAdmin();
    $workspaces = $dbConnectionSuperAdmin->getWorkspaces();
    return $response->withJson($workspaces);
})->add(new RequireAdminToken());;


$app->delete('/workspaces', function (Request $request, Response $response) {

    $dbConnection = new DBConnectionSuperAdmin();
    $bodyData = JSON::decode($request->getBody());
    $workspaceList = isset($bodyData->ws) ? $bodyData->ws : [];

    if (!is_array($workspaceList)) {
        throw new HttpBadRequestException($request);
    }

    $dbConnection->deleteWorkspaces($workspaceList);

    return $response;
})->add(new RequireAdminToken());


$app->get('/users', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) {

    $dbConnectionSuperAdmin = new DBConnectionSuperAdmin();

    return $response->withJson($dbConnectionSuperAdmin->getUsers());
})->add(new RequireAdminToken());


$app->delete('/users', function(Request $request, Response $response) {

    $dbConnectionSuperAdmin = new DBConnectionSuperAdmin();
    $bodyData = JSON::decode($request->getBody());
    $userList = isset($bodyData->u) ? $bodyData->u : [];

    $dbConnectionSuperAdmin->deleteUsers($userList);

    return $response;
})->add(new RequireAdminToken());


$app->get('/list/routes', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) use ($app) {

    $routes = array_reduce($app->getContainer()->get('router')->getRoutes(), function($target, Route $route) {
        foreach ($route->getMethods() as $method) {
            $target[] = "[$method] " . $route->getPattern();
        }
        return $target;
    }, []);

    return $response->withJson($routes);
});


$app->get('/specstatus', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) use ($app) {

    $routesRegistered = array_reduce($app->getContainer()->get('router')->getRoutes(), function($target, Route $route) {
        foreach ($route->getMethods() as $method) {
            $target[] = "[$method] " . $route->getPattern();
        }
        return $target;
    }, []);

    $specs = SpecCollector::collectSpecs(ROOT_DIR . '/routes');
    $routes = SpecCollector::collectRoutes(ROOT_DIR . '/routes');

    $status = array();

    $allRoutes = array_unique(array_merge(array_keys($specs), array_keys($routes), $routesRegistered));
    sort($allRoutes);

    foreach ($allRoutes as $route) {
        $status[$route] = array(
            "spec" => isset($specs[$route]) ? $specs[$route] : "(spec missing)",
            "code" => isset($routes[$route]) ? $routes[$route] : "(code missing)"
        );
    }

    return $response->withJson(array('status'=>$status, 'specs'=>$routesRegistered));
});


$app->get('/version', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) use ($app) {

    return $response->withJson(array('version' => Version::get()));
});


$app->post('/login', function(Request $request, Response $response) use ($app) {

    $dbConnection = new DBConnectionAdmin();

    $requestBody = JSON::decode($request->getBody());

    if (isset($requestBody->n) and isset($requestBody->p)) {
        $token = $dbConnection->login($requestBody->n, $requestBody->p);
    } else if (isset($requestBody->at)) {
        $token = $requestBody->at;
    } else {
        throw new HttpForbiddenException($request, "Authentication credentials missing.");
    }

    $tokenInfo = $dbConnection->validateToken($token);

    $workspaces = $dbConnection->getWorkspaces($token);

    if ((count($workspaces) == 0) and !$tokenInfo['user_is_superadmin']) {
        throw new HttpException($request, "You don't have any workspaces and are not allowed to create some.", 406);
    }

    return $response->withJson([
        'admintoken' => $token,
        'user_id' => $tokenInfo['user_id'],
        'name' => $tokenInfo['user_name'],
        'workspaces' => $workspaces,
        'is_superadmin' => $tokenInfo['user_is_superadmin']
    ]);
});

