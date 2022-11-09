<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-tests

class XMLFile extends File {

    const type = 'xml';
    const knownTypes = ['Testtakers', 'Booklet', 'SysCheck', 'Unit'];

    const deprecatedElements = [];

    protected string $rootTagName = '';
    protected ?array $schema;

    public SimpleXMLElement $xml;


    public function __construct(string $path, bool $validate = false, bool $isRawXml = false) {

        libxml_use_internal_errors(true);
        libxml_clear_errors();

        if (!$isRawXml) {

            parent::__construct($path);

            if (!$this->isValid()) {

                libxml_use_internal_errors(false);
                return;
            }

            $xmlElem = simplexml_load_file($path);
            $this->importLibXmlErrors();

        } else {

            $xmlElem = simplexml_load_string($path);
        }


        if ($xmlElem === false) {

            $this->xml = new SimpleXMLElement('<error />');

            if (!count($this->validationReport)) {
                $this->validationReport[] = new ValidationReportEntry('error', "Invalid File");
            }

            libxml_use_internal_errors(false);
            return;
        }

        $this->xml = $xmlElem;
        $this->rootTagName = $this->xml->getName();

        if (!in_array($this->rootTagName, $this::knownTypes)) {

            $this->report('error', "Invalid root-tag: `$this->rootTagName`");
            libxml_use_internal_errors(false);
            return;
        }

        $this->readMetadata();

        if ($validate) {

            $this->validateAgainstSchema();
            $this->warnOnDeprecatedElements();
        }

        libxml_use_internal_errors(false);
    }

    private function readMetadata(): void {

        $id = $this->xmlGetNodeContentIfPresent("/{$this->rootTagName}/Metadata/Id");
        if ($id) {
            $this->id = trim(strtoupper($id));
        }

        $this->label = $this->xmlGetNodeContentIfPresent("/{$this->rootTagName}/Metadata/Label");
        $this->description = $this->xmlGetNodeContentIfPresent("/{$this->rootTagName}/Metadata/Description");
    }


    private function readSchema(): void {

        // TODO support other ways of defining the schema (schemaLocation)

        $schemaUrl = (string) $this->xml->attributes('xsi', true)->noNamespaceSchemaLocation;

        if (!$schemaUrl) {

            $this->fallBackToCurrentSchemaVersion('File has no link to XSD-Schema.');
            return;
        }

        $this->schema = XMLSchema::parseSchemaUrl($schemaUrl);

        if (!$this->schema) {

            $this->report('error', 'File has no valid link to XSD-schema.');
            return;
        }

        if ($this->schema['type'] !== $this->getRoottagName()) {

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

        $currentVersion = Version::get();
        $this->report('warning', "{$message} Current version (`$currentVersion`) will be used instead.");
        $this->schema = XMLSchema::getLocalSchema($this->getRoottagName());
    }


    private function validateAgainstSchema(): void {

        $this->readSchema();
        $schemaFilePath = XMLSchema::getSchemaFilePath($this->schema);
        if (!$schemaFilePath) {

            $this->fallBackToCurrentSchemaVersion("XSD-Schema (`{$this->schema['version']}`) could not be obtained.");
            $schemaFilePath = XMLSchema::getSchemaFilePath($this->schema);
        }

        $xmlReader = new XMLReader();
        $xmlReader->open($this->path);

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

            foreach ($this->xml->xpath($deprecatedElement) as $deprecatedItem) {

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

        $nodes = $this->xml->xpath($nodePath);
        return count($nodes) ? (string) $nodes[0] : '';
    }


    public function getRoottagName() { // TODO is this needed?

        return $this->rootTagName;
    }
}
