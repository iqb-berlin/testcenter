<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class XMLFileUnit extends XMLFile {
  const string type = 'Unit';
  const true canBeRelationSubject = true;
  const true canBeRelationObject = true;

  const array deprecatedElements = [
    '/Unit/Definition/@type',
    '/Unit/Metadata/Lastchange',
    '/Unit/Dependencies/file'
  ];

  public function crossValidate(WorkspaceCache $workspaceCache): void {
    parent::crossValidate($workspaceCache);

    $this->checkRequestedAttachments();
    $this->checkIfResourcesExist($workspaceCache);
    $this->getPlayerIfExists($workspaceCache);
  }

  public function getPlayerIfExists(WorkspaceCache $workspaceCache): ?ResourceFile {
    if (!$this->isValid()) {
      return null;
    }

    $playerId = $this->readPlayerId();

    $resource = $workspaceCache->getResource($playerId);

    if ($resource != null) {
      $this->addRelation(new FileRelation($resource->getType(), $resource->getName(), FileRelationshipType::usesPlayer, $resource, $playerId));
    } else {
      $this->report('error', "Player not found `$playerId`.");
    }

    return $resource;
  }

  private function getSchemeRef(): string {
    if (!$this->isValid()) {
      return '';
    }

    $reference = $this->getXml()->xpath('/Unit/CodingSchemeRef');

    $schemeIdRaw = count($reference) ? (string) $reference[0] : '';

    // TODO X check if schemer & scheme type is supported

    return $schemeIdRaw;
  }

  private function checkIfResourcesExist(WorkspaceCache $cache): void {
    $this->addDependency($cache, FileRelationshipType::isDefinedBy, $this->getDefinitionRef());
    $this->addDependency($cache, FileRelationshipType::usesScheme, $this->getSchemeRef());

    $resources = $this->readPlayerDependencies();
    foreach ($resources as $dependency) {
      $this->addDependency($cache, FileRelationshipType::usesPlayerResource, $dependency);
    }
  }

  private function addDependency(
    WorkspaceCache $cache,
    FileRelationshipType $relationshipType,
    string $resourceName
  ): void {
    if (!$resourceName) {
      return;
    }

    $resourceId = strtoupper($resourceName);
    $resource = $cache->getResource($resourceId);

    if ($resource != null) {
      $this->addRelation(new FileRelation($resource->getType(), $resourceName, $relationshipType, $resource));
    } else {
      $this->report('error', "Resource `$resourceName` not found");
    }
  }

  public function readPlayerId(): string {
    if (!$this->isValid()) {
      return '';
    }

    $definition = $this->getXml()->xpath('/Unit/Definition | /Unit/DefinitionRef');

    $playerIdRaw = null;

    if (count($definition)) {
      $playerIdRaw = (string) $definition[0]['player'] ?? (string) $definition[0]['type'];
    }

    if (!$playerIdRaw) {
      return '';
    }

    return FileID::normalize($playerIdRaw);
  }

  public function getDefinitionRef(): string {
    $definitionRefNodes = $this->getXml()->xpath('/Unit/DefinitionRef');
    return count($definitionRefNodes) ? (string) $definitionRefNodes[0] : '';
  }

  public function getDefinition(): string {
    $definitionNodes = $this->getXml()->xpath('/Unit/Definition');
    return count($definitionNodes) ? (string) $definitionNodes[0] : '';
  }

  private function readPlayerDependencies(): array {
    if (!$this->isValid()) {
      return [];
    }

    $dE = $this->getXml()->xpath('/Unit/Dependencies/file[not(@for) or @for="player"]|/Unit/Dependencies/File[not(@for) or @for="player"]');

    return array_map(
      function($e) {
        return (string) $e;
      },
      $dE
    );
  }

  private function checkRequestedAttachments(): void {
    $requestedAttachments = $this->getRequestedAttachments();
    $requestedAttachmentsCount = count($requestedAttachments);
    if ($requestedAttachmentsCount) {
      $this->report('info', "`$requestedAttachmentsCount` attachment(s) requested.");
    }
  }

  public function getRequestedAttachments(): array {
    $variables = $this->getXml()->xpath('/Unit/BaseVariables/Variable[@type="attachment"]');
    $requestedAttachments = [];
    foreach ($variables as $variable) {
      if (!is_a($variable, SimpleXMLElement::class)) {
        continue;
      }

      $requestedAttachments[] = new RequestedAttachment(
        $this->getId(),
        (string) $variable['format'],
        (string) $variable['id']
      );
    }

    return $requestedAttachments;
  }

  public function getDefinitionType(): string {
    // at one point we decided to deprecated the type-attribute in <DefinitionRef> or <Definition>, and said, that the
    // type is always indicated by the player. This might change again in the future.
    if (count($this->relations)) {
      foreach ($this->relations as $relation) {
        /* @var FileRelation $relation */
        if ($relation->getRelationshipType() === FileRelationshipType::usesPlayer) {
          return strtolower(FileID::normalize($relation->getTargetName()));
        }
      }
      return '';
    }
    return strtolower($this->readPlayerId());
  }
}
