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
    protected $customTexts;

    public SimpleXMLElement $xmlfile;

    public function __construct(string $path, bool $validate = false, bool $isRawXml = false) {

        $xsdFolderName = ROOT_DIR . '/definitions/';

        libxml_use_internal_errors(true);
        libxml_clear_errors();

        if (!$isRawXml) {

            parent::__construct($path);
        }

        $xmlElem = !$isRawXml ? simplexml_load_file($path) : new SimpleXMLElement($path);

        if ($xmlElem === false) {

            $this->xmlfile = new SimpleXMLElement('<error />');
            if (!count($this->validationReport)) {
                $this->validationReport[] = new ValidationReportEntry('error', "Invalid File");
            }

        } else {

            $this->xmlfile = $xmlElem;

            $this->rootTagName = $this->xmlfile->getName();
            if (!array_key_exists($this->rootTagName, $this->schemaFileNames)) {

                $this->report('error', "Invalid root-tag: `$this->rootTagName`");

            } else {

                $mySchemaFilename = $xsdFolderName . $this->schemaFileNames[$this->rootTagName];

                if (count($this->xmlfile->Metadata)) {

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
                        // TODO move to testtakers, because it is ONLY used there... SysCheck is made differently
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
                }

                if ($validate) {

                    $myReader = new XMLReader();
                    $myReader->open($path);
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


    public function getRoottagName() {

        return $this->rootTagName;
    }


    public function getLabel() {

        return $this->label;
    }


    public function getDescription() {

        return $this->description;
    }


    public function getCustomTexts() { // TODO maybe move to where it is allowed: syscheck, testtakers

        return $this->customTexts;
    }
}
