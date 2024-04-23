<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-tests

class XMLFile extends File {
  const type = 'xml';
  const knownRootTags = ['Testtakers', 'Booklet', 'SysCheck', 'Unit'];

  const deprecatedElements = [];

  protected string $rootTagName = '';
  protected ?array $schema;

  private ?SimpleXMLElement $xml = null;

  protected function validate(): void {
    parent::validate();

    if ($this->xml) {
      return;
    }

    paf_log('VALIDATE_XML: ' . $this->name);

    libxml_use_internal_errors(true);
    libxml_clear_errors();

    $xmlElem = simplexml_load_string($this->content);

    if ($xmlElem === false) {
      $this->importLibXmlErrors();
      libxml_use_internal_errors(false);
      $this->xml = new SimpleXMLElement('<error />');
      return;
    }

    $this->xml = $xmlElem;
    $this->rootTagName = $this->xml->getName();

    if (!in_array($this->rootTagName, $this::knownRootTags)) {
      $this->report('error', "Invalid root-tag: `$this->rootTagName`");
      $this->importLibXmlErrors();
      libxml_use_internal_errors(false);
      return;
    }

    $this->readMetadata();

    $this->importLibXmlErrors();
    $this->validateAgainstSchema();
    $this->warnOnDeprecatedElements();

    libxml_use_internal_errors(false);
  }

  protected function getXML(): SimpleXMLElement {
    error_log('GETXML:' . $this->name);
    parent::load();
    return $this->xml;
  }

  private function readMetadata(): void {
    $id = $this->xmlGetNodeContentIfPresent("/$this->rootTagName/Metadata/Id");
    if ($id) {
      $this->id = trim(strtoupper($id));
    }

    $this->label = $this->xmlGetNodeContentIfPresent("/$this->rootTagName/Metadata/Label");
    $this->description = $this->xmlGetNodeContentIfPresent("/$this->rootTagName/Metadata/Description");
  }

  private function readSchema(): void {
    // TODO support other ways of defining the schema (schemaLocation)

    $schemaUrl = (string) $this->getXml()->attributes('xsi', true)->noNamespaceSchemaLocation;

    if (!$schemaUrl) {
      $this->fallBackToCurrentSchemaVersion('File has no link to XSD-Schema.');
      return;
    }

    $this->schema = XMLSchema::parseSchemaUrl($schemaUrl);

    if (!$this->schema) {
      $this->report('error', 'File has no valid link to XSD-schema.');
      return;
    }

    if ($this->schema['type'] !== $this->getRootTagName()) {
      $this->report('error', 'File has no valid link to XSD-schema.');
      return;
    }

    if (!$this->schema['version']) {
      $this->fallBackToCurrentSchemaVersion("Version of XSD-schema missing.");
      return;
    }

    if (!Version::isCompatible($this->schema['version'])) {
      $this->fallBackToCurrentSchemaVersion("Outdated or wrong version of XSD-schema (`{$this->schema['version']}`).");
    }
  }

  private function fallBackToCurrentSchemaVersion(string $message): void {
    $currentVersion = SystemConfig::$system_version;
    $this->report('warning', "$message Current version (`$currentVersion`) will be used instead.");
    $this->schema = XMLSchema::getLocalSchema($this->getRootTagName());
  }

  private function validateAgainstSchema(): void {
    $this->readSchema();
    $schemaFilePath = XMLSchema::getSchemaFilePath($this->schema);
    if (!$schemaFilePath) {
      $this->fallBackToCurrentSchemaVersion("XSD-Schema (`{$this->schema['version']}`) could not be obtained.");
      $schemaFilePath = XMLSchema::getSchemaFilePath($this->schema);
    }

    $xmlReader = new XMLReader();
    $xmlReader->xml($this->getXML()->asXML());

    try {
      $xmlReader->setSchema($schemaFilePath);
    } catch (Throwable $exception) {
      $this->importLibXmlErrors($exception->getMessage() . ': ');
      $xmlReader->close();
      return;
    }

    do {
      $continue = $xmlReader->read();
      $this->importLibXmlErrors();
    } while ($continue);

    $xmlReader->close();
  }

  private function warnOnDeprecatedElements(): void {
    foreach ($this::deprecatedElements as $deprecatedElement) {
      foreach ($this->getXml()->xpath($deprecatedElement) as $ignored) {
        $this->report('warning', "Element `$deprecatedElement` is deprecated.");
      }
    }
  }

  private function importLibXmlErrors(string $prefix = ""): void {
    foreach (libxml_get_errors() as $error) {
      $errorString = "{$prefix}Error [$error->code] in line $error->line: ";
      $errorString .= trim($error->message);
      $this->report('error', $errorString);
    }
    libxml_clear_errors();
  }

  protected function xmlGetNodeContentIfPresent(string $nodePath): string {
    $nodes = $this->getXml()->xpath($nodePath);
    return count($nodes) ? (string) $nodes[0] : '';
  }

  public function getRootTagName(): string { // TODO is this needed?

    return $this->rootTagName;
  }
}
