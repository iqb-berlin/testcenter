<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class TesttakersFolder extends WorkspaceController {


    static function searchAllForLogin(string $name, string $password = ''): ?PotentialLogin {

        $loginData = null;

        foreach (TesttakersFolder::getAll() as $testtakersFolder) { /* @var TesttakersFolder $testtakersFolder */

            $loginData = $testtakersFolder->findLoginData($name, $password);

            if ($loginData != null) {
                break;
            }
        }

        return $loginData;
    }


    public function findLoginData(string $name, string $password): ?PotentialLogin { // TODO unit-test

        foreach (Folder::glob($this->getOrCreateSubFolderPath('Testtakers'), "*.[xX][mM][lL]") as $fullFilePath) {

            $xFile = new XMLFileTesttakers($fullFilePath);

            if ($xFile->isValid()) {
                if ($xFile->getRoottagName() == 'Testtakers') {
                    $potentialLogin = $xFile->getLogin($name, $password, $this->_workspaceId);
                    if ($potentialLogin and (count($potentialLogin->getBooklets()) > 0)) {
                        return $potentialLogin;
                    }
                }
            }
        }

        return null;
    }


    public function findGroup(string $groupName): ?array { // TODO unit-test

        foreach (Folder::glob($this->getOrCreateSubFolderPath('Testtakers'), "*.[xX][mM][lL]") as $fullFilePath) {

            $xFile = new XMLFileTesttakers($fullFilePath);

            $groups = $xFile->getGroups();

            if (isset($groups[$groupName])) {
                return $groups[$groupName];
            }
        }

        return null;
    }
}
