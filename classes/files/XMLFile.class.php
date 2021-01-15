<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-tests

class XMLFile extends File {

    const type = 'xml';
    const knownTypes = ['Testtakers', 'Booklet', 'SysCheck', 'Unit'];

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

            $xmlElem = new SimpleXMLElement($path);
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

        $schemaUrl = (string) $this->xml->attributes('xsi', true)->noNamespaceSchemaLocation;
        $this->schema = XMLSchema::parseSchemaUrl($schemaUrl, true);

        if (!$this->schema || !isset($this->schema['filePath']) || !$this->schema['filePath']) {

            // TODO distinguish between NO schema (use fallback) and outdated - throw error
            $this->report('warning', 'File has no (valid) link to XSD-Schema. Current Version will be assumed but maybe wrong');
            $this->schema = XMLSchema::getLocalSchema($this->getRoottagName());
        }
    }


    private function validateAgainstSchema(): void {

        $this->readSchema();
        if (!$this->schema['filePath']) {

            return;
        }

        $xmlReader = new XMLReader();
        $xmlReader->open($this->path);
        $xmlReader->setSchema($this->schema['filePath']);
        do {
            $continue = $xmlReader->read();
            $this->importLibXmlErrors();
        } while ($continue);
    }


    private function importLibXmlErrors(): void {

        foreach (libxml_get_errors() as $error) {
            $errorString = "Error [{$error->code}] in line {$error->line}: ";
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
