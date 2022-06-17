<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit tests

class InitDAO extends SessionDAO {

    const legacyTableNames = [
        'admintokens',
        'persons',
        'logins',
        'bookletlogs',
        'bookletreviews',
        'booklets',
        'unitlogs',
        'unitreviews'
    ];


    public function createSampleLoginsReviewsLogs(): void {

        $timestamp = TimeStamp::now();

        $sessionDAO = new SessionDAO();
        $testDAO = new TestDAO();

        $testLogin = new Login(
            'test',
            Password::encrypt('user123', $this->passwordSalt),
            'run-hot-return',
            'sample_group',
            'sample_group',
            ['xxx' => ['BOOKLET.SAMPLE-1']],
            1,
            TimeStamp::fromXMLFormat('1/1/2030 12:00'),
            0,
            0,
            (object) ['somStr' => 'someLabel']
        );
        $loginSession = $sessionDAO->createLoginSession($testLogin, true);

        $personSession = $sessionDAO->getOrCreatePersonSession($loginSession, 'xxx');
        $test = $testDAO->getOrCreateTest($personSession->getPerson()->getId(), 'BOOKLET.SAMPLE-1', "sample_booklet_label");
        $testDAO->addTestReview((int) $test['id'], 1, "", "sample booklet review");
        $testDAO->addUnitReview((int) $test['id'], "UNIT.SAMPLE", 1, "", "this is a sample unit review");
        $testDAO->addUnitLog((int) $test['id'], 'UNIT.SAMPLE', "sample unit log", $timestamp);
        $testDAO->addTestLog((int) $test['id'], "sample log entry", $timestamp);
        $testDAO->updateDataParts((int) $test['id'], 'UNIT.SAMPLE', ["all" => "{\"name\":\"Sam Sample\",\"age\":34}"], "example-data-format", $timestamp);
        $testDAO->updateUnitState((int) $test['id'], "UNIT.SAMPLE", ["PRESENTATIONCOMPLETE" => "yes"]);
        $testDAO->updateTestState((int) $test['id'], ["CURRENT_UNIT_ID" => "UNIT.SAMPLE"]);
        $test2 = $testDAO->getOrCreateTest($personSession->getPerson()->getId(), 'BOOKLET.SAMPLE-2', "a locked test");
        $testDAO->lockTest((int) $test2['id']);
    }


    public function createSampleExpiredSessions(): void {

        $superAdminDAO = new SuperAdminDAO();
        $adminDAO = new AdminDAO();

        $login = new Login(
            'test-expired',
            '',
            'run-hot-return',
            'expired_group',
            'expired_group',
             ['xxx' => ['BOOKLET.SAMPLE-1']],
            1,
            TimeStamp::fromXMLFormat('1/1/2000 12:00')
        );
        $login = $this->createLoginSession($login, true);
        $this->createPersonSession($login, 'xxx', 0,true);

        $superAdminDAO->createUser("expired_user", "whatever", true);
        $adminDAO->createAdminToken("expired_user", "whatever", TimeStamp::fromXMLFormat('1/1/2000 12:00'));
    }


    public function createSampleMonitorSessions(): array {

        $personsSessions = [];

        $login = new Login(
            'test-group-monitor',
            'user123',
            'monitor-group',
            'sample_group',
            'sample_group',
            [],
            1,
            TimeStamp::fromXMLFormat('1/1/2030 12:00')
        );
        $loginSession = $this->createLoginSession($login);
        $personsSessions['test-group-monitor'] = $this->createPersonSession($loginSession, '', 0);

        $login = new Login(
            'expired-group-monitor',
            'user123',
            'monitor-group',
            'expired_group',
            'expired_group',
            ['' => ['']],
            1,
            TimeStamp::fromXMLFormat('1/1/2000 12:00')
        );
        $loginSession = $this->createLoginSession($login, true);
        $personsSessions['expired-group-monitor'] = $this->createPersonSession($loginSession, '', 0,true);

        return $personsSessions;
    }


    public function createAdmin(string $username, string $password): int {

        $superAdminDAO = new SuperAdminDAO();
        $admin = $superAdminDAO->createUser($username, $password, true);
        $adminDAO = new AdminDAO();
        $adminDAO->createAdminToken($username, $password); // TODO why?
        return (int) $admin['id'];
    }


    public function createWorkspace(string $workspaceName): int {

        $superAdminDAO = new SuperAdminDAO();
        $workspace = $superAdminDAO->createWorkspace($workspaceName);
        return (int) $workspace['id'];
    }


    public function addWorkspaceToAdmin(int $adminId, int $workspaceId): void {

        $superAdminDAO = new SuperAdminDAO();
        $superAdminDAO->setWorkspaceRightsByUser(
            $adminId,
            [
                (object) [
                    "id" => $workspaceId,
                    "role" => "RW"
                ]
            ]
        );
    }


