<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class RequestedAttachment {
    public readonly string $unitName;
    public readonly string $attachmentType;
    public readonly string $variableId;

    function __construct(
        string $unitName,
        string $attachmentType,
        string $variableId
    ) {
        $this->unitName = $unitName;
        $this->attachmentType = $attachmentType;
        $this->variableId = $variableId;
    }
}