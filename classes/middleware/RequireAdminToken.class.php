<?php /** @noinspection PhpUnhandledExceptionInspection */

use Slim\Exception\HttpForbiddenException;
use Slim\Http\Request;
use Slim\Http\Response;

class RequireAdminToken {

    function __invoke(Request $request, Response $response, $next) {

        if ($request->isOptions()) {
            return $next($request, $response);
        }

        if (!$request->hasHeader('AuthToken')) {
            throw new HttpForbiddenException($request, 'Auth Header not sufficient: header missing');
        }

        $authToken = JSON::decode($request->getHeaderLine('AuthToken'));
        $adminToken = $authToken->at;

        if (!isset($authToken->at) or strlen($adminToken) == 0) {
            throw new HttpForbiddenException($request, 'Auth Header not sufficient: at missing');
        }

        $dbConnectionAdmin = new DBConnectionAdmin();

        $tokenInfo = $dbConnectionAdmin->validateToken($adminToken);

        $authToken = new AdminAuthToken($adminToken, $tokenInfo['user_is_superadmin']);
        $request = $request->withAttribute('AuthToken', $authToken);

        return $next($request, $response);
    }
}
