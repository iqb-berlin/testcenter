<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class TesttakersFolder extends WorkspaceController {

    public function findLoginData(string $name, string $password): ?LoginData { // TODO unit-test

        foreach (Folder::glob($this->_getOrCreateSubFolderPath('Testtakers'), "*.[xX][mM][lL]") as $fullFilePath) {

            $xFile = new XMLFileTesttakers($fullFilePath);

            if ($xFile->isValid()) {
                if ($xFile->getRoottagName() == 'Testtakers') {
                    $loginData = $xFile->getLoginData($name, $password);
                    if (count($loginData['booklets']) > 0) {
                        $loginData['workspaceId'] = $this->_workspaceId;
                        $loginData['customTexts'] = $xFile->getCustomTexts();
                        return new LoginData($loginData);
                    }
                }
            }
        }

        return null;
    }
}
