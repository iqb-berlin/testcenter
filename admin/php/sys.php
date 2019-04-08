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
                        require_once($this->get('code_directory') . '/DBConnection.php');
                        $myDBConnection = new DBConnection();
                        if (!$myDBConnection->isError()) {
                            $errormessage = 'access denied';
                            if ($myDBConnection->isSuperAdmin($adminToken)) {
                                $errorcode = 0;
                                $_SESSION['adminToken'] = $adminToken;
                            }
                        }
                        unset($myDBConnection);
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
$app->get('/users', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $myerrorcode = 500;
        $myreturn = [];
        
        require_once($this->get('code_directory') . '/DBConnectionSuperadmin.php');
		$myDBConnection = new DBConnectionSuperadmin();
		if (!$myDBConnection->isError()) {
            $myerrorcode = 0;
            $ws = $request->getQueryParam('ws', 0);
            if ($ws > 0) {
                $myreturn = $myDBConnection->getUsersByWorkspace($ws);
            } else {
                $myreturn = $myDBConnection->getUsers();
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
$app->get('/workspaces', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $myerrorcode = 500;
        $myreturn = [];
        
        require_once($this->get('code_directory') . '/DBConnectionSuperadmin.php');
		$myDBConnection = new DBConnectionSuperadmin();
		if (!$myDBConnection->isError()) {
            $myerrorcode = 0;
            $user = $request->getQueryParam('u', '');
            if (strlen($user) > 0) {
                $myreturn = $myDBConnection->getWorkspacesByUser($user);
            } else {
                $myreturn = $myDBConnection->getWorkspaces();
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
$app->post('/user/add', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $myerrorcode = 500;
        require_once($this->get('code_directory') . '/DBConnectionSuperadmin.php');
		$myDBConnection = new DBConnectionSuperadmin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;
            $bodydata = json_decode($request->getBody());
            $username = isset($bodydata->n) ? $bodydata->n : '';
            $userpassword = isset($bodydata->p) ? $bodydata->p : '';

            $ok = $myDBConnection->addUser($username, $userpassword);
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
$app->post('/user/pw', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $myerrorcode = 500;
        require_once($this->get('code_directory') . '/DBConnectionSuperadmin.php');
		$myDBConnection = new DBConnectionSuperadmin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;
            $bodydata = json_decode($request->getBody());
            $username = isset($bodydata->n) ? $bodydata->n : '';
            $userpassword = isset($bodydata->p) ? $bodydata->p : '';

            $ok = $myDBConnection->setPassword($username, $userpassword);
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
$app->post('/users/delete', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $bodydata = json_decode($request->getBody());
		$userList = isset($bodydata->u) ? $bodydata->u : [];

        $myerrorcode = 500;
        require_once($this->get('code_directory') . '/DBConnectionSuperadmin.php');
		$myDBConnection = new DBConnectionSuperadmin();
		if (!$myDBConnection->isError()) {
            $ok = $myDBConnection->deleteUsers($userList);
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