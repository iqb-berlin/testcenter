<?php
declare(strict_types=1);

class FileRelation extends DataCollectionTypeSafe {

    protected string $targetType = '';
    protected string $targetName = '';
    protected FileRelationshipType $relationshipType = FileRelationshipType::unknown;
//    protected ?File $target;
    protected ?string $targetId;

    public function __construct(
        string $targetType,
        string $targetName,
        FileRelationshipType $relationshipType = FileRelationshipType::unknown,
//        File $target = null,
        string $targetId = null,
    ) {
        $this->targetType = $targetType;
        $this->targetName = $targetName;
        $this->relationshipType = $relationshipType;
//        $this->target = $target;
        $this->targetId = $targetId;
    }


    public function getTargetType(): string {

        return $this->targetType;
    }


    public function getTargetName(): string {

        return $this->targetName;
    }


    public function getRelationshipType(): FileRelationshipType {

        return $this->relationshipType;
    }


//    public function getTarget(): ?File {
//
//        return $this->target;
//    }


    public function getTargetId(): ?string {

        return $this->targetId;
    }
}