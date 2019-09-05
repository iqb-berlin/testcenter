<?php
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
use Slim\Exception\HttpNotFoundException;

// www.IQB.hu-berlin.de
// Bărbulescu, Mechtel
// 2018, 2019
// license: MIT

include_once '../webservice.php';

$app->add(function (Slim\Http\Request $req, Slim\Http\Response $res, $next) {
    $errorCode = 0;
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
                                        $_SESSION['workspaceDirName'] = $this->get('data_directory') . '/ws_' . $workspace;
                                        if (!file_exists($_SESSION['workspaceDirName'])) { // TODO move this to auth token check?
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
});


$app->get('/filelist', function (Slim\Http\Request $request, Slim\Http\Response $response) {

    $files = getAllFilesFromWorkspace($_SESSION['workspaceDirName']);
    $response->getBody()->write(jsonencode($files));
    return $response->withHeader('Content-type', 'application/json;charset=UTF-8');
});

// ##############################################################
// ##############################################################
$app->post('/delete', function (Slim\Http\Request $request, Slim\Http\Response $response) {
    try {
        $workspaceDirName = $_SESSION['workspaceDirName'];
        $bodydata = json_decode($request->getBody());
		$fileList = isset($bodydata->f) ? $bodydata->f : [];

        $myerrorcode = 404;
        if (file_exists($workspaceDirName)) {
            $myerrorcode = 0;
            $errorcount = 0;
            $successcount = 0;
            foreach($fileList as $fileToDelete) {
                $mysplits = explode('::', $fileToDelete);
                if (count($mysplits) == 2) {
                    if (unlink($workspaceDirName . '/' . $mysplits[0] . '/' . $mysplits[1])) {
                        $successcount = $successcount + 1;
                    } else {
                        $errorcount = $errorcount + 1;
                    }
                }
            }
            if ($errorcount > 0) {
                $myreturn = 'e:Konnte ' . $errorcount . ' Dateien nicht löschen.';	
            } else {
                if ($successcount == 1) {
                    $myreturn = 'Eine Datei gelöscht.';
                } else {
                    $myreturn = 'Erfolgreich ' . $successcount . ' Dateien gelöscht.';	
                }
            }
        }

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

// ##############################################################
// ##############################################################
$app->post('/unlock', function (Slim\Http\Request $request, Slim\Http\Response $response) {
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
                if (!$myDBConnection->changeBookletLockStatus($workspace, $groupName, false)) {
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

// ##############################################################
// ##############################################################
$app->post('/lock', function (Slim\Http\Request $request, Slim\Http\Response $response) {
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
                if (!$myDBConnection->changeBookletLockStatus($workspace, $groupName, true)) {
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
