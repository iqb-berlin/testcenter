<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class XMLFileUnit extends XMLFile {
  const type = 'Unit';
  const canBeRelationSubject = true;
  const canBeRelationObject = true;

  const deprecatedElements = [
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

  public function getPlayerIfExists(WorkspaceCache $validator): ?ResourceFile {
    if (!$this->isValid()) {
      return null;
    }

    $playerId = $this->readPlayerId();

    $resource = $validator->getResource($playerId);

    if ($resource != null) {
      $this->addRelation(new FileRelation($resource->getType(), $playerId, FileRelationshipType::usesPlayer, $resource));
    } else {
      $this->report('error', "Player not found `$playerId`.");
    }

    return $resource;
  }

  private function checkIfResourcesExist(WorkspaceCache $validator): void {
    $this->contextData['totalSize'] = $this->size;

    $definitionRef = $this->getDefinitionRef();

    $resources = $this->readPlayerDependencies();

    if ($definitionRef) {
      $resources['definition'] = $definitionRef;
    }

    foreach ($resources as $key => $resourceName) {
      $resourceId = strtoupper($resourceName);
      $resource = $validator->getResource($resourceId, false);

      if ($resource != null) {
        $relationshipType = ($key === 'definition') ? FileRelationshipType::isDefinedBy : FileRelationshipType::usesPlayerResource;
        $this->addRelation(new FileRelation($resource->getType(), $resourceName, $relationshipType, $resource));
        $this->contextData['totalSize'] += $resource->getSize();

      } else {
        $this->report('error', "Resource `$resourceName` not found");
      }
    }
  }

  public function getTotalSize(): int {
    return $this->contextData['totalSize'];
  }

  public function readPlayerId(): string {
    if (!$this->isValid()) {
      return '';
    }

    $definition = $this->getXml()->xpath('/Unit/Definition | /Unit/DefinitionRef');

    $playerIdRaw = count($definition) ? (string) $definition[0]['player'] : null;

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
}
