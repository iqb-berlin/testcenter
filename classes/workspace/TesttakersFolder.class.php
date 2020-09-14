<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class TesttakersFolder extends Workspace {


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

                $potentialLogin = $xFile->getLogin($name, $password, $this->_workspaceId);

                if ($potentialLogin) {

                    return $potentialLogin;
                }
            }
        }

        return null;
    }


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


    public function getMembersOfLogin(string $name, string $password): PotentialLoginArray { // TODO unit-test

        foreach (Folder::glob($this->getOrCreateSubFolderPath('Testtakers'), "*.[xX][mM][lL]") as $fullFilePath) {

            $xFile = new XMLFileTesttakers($fullFilePath);

            $members = $xFile->getMembersOfLogin($name, $password, $this->_workspaceId);

            if ($members) {
                return $members;
            }
        }
        return new PotentialLoginArray();
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
}
