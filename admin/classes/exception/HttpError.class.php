<?php


class HttpError extends Exception {

    public function __construct(string $message = '', int $code = 0, ?Throwable $previous = null) {
        // TODO check for valid http codes
        parent::__construct($message, $code, $previous);
    }

}
