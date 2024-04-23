<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class XMLFileSysCheck extends XMLFile {
  const type = 'SysCheck';
  const canBeRelationSubject = true;
  const canBeRelationObject = false;

  public function crossValidate(WorkspaceCache $workspaceCache): void {
    parent::crossValidate($workspaceCache);

    $unitId = $this->getUnitId();
    $unit = $workspaceCache->getUnit($unitId);

    if ($unit != null) {
      $this->addRelation(new FileRelation($unit->getType(), $unit->getName(), FileRelationshipType::containsUnit, $unit->getId()));
    }
  }

  public function getSaveKey() {
    if (!$this->isValid()) {
      return "";
    }

    $configNode = $this->getXml()->xpath('/SysCheck/Config[@savekey]');
    return count($configNode) ? strtoupper((string) $configNode[0]['savekey']) : '';
  }

  public function hasSaveKey(): bool {
    return strlen($this->getSaveKey()) > 0;
  }

  public function hasUnit(): bool {
    return strlen($this->getUnitId()) > 0;
  }

  public function getUnitId(): string {
    if (!$this->isValid()) {
      return "";
    }

    $configNode = $this->getXml()->xpath('/SysCheck/Config[@unit]');
    return count($configNode) ? strtoupper((string) $configNode[0]['unit']) : '';
  }

  public function getCustomTexts(): array {
    if (!$this->isValid()) {
      return [];
    }

    $customTextNodes = $this->getXml()->xpath('/SysCheck/Config/CustomText');
    $customTexts = [];
    foreach ($customTextNodes as $customTextNode) {
      $customTexts[] = [
        'key' => (string) $customTextNode['key'],
        'value' => (string) $customTextNode
      ];
    }
    return $customTexts;
  }

  public function getSkipNetwork(): bool {
    if (!$this->isValid()) {
      return false;
    }

    $configNode = $this->getXml()->xpath('/SysCheck/Config[@skipnetwork]');
    return count($configNode) ? ($configNode[0]['skipnetwork'] == 'true') : false;
  }

  public function getQuestions(): array {
    if (!$this->isValid()) {
      return [];
    }

    $questions = [];
    $questionNodes = $this->getXml()->xpath('/SysCheck/Config/Q');
    foreach ($questionNodes as $questionNode) {
      $questions[] = [
        'id' => (string) $questionNode['id'],
        'type' => (string) $questionNode['type'],
        'prompt' => (string) $questionNode['prompt'],
        'required' => (boolean) $questionNode['required'],
        'options' => strlen((string) $questionNode) ? explode('#', (string) $questionNode) : []
      ];
    }
    return $questions;
  }

  public function getSpeedtestUploadParams(): array {
    return $this->getSpeedParams(true);
  }

  public function getSpeedtestDownloadParams(): array {
    return $this->getSpeedParams(false);
  }

  private function getSpeedParams(bool $upload = false) {
    $speedtestParams = [
      'min' => 0,
      'good' => 0,
      'maxDevianceBytesPerSecond' => 0,
      'maxErrorsPerSequence' => 0,
      'maxSequenceRepetitions' => 0,
      'sequenceSizes' => []
    ];

    if (!$this->isValid()) {
      return $speedtestParams;
    }

    $node = $this->getXml()->xpath('/SysCheck/Config/' . ($upload ? 'UploadSpeed' : 'DownloadSpeed'));

    if (!count($node)) {
      return $speedtestParams;
    }

    foreach ($speedtestParams as $param => $default) {
      $speedtestParams[$param] = (int) $node[0][$param] ?? $default;
    }

    if ((string) $node[0]) {
      $speedtestParams['sequenceSizes'] = array_map(
        function($str) {
          return trim($str);
        },
        explode(',', (string) $node[0])
      );
    }

    return $speedtestParams;
  }
}
