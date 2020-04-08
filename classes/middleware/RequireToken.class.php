<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Slim\Exception\HttpUnauthorizedException;
use Slim\Http\Request;
use Slim\Http\Response;


class RequireToken {

    protected $requiredTypes = [];

    public function __construct(string ...$requiredTypes) {

        $this->requiredTypes = $requiredTypes;
    }

    function __invoke(Request $request, Response $response, $next) {

        if ($request->isOptions()) {
            return $next($request, $response);
        }

        $tokenString = $this->getTokenFromHeader($request);

        $sessionDAO = new SessionDAO();

        $token = $sessionDAO->getToken($tokenString, $this->requiredTypes);

        $request = $request->withAttribute('AuthToken', $token);

        return $next($request, $response);
    }


    function getTokenFromHeader(Request $request): string {

        if (!$request->hasHeader('AuthToken')) {
            throw new HttpUnauthorizedException($request, 'Auth Header not sufficient: missing');
        }

        $authToken = $request->getHeaderLine('AuthToken');

        if (!$authToken) {
            throw new HttpUnauthorizedException($request, "Auth Header not sufficient: empty");
        }

        return $authToken;
    }
}
