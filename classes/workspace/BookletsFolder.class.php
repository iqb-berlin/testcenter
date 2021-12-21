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


    function getTestStatusOverview(array $testStatusFromDB): array {

        $testStatus = $this->getTestStatus();

        foreach ($testStatus as $groupName => $status) {

            if (isset($testStatusFromDB[$groupName])) {
                $testStatus[$groupName] = array_merge($testStatus[$groupName], $testStatusFromDB[$groupName]);
            } else {
                $testStatus[$groupName]['bookletsStarted'] = 0;
                $testStatus[$groupName]['bookletsLocked'] = 0;
                $testStatus[$groupName]['laststart'] = strtotime("1/1/2000");
                $testStatus[$groupName]['laststartStr'] = '';
            }
        }

        foreach ($testStatusFromDB as $groupName => $status) {

            if (!isset($testStatus[$groupName])) {
                $testStatus[$groupName] = $status;
                $testStatus[$groupName]['groupname'] = $groupName;
                $testStatus[$groupName]['orphaned'] = true; // group is in Db, but file is vanished
            }
        }

        return array_values($testStatus);
    }

    private function getTestStatus(): array {

        $logins = $this->getLogins();

        $allGroupStatistics = [];
        $codes = [];

        foreach ($logins as $login) {

            /* @var Login $login */
            $groupName = $login->getGroupName();

            if (!isset($allGroupStatistics[$groupName])) {
                $allGroupStatistics[$groupName] = [
                    'groupname' => $groupName,
                    'loginsPrepared' => 0,
                    'personsPrepared' => 0,
                    'bookletsPrepared' => 0,
                ];
            }

            if (!isset($codes[$login->getName()])) {
                $codes[$login->getName()] = [];
            }

            $codesInLogin = array_keys($login->getBooklets());
            if ($codesInLogin != [""]) {
                array_push($codes[$login->getName()], ...$codesInLogin);
            }

            $allGroupStatistics[$groupName]['loginsPrepared'] += 1;
            $allGroupStatistics[$groupName]['personsPrepared'] += max(1, count(array_unique($codes[$login->getName()])));
            $allGroupStatistics[$groupName]['bookletsPrepared'] += array_reduce($login->getBooklets(),
                function($carry, $bookletList) {
                    return $carry + count($bookletList);
                },
                0
            );
        }

        return $allGroupStatistics;
    }
}
