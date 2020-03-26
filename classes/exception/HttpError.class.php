<?php


class HttpError extends Exception {

    private $title = '';

    public function __construct(string $message = '', int $code = 0, string $title = '', ?Throwable $previous = null) {

        $this->title = $title;
        // TODO check for valid http codes
        parent::__construct($message, $code, $previous);
    }

    public function getTitle() {

        return $this->title;
    }

}
