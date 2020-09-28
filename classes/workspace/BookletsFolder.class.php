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


    public function getTesttakersSortedByGroups(): array {

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

            foreach ($testTakersFile->getAllTesttakers() as $testtaker) {

                /* @var PotentialLogin $testtaker */

                if (isset($preparedBooklets[$testtaker->getGroupName()])) {

                    $preparedBooklets[$testtaker->getGroupName()] = [];
                }

                $preparedBooklets[$testtaker->getGroupName()][] = $testtaker;
            }
        }

        return $preparedBooklets;
    }


    function getTestStatusOverview(array $bookletsStarted): array {

        $allGroupStatistics = [];

        foreach ($this->getTesttakersSortedByGroups() as $groupName => $groupOfTesttakers) {

            $groupStats = array_reduce($groupOfTesttakers, function(array $carry, PotentialLogin $testtaker) {
                return [
                    'logins' => $carry['logins'] + 1,
                    'persons' => $carry['persons'] + count($testtaker->getBooklets()),
                    'booklets' => $carry['booklets']
                        + array_reduce($testtaker->getBooklets(), function(int $carry, array $booklets) {
                            return $carry + count($booklets);
                        }, 0)
                ];
            }, [
                'logins' => 0,
                'persons' => 0,
                'booklets' => 0
            ]);

            $allGroupStatistics[$groupName] = [
                'groupname' => $groupName,
                'loginsPrepared' => $groupStats['logins'],
                'personsPrepared' => $groupStats['persons'],
                'bookletsPrepared' => $groupStats['booklets'],
                'bookletsStarted' => 0,
                'bookletsLocked' => 0,
                'laststart' => strtotime("1/1/2000"),
                'laststartStr' => ''
            ];
        }

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
                $allGroupStatistics[$startedBooklet['groupname']]['laststartStr'] = strftime('%d.%m.%Y',$tmpTime);
            }
        }

        return array_values($allGroupStatistics);
    }
}
