<?php
declare(strict_types=1);

class FileRelation extends DataCollectionTypeSafe {

    protected string $targetType = '';
    protected string $targetId = '';
    protected string $relationshipType = '';

    public function __construct(
        string $targetType = '',
        string $targetId = null,
        string $relationshipType = '',
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


    public function getRelationshipType(): string {

        return $this->relationshipType;
    }
}