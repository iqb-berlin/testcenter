<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class XMLFileUnit extends XMLFile {
  const string type = 'Unit';
  const bool canBeRelationSubject = true;
  const bool canBeRelationObject = true;

  const array deprecatedElements = [
    '/Unit/Definition/@type',
    '/Unit/Metadata/Lastchange',
    '/Unit/Dependencies/file'
  ];

  public function crossValidate(WorkspaceCache $workspaceCache): void {
    paf_log('crossValidate (rel: ' . count($this->relations ?? []) . ')');

    parent::crossValidate($workspaceCache);
    $this->checkRequestedAttachments();
    $this->checkIfResourcesExist($workspaceCache);
  }

  public function getPlayerIfExists(WorkspaceCache $cache): ?ResourceFile {
    if (!$this->isValid()) {
      return null;
    }

    if ($this->relations == null) {
      $playerId = $this->readPlayerId();
      return $cache->getResource($playerId);
    }

    foreach ($this->relations as $relation) {
      /* @var $relation FileRelation */
      if ($relation->getRelationshipType() == FileRelationshipType::usesPlayer) {
        return $cache->getResource($relation->getTargetId());
      }
    }

    return null;
  }

  private function checkIfResourcesExist(WorkspaceCache $cache): void {
    if ($this->relations == null) {
      $this->readRelations($cache);
    } else {
      foreach ($this->relations as $relation) {
        if (!$relation->getTargetId()) { // TODO X
          var_dump($this->relations);
          die();
        }
        /* @var $relation FileRelation */
        if (!$cache->getResource($relation->getTargetId())) {
          $this->report('error', "Resource `{$relation->getTargetId()}` not found");
        }
      }
    }
  }

  private function readRelations(WorkspaceCache $cache): void {
    $this->contextData['totalSize'] = $this->size;
    $resources = $this->readPlayerDependencies();
    $definitionRef = $this->getDefinitionRef();
    if ($definitionRef) {
      $resources['Unit-Definition'] = $definitionRef;
    }
    $playerId = $this->readPlayerId();
    if ($playerId) {
      $resources['Player'] = $playerId;
    }
    foreach ($resources as $key => $resourceQuery) {
      $resourceId = strtoupper($resourceQuery);
      $resource = $cache->getResource($resourceId);
      if ($resource != null) {
        $relationshipType = match($key) {
          'Unit-Definition' => FileRelationshipType::isDefinedBy,
          'Player' => FileRelationshipType::usesPlayer,
          default => FileRelationshipType::usesPlayerResource
        };
        $this->addRelation(new FileRelation($resource->getType(), $resource->getName(), $relationshipType, $resource->getId()));
        $this->contextData['totalSize'] += $resource->getSize();
      } else {
        $this->report('error', "$key `$resourceQuery` not found");
      }
    }
  }

  public function getTotalSize(): int {
    return $this->contextData['totalSize'];
  }

  private function readPlayerId(): ?string {
    if (!$this->isValid()) {
      return null;
    }

    $definition = $this->getXml()->xpath('/Unit/Definition | /Unit/DefinitionRef');

    $playerIdRaw = count($definition) ? (string) $definition[0]['player'] : null;

    if (!$playerIdRaw) {
      return null;
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
    $this->contextData['requestedAttachments'] = $requestedAttachments;
  }

  public function getRequestedAttachments(): array {
    if (isset($this->contextData['requestedAttachments'])) {
      return $this->contextData['requestedAttachments'];
    }
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
}
