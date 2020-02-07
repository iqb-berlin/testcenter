<?php

use Slim\Http\Request;
use Slim\Http\Response;

class NormalAuth {

    function __invoke(Request $req, Response $res, $next) {

        if ($req->isOptions()) return $next($req, $res);

        $responseStatus = 401;
        $errormessage = 'Auth-Header not sufficient';
        if ($req->hasHeader('Accept')) {
            if ($req->hasHeader('AuthToken')) {

                $authToken = json_decode($req->getHeaderLine('AuthToken'));
                $adminToken = $authToken->at;
                if (strlen($adminToken) > 0) {

                    $myDBConnection = new DBConnection();

                    if ($myDBConnection->isSuperAdmin($adminToken)) {
                        $responseStatus = 0;
                        $_SESSION['adminToken'] = $adminToken;
                    }
                }

            }
            session_write_close();
        }

        if ($responseStatus === 0) {
            return $next($req, $res);
        }

        return $res->withStatus($responseStatus)
            ->withHeader('Content-Type', 'text/html')
            ->write($errormessage);

    }

}
