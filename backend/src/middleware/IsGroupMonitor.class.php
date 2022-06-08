<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Slim\Exception\HttpForbiddenException;
use Slim\Http\ServerRequest as Request;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;


class IsGroupMonitor {

    function __invoke(Request $request, RequestHandler $handler): ResponseInterface {

        /* @var $authToken AuthToken */
        $authToken = $request->getAttribute('AuthToken');

        // TODo verify if it's the correct group!

        if ($authToken->getMode() !== 'monitor-group') {

            throw new HttpForbiddenException($request, "Access Denied: 
                Wrong mode for personSession: `{$authToken->getMode()}`. `monitor-group` required.");
        }

        return $handler->handle($request);
    }
}