    public function clearDb(): array {

        $droppedTables = [];

        if ($this->getDBType() == 'mysql') {
            $this->_('SET FOREIGN_KEY_CHECKS = 0');
        }

       foreach (array_merge($this::legacyTableNames, $this::tables) as $table) {

            if ($this->getTableStatus($table) !== 'missing') {
                $droppedTables[] = $table;
                $this->_("drop table $table");
            }
        }

        if ($this->getDBType() == 'mysql') {
            $this->_('SET FOREIGN_KEY_CHECKS = 1');
        }

        return $droppedTables;
    }


    // TODO unit-test
    public function getDbStatus(): array {

        $tableStatus = [
            'used' => [],
            'missing' => [],
            'empty' => []
        ];

        foreach ($this::tables as $table) {

            $tableStatus[$this->getTableStatus($table)][] = $table;
        }

        $used = count($tableStatus['used']);
        $missing = count($tableStatus['missing']);
        $tables = $missing
            ? ($missing == count($this::tables) ? 'empty' : 'incomplete')
            : 'complete';

        return [
            'message' => $tables
                . ". \nMissing Tables: "
                . ($missing ? implode(', ', $tableStatus['missing']) : 'none')
                . ". \nUsed Tables: "
                . ($used ? implode(', ', $tableStatus['used']) : 'none')
                . '.',
            'used' => !!$used,
            'tables' => $tables
        ];
    }


    protected function getTableStatus(string $table): string {

        try {

            $entries = $this->_("SELECT * FROM $table limit 10", [], true);
            return count($entries) ? 'used' : 'empty';

        } catch (Exception $exception) {

            return 'missing';
        }
    }


    public function createSampleCommands(int $commanderId): void {

        $adminDAO = new AdminDAO();
        $adminDAO->storeCommand($commanderId, 1, new Command(-1,  'COMMAND', 1597906980, 'p4'));
        $adminDAO->storeCommand($commanderId, 1, new Command(-1, 'COMMAND', 1597906970, 'p3'));
        $adminDAO->storeCommand($commanderId, 1, new Command(-1, 'COMMAND', 1597906960, 'p1', 'p2'));
    }


    public function adminExists(): bool {

        $admins = $this->_("select count(*) as count from users where is_superadmin = 1");
        return (int) $admins['count'] > 0;
    }


    public function createWorkspaceIfMissing(Workspace $workspace): array {

        $workspaceFromDb = $this->_(
            "SELECT workspaces.id, workspaces.name FROM workspaces WHERE `id` = :ws_id",
            [':ws_id' => $workspace->getId()]
        );

        if ($workspaceFromDb) {

            return $workspaceFromDb;
        }

        $name = "ws {$workspace->getId()} [restored " . TimeStamp::toSQLFormat(TimeStamp::now()) . "]";

        $this->_(
            'INSERT INTO workspaces (name, id) VALUES (:ws_name, :ws_id)',
            [':ws_name' => $name, ':ws_id' => $workspace->getId()]
        );

        return [
            "name" => $name,
            "restored" => true,
            "id" => $workspace->getId()
        ];
    }


    public function installPatches(string $patchesDir, bool $allowFailing): array {

        $report = [
            'patches' => [],
            'errors' => []
        ];

        $patches = array_map(
            function($file) { return basename($file, '.sql');},
            Folder::glob($patchesDir, '*.sql')
        );
        usort($patches, [Version::class, 'compare']);

        foreach ($patches as $patch) {

            $isFutureVersion = Version::compare($patch) > 0;
            $shouldBeInstalled = Version::compare($patch, $this->getDBSchemaVersion()) <= 0;
            // echo "\n ~ $patch ~ " . ($isFutureVersion?'y':'n') . ' ~ ' . ($shouldBeInstalled?'y':'n');

            if ($isFutureVersion or $shouldBeInstalled) {
                continue;
            }

            try {

                $report['patches'][] = $patch;
                $this->runFile("$patchesDir/$patch.sql");
                $this->setDBSchemaVersion($patch);

            } catch (PDOException $exception) {

                $report['errors'][$patch] = $exception->getMessage();

                if (!$allowFailing) {

                    return $report;
                }
            }
        }

        return $report;
    }


    public function setDBSchemaVersion(string $newVersion) {

        $currentDBSchemaVersion = $this->getDBSchemaVersion();

        if ($currentDBSchemaVersion == '0.0.0-no-table') {

            return;
        }

        if ($currentDBSchemaVersion == '0.0.0-no-entry') {

            $this->_(
                "INSERT INTO meta (metaKey, value) VALUES ('dbSchemaVersion', :new_version)",
                [':new_version' => $newVersion]
            );
        } else {

            $this->_(
                "update meta set value = :new_version where metaKey = 'dbSchemaVersion'",
                [':new_version' => $newVersion]
            );
        }
    }


    public function getDBContentDump(bool $includeLegacyTables = false): array {

        $tables = $includeLegacyTables ? array_merge($this::legacyTableNames, $this::tables) : $this::tables;

        $report = [];

        foreach ($tables as $table) {

            try {

                $entries = $this->_("SELECT * FROM $table", [], true);
                $report[$table] = CSV::build($entries);

            } catch (Exception $exception) {

                $report[$table] = 'not found';
            }
        }

        return $report;
    }


    public function createSampleMetaData(): void {

        $this->setMeta('appConfig', 'aKey', 'newValue');
    }
}
