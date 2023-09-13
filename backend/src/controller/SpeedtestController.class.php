<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO unit tests !

use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;

class SpeedtestController extends Controller {
  public static function getRandomPackage(Request $request, Response $response): Response {
    $size = (int) $request->getAttribute('size');

    apache_setenv('no-gzip', '1');

    if (($size > 8388608 * 8) or ($size < 16)) {
      throw new HttpError("Unsupported test size ($size)", 406);
    }

    $package = str_repeat('a', $size - 1);
    $package .= '=';

    $response->getBody()->write($package);
    return $response
      ->withHeader('Content-Transfer-Encoding', 'binary')
      ->withHeader('Content-Type', 'text/plain');
  }

  public static function postRandomPackage(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response): Response {
    return $response->withJson([
      'requestTime' => $_SERVER['REQUEST_TIME_FLOAT'],
      'packageReceivedSize' => $_SERVER['CONTENT_LENGTH']
    ]);
  }
}
