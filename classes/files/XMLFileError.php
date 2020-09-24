<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class XMLFileError extends XMLFile {

    /** @noinspection PhpMissingParentConstructorInspection */
    public function __construct(string $errorMessage) {

        $this->report('error', $errorMessage);
    }
}
