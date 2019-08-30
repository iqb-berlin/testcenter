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
$app->add(function (ServerRequestInterface $req, ResponseInterface $res, $next) {
    if ($req->hasHeader('Accept')) {
        $adminToken = '';
        if ($req->hasHeader('AuthToken')) {
            $authToken = json_decode($req->getHeaderLine('AuthToken'));
            $adminToken = $authToken->t;
        }

        $_SESSION['adminToken'] = $adminToken;

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
$container['code_directory'] = __DIR__.'/../../vo_code';
$container['data_directory'] = __DIR__.'/../../vo_data';
$container['conf_directory'] = __DIR__.'/../../config';
// use in Routes: $directory = $this->get('data_directory');


// ##############################################################
// ######                    routes                        ######
// ##############################################################
$app->post('/login', function (ServerRequestInterface $request, ResponseInterface $response) {
    try {
        $myerrorcode = 500;
        $bodydata = json_decode($request->getBody());
		$loginName = isset($bodydata->n) ? $bodydata->n : '';
        $loginPassword = isset($bodydata->p) ? $bodydata->p : '';
        // do not take the AuthHeader-Data!
        $adminToken = isset($bodydata->at) ? $bodydata->at : '';

        $myreturn = [
            'admintoken' => '',
			'name' => '',
			'workspaces' => [],
			'is_superadmin' => false
        ];

        require_once($this->get('code_directory') . '/DBConnectionAdmin.php');
        $myDBConnection = new DBConnectionAdmin();
        if (!$myDBConnection->isError()) {
            $myerrorcode = 401;
    
            // //////////////////////////////////////////////////////////////////////////////////////////////////
            // CASE A: login by name and password ///////////////////////////////////////////////////////////////
            if (strlen($loginName) > 0 && strlen($loginPassword) > 0) {
				$myToken = $myDBConnection->login($loginName, $loginPassword);


				if (isset($myToken) and (strlen($myToken) > 0)) {

					$myerrorcode = 403;
					$myName = $myDBConnection->getLoginName($myToken);
				
					if (isset($myName) and (strlen($myName) > 0)) {
						$myerrorcode = 406;
						$workspaces = $myDBConnection->getWorkspaces($myToken);
						$isSuperAdmin = $myDBConnection->isSuperAdmin($myToken);
						if ((count($workspaces) > 0) || $isSuperAdmin) {
							$myerrorcode = 0;
						
							$myreturn = [
								'admintoken' => $myToken,
								'name' => $myName,
								'workspaces' => $workspaces,
								'is_superadmin' => $isSuperAdmin
							];
						}
					} 
				}
            // //////////////////////////////////////////////////////////////////////////////////////////////////
            // CASE A: login by name and password ///////////////////////////////////////////////////////////////
            } else if (strlen($adminToken) > 0) {
                $myerrorcode = 403;
                $myName = $myDBConnection->getLoginName($adminToken);
            
                if (isset($myName) and (strlen($myName) > 0)) {
                    $myerrorcode = 406;
                    $workspaces = $myDBConnection->getWorkspaces($adminToken);
                    $isSuperAdmin = $myDBConnection->isSuperAdmin($adminToken);
                    if ((count($workspaces) > 0) || $isSuperAdmin) {
                        $myerrorcode = 0;
                    
                        $myreturn = [
                            'admintoken' => $adminToken,
                            'name' => $myName,
                            'workspaces' => $workspaces,
                            'is_superadmin' => $isSuperAdmin
                        ];
                    }
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
