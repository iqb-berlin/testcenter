<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit tests

class InitDAO extends SessionDAO {


    static function createWithRetries(int $retries = 5): InitDAO {

        while ($retries--) {

            try {

                return new InitDAO();

            } catch (Throwable $t) {

                echo "\nDatabase connection failed... retry! ($retries attempts left)";
                usleep(20 * 1000000); // give database container time to come up
            }
        }

        throw new Exception("Database connection failed.");
    }


    public function createSampleLoginsReviewsLogs(string $loginCode): void {

        $timestamp = TimeStamp::now();

        $sessionDAO = new SessionDAO();
        $testDAO = new TestDAO();

        $testSession = new PotentialLogin(
            'sample_user',
            'run-hot-return',
            'sample_group',
            [$loginCode => ['BOOKLET.SAMPLE']],
            1,
            TimeStamp::fromXMLFormat('1/1/2030 12:00'),
            0,
            0,
            (object) ['somStr' => 'someLabel']
        );
        $login = $sessionDAO->getOrCreateLogin($testSession);
        $login->_validTo = TimeStamp::fromXMLFormat('1/1/2030 12:00');
        $person = $sessionDAO->getOrCreatePerson($login, $loginCode);
        $test = $testDAO->getOrCreateTest($person->getId(), 'BOOKLET.SAMPLE', "sample_booklet_label");
        $testDAO->addTestReview((int) $test['id'], 1, "", "sample booklet review");
        $testDAO->addUnitReview((int) $test['id'], "UNIT.SAMPLE", 1, "", "this is a sample unit review");
        $testDAO->addUnitLog((int) $test['id'], 'UNIT.SAMPLE', "sample unit log", $timestamp);
        $testDAO->addBookletLog((int) $test['id'], "sample log entry", $timestamp);
        $testDAO->addResponse((int) $test['id'], 'UNIT.SAMPLE', "{\"name\":\"Sam Sample\",\"age\":34}", "", $timestamp);
        $testDAO->updateUnitLastState((int) $test['id'], "UNIT.SAMPLE", ["PRESENTATIONCOMPLETE" => "yes"]);
        $testDAO->updateTestLastState((int) $test['id'], 'LASTUNIT', '1');
    }

    /**
     * @param string $loginCode
     * @throws HttpError
     */
    public function createSampleExpiredSessions(string $loginCode): void {

        $superAdminDAO = new SuperAdminDAO();
        $adminDAO = new AdminDAO();

        $testSession = new PotentialLogin(
            'expired_user',
            'run-hot-return',
            'expired_group',
             [$loginCode => ['BOOKLET.SAMPLE']],
            1,
            TimeStamp::fromXMLFormat('1/1/2000 12:00')
        );

        $login = $this->createLogin($testSession, true);
        $this->createPerson($login, $loginCode, true);

        $superAdminDAO->createUser("expired_user", "whatever", true);
        $adminDAO->createAdminToken("expired_user", "whatever", TimeStamp::fromXMLFormat('1/1/2000 12:00'));
    }


    public function createSampleMonitorSessions(): void {

        $testSessionWorkspaceMonitor = new PotentialLogin(
            'test-study-monitor',
            'monitor-study',
            'sample_group',
            [],
            1,
            TimeStamp::fromXMLFormat('1/1/2030 12:00')
        );
        $login = $this->createLogin($testSessionWorkspaceMonitor);
        $this->createPerson($login, '');

        $testSessionGroupMonitor = new PotentialLogin(
            'test-group-monitor',
            'monitor-group',
            'sample_group',
            [],
            1,
            TimeStamp::fromXMLFormat('1/1/2030 12:00')
        );
        $login = $this->createLogin($testSessionGroupMonitor);
        $this->createPerson($login, '');

        $testSession = new PotentialLogin(
            'expired-group-monitor',
            'monitor-group',
            'expired_group',
            ['' => ['']],
            1,
            TimeStamp::fromXMLFormat('1/1/2000 12:00')
        );
        $login = $this->createLogin($testSession, true);
        $this->createPerson($login, '', true);

        $testSession = new PotentialLogin(
            'expired-study-monitor',
            'monitor-study',
            'expired_group',
            ['' => ['']],
            1,
            TimeStamp::fromXMLFormat('1/1/2000 12:00')
        );
        $login = $this->createLogin($testSession, true);
        $this->createPerson($login, '', true);
    }


    /**
     * @param string $username
     * @param string $password
     * @param string $workspaceName
     * @return array
     * @throws HttpError
     */
    public function createWorkspaceAndAdmin(string $username, string $password, string $workspaceName): array {

        $superAdminDAO = new SuperAdminDAO();
        $adminDAO = new AdminDAO();
        $admin = $superAdminDAO->createUser($username, $password, true);
        $adminDAO->createAdminToken($username, $password);
        $workspace = $superAdminDAO->createWorkspace($workspaceName);

        $superAdminDAO->setWorkspaceRightsByUser(
            (int) $admin['id'],
            [
                (object) [
                    "id" => (int) $workspace['id'],
                    "role" => "RW"
                ]
            ]
        );

        return [
            "workspaceId" => (int) $workspace['id'],
            "userId" => (int) $admin['id'],
        ];
    }


    public function clearDb(): string {

        $report = "";

        if ($this->getDBType() == 'mysql') {
            $this->_('SET FOREIGN_KEY_CHECKS = 0');
        }

        foreach ($this::tables as $table) {

            $report .= "\n## DROP TABLE `$table`";
            $this->_("Drop table if exists $table cascade ");
        }

        if ($this->getDBType() == 'mysql') {
            $this->_('SET FOREIGN_KEY_CHECKS = 1');
        }

        return $report;
    }


    // TODO unit-test
    public function getDbStatus(): array {

        $tableStatus = [
            'used' => [],
            'missing' => [],
            'empty' => []
        ];

        foreach ($this::tables as $table) {

            try {

                $entries = $this->_("SELECT * FROM $table limit 10", [], true);
                $tableStatus[count($entries) ? 'used' : 'empty'][] = $table;

            } catch (Exception $exception) {

                $tableStatus['missing'][] = $table;
            }
        }

        return [
            'message' =>
                "Missing Tables: " . implode(', ', $tableStatus['missing']) . '. ' .
                "Used Tables: " . implode(', ', $tableStatus['used']) . '.',
            'used' => count($tableStatus['used']),
            'missing' => count($tableStatus['missing'])
        ];
    }
}
