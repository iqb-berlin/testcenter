<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Attachment { //  extends DataCollectionTypeSafe

    const dataTypes = ['image', 'missing'];
    const attachmentTypes = ['capture-image'];

    public readonly string $attachmentId;
    public readonly string $personLabel;
    public readonly string $testLabel;
    public readonly string $dataType;
    public readonly array $attachmentFileIds;
    public readonly string $unitLabel;
    public readonly ?int $lastModified;
    public readonly string $attachmentType;
    public readonly string $groupName;

    public function __construct(
        string $attachmentId,
        string $personLabel,
        string $testLabel,
        string $dataType,
        array  $attachmentFileIds,
        string $unitLabel,
        ?int    $lastModified,
        string $attachmentType,
        string $groupName,
    ) {

        $this->attachmentId = $attachmentId;
        $this->personLabel = $personLabel;
        $this->testLabel = $testLabel;
        $this->dataType = $dataType; // TODO check
        $this->attachmentFileIds = $attachmentFileIds;
        $this->unitLabel = $unitLabel;
        $this->lastModified = $lastModified;
        $this->attachmentType = $attachmentType;  // TODO check
        $this->groupName = $groupName;
    }
}