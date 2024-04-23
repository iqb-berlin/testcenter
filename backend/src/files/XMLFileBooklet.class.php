<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class XMLFileBooklet extends XMLFile {
  const string type = 'Booklet';
  const bool canBeRelationSubject = true;
  const bool canBeRelationObject = true;

  public function crossValidate(WorkspaceCache $workspaceCache): void {
    parent::crossValidate($workspaceCache);
    $this->checkUnitIds($workspaceCache);
  }

  public function getUnitIds(): array {
    if (!$this->isValid()) {
      return [];
    }

    if ($this->relations == null) {
      return $this->readUnitIds($this->getXml()->Units[0]);
    } else {
      $unitIds = [];
      foreach ($this->relations as $relation) {
        /* @var $relation FileRelation */
        if ($relation->getRelationshipType() == FileRelationshipType::containsUnit) {
          $unitIds[] = $relation->getTargetId();
        }
      }
      return $unitIds;
    }
  }

  private function checkUnitIds(WorkspaceCache $cache): void {
    $bookletPlayers = [];
    $this->contextData['totalSize'] = $this->getSize();

    $unitIds = $this->getUnitIds();
    $this->relations = [];

    foreach ($unitIds as $unitId) {
      $unit = $cache->getUnit($unitId);

      if ($unit == null) {
        $this->report('error', "Unit `$unitId` not found");
        continue;
      }

      $this->addRelation(new FileRelation($unit->getType(), $unit->getName(), FileRelationshipType::containsUnit, $unitId));

      $this->contextData['totalSize'] += $unit->getTotalSize();

      $playerFile = $unit->getPlayerIfExists($cache);

      if (!$playerFile) {
        $this->report('error', "No suitable version of Player found (Unit `$unitId`).");
      }

      if ($playerFile and !in_array($playerFile->getId(), $bookletPlayers)) {
        $this->contextData['totalSize'] += $playerFile->getSize();
        $bookletPlayers[] = $playerFile->getId();
      }
    }
  }

  private function readUnitIds(SimpleXMLElement $node): array {
    $unitIds = [];
    foreach ($node->children() as $element) {
      if ($element->getName() == 'Unit') {
        $id = strtoupper((string) $element['id']);
        $unitIds[] = $id;

      } else {
        foreach ($this->readUnitIds($element) as $id) {
          $unitIds[] = $id;
        }
      }
    }
    return $unitIds;
  }
}
