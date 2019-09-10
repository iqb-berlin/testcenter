<?php

/**
 * status: completely new endpoints
 */


use Slim\App;
use Slim\Route;


$app->group('/system', function(App $app) {

    $app->get('/routes', function(Slim\Http\Request $request, Slim\Http\Response $response) use($app) {

        $routes = array_reduce($app->getContainer()->get('router')->getRoutes(), function($target, Route $route) {
//            $target[$route->getPattern()] = array(
//                'methods' => $route->getMethods(),
//                'callable' => $route->getCallable(),
//                'middlewares' => $route->getMiddleware(),
//                'pattern' => $route->getPattern(),
//            );
            foreach ($route->getMethods() as $method) {
                $target[] = "[$method] " . $route->getPattern();
            }
            return $target;
        }, []);

        return $response->withJson($routes);
    });
});
