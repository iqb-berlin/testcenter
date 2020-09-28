<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class XMLFileError extends XMLFile {

    const type = 'Error';

    /** @noinspection PhpMissingParentConstructorInspection */
    public function __construct(string $errorMessage) {

        $this->report('error', $errorMessage);
    }
}
