<?php


use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpException;
use Slim\Route;
use Slim\Http\Request;
use Slim\Http\Response;


$app->get('/workspaces', function (/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) {

    $dbConnectionSuperAdmin = new DBConnectionSuperadmin();
    $workspaces = $dbConnectionSuperAdmin->getWorkspaces();
    return $response->withJson($workspaces);
})->add(new NormalAuth());;

$app->delete('/workspaces', function (Request $request, Response $response) {

    $dbConnection = new DBConnectionSuperadmin();
    $bodyData = json_decode($request->getBody());
    $workspaceList = isset($bodyData->ws) ? $bodyData->ws : [];

    if (!is_array($workspaceList)) {
        throw new HttpBadRequestException($request);
    }

    $dbConnection->deleteWorkspaces($workspaceList);

    return $response;
})->add(new NormalAuth());

$app->get('/users', function(Request $request, Response $response) {

    $dbConnectionSuperAdmin = new DBConnectionSuperadmin();

    return $response->withJson($dbConnectionSuperAdmin->getUsers());
})->add(new NormalAuth());;


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

    $routesRegistred = array_reduce($app->getContainer()->get('router')->getRoutes(), function($target, Route $route) {
        foreach ($route->getMethods() as $method) {
            $target[] = "[$method] " . $route->getPattern();
        }
        return $target;
    }, []);

    $specs = SpecCollector::collectSpecs(__DIR__);
    $routes = SpecCollector::collectRoutes(__DIR__);


    $status = array();

    $allroutes = array_unique(array_merge(array_keys($specs), array_keys($routes), $routesRegistred));
    sort($allroutes);

    foreach ($allroutes as $route) {
        $status[$route] = array(
            "spec" => isset($specs[$route]) ? $specs[$route] : "(spec missing)",
            "code" => isset($routes[$route]) ? $routes[$route] : "(code missing)"
        );
    }

    return $response->withJson(array('status'=>$status, 'specs'=>$routesRegistred));
});


$app->post('/login', function(Request $request, Response $response) use ($app) {

    $dbConnection = new DBConnectionAdmin();

    $requestBody = json_decode($request->getBody());

    if (isset($requestBody->n) and isset($requestBody->p)) {
        $token = $dbConnection->login($requestBody->n, $requestBody->p);
    } else if (isset($requestBody->at)) {
        $token = $requestBody->at;
    } else {
        throw new HttpForbiddenException($request, "Authentication credentials missing.");
    }

    $userName = $dbConnection->getLoginName($token);

    if (!isset($userName) or (strlen($userName) == 0)) { // TODO not necessary if dbC would throw Exception
        error_log("Rejected login attempt with: " . $request->getBody());
        throw new HttpForbiddenException($request, "Wrong authentication credentials");
    }

    $workspaces = $dbConnection->getWorkspaces($token);
    $isSuperAdmin = $dbConnection->isSuperAdmin($token);

    if ((count($workspaces) == 0) and !$isSuperAdmin) {
        throw new HttpException($request, "You don't have any workspaces and are not allowed to create some.", 406);
    }

    return $response->withJson([
        'admintoken' => $token,
        'name' => $userName,
        'workspaces' => $workspaces,
        'is_superadmin' => $isSuperAdmin
    ]);
});

