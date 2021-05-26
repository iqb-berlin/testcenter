<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class Server {

    static function getUrl(array $senv = null): string {

        $senv = $senv ?? $_SERVER;

        $ssl = (!empty($senv['HTTPS']) && $senv['HTTPS'] == 'on');

        $sp = strtolower($senv['SERVER_PROTOCOL']);
        $protocol = $senv['HTTP_X_FORWARDED_PROTO'] ??
            substr($sp, 0, strpos($sp, '/')) . (($ssl) ? 's' : '');

        $port = $senv['SERVER_PORT'];
        $port = ((!$ssl && $port == '80') || ($ssl && $port == '443')) ? '' : ':' . $port;

        $host = $senv['HTTP_X_FORWARDED_HOST'] ?? $senv['HTTP_HOST'] ?? ($senv['SERVER_NAME'] . $port);

        $prefix = $senv['HTTP_X_FORWARDED_PREFIX'] ?? '';

        $folder = str_replace('/index.php', '', $senv['SCRIPT_NAME']);

        return $protocol . '://' . $host . $prefix . $folder;
    }
}
