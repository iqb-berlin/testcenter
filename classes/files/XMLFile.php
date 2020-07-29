<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-tests

class XMLFile {

    private $schemaFileNames = [
        'Testtakers' => 'vo_Testtakers.xsd',
        'Booklet' => 'vo_Booklet.xsd',
        'SysCheck' => 'vo_SysCheck.xsd',
        'Unit' => 'vo_Unit.xsd'
    ];

    protected $rootTagName;
    protected $isValid;
    protected $id;
    protected $label;
    protected $description;
    protected $filename;
    protected $customTexts;

    public $allErrors = [];
    public $xmlfile;


    static function get(string $xmlFilename, bool $validate = false): XMLFile {

        if (!file_exists($xmlFilename)) {

            throw new HttpError("File not found: `{$xmlFilename}`");
        }

        $xml = simplexml_load_file($xmlFilename);

        if (!$xml) {

            throw new HttpError("Could not open XML-File: `{$xmlFilename}`", 500);
        }

        switch ($xml->getName()) {
            case 'Testtakers': return new XMLFileTesttakers($xmlFilename, $validate);
            case 'SysCheck': return new XMLFileSysCheck($xmlFilename, $validate);
            case 'SysBooklet': return new XMLFileBooklet($xmlFilename, $validate);
            case 'Unit': return new XMLFileUnit($xmlFilename, $validate);
        }

        return new XMLFile($xmlFilename, $validate);
    }


    public function __construct(string $xmlfilename, bool $validate = false, bool $isRawXml = false) {
        $this->allErrors = [];
        $this->rootTagName = '';
        $this->id = '';
        $this->label = '';
        $this->isValid = false;
        $this->xmlfile = false;
        $this->filename = $xmlfilename;
        $this->customTexts = [];

        $xsdFolderName = ROOT_DIR . '/definitions/';

        libxml_use_internal_errors(true);
        libxml_clear_errors();
    
        if (!$isRawXml and !file_exists($xmlfilename)) {

            array_push($this->allErrors, "`$xmlfilename` not found`");

        } else {

            $this->xmlfile = !$isRawXml
                ? simplexml_load_file($xmlfilename)
                : new SimpleXMLElement($xmlfilename);

            if ($this->xmlfile == false) {

                array_push($this->allErrors, "Error in `$xmlfilename`");

            } else {

                $this->rootTagName = $this->xmlfile->getName();
                if (!array_key_exists($this->rootTagName, $this->schemaFileNames)) {

                    array_push($this->allErrors, $xmlfilename . ': Root-Tag "' . $this->rootTagName . '" unknown.');

                } else {

                    $mySchemaFilename = $xsdFolderName . $this->schemaFileNames[$this->rootTagName];

                    $myId = $this->xmlfile->Metadata[0]->Id[0];
                    if (isset($myId)) {
                        $this->id = strtoupper((string) $myId);
                    }

                    $this->label = (string) $this->xmlfile->Metadata[0]->Label[0];

                    $myDescription = $this->xmlfile->Metadata[0]->Description[0];
                    if (isset($myDescription)) {
                        $this->description = (string) $myDescription;
                    }

                    $myCustomTextsNode = $this->xmlfile->CustomTexts[0];
                    if (isset($myCustomTextsNode)) {
                        foreach($myCustomTextsNode->children() as $costumTextElement) {
                            if ($costumTextElement->getName() == 'CustomText') {
                                $customTextValue = (string) $costumTextElement;
                                $customTextKeyAttr = $costumTextElement['key'];
                                if ((strlen($customTextValue) > 0) && isset($customTextKeyAttr)) {
                                    $costumTextKey = (string) $customTextKeyAttr;
                                    if (strlen($costumTextKey) > 0) {
                                        $this->customTexts[$costumTextKey] = $customTextValue;
                                    }
                                }
                            }
                        }
                    }

                    if ($validate) {

                        $myReader = new XMLReader();
                        $myReader->open($xmlfilename);
                        $myReader->setSchema($mySchemaFilename);

                        do {
                            $continue = $myReader->read();
                            foreach (libxml_get_errors() as $error) {
                                $errorString = "Error [{$error->code}] in line {$error->line}: ";
                                $errorString .= trim($error->message);
                                array_push($this->allErrors, $errorString);
                            }
                            libxml_clear_errors();
                        } while ($continue);

                        $this->isValid = count($this->allErrors) == 0;

                    } else {
                        $this->isValid = true;
                    }
                }
            }
        }
        if ($validate) {
            // simplexml_load_file gibt auch Fehler nach libxml
            foreach (libxml_get_errors() as $error) {
                $errorString = "Error [{$error->code}] in line {$error->line}: ";
                $errorString .= trim($error->message);
                array_push($this->allErrors, $errorString);
            }
            libxml_clear_errors();
        }
        libxml_use_internal_errors(false);
    }


    public function getErrors() {

        return $this->allErrors;
    }


    public function getRoottagName() {

        return $this->rootTagName;
    }


    public function getId() {

        return $this->id;
    }


    public function getLabel() {

        return $this->label;
    }


    public function getDescription() {

        return $this->description;
    }


    public function isValid() {

        return $this->isValid;
    }


    public function getCustomTexts() {

        return $this->customTexts;
    }
}
