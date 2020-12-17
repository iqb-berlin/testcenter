<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-tests

class XMLFile extends File {

    const type = 'xml';

    private $schemaFileNames = [
        'Testtakers' => 'vo_Testtakers.xsd',
        'Booklet' => 'vo_Booklet.xsd',
        'SysCheck' => 'vo_SysCheck.xsd',
        'Unit' => 'vo_Unit.xsd'
    ];

    protected string $rootTagName = '';
    protected string $label = '';
    protected string $description = '';

    public SimpleXMLElement $xml;

    public function __construct(string $path, bool $validate = false, bool $isRawXml = false) {

        $xsdFolderName = ROOT_DIR . '/definitions/';

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

        if (!array_key_exists($this->rootTagName, $this->schemaFileNames)) {

            $this->report('error', "Invalid root-tag: `$this->rootTagName`");
            libxml_use_internal_errors(false);
            return;
        }

        $this->readMetadata();

        if ($validate) {

            $schemaFilename = $xsdFolderName . $this->schemaFileNames[$this->rootTagName];
            $xmlReader = new XMLReader();
            $xmlReader->open($path);
            $xmlReader->setSchema($schemaFilename);
            do {
                $continue = $xmlReader->read();
                $this->importLibXmlErrors();
            } while ($continue);
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


    public function getRoottagName() {

        return $this->rootTagName;
    }


    public function getLabel() {

        return $this->label;
    }


    public function getDescription() {

        return $this->description;
    }
}
