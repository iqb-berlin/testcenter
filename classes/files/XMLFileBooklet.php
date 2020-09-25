<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class XMLFileBooklet extends XMLFile {

    protected int $totalSize = 0;


    public function setTotalSize(WorkspaceValidator $validator): void {

        $bookletPlayers = [];
        $bookletLoad = $this->getSize();

        foreach($this->getAllUnitIds() as $unitId) {

            if (!$validator->unitExists($unitId)) {
                $this->report('error', "Unit `$unitId` not found");
                continue;
            }

            $bookletLoad += $validator->unitFilesizes[$unitId];
            $player = $validator->unitPlayers[$unitId];

            if (!in_array($player, $bookletPlayers)) {

                $player = FileName::normalize($player, true);

                if (isset($this->resourceSizes[$player])) {

                    $bookletLoad += $validator->resourceSizes[$player];
                }
                $bookletPlayers[] = $player;
            }
        }
    }


    public function getTotalSize(): int {

        return $this->totalSize;
    }


    private function getAllUnitIds() {

        $allUnitIds = [];
        if ($this->isValid() and ($this->xmlfile != false) and ($this->rootTagName == 'Booklet')) {
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
