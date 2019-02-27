<?php
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;

session_start();
require '../vendor/autoload.php';
$app = new \Slim\App();
$app->add(function (ServerRequestInterface $req, ResponseInterface $res, $next) {
    if ($req->hasHeader('Accept')) {
        $personToken = '';
        $loginToken = '';
        $bookletDbId = 0;
        if ($req->hasHeader('AuthToken')) {
            $authToken = json_decode($req->getHeaderLine('AuthToken'));
            $personToken = $authToken->p;
            $loginToken = $authToken->l;
            $bookletDbId = $authToken->b;
        }

        $_SESSION['loginToken'] = $loginToken;
        $_SESSION['personToken'] = $personToken;
        $_SESSION['bookletDbId'] = $bookletDbId;

        session_write_close();
    }

    return $next($req, $res);
});

// HELPERs #######################################################
function jsonencode($obj)
{
    return json_encode($obj, JSON_UNESCAPED_UNICODE);
}

// global Variables #############################################
$container = $app->getContainer();
$container['code_directory'] = __DIR__.'/../vo_code';
$container['data_directory'] = __DIR__.'/../vo_data';
// use in Routes: $directory = $this->get('data_directory');


// ##############################################################
// ######                    routes                        ######
// ##############################################################
$app->get('/bookletdata', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $myerrorcode = 500;
        $personToken = $_SESSION['personToken'];
        $bookletDbId = $_SESSION['bookletDbId'];
        $myreturn = ['xml' => '', 'locked' => false, 'u' => 0];

        if ((strlen($personToken) > 0) && ($bookletDbId > 0)) {
            require_once($this->get('code_directory') . '/DBConnectionTC.php');

            $myDBConnection = new DBConnectionTC();
            if (!$myDBConnection->isError()) {
                $myerrorcode = 401;
        
                $auth = $personToken . '##' . $bookletDbId;
                $wsId = $myDBConnection->getWorkspaceByAuth($auth);
                if ($wsId > 0) {
                    $myerrorcode = 404;
                    $myBookletFolder = $this->get('data_directory') . '/ws_' . $wsId . '/Booklet';
                    $bookletName = $myDBConnection->getBookletNameByAuth($auth);
                    if (file_exists($myBookletFolder) and (strlen($bookletName) > 0)) {
                        $mydir = opendir($myBookletFolder);
                        if ($mydir !== false) {

                            require_once($this->get('code_directory') . '/XMLFile.php'); // // // // ========================
                            while (($entry = readdir($mydir)) !== false) {
                                $fullfilename = $myBookletFolder . '/' . $entry;
                                if (is_file($fullfilename)) {

                                    $xFile = new XMLFile($fullfilename);
                                    if ($xFile->isValid()) {
                                        $bKey = $xFile->getId();
                                        if ($bKey == $bookletName) {
                                            $myerrorcode = 0;
                                            $myreturn['xml'] = $xFile->xmlfile->asXML();
                                            break;
                                        }
                                    }
                                }
                            }
                            if ($myerrorcode == 0) {
                                $status = $myDBConnection->getBookletStatus($myDBConnection->getBookletId($auth));
                                if (isset($status['u'])) {
                                    $myreturn['u'] = $status['u'];
                                }
                                if (isset($status['locked'])) {
                                    $myreturn['locked'] = $status['locked'];
                                }
                            }
                        }
                    }
                }
            }    
            unset($myDBConnection);
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


$app->get('/unitdata/{unitid}', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $myerrorcode = 500;
        $personToken = $_SESSION['personToken'];
        $bookletDbId = $_SESSION['bookletDbId'];
        $unitid = $request->getAttribute('unitid');
        $myreturn = ['xml' => '', 'status' => '', 'restorepoint' => ''];

        if ((strlen($personToken) > 0) && ($bookletDbId > 0)) {
            require_once($this->get('code_directory') . '/DBConnectionTC.php');

            $myDBConnection = new DBConnectionTC();
            if (!$myDBConnection->isError()) {
                $myerrorcode = 401;
        
                $auth = $personToken . '##' .  $bookletDbId;
                $wsId = $myDBConnection->getWorkspaceByAuth($auth);
                if ($wsId > 0) {
                    $myerrorcode = 404;
                    $unitFolder = $this->get('data_directory') . '/ws_' . $wsId . '/Unit';
                    if (file_exists($unitFolder) and (strlen($unitid) > 0)) {
                        $mydir = opendir($unitFolder);
                        if ($mydir !== false) {
                            $unitidUpper = strtoupper($unitid);
    
                            require_once($this->get('code_directory') . '/XMLFile.php'); // // // // ========================
                            while (($entry = readdir($mydir)) !== false) {
                                $fullfilename = $unitFolder . '/' . $entry;
                                if (is_file($fullfilename)) {
    
                                    $xFile = new XMLFile($fullfilename);
                                    if ($xFile->isValid()) {
                                        $uKey = $xFile->getId();
                                        if ($uKey == $unitidUpper) {
                                            $myerrorcode = 0;
                                            $myreturn['xml'] = $xFile->xmlfile->asXML();
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            if ($myerrorcode == 0) {
                                $status = $myDBConnection->getUnitStatus($myDBConnection->getBookletId($auth), $unitid);
                                if (isset($status['restorepoint'])) {
                                    $myreturn['restorepoint'] = $status['restorepoint'];
                                }
                            }
                        }
                    }
                }
            }    
            unset($myDBConnection);
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

$app->run();
?>