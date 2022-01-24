<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class TesttakersFolder extends Workspace {

    public function findGroup(string $groupName): ?Group {

        foreach (Folder::glob($this->getOrCreateSubFolderPath('Testtakers'), "*.[xX][mM][lL]") as $fullFilePath) {

            $xFile = new XMLFileTesttakers($fullFilePath);

            $groups = $xFile->getGroups();

            if (isset($groups[$groupName])) {
                return $groups[$groupName];
            }
        }

        return null;
    }


    function getAllGroups(): array {

        $groups = [];

        foreach (Folder::glob($this->getOrCreateSubFolderPath('Testtakers'), "*.[xX][mM][lL]") as $fullFilePath) {

            $xFile = new XMLFileTesttakers($fullFilePath);

            if ($xFile->isValid()) {

                $groups[$fullFilePath] = $xFile->getGroups();
            }

        }

        return $groups;
    }


    // TODO unit-test
    function getAllLoginNames(): array {

        $logins = [];

        foreach (Folder::glob($this->getOrCreateSubFolderPath('Testtakers'), "*.[xX][mM][lL]") as $fullFilePath) {

            $xFile = new XMLFileTesttakers($fullFilePath);

            if ($xFile->isValid()) {

                $logins[$fullFilePath] = $xFile->getAllLoginNames();
            }

        }

        return $logins;
    }
}
