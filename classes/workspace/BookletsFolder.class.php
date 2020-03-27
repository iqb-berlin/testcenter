<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class BookletsFolder extends WorkspaceController {


    public function getBookletName(string $bookletId): string {

        $bookletName = '';

        $lookupFolder = $this->_workspacePath . '/Booklet';
        if (!file_exists($lookupFolder)) {
            throw new HttpError("Folder does not exist: `$lookupFolder`", 500);
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

                        $myBookletId = $xFile->getId();

                        if ($myBookletId === $bookletId) {

                            $bookletName = $xFile->getLabel();
                            break;
                        }
                    }
                }
            }
        }

        return $bookletName;
    }


    public function assemblePreparedBookletsFromFiles(): array {

        $testTakerDirPath = $this->_workspacePath . '/Testtakers';
        if (!file_exists($testTakerDirPath)) {
            throw new Exception("Folder not found: $testTakerDirPath");
        }
        $preparedBooklets = [];

        foreach (Folder::glob($testTakerDirPath, "*.[xX][mM][lL]") as $fullFilePath) {

            $testTakersFile = new XMLFileTesttakers($fullFilePath);
            if (!$testTakersFile->isValid()) {

                continue;
            }

            if ($testTakersFile->getRoottagName() != 'Testtakers') {

                continue;
            }

            foreach ($testTakersFile->getAllTesttakers() as $prepared) {

                $localGroupName = $prepared['groupname'];
                $localLoginData = $prepared;
                // ['groupname' => string, 'loginname' => string, 'code' => string, 'booklets' => string[]]
                if (!isset($preparedBooklets[$localGroupName])) {
                    $preparedBooklets[$localGroupName] = [];
                }
                array_push($preparedBooklets[$localGroupName], $localLoginData);
            }
        }
        return $this->_sortPreparedBooklets($preparedBooklets);
    }


    private function _sortPreparedBooklets(array $preparedBooklets): array {

        $preparedBookletsSorted = [];
        // error_log(print_r($preparedBooklets, true));
        // !! no cross checking, so it's not checked whether a prepared booklet is started or a started booklet has been prepared // TODO overthink this
        foreach($preparedBooklets as $group => $preparedData) {
            $alreadyCountedLogins = [];
            foreach($preparedData as $pd) {
                // ['groupname' => string, 'loginname' => string, 'code' => string, 'booklets' => string[]]
                if (!isset($preparedBookletsSorted[$group])) {
                    $preparedBookletsSorted[$group] = [
                        'groupname' => $group,
                        'loginsPrepared' => 0,
                        'personsPrepared' => 0,
                        'bookletsPrepared' => 0,
                        'bookletsStarted' => 0,
                        'bookletsLocked' => 0,
                        'laststart' => strtotime("1/1/2000"),
                        'laststartStr' => ''
                    ];
                }
                if (!in_array($pd['loginname'], $alreadyCountedLogins)) {
                    array_push($alreadyCountedLogins, $pd['loginname']);
                    $preparedBookletsSorted[$group]['loginsPrepared'] += 1;
                }
                $preparedBookletsSorted[$group]['personsPrepared'] += 1;
                $preparedBookletsSorted[$group]['bookletsPrepared'] += count($pd['booklets']);
            }
        }
        return $preparedBookletsSorted;
    }


    function getTestStatusOverview(array $bookletsStarted): array {

        $preparedBooklets = $this->assemblePreparedBookletsFromFiles();

        foreach($bookletsStarted as $startedBooklet) {
            // groupname, loginname, code, bookletname, locked
            if (!isset($preparedBooklets[$startedBooklet['groupname']])) {
                $preparedBooklets[$startedBooklet['groupname']] = [
                    'groupname' => $startedBooklet['groupname'],
                    'loginsPrepared' => 0,
                    'personsPrepared' => 0,
                    'bookletsPrepared' => 0,
                    'bookletsStarted' => 0,
                    'bookletsLocked' => 0,
                    'laststart' => strtotime("1/1/2000"),
                    'laststartStr' => ''
                ];
            }
            $preparedBooklets[$startedBooklet['groupname']]['bookletsStarted'] += 1;
            if ($startedBooklet['locked'] == '1') {
                $preparedBooklets[$startedBooklet['groupname']]['bookletsLocked'] += 1;
            }
            $tmpTime = strtotime($startedBooklet['laststart']);
            if ($tmpTime > $preparedBooklets[$startedBooklet['groupname']]['laststart']) {
                $preparedBooklets[$startedBooklet['groupname']]['laststart'] = $tmpTime;
                $preparedBooklets[$startedBooklet['groupname']]['laststartStr'] = strftime('%d.%m.%Y',$tmpTime);
            }
        }

        // get rid of the key
        $returner = [];
        foreach($preparedBooklets as $group => $groupData) {
            array_push($returner, $groupData);
        }

        return $returner;
    }


    public function findLoginData(string $name, string $password): ?array { // TODO unit-test // TODO is in wrong class

        foreach (Folder::glob($this->_getOrCreateSubFolderPath('Testtakers'), "*.[xX][mM][lL]") as $fullFilePath) {

            $xFile = new XMLFileTesttakers($fullFilePath);

            if ($xFile->isValid()) {
                if ($xFile->getRoottagName() == 'Testtakers') {
                    $loginData = $xFile->getLoginData($name, $password);
                    if (count($loginData['booklets']) > 0) {
                        $loginData['workspaceId'] = $this->_workspaceId;
                        $loginData['customTexts'] = $xFile->getCustomTexts();
                        return $loginData;
                    }
                }
            }
        }

        return null;
    }
}
