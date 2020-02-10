<?php /** @noinspection PhpUnhandledExceptionInspection */

use Slim\Exception\HttpForbiddenException;
use Slim\Http\Request;
use Slim\Http\Response;

class RequireAdminToken {

    function __invoke(Request $req, Response $res, $next) {

        if ($req->isOptions()) {
            return $next($req, $res);
        }

        if (!$req->hasHeader('AuthToken')) {
            throw new HttpForbiddenException($req, 'Auth Header not sufficient: header missing');
        }

        $authToken = JSON::decode($req->getHeaderLine('AuthToken'));
        $adminToken = $authToken->at;

        if (!isset($authToken->at) or strlen($adminToken) == 0) {
            throw new HttpForbiddenException($req, 'Auth Header not sufficient: at missing');
        }

        $dbConnectionAdmin = new DBConnectionAdmin();

        $tokenInfo = $dbConnectionAdmin->validateToken($adminToken);

        $authToken = new AdminAuthToken($adminToken, $tokenInfo['user_is_superadmin']);
        $req = $req->withAttribute('AuthToken', $authToken);

        return $next($req, $res);
    }
}
