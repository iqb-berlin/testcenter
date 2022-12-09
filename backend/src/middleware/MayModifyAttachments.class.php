<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Psr\Http\Message\ResponseInterface;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpNotFoundException;
use Slim\Http\ServerRequest as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Routing\RouteContext;

class MayModifyAttachments {

    function __invoke(Request $request, RequestHandler $handler): ResponseInterface {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        // TODo verify if it's the correct group!

        if ($authToken->getMode() !== 'monitor-group') {

            throw new HttpForbiddenException($request, "Access Denied");
        }
        return $handler->handle($request);
    }
}
