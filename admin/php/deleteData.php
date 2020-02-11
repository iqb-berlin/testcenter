<?php
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
// www.IQB.hu-berlin.de
// Bărbulescu, Mechtel
// 2018, 2019
// license: MIT

session_start();
require '../../vendor/autoload.php';
$app = new \Slim\App();
// global Variables #############################################
$container = $app->getContainer();
$container['code_directory'] = __DIR__.'/../../vo_code';
$container['data_directory'] = __DIR__.'/../../vo_data';
// use in Routes: $directory = $this->get('data_directory');


$app->add(function (ServerRequestInterface $req, ResponseInterface $res, $next) {
    $errorcode = 0;
    if ($req->isPost() || $req->isGet()) {
        $errorcode = 401;
        $errormessage = 'Auth-Header not sufficient';
        if ($req->hasHeader('Accept')) {
            if ($req->hasHeader('AuthToken')) {
                try {
                    $authToken = json_decode($req->getHeaderLine('AuthToken'));
                    $adminToken = $authToken->at;
                    if (strlen($adminToken) > 0) {
                        $workspace = $authToken->ws;
                        if (is_numeric($workspace)) {
                            if ($workspace > 0) {
                                require_once($this->get('code_directory') . '/DBConnectionAdmin.php');                                
                                $myDBConnection = new DBConnectionAdmin();
                                if (!$myDBConnection->isError()) {
                                    $errormessage = 'access denied';
                                    $role = $myDBConnection->getWorkspaceRole($adminToken, $workspace);
                                    if (($req->isPost() && ($role == 'RW')) || ($req->isGet() && ($role != ''))) {
                                        $errorcode = 0;
                                        $_SESSION['adminToken'] = $adminToken;
                                        $_SESSION['workspace'] = $workspace;
                                        $_SESSION['workspaceDirName'] = $this->get('data_directory') . '/ws_' . $workspace;
                                    }
                                }
                                unset($myDBConnection);
                            }
                        }
                    }
                } catch (Exception $ex) {
                    $errorcode = 500;
                    $errormessage = 'Something went wrong: ' . $ex->getMessage();
                }
            }
            session_write_close();
        }
    }
    
    if ($errorcode === 0) {
        return $next($req, $res);
    } else {
        return $res->withStatus($errorcode)
            ->withHeader('Content-Type', 'text/html')
            ->write($errormessage);
    }
});

// HELPERs #######################################################
function jsonencode($obj)
{
    return json_encode($obj, JSON_UNESCAPED_UNICODE);
}

// ##############################################################
// ######                    routes                        ######
// ##############################################################
$app->post('/', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $workspace = $_SESSION['workspace'];
        $bodydata = json_decode($request->getBody());
		$groups = isset($bodydata->g) ? $bodydata->g : [];

        require_once($this->get('code_directory') . '/DBConnectionAdmin.php');                                
        $myDBConnection = new DBConnectionAdmin();
        $myerrorcode = 0;
        $myreturn = false;

        if (!$myDBConnection->isError()) {
            $myreturn = true;
            foreach($groups as $groupName) {
                if (!$myDBConnection->deleteData($workspace, $groupName)) {
                  $myreturn = false;
                  break;
                }
            }
        }
        unset($myDBConnection);        

        if ($myerrorcode == 0) {
            $responseData = jsonencode($myreturn);
            $response->getBody()->write($responseData);
    
            $responseToReturn = $response->withHeader('Content-type', 'application/json;charset=UTF-8');
        } else {
            $responseToReturn = $response->withStatus($myerrorcode)
                ->withHeader('Content-Type', 'text/html')
                ->write('Something went wrong!');
        }

        return $responseToReturn;
    } catch (Exception $ex) {
        return $response->withStatus(500)
            ->withHeader('Content-Type', 'text/html')
            ->write('Something went wrong: ' . $ex->getMessage());
    }
});


$app->run();
?>