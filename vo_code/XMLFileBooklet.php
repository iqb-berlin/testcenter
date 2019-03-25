<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Mechtel
// 2018, 2019
// license: MIT

require_once('XMLFile.php');

class XMLFileBooklet extends XMLFile
{
    // ####################################################
    private function getUnitIds($node) {
        $myreturn = [];
        foreach($node->children() as $element) {
            if ($element->getName() == 'Unit') {
                $idAttr = (string) $element['id'];
                if (isset($idAttr)) {
                    array_push($myreturn, strtoupper($idAttr));
                }
            } else {
                foreach($this->getUnitIds($element) as $id) {
                    array_push($myreturn, $id);
                }
            }
        }
        return $myreturn;
    }

    // ####################################################
    public function getAllUnitIds()
    {
        $myreturn = [];
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'Booklet')) {
            $unitsNode = $this->xmlfile->Units[0];
            if (isset($unitsNode)) {
                $myreturn = $this->getUnitIds($unitsNode);
            }
        }
        return $myreturn;
    }
}
