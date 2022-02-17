<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit tests !


use Slim\Http\Response;
use Slim\Http\Request;

class SpeedtestController extends Controller {

    public static function getRandomPackage(Request $request, Response $response): Response {

        $size = (int) $request->getAttribute('size');

        if (function_exists('apache_setenv')) { // for OCBA server
            apache_setenv('no-gzip', '1');
        }

        if (($size > 8388608 * 8) or ($size < 16)) {

            throw new HttpError("Unsupported test size ({$size})", 406);
        }

        $package = '';

        $allowedChars = "ABCDEFGHIJKLOMNOPQRSTUVWXZabcdefghijklmnopqrstuvwxyz0123456789+/";
        while ($size-- > 1) {
            $package .= substr($allowedChars, rand(0, strlen($allowedChars) - 1), 1);
        }
        $package .= '=';

        $response->getBody()->write($package);
        return $response
            ->withHeader('Content-Transfer-Encoding','binary')
            ->withHeader('Content-Type', 'text/plain');

    }


    public static function postRandomPackage(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response): Response {

        return $response->withJson([
            'requestTime' => $_SERVER['REQUEST_TIME_FLOAT'],
            'packageReceivedSize' => $_SERVER['CONTENT_LENGTH']
        ]);
    }
}
