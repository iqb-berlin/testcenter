<?php

use Slim\Http\Request;
use Slim\Http\Response;

class NormalAuth {

    function __invoke(Request $req, Response $res, $next) {

        if ($req->isOptions()) return $next($req, $res);

        $errormessage = 'Auth-Header not sufficient';
        if ($req->hasHeader('Accept')) {
            if ($req->hasHeader('AuthToken')) {

                $authToken = JSON::decode($req->getHeaderLine('AuthToken'));
                $adminToken = $authToken->at;
                if (strlen($adminToken) > 0) {

                    $myDBConnection = new DBConnection();

                    $authToken = new AdminAuthToken($adminToken, $myDBConnection->isSuperAdmin($adminToken));
                    $req->withAttribute('AuthToken', $authToken);
                    return $next($req, $res);
                }

            }
        }

        return $res->withStatus(401)
            ->withHeader('Content-Type', 'text/html')
            ->write($errormessage);

    }

}
