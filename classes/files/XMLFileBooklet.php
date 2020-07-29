<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class XMLFileBooklet extends XMLFile {


    public function getAllUnitIds() {

        $allUnitIds = [];
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'Booklet')) {
            $unitsNode = $this->xmlfile->Units[0];
            if (isset($unitsNode)) {
                $allUnitIds = $this->getUnitIds($unitsNode);
            }
        }
        return $allUnitIds;
    }


    private function getUnitIds(SimpleXMLElement $node): array {

        $unitIds = [];
        foreach($node->children() as $element) {
            if ($element->getName() == 'Unit') {
                $idAttr = (string) $element['id'];
                if (isset($idAttr)) {
                    array_push($unitIds, strtoupper($idAttr));
                }
            } else {
                foreach($this->getUnitIds($element) as $id) {
                    array_push($unitIds, $id);
                }
            }
        }
        return $unitIds;
    }
}
