<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-tests

class XMLFile extends File {
  const type = 'xml';
  const array knownRootTags = ['Testtakers', 'Booklet', 'SysCheck', 'Unit'];

  const deprecatedElements = [];
  const constraints = [];

  protected string $rootTagName = '';
  protected ?array $schema;

  private ?SimpleXMLElement $xml = null;

  protected function validate(): void {
    parent::validate();

    if ($this->xml) {
      return;
    }

    if (!$this->content) {
      $this->report('error', "Empty File");
      $this->xml = new SimpleXMLElement('<error />');
      return;
    }

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
    $this->validateConstraints();

    libxml_use_internal_errors(false);
  }

  protected function getXML(): SimpleXMLElement {
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

  // Sometimes we have constraints for XML-formats which can not modelled in XMLschema 1.0
  // XMLSchema 1.1 is not supported by PHP (nor by IDEA although there is a setting for it),
  // and there is no plugin or suitable external library for this (the saxon/c open source
  // version does not allow XMLschema 1.1, and xerces only have bindings for java and perl).
  //
  // Those constraints can be defined in the constraints array in a file extending this.
  // A constraint is an associative array consisting of the elements
  // 'description', 'xpath1', 'xpath2' and 'compare'.
  // The results of both Xpaths get compared itemwise. The may be a list of strings (of attributes where queries)
  // or nodes. PHP/simpleXML does not support Xpaths containing comparison operators themselves.
  // 'compare' may contain a comparison operators
  // ('==', '!=', '>', '<', '>=', '<=') or the name of a comparison function which must be a static member
  // of this.
  public function validateConstraints(): void {
    foreach ($this::constraints as $constraint) {
      $this->validateConstraint(
        $constraint['description'] ?? throw new Error('constraint is missing description'),
        $constraint['xpath1'] ?? throw new Error('constraint is missing xpath1'),
        $constraint['xpath2'] ?? '',
        $constraint['compare'] ?? throw new Error('constraint is missing compare.'),
      );
    }
  }

  protected function validateConstraint(string $desc, string $query1, string $query2, string $compare): bool {
    $getValuesFromQuery = function(string $query): array {
      $getValue = fn(?string $queriedAttribute): callable =>
        function(?SimpleXMLElement $node) use ($queriedAttribute): string | SimpleXMLElement {
          if (!$node) return '';
          if (!$queriedAttribute) return $node;
          return (string) $node[$queriedAttribute];
        };
      if (!$query) return [];
      preg_match('/.+@(\w+)/', $query, $queriedAttribute);
      $queriedAttribute = $queriedAttribute[1] ?? null;
      $xpathResult = $this->xml->xpath($query);
      if (!is_array($xpathResult)) return [];
      return array_map($getValue($queriedAttribute), $xpathResult);
    };

    $values1 = $getValuesFromQuery($query1);
    $values2 = $getValuesFromQuery($query2);

    $validationResults = array_map(
      function(string | SimpleXMLElement | null $elem1, string | SimpleXMLElement | null $elem2) use ($compare, $values1, $values2): true | string {
        $r = match ($compare) {
          "==" => $elem1 == $elem2,
          "!=" => $elem1 != $elem2,
          ">=" => floatval($elem1) >= floatval($elem2),
          "<=" => floatval($elem1) <= floatval($elem2),
          ">" => floatval($elem1) > floatval($elem2),
          "<" => floatval($elem1) < floatval($elem2),
          default => method_exists($this::class, $compare) ? $this::$compare($elem1, $elem2, $values1, $values2, $this->xml) : throw new Error("Compare method not found: `$compare`")
        };
        return ($r === false) ? "`$elem1` `$compare` `$elem2`" : $r;
      },
      $values1,
      $values2
    );

    $errors = array_filter($validationResults, fn (true | string $a): bool => !is_bool($a));

    foreach ($errors as $error) {
      $this->report('error', "Advanced XML validation: Assertion `$desc` failed: $error.");
    }

    return !count($errors);
  }
}
