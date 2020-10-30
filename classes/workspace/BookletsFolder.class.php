<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class BookletsFolder extends Workspace {


    public function getBookletLabel(string $bookletId): string {

        $lookupFolder = $this->_workspacePath . '/Booklet';
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




    public function getLogins(): array {

        $testTakerDirPath = $this->_workspacePath . '/Testtakers';
        if (!file_exists($testTakerDirPath)) {
            throw new Exception("Folder not found: $testTakerDirPath");
        }
        $testtakers = [];

        foreach (Folder::glob($testTakerDirPath, "*.[xX][mM][lL]") as $fullFilePath) {

            $testtakersFile = new XMLFileTesttakers($fullFilePath);
            if (!$testtakersFile->isValid()) { // TODO cross-file-validity?!

                continue;
            }

            array_push($testtakers, ...$testtakersFile->getAllTesttakers());
        }
        return $testtakers;
    }


    function getTestStatusOverviewNEW(array $bookletsStarted): array {

        $logins = $this->getLogins();

        $allGroupStatistics = [];
        $codes = [];

        foreach ($logins as $login) {

            /* @var PotentialLogin $login */
            $groupName = $login->getGroupName();

            if (!isset($allGroupStatistics[$groupName])) {
                $allGroupStatistics[$groupName] = [
                    'groupname' => $groupName,
                    'loginsPrepared' => 0,
                    'personsPrepared' => 0,
                    'bookletsPrepared' => 0,
                    'bookletsStarted' => 0,
                    'bookletsLocked' => 0,
                    'laststart' => strtotime("1/1/2000"),
                    'laststartStr' => ''
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


    function getTestStatusOverview(array $bookletsStarted): array {

        $allGroupStatistics = $this->getTestStatusOverviewNEW($bookletsStarted);

        foreach($bookletsStarted as $startedBooklet) {

            if (!isset($allGroupStatistics[$startedBooklet['groupname']])) {
                continue;
            }

            $allGroupStatistics[$startedBooklet['groupname']]['bookletsStarted'] += 1;

            if ($startedBooklet['locked'] == '1') {
                $allGroupStatistics[$startedBooklet['groupname']]['bookletsLocked'] += 1;
            }

            $tmpTime = strtotime($startedBooklet['laststart'] ?? "1/1/2000");
            if ($tmpTime > $allGroupStatistics[$startedBooklet['groupname']]['laststart']) {
                $allGroupStatistics[$startedBooklet['groupname']]['laststart'] = $tmpTime;
                $allGroupStatistics[$startedBooklet['groupname']]['laststartStr'] = strftime('%d.%m.%Y', $tmpTime);
            }
        }

        return array_values($allGroupStatistics);
    }
}
