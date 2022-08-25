<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test
// TODO throw other Exceptions, so we don't get a 500 on malformed json

class JSON {

    static function decode(?string $json, bool $assoc = false) {

        if (!$json) {
            return $assoc ? [] : new stdClass();
        }

        $decoded = json_decode($json, $assoc,512, JSON_UNESCAPED_UNICODE);

        switch (json_last_error()) {
            case JSON_ERROR_NONE:
                return $decoded;
            case JSON_ERROR_DEPTH:
                throw new Exception('JSON Error: Maximum stack depth exceeded');
            case JSON_ERROR_STATE_MISMATCH:
                throw new Exception('JSON Error: Underflow or the modes mismatch');
            case JSON_ERROR_CTRL_CHAR:
                throw new Exception('JSON Error: Unexpected control character found');
            case JSON_ERROR_SYNTAX:
                throw new Exception('JSON Error: Syntax error, malformed JSON');
            case JSON_ERROR_UTF8:
                throw new Exception('JSON Error: Malformed UTF-8 characters, possibly incorrectly encoded');
            case JSON_ERROR_RECURSION:
                throw new Exception('JSON Error: One or more recursive references in the value to be encoded');
            case JSON_ERROR_INF_OR_NAN:
                throw new Exception('JSON Error: One or more NAN or INF values in the value to be encoded');
            case JSON_ERROR_UNSUPPORTED_TYPE:
                throw new Exception('JSON Error: A value of a type that cannot be encoded was given');
            case JSON_ERROR_INVALID_PROPERTY_NAME:
                throw new Exception('JSON Error: A property name that cannot be encoded was given');
            case JSON_ERROR_UTF16:
                throw new Exception('JSON Error: Malformed UTF-16 characters, possibly incorrectly encoded');
            default:
                throw new Exception('JSON Error: Unknown error');
        }
    }
}
