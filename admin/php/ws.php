<?php
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;

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
$app->get('/filelist', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $workspace = $_SESSION['workspace'];
		$myreturn = [];

        $myerrorcode = 0;
        $workspaceDirName = $this->get('data_directory') . '/ws_' . $workspace;
        if (file_exists($workspaceDirName)) {
            require_once($this->get('code_directory') . '/FilesFactory.php');
            $workspaceDir = opendir($workspaceDirName);
            while (($subdir = readdir($workspaceDir)) !== false) {
                if (($subdir !== '.') && ($subdir !== '..')) {
                    $fullsubdirname = $workspaceDirName . '/' .  $subdir;
                    if (is_dir($fullsubdirname)) {
                        $mydir = opendir($fullsubdirname);
                        while (($entry = readdir($mydir)) !== false) {
                            $fullfilename = $fullsubdirname . '/' . $entry;
                            if (is_file($fullfilename)) {
                                $rs = new ResourceFile($entry, filemtime($fullfilename), filesize($fullfilename));

                                array_push($myreturn, [
                                    'filename' => $rs->getFileName(),
                                    'filesize' => $rs->getFileSize(),
                                    'filesizestr' => $rs->getFileSizeString(),
                                    'filedatetime' => $rs->getFileDateTime(),
                                    'filedatetimestr' => $rs->getFileDateTimeString(),
                                    'type' => $subdir,
                                    'typelabel' => $subdir
                                ]);
                            }
                        }
                    }
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
$app->get('/file/{filename}', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $workspace = $_SESSION['workspace'];
        $path_parts = pathinfo($request->getAttribute('filename'));
        $filename = $path_parts['basename'];
        $path_parts = pathinfo($request->getQueryParam('ft', ''));
        $subFolder = $path_parts['basename'];
        $myreturn = '';

        $myerrorcode = 404;
        $fullfilename = $this->get('data_directory') . '/ws_' . $workspace . '/' . $subFolder . '/' . $filename;
        if (file_exists($fullfilename)) {
            $myerrorcode = 0;
            $myreturn = file_get_contents($fullfilename);
        }

        if ($myerrorcode == 0) {
            $response->getBody()->write($myreturn);
            $responseToReturn = $response->withHeader('Content-type', 'text/html')
                ->withHeader('Content-Description', 'File Transfer')
                ->withHeader('Content-Type', ($subFolder == 'Resource') ? 'application/octet-stream' : 'text/xml')
                ->withHeader('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->withHeader('Expires', '0')
                ->withHeader('Cache-Control', 'must-revalidate')
                ->withHeader('Pragma', 'public')
                ->withHeader('Content-Length', filesize($fullfilename));
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