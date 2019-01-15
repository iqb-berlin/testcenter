<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

class XMLFile
{
    public $allErrors = [];
    private $schemaFileNames = ['Testtakers' => 'vo_Testtakers.xsd', 
                                'Booklet' => 'vo_Booklet.xsd',
                                'SysCheck' => 'vo_SysCheck.xsd',
                                'Unit' => 'vo_Unit.xsd'];
    protected $rootTagName;
    protected $isValid;
    protected $id;
    protected $label;
    protected $description;
    protected $filename;
    public $xmlfile;

    // ####################################################
    public function __construct($xmlfilename, $validate = false)
    {
        $this->allErrors = [];
        $this->rootTagName = '';
        $this->id = '';
        $this->label = '';
        $this->isValid = false;
        $this->xmlfile = false;
        $this->filename = $xmlfilename;

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

                    $myId = $this->xmlfile->Metadata[0]->Id[0];
                    if (isset($myId)) {
                        $this->id = strtoupper((string) $myId);
                    }

                    // label is required!
                    $this->label = (string) $this->xmlfile->Metadata[0]->Label[0];
                    $myDescription = $this->xmlfile->Metadata[0]->Description[0];
                    if (isset($myDescription)) {
                        $this->description = (string) $myDescription;
                    }

                    if ($validate) {
                        if (strlen($this->label) > 0) {
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
                    } else {
                        $this->isValid = true;
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
    public function getDescription()
    {
        return $this->description;
    }

    // ####################################################
    public function isValid()
    {
        return $this->isValid;
    }
}
