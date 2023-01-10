<?php
declare(strict_types=1);

class FileRelation extends DataCollectionTypeSafe {

    protected string $targetType = '';
    protected string $targetId = '';
    protected FileRelationshipType $relationshipType = FileRelationshipType::unknown;

    public function __construct(
        string $targetType = '',
        string $targetId = null,
        FileRelationshipType $relationshipType = FileRelationshipType::unknown,
    ) {
        $this->targetType = $targetType;
        $this->targetId = $targetId;
        $this->relationshipType = $relationshipType;
    }


    public function getTargetType(): string {

        return $this->targetType;
    }


    public function getTargetId(): string {

        return $this->targetId;
    }


    public function getRelationshipType(): FileRelationshipType {

        return $this->relationshipType;
    }
}