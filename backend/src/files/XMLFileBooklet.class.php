<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class XMLFileBooklet extends XMLFile {
  const string type = 'Booklet';
  const bool canBeRelationSubject = true;
  const bool canBeRelationObject = true;
  const array constraints = [
    [
      'description' => 'All states in restrictions must be defined',
      'xpath1' => '//Show/@if',
      'xpath2' => '//State/@id',
      'compare' => 'assertAllStatesDefined'
    ],
    [
      'description' => 'All options in restrictions must be defined',
      'xpath1' => '//Show',
      'compare' => 'assertAllStateOptionsDefined'
    ],
    [
      'description' => 'At least one option per state must be empty',
      'xpath1' => '//States/State/@id',
      'compare' => 'assertAtLeastOneEmptyOptionPerState'
    ],
    [
      'description' => 'units or alias in from-attribute must be defined',
      'xpath1' => '//States/State/Option/If/*/@from',
      'compare' => 'assertEveryReferredUnitMustBeDefined'
    ]
  ];

  public function crossValidate(WorkspaceCache $workspaceCache): void {
    parent::crossValidate($workspaceCache);

    $bookletPlayers = [];
    $this->contextData['totalSize'] = $this->getSize();

    foreach ($this->getUnitIds() as $unitId) {
      $unit = $workspaceCache->getUnit($unitId);

      if ($unit == null) {
        $this->report('error', "Unit `$unitId` not found");
        continue;
      }

      $this->addRelation(new FileRelation($unit->getType(), $unitId, FileRelationshipType::containsUnit, $unit));

      $this->contextData['totalSize'] += $unit->getTotalSize();

      $playerFile = $unit->getPlayerIfExists($workspaceCache);

      if (!$playerFile) {
        $this->report('error', "No suitable version of Player found (Unit `$unitId`).");
      }

      if ($playerFile and !in_array($playerFile->getId(), $bookletPlayers)) {
        $this->contextData['totalSize'] += $playerFile->getSize();
        $bookletPlayers[] = $playerFile->getId();
      }
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

  protected static function assertAllStatesDefined(
    string | SimpleXMLElement | null $result1,
    string | SimpleXMLElement | null $result2,
    array $results1,
    array $results2,
    SimpleXMLElement $doc
  ): true | string {
    return (!$result1 or in_array($result1, $results2)) ? true : "State not defined: `$result1`";
  }

  protected static function assertAllStateOptionsDefined(
    string | SimpleXMLElement | null $show,
    string | SimpleXMLElement | null $dummy,
    array $results1,
    array $results2,
    SimpleXMLElement $doc
  ): true | string {
    if (!is_a($show, SimpleXMLElement::class)) throw new Error('Use an xpath that returns a node, not an attribute.');
    $if = (string) $show['if'];
    $is = (string) $show['is'];
    if (!$if or !$is) return "`<Show>` misses attributes";
    $xp = "//States/State[@id = '$if']/Option[@id = '$is']";
    $option = $doc->xpath($xp);
    if (!$option) {
      return "Option `$is` for state `$if` is not defined.";
    }
    return true;
  }

  protected static function assertAtLeastOneEmptyOptionPerState(
    string | SimpleXMLElement | null $stateId,
    string | SimpleXMLElement | null $dummy,
    array $results1,
    array $results2,
    SimpleXMLElement $doc
  ): true | string {
    $xp = "//States/State[@id = '$stateId']/Option[not(text())]";
    $emptyOptions = $doc->xpath($xp);
    if (!$emptyOptions or !count($emptyOptions)) {
      return "State `$stateId` has no option without conditions. Each state must have at least one.";
    }
    return true;
  }

  protected static function assertEveryReferredUnitMustBeDefined(
    string | SimpleXMLElement | null $unitId,
    string | SimpleXMLElement | null $dummy,
    array $results1,
    array $results2,
    SimpleXMLElement $doc
  ): true | string {
    $xp = "//Unit[@id = '$unitId'] | //Unit[@alias = '$unitId']";
    $findUnit = $doc->xpath($xp);
    if (!$findUnit or !count($findUnit)) {
      return "No Unit with id or alias `$unitId` defined.";
    }
    return true;
  }
}
