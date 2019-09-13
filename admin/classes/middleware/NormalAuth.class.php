<?php

use Slim\Http\Request;
use Slim\Http\Response;

class NormalAuth {

    function __invoke(Request $req, Response $res, $next) {

        $errormessage = '';
        $responseStatus = 0;
        if ($req->isPost() || $req->isGet()) {
            $responseStatus = 401;
            $errormessage = 'Auth-Header not sufficient';
            if ($req->hasHeader('Accept')) {
                if ($req->hasHeader('AuthToken')) {
                    try {
                        $authToken = json_decode($req->getHeaderLine('AuthToken'));
                        $adminToken = $authToken->at;
                        if (strlen($adminToken) > 0) {

                            $myDBConnection = new DBConnection();
                            if (!$myDBConnection->isError()) {
                                $errormessage = 'access denied';
                                if ($myDBConnection->isSuperAdmin($adminToken)) {
                                    $responseStatus = 0;
                                    $_SESSION['adminToken'] = $adminToken;
                                }
                            }
                            unset($myDBConnection);
                        }
                    } catch (Exception $ex) {
                        $responseStatus = 500;
                        $errormessage = 'Something went wrong: ' . $ex->getMessage();
                    }
                }
                session_write_close();
            }
        }

        if ($responseStatus === 0) {
            return $next($req, $res);
        } else {
            return $res->withStatus($responseStatus)
                ->withHeader('Content-Type', 'text/html')
                ->write($errormessage);
        }
    }

}
