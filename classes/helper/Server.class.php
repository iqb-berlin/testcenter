<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class Server {

    static function getUrl() {

        $ssl = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') ? true : false;
        $sp = strtolower($_SERVER['SERVER_PROTOCOL']);
        $protocol = substr($sp, 0, strpos($sp, '/')) . (($ssl) ? 's' : '');
        $port = $_SERVER['SERVER_PORT'];
        $port = ((!$ssl && $port=='80') || ($ssl && $port=='443')) ? '' : ':'.$port;
        $host = isset($_SERVER['HTTP_X_FORWARDED_HOST'])
            ? $_SERVER['HTTP_X_FORWARDED_HOST']
            : (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : null);
        $host = isset($host) ? $host : $_SERVER['SERVER_NAME'] . $port;
        $uri = $protocol . '://' . $host . $_SERVER['REQUEST_URI'];
        $segments = explode('?', $uri, 2);
        return $segments[0];
    }


    static function directoryIsPublic($localPath, $url) {

        $ts = time();
        file_put_contents("$localPath/test-$ts.txt", 'public');
        $data = file_get_contents("$url/test-$ts.txt");
        unlink("$localPath/test-$ts.txt");
        return ($data == 'public');
    }
}
