<?php

use Slim\Exception\HttpNotFoundException;
use Slim\Http\Request;
use Slim\Http\Response;

class NormalAuthWithWorkspaceInHeader {

    function __invoke(Request $req, Response $res, $next) {

        $errorCode = 0;
        $errormessage = "Only get and post are allowed";
        if ($req->isPost() || $req->isGet()) {
            $errorCode = 401;
            $errormessage = 'Auth-Header not sufficient';
            if ($req->hasHeader('Accept')) {
                if ($req->hasHeader('AuthToken')) {
                    try {
                        $authToken = json_decode($req->getHeaderLine('AuthToken'));
                        $adminToken = $authToken->at;
                        if (strlen($adminToken) > 0) {
                            $workspace = $authToken->ws;
                            if (is_numeric($workspace)) {
                                if ($workspace > 0) { // TODO 401 is not correct for missing workspace
                                    $dbConnection = new DBConnectionAdmin();
                                    if (!$dbConnection->isError()) {
                                        $errormessage = 'access denied';
                                        $role = $dbConnection->getWorkspaceRole($adminToken, $workspace);
                                        if (($req->isPost() && ($role == 'RW')) || ($req->isGet() && ($role != ''))) {
                                            $errorCode = 0;
                                            $_SESSION['adminToken'] = $adminToken;
                                            $_SESSION['workspace'] = $workspace;
                                            $_SESSION['workspaceDirName'] = realpath(ROOT_DIR . "/vo_data/ws_$workspace");
                                            if (!file_exists($_SESSION['workspaceDirName'])) { // TODO I moved this to auth token check - is that OK
                                                throw new HttpNotFoundException($req, "Workspace {$_SESSION['workspaceDirName']} not found");
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } catch (Exception $ex) {
                        $errorCode = 500;
                        $errormessage = 'Something went wrong: ' . $ex->getMessage();
                    }
                }
                session_write_close();
            }
        }

        if ($errorCode === 0) {
            return $next($req, $res);
        } else {
            return $res->withStatus($errorCode)
                ->withHeader('Content-Type', 'text/html')
                ->write($errormessage);
        }
    }
}
