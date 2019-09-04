<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Mechtel
// 2018, 2019
// license: MIT

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Exception\HttpBadRequestException;

include_once '../webservice.php';

/**
 * check login status
 */
$app->add(function (Slim\Http\Request $req, Slim\Http\Response $res, $next) {

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
});


$app->get('/users', function (Slim\Http\Request $request, Slim\Http\Response $response) {
    try {

        $dbConnection = getDBConnectionSuperAdmin();

        $ws = $request->getQueryParam('ws', 0);
        if ($ws > 0) {
            $returner = $dbConnection->getUsersByWorkspace($ws);
        } else {
            $returner = $dbConnection->getUsers();
        }

        $response->getBody()->write(jsonencode($returner));

    } catch (Exception $ex) { // TODO global exception catching

        errorOut($request, $response, $ex);
    }

    return $response->withHeader('Content-type', 'application/json;charset=UTF-8');
});


$app->get('/workspaces', function (Slim\Http\Request $request, Slim\Http\Response $response) {
    try {

		$dbConnection = new DBConnectionSuperadmin();

        $user = $request->getQueryParam('u', '');
        if (strlen($user) > 0) {
            $returner = $dbConnection->getWorkspacesByUser($user);
        } else {
            $returner = $dbConnection->getWorkspaces();
        }

        $response->getBody()->write(jsonencode($returner));

    } catch (Exception $ex) {

        errorOut($request, $response, $ex);
    }

    return $response->withHeader('Content-type', 'application/json;charset=UTF-8');
});

$app->post('/user/add', function (Slim\Http\Request $request, Slim\Http\Response $response) { //TODO -> [PUT] /user
    try {

		$dbConnection = new DBConnectionSuperadmin();
        $requestBody = json_decode($request->getBody());
        if (!isset($requestBody->n) or !isset($requestBody->p)) { // TODO I made them required. is that okay?
            throw new HttpBadRequestException($request,"Username or Password missing");
        }

        $dbConnection->addUser($requestBody->n, $requestBody->p);

        $response->getBody()->write('true'); // TODO don't give anything back

    } catch (Exception $ex) {

        errorOut($request, $response, $ex);
    }

    return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back
});


$app->post('/user/pw', function(Slim\Http\Request $request, Slim\Http\Response $response) {
    try {

        $dbConnection = new DBConnectionSuperadmin();
        $requestBody = json_decode($request->getBody());
        if (!isset($requestBody->n) or !isset($requestBody->p)) { // TODO I made them required. is that okay?
            throw new HttpBadRequestException($request,"Username or Password missing");
        }

        $dbConnection->setPassword($requestBody->n, $requestBody->p);

        $response->getBody()->write('true'); // TODO don't give anything back

    } catch (Exception $ex) {

        errorOut($request, $response, $ex);
    }

    return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back
});


$app->post('/users/delete', function(Slim\Http\Request $request, Slim\Http\Response $response) { // TODO change to [DEL] /user
    try {

		$myDBConnection = new DBConnectionSuperadmin();
        $bodyData = json_decode($request->getBody());
        $userList = isset($bodyData->u) ? $bodyData->u : [];

        $myDBConnection->deleteUsers($userList);

        $response->getBody()->write('true'); // TODO don't give anything back

    } catch (Exception $ex) {

        errorOut($request, $response, $ex);
    }

    return $response->withHeader('Content-type', 'text/plain;charset=UTF-8'); // TODO don't give anything back
});

// ##############################################################
$app->post('/workspace/add', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $myerrorcode = 500;
        require_once($this->get('code_directory') . '/DBConnectionSuperadmin.php');
		$myDBConnection = new DBConnectionSuperadmin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;
            $bodydata = json_decode($request->getBody());
            $wsname = isset($bodydata->n) ? $bodydata->n : '';

            $ok = $myDBConnection->addWorkspace($wsname);
            if ($ok) {
                $myerrorcode = 0;
                $myreturn = $ok;
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
$app->post('/workspace/rename', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $myerrorcode = 500;
        $myreturn = false;
        require_once($this->get('code_directory') . '/DBConnectionSuperadmin.php');
		$myDBConnection = new DBConnectionSuperadmin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;
            $bodydata = json_decode($request->getBody());
            $wsId = isset($bodydata->ws) ? $bodydata->ws : 0;
            $wsname = isset($bodydata->n) ? $bodydata->n : '';

            $ok = $myDBConnection->renameWorkspace($wsId, $wsname);
            if ($ok) {
                $myerrorcode = 0;
                $myreturn = $ok;
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
$app->post('/workspaces/delete', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $bodydata = json_decode($request->getBody());
		$wsIds = isset($bodydata->ws) ? $bodydata->ws : [];

        $myerrorcode = 500;
        require_once($this->get('code_directory') . '/DBConnectionSuperadmin.php');
		$myDBConnection = new DBConnectionSuperadmin();
		if (!$myDBConnection->isError()) {
            $ok = $myDBConnection->deleteWorkspaces($wsIds);
            if ($ok) {
                $myerrorcode = 0;
                $myreturn = $ok;
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
$app->post('/workspace/users', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $bodydata = json_decode($request->getBody());
		$wsId = isset($bodydata->ws) ? $bodydata->ws : 0;
		$users = isset($bodydata->u) ? $bodydata->u : [];

        $myerrorcode = 0;
        require_once($this->get('code_directory') . '/DBConnectionSuperadmin.php');
		$myDBConnection = new DBConnectionSuperadmin();
        $myreturn = false;

        if (!$myDBConnection->isError()) {
            $myreturn = $myDBConnection->setUsersByWorkspace($wsId, $users);
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
$app->post('/user/workspaces', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $bodydata = json_decode($request->getBody());
		$workspaces = isset($bodydata->ws) ? $bodydata->ws : [];
		$username = isset($bodydata->u) ? $bodydata->u : '';

        $myerrorcode = 0;
        require_once($this->get('code_directory') . '/DBConnectionSuperadmin.php');
		$myDBConnection = new DBConnectionSuperadmin();
        $myreturn = false;

        if (!$myDBConnection->isError()) {
            $myreturn = $myDBConnection->setWorkspacesByUser($username, $workspaces);
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
