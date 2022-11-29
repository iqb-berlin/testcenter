<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Attachment extends DataCollectionTypeSafe {

    const dataTypes = ['image', 'missing'];
    const attachmentTypes = ['capture-image'];

    public readonly string $attachmentId;
    public readonly string $attachmentType;
    public readonly string $dataType;
    public readonly array $attachmentFileIds;
    public readonly ?int $lastModified;
    public readonly string $_groupName;
    public readonly string $_groupLabel;
    public readonly string $_loginName;
    public readonly string $_loginNameSuffix;
    public readonly string $testLabel;
    public readonly string $_bookletName;
    public readonly string $unitLabel;
    public readonly string $personLabel;
    public readonly int $_testId;
    public readonly string $_unitName;
    public readonly string $variableId;

    public function __construct(
        string $attachmentId,
        string $attachmentType,
        string $dataType,
        array  $attachmentFileIds,
        ?int   $lastModified,
        string $groupName,
        string $groupLabel,
        string $loginName,
        string $loginNameSuffix,
        string $testLabel,
        string $bookletName,
        string $unitLabel,
    ) {

        $this->attachmentId = $attachmentId;
        $this->attachmentType = $attachmentType;  // TODO check
        $this->dataType = $dataType; // TODO check
        $this->attachmentFileIds = $attachmentFileIds;
        $this->lastModified = $lastModified;
        $this->_groupName = $groupName;
        $this->_groupLabel = $groupLabel;
        $this->_loginName = $loginName;
        $this->_loginNameSuffix = $loginNameSuffix;
        $this->_bookletName = $bookletName;
        $this->testLabel = $testLabel;
        $this->unitLabel = $unitLabel;

        $this->personLabel = AccessSet::getDisplayName(
            $groupLabel,
            $loginName,
            $loginNameSuffix
        );

        $idPieces = self::decodeId($attachmentId);
        $this->_testId = (int) $idPieces[0];
        $this->_unitName = $idPieces[1];
        $this->variableId = $idPieces[2];
    }

    static function decodeId(string $attachmentId): array {

        $idPieces = explode(':', $attachmentId);
        if (count($idPieces) != 3) {
            throw new HttpError("Invalid attachment attachmentId: `$attachmentId`", 400);
        }
        return $idPieces;
    }
}