<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Slim\Exception\HttpUnauthorizedException;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Http\ServerRequest as Request;


class RequireToken {

    protected $requiredTypes = [];

    public function __construct(string ...$requiredTypes) {

        $this->requiredTypes = $requiredTypes;
    }

    function __invoke(Request $request, RequestHandler $handler) {

        if ($request->isOptions()) {
            return $handler->handle($request);
        }

        $tokenString = $this->getTokenFromHeader($request);

        $sessionDAO = new SessionDAO();

        $token = $sessionDAO->getToken($tokenString, $this->requiredTypes);

        $request = $request->withAttribute('AuthToken', $token);

        return $handler->handle($request);
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
