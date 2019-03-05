<?php
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;

session_start();
require '../vendor/autoload.php';
$app = new \Slim\App();
// global Variables #############################################
$container = $app->getContainer();
$container['code_directory'] = __DIR__.'/../vo_code';
$container['data_directory'] = __DIR__.'/../vo_data';
// use in Routes: $directory = $this->get('data_directory');

// ##############################################################
$app->add(function (ServerRequestInterface $req, ResponseInterface $res, $next) {
    $errorcode = 0;
    if ($req->isPost()) {
        $errorcode = 401;
        $errormessage = 'Auth-Header not sufficient';
        if ($req->hasHeader('Accept')) {
            $personToken = '';
            $loginToken = '';
            $bookletDbId = 0;
            if ($req->hasHeader('AuthToken')) {
                try {
                    $authToken = json_decode($req->getHeaderLine('AuthToken'));
                    $loginToken = $authToken->l;
                    if (strlen($loginToken) > 0) {
                        $personToken = $authToken->p;
                        if (strlen($personToken) > 0) {
                            $bookletDbId = $authToken->b;
                            
                            if (is_numeric($bookletDbId)) {
                                if ($bookletDbId > 0) {
                                    require_once($this->get('code_directory') . '/DBConnectionTC.php');                                
                                    $myDBConnection = new DBConnectionTC();
                                    if (!$myDBConnection->isError()) {
                                        if ($myDBConnection->canWriteBookletData($personToken, $bookletDbId)) {
                                            $errorcode = 0;
                                            $_SESSION['loginToken'] = $loginToken;
                                            $_SESSION['personToken'] = $personToken;
                                            $_SESSION['bookletDbId'] = $bookletDbId;
                                        }
                                    }
                                    unset($myDBConnection);
                                }
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
$app->post('/review', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $myerrorcode = 500;
        $bookletDbId = $_SESSION['bookletDbId'];
        $bodydata = json_decode($request->getBody());
		$unit = isset($bodydata->u) ? $bodydata->u : '';
        $prio = isset($bodydata->p) ? $bodydata->p : '';
        $cat = isset($bodydata->c) ? $bodydata->c : '';
        $entry = isset($bodydata->e) ? $bodydata->e : '';

        $myreturn = false;

        require_once($this->get('code_directory') . '/DBConnectionTC.php');
        $myDBConnection = new DBConnectionTC();
        if (!$myDBConnection->isError()) {
            $myerrorcode = 0;
    
            if (strlen($unit) > 0) {
                $myreturn = $myDBConnection->addUnitReview($bookletDbId, $unit, $prio, $cat, $entry);
            } else {
                $myreturn = $myDBConnection->addBookletReview($bookletDbId, $prio, $cat, $entry);
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
$app->run();
?>