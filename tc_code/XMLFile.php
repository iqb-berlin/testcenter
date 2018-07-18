<?php
class XMLFile
{
    private $allErrors = [];
    private $schemaFileNames = ['Testtakers' => 'OpenCBA_Testtakers.xsd', 
                                'Booklet' => 'OpenCBA_Booklet.xsd',
                                'Unit' => 'OpenCBA_Unit.xsd'];
    private $rootTagName;
    private $isValid;
    private $name;

    // ####################################################
    public function __construct($xmlfilename)
    {
        $this->allErrors = [];
        $this->rootTagName = '';
        $this->name = '';
        $this->isValid = false;

        $xsdFolderName = __DIR__ . '/';

        libxml_use_internal_errors(true);
        libxml_clear_errors();
    
        if (!file_exists($xmlfilename)) {
            array_push($this->allErrors, 'Konnte ' . $xmlfilename . ' nicht finden.');
        } else {

            $xmlfile = simplexml_load_file($xmlfilename);
            if ($xmlfile == false) {
                array_push($this->allErrors, 'Konnte ' . $xmlfilename . ' nicht öffnen.');
            } else {
                $this->rootTagName = $xmlfile->getName();
                if (!array_key_exists($this->rootTagName, $this->schemaFileNames)) {
                    array_push($this->allErrors, $xmlfilename . ': Root-Tag "' . $this->rootTagName . '" unbekannt.');
                } else {
                    $mySchemaFilename = $xsdFolderName . $this->schemaFileNames[$this->rootTagName];

                    $this->name = $xmlfile->Metadata[0]->Name[0];

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
    public function getName()
    {
        return $this->name;
    }

    // ####################################################
    public function isValid()
    {
        return $this->isValid;
    }
}
