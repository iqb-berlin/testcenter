<?php


class XMLFile {
    public $allErrors = [];
    private $_schemaFileNames = ['Testtakers' => 'vo_Testtakers.xsd',
                                'Booklet' => 'vo_Booklet.xsd',
                                'SysCheck' => 'vo_SysCheck.xsd',
                                'Unit' => 'vo_Unit.xsd'];
    protected $_rootTagName;
    protected $_isValid;
    protected $_id;
    protected $_label;
    protected $_description;
    protected $_filename;
    protected $_customTexts;

    public $xmlfile;


    public function __construct($xmlfilename, $validate = false) {
        $this->allErrors = [];
        $this->_rootTagName = '';
        $this->_id = '';
        $this->_label = '';
        $this->_isValid = false;
        $this->xmlfile = false;
        $this->_filename = $xmlfilename;
        $this->_customTexts = [];

        $xsdFolderName = ROOT_DIR . '/definitions/';

        libxml_use_internal_errors(true);
        libxml_clear_errors();
    
        if (!file_exists($xmlfilename)) {
            array_push($this->allErrors, 'Konnte ' . $xmlfilename . ' nicht finden.');
        } else {

            $this->xmlfile = simplexml_load_file($xmlfilename);
            if ($this->xmlfile == false) {
                array_push($this->allErrors, 'Konnte ' . $xmlfilename . ' nicht öffnen.');
            } else {
                $this->_rootTagName = $this->xmlfile->getName();
                if (!array_key_exists($this->_rootTagName, $this->_schemaFileNames)) {
                    array_push($this->allErrors, $xmlfilename . ': Root-Tag "' . $this->_rootTagName . '" unbekannt.');
                } else {
                    $mySchemaFilename = $xsdFolderName . $this->_schemaFileNames[$this->_rootTagName];

                    $myId = $this->xmlfile->Metadata[0]->Id[0];
                    if (isset($myId)) {
                        $this->_id = strtoupper((string) $myId);
                    }

                    // label is required!
                    $this->_label = (string) $this->xmlfile->Metadata[0]->Label[0];
                    $myDescription = $this->xmlfile->Metadata[0]->Description[0];
                    if (isset($myDescription)) {
                        $this->_description = (string) $myDescription;
                    }
                    $myCustomTextsNode = $this->xmlfile->CustomTexts[0];
                    if (isset($myCustomTextsNode)) {
                        foreach($myCustomTextsNode->children() as $costumTextElement) {
                            if ($costumTextElement->getName() == 'Text') {
                                $customTextValue = (string) $costumTextElement;
                                $customTextKeyAttr = $costumTextElement['key'];
                                if ((strlen($customTextValue) > 0) && isset($customTextKeyAttr)) {
                                    $costumTextKey = (string) $customTextKeyAttr;
                                    if (strlen($costumTextKey) > 0) {
                                        $this->_customTexts[$costumTextKey] = $customTextValue;
                                    }
                                }
                            }
                        }
    
                    }

                    if ($validate) {
                        if (strlen($this->_label) > 0) {
                            $myReader = new XMLReader();
                            $myReader->open($xmlfilename);
                            $myReader->setSchema($mySchemaFilename);
        
                            $continue = true;
                            do {
                                $continue = $myReader->read();
                                foreach (libxml_get_errors() as $error) {
                                    $errorString = "Fehler $error->code in Zeile {$error->line}: ";
                                    $errorString .= trim($error->message);
                                    array_push($this->allErrors, $errorString);
                                }
                                libxml_clear_errors();
                            } while ($continue);
        
                        $this->_isValid = count($this->allErrors) == 0;
                        }
                    } else {
                        $this->_isValid = true;
                    }
                }
            }
        }
        if ($validate) {
            // simplexml_load_file gibt auch Fehler nach libxml
            foreach (libxml_get_errors() as $error) {
                $errorString = "Fehler $error->code in Zeile {$error->line}:";
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

        return $this->_rootTagName;
    }


    public function getId() {

        return $this->_id;
    }


    public function getLabel() {

        return $this->_label;
    }


    public function getDescription() {

        return $this->_description;
    }


    public function isValid() {

        return $this->_isValid;
    }


    public function getCustomTexts() {

        return $this->_customTexts;
    }
}
