<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit tests !

use Slim\Exception\HttpForbiddenException;
use Slim\Http\ServerRequest as Request;
use Slim\Http\Response;

class BookletController extends Controller {
  public static function getData(Request $request, Response $response): Response {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');
    $personToken = $authToken->getToken();

    $bookletName = $request->getAttribute('booklet_name');

    if (!self::sessionDAO()->personHasBooklet($personToken, $bookletName)
      and !self::adminDAO()->hasMonitorAccessToWorkspace($personToken, $authToken->getWorkspaceId())) {
      throw new HttpForbiddenException($request, "Booklet with name `$bookletName` is not allowed for $personToken");
    }

    $testStatus = self::sessionDAO()->getTestStatus($personToken, $bookletName);
    return $response->withJson($testStatus);
  }

  public static function getBooklet(Request $request, Response $response): Response {
    /* @var $authToken AuthToken */
    $authToken = $request->getAttribute('AuthToken');
    $personToken = $authToken->getToken();

    $bookletName = $request->getAttribute('booklet_name');

    if (!self::sessionDAO()->personHasBooklet($personToken, $bookletName)
      and !self::adminDAO()->hasMonitorAccessToWorkspace($personToken, $authToken->getWorkspaceId())) {
      throw new HttpForbiddenException($request, "Booklet with name `$bookletName` is not allowed for $personToken");
    }

    $Workspace = new Workspace($authToken->getWorkspaceId());
    $booklet = $Workspace->getFileById('Booklet', $bookletName);
    /* @var $booklet XMLFileBooklet */
    $xml = $booklet->getContent();

    return $response->withHeader('Content-Type', 'application/xml')->write($xml);
  }
}
