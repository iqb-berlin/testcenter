<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class XMLFileBooklet extends XMLFile {
  const type = 'Booklet';
  const canBeRelationSubject = true;
  const canBeRelationObject = true;

  public function crossValidate(WorkspaceCache $workspaceCache): void {
    parent::crossValidate($workspaceCache);


    foreach ($this->getUnitIds() as $unitId) {
      $unit = $workspaceCache->getUnit($unitId);

      if ($unit == null) {
        $this->report('error', "Unit `$unitId` not found");
        continue;
      }

      if (!$unit->isValid()) {
        $this->report('error', "Unit `$unitId` has an error");
        continue;
      }

      $this->addRelation(new FileRelation($unit->getType(), $unitId, FileRelationshipType::containsUnit, $unit));

    }
  }

  // TODO unit-test $useAlias
  public function getUnitIds(bool $useAlias = false): array {
    if (!$this->isValid()) {
      return [];
    }

    return $this->getUnitIdFromNode($this->getXml()->Units[0], $useAlias);
  }

  private function getUnitIdFromNode(SimpleXMLElement $node, bool $useAlias = false): array {
    $unitIds = [];
    foreach ($node->children() as $element) {
      if ($element->getName() == 'Unit') {
        $id = strtoupper((string) $element['id']);
        $alias = (string) $element['alias'];
        $unitIds[] = ($useAlias and $alias) ? $alias : $id;

      } else {
        foreach ($this->getUnitIdFromNode($element, $useAlias) as $id) {
          $unitIds[] = $id;
        }
      }
    }
    return $unitIds;
  }
}
