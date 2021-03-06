<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class XMLFileBooklet extends XMLFile {

    const type = 'Booklet';

    protected int $totalSize = 0;


    public function crossValidate(WorkspaceValidator $validator): void {

        parent::crossValidate($validator);

        $bookletPlayers = [];
        $this->totalSize = $this->getSize();

        foreach($this->getAllUnitIds() as $unitId) {

            $unit = $validator->getUnit($unitId);

            if ($unit == null) {
                $this->report('error', "Unit `$unitId` not found");
                continue;
            }

            $unit->addUsedBy($this);

            $this->totalSize += $unit->getTotalSize();

            $playerFile = $unit->getPlayerIfExists($validator);

            if (!$playerFile) {

                $this->report('error', "No suitable version of `{$unit->getPlayerId()}` found");
            }

            if ($playerFile and !in_array($playerFile->getId(), $bookletPlayers)) {

                $this->totalSize += $playerFile->getSize();
                $bookletPlayers[] = $playerFile->getId();
            }
        }
    }


    public function getTotalSize(): int {

        return $this->totalSize;
    }


    protected function getAllUnitIds() {

        $allUnitIds = [];
        if ($this->isValid() and ($this->xml != false) and ($this->rootTagName == 'Booklet')) {
            $unitsNode = $this->xml->Units[0];
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


    public function getSpecialInfo(): FileSpecialInfo {

        $meta = parent::getSpecialInfo();
        $meta->totalSize = $this->getTotalSize();
        return $meta;
    }
}
