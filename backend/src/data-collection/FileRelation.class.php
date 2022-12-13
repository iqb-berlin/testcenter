<?php
declare(strict_types=1);

class FileRelation extends DataCollectionTypeSafe {

    protected string $targetType = '';
    protected string $targetName = '';
    protected string $relationshipType = '';

    public function __construct(
        string $targetType = '',
        string $targetName = null,
        string $relationshipType = '',
    ) {
        $this->targetType = $targetType;
        $this->targetName = $targetName;
        $this->relationshipType = $relationshipType;
    }


    public function getTargetType(): string {

        return $this->targetType;
    }


    public function getTargetName(): string {

        return $this->targetName;
    }


    public function getRelationshipType(): string {

        return $this->relationshipType;
    }
}