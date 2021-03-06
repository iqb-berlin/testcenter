<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class BookletsFolder extends Workspace {

    public function getBookletLabel(string $bookletId): string {

        $lookupFolder = $this->workspacePath . '/Booklet';
        if (!file_exists($lookupFolder)) {
            throw new HttpError("Folder does not exist: `$lookupFolder`", 404);
        }

        $lookupDir = opendir($lookupFolder);
        if ($lookupDir === false) {
            throw new HttpError("Could not open: `$lookupFolder`", 404);
        }

        while (($entry = readdir($lookupDir)) !== false) {

            $fullFileName = $lookupFolder . '/' . $entry;

            if (is_file($fullFileName) && (strtoupper(substr($entry, -4)) == '.XML')) {

                $xFile = new XMLFile($fullFileName);

                if ($xFile->isValid()) {

                    if ($xFile->getRoottagName()  == 'Booklet') {

                        if ($xFile->getId() === $bookletId) {

                            return $xFile->getLabel();
                        }
                    }
                }
            }
        }

        throw new HttpError("No booklet with name `$bookletId` found", 404);
    }


    public function getLogins(): LoginArray {

        $testTakerDirPath = $this->workspacePath . '/Testtakers';
        if (!file_exists($testTakerDirPath)) {
            throw new Exception("Folder not found: $testTakerDirPath");
        }
        $testtakers = [];

        foreach (Folder::glob($testTakerDirPath, "*.[xX][mM][lL]") as $fullFilePath) {

            $testtakersFile = new XMLFileTesttakers($fullFilePath);
            if (!$testtakersFile->isValid()) { // TODO cross-file-validity?!

                continue;
            }

            array_push($testtakers, ...$testtakersFile->getAllLogins());
        }
        return new LoginArray(...$testtakers);
    }
}
