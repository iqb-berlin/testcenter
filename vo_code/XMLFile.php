<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

class XMLFile
{
    protected $allErrors = [];
    private $schemaFileNames = ['Testtakers' => 'vo_Testtakers.xsd', 
                                'Booklet' => 'vo_Booklet.xsd',
                                'Unit' => 'vo_Unit.xsd'];
    protected $rootTagName;
    protected $isValid;
    protected $id;
    protected $label;
    public $xmlfile;

    // ####################################################
    public function __construct($xmlfilename)
    {
        $this->allErrors = [];
        $this->rootTagName = '';
        $this->id = '';
        $this->label = '';
        $this->isValid = false;
        $this->xmlfile = false;

        $xsdFolderName = __DIR__ . '/';

        libxml_use_internal_errors(true);
        libxml_clear_errors();
    
        if (!file_exists($xmlfilename)) {
            array_push($this->allErrors, 'Konnte ' . $xmlfilename . ' nicht finden.');
        } else {

            $this->xmlfile = simplexml_load_file($xmlfilename);
            if ($this->xmlfile == false) {
                array_push($this->allErrors, 'Konnte ' . $xmlfilename . ' nicht öffnen.');
            } else {
                $this->rootTagName = $this->xmlfile->getName();
                if (!array_key_exists($this->rootTagName, $this->schemaFileNames)) {
                    array_push($this->allErrors, $xmlfilename . ': Root-Tag "' . $this->rootTagName . '" unbekannt.');
                } else {
                    $mySchemaFilename = $xsdFolderName . $this->schemaFileNames[$this->rootTagName];

                    $this->id = strtoupper((string) $this->xmlfile->Metadata[0]->Id[0]);
                    $this->label = (string) $this->xmlfile->Metadata[0]->Label[0];

                    if ((strlen($this->id) > 0) && (strlen($this->label) > 0)) {
                        $myReader = new \XMLReader();
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
    
                        $this->isValid = count($this->allErrors) == 0;
                    }
                }
            }
        }
        // simplexml_load_file gibt auch Fehler nach libxml
        foreach (libxml_get_errors() as $error) {
            $errorString = "Fehler $error->code in Zeile {$error->line}:";
            $errorString .= trim($error->message);
            array_push($this->allErrors, $errorString);
        }
        libxml_clear_errors();
        libxml_use_internal_errors(false);

    }

    // ####################################################
    public function getErrors()
    {
        return $this->allErrors;
    }

    // ####################################################
    public function getRoottagName()
    {
        return $this->rootTagName;
    }

    // ####################################################
    public function getId()
    {
        return $this->id;
    }

    // ####################################################
    public function getLabel()
    {
        return $this->label;
    }

    // ####################################################
    public function isValid()
    {
        return $this->isValid;
    }
}
