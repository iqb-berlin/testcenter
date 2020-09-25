<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-tests

class XMLFile extends File {

    private $schemaFileNames = [
        'Testtakers' => 'vo_Testtakers.xsd',
        'Booklet' => 'vo_Booklet.xsd',
        'SysCheck' => 'vo_SysCheck.xsd',
        'Unit' => 'vo_Unit.xsd'
    ];

    protected $rootTagName = '';
    protected string $label = '';
    protected string $description = '';
    protected $customTexts;

    public $xmlfile;

    public function __construct(string $xmlfilename, bool $validate = false, bool $isRawXml = false) {

        $xsdFolderName = ROOT_DIR . '/definitions/';

        libxml_use_internal_errors(true);
        libxml_clear_errors();
    
        if (!$isRawXml) {

            parent::__construct($xmlfilename);
        }

        $this->xmlfile = !$isRawXml
            ? simplexml_load_file($xmlfilename)
            : new SimpleXMLElement($xmlfilename);

        if ($this->xmlfile == false) {

            $this->report('error', "Error in `$xmlfilename`");

        } else {

            $this->rootTagName = $this->xmlfile->getName();
            if (!array_key_exists($this->rootTagName, $this->schemaFileNames)) {

                $this->report('error', $xmlfilename . ': Root-Tag "' . $this->rootTagName . '" unknown.');

            } else {

                $mySchemaFilename = $xsdFolderName . $this->schemaFileNames[$this->rootTagName];

                $myId = $this->xmlfile->Metadata[0]->Id[0];
                if (isset($myId)) {
                    $this->id = trim(strtoupper((string) $myId));
                }

                $this->label = (string) $this->xmlfile->Metadata[0]->Label[0];

                $myDescription = $this->xmlfile->Metadata[0]->Description[0];
                if (isset($myDescription)) {
                    $this->description = (string) $myDescription;
                }

                $myCustomTextsNode = $this->xmlfile->CustomTexts[0];
                if (isset($myCustomTextsNode)) {
                    foreach($myCustomTextsNode->children() as $customTextElement) {
                        if ($customTextElement->getName() == 'CustomText') {
                            $customTextValue = (string) $customTextElement;
                            $customTextKeyAttr = $customTextElement['key'];
                            if ((strlen($customTextValue) > 0) && isset($customTextKeyAttr)) {
                                $customTextKey = (string) $customTextKeyAttr;
                                if (strlen($customTextKey) > 0) {
                                    $this->customTexts[$customTextKey] = $customTextValue;
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
                            $this->report('error', $errorString);
                        }
                        libxml_clear_errors();
                    } while ($continue);

                }
            }
        }

        if ($validate) {
            // simplexml_load_file gibt auch Fehler nach libxml
            foreach (libxml_get_errors() as $error) {
                $errorString = "Error [{$error->code}] in line {$error->line}: ";
                $errorString .= trim($error->message);
                $this->report('error', $errorString);
            }
            libxml_clear_errors();
        }
        libxml_use_internal_errors(false);
    }


    public function getErrors() {

        return array_filter($this->validationReport, function(ValidationReportEntry $validationReportEntry): bool {
            return $validationReportEntry->level == 'error';
        });
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


    public function getCustomTexts() {

        return $this->customTexts;
    }
}
