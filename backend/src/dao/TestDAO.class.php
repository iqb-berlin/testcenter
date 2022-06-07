<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class TestDAO extends DAO {


    public function getBookletName(int $testId): string { // TODO add unit test.

        $booklet = $this->_(
            'SELECT tests.name FROM tests
            WHERE tests.id=:bookletId',
            [':bookletId' => $testId]
        );

        if ($booklet === null) {
            throw new HttpError("No test with id `{$testId}` found in db.", 404);
        }

        return $booklet['name'];
    }


    // TODO unit test
    public function getOrCreateTest(int $personId, string $bookletName, string $bookletLabel): array {

        $test = $this->_(
            'SELECT tests.locked, tests.id, tests.laststate, tests.label FROM tests
            WHERE tests.person_id=:personId and tests.name=:bookletname',
            [
                ':personId' => $personId,
                ':bookletname' => $bookletName
            ]
        );

        if ($test !== null) {

            $test['_newlyCreated'] = false;
            return $test;
        }

        $this->_(
            'INSERT INTO tests (person_id, name, label) VALUES(:person_id, :name, :label)',
            [
                ':person_id' => $personId,
                ':name' => $bookletName,
                ':label' => $bookletLabel
            ]
        );

        return [
            'id' => $this->pdoDBhandle->lastInsertId(),
            'label' => $bookletLabel,
            'name' => $bookletName,
            'person_id' => $personId,
            'locked' => '0',
            'running' => '0',
            'lastState' => '',
            '_newlyCreated' => true
        ];
    }


    // TODO unit test
    public function isTestLocked(int $testId) {

        $test = $this->_(
            'SELECT tests.locked FROM tests
                WHERE tests.id=:bookletId',
            [
                ':bookletId' => $testId
            ]
        );

        if ($test == null) {
            return false;
        }

        return !$test or ($test['locked'] == '1');
    }


    // TODO unit test
    public function addTestReview(int $testId, int $priority, string $categories, string $entry): void {

        $this->_(
            'INSERT INTO test_reviews (booklet_id, reviewtime, priority, categories, entry) 
            VALUES(:b, :t, :p, :c, :e)',
            [
                ':b' => $testId,
                ':t' => TimeStamp::toSQLFormat(TimeStamp::now()),
                ':p' => $priority,
                ':c' => $categories,
                ':e' => $entry
            ]
        );
    }


    // TODO unit test
    public function addUnitReview(int $testId, string $unit, int $priority, string $categories, string $entry): void {

        $unitDbId = $this->getOrCreateUnitId($testId, $unit);
        $this->_(
            'INSERT INTO unit_reviews (unit_id, reviewtime, priority, categories, entry) 
            VALUES(:u, :t, :p, :c, :e)',
            [
                ':u' => $unitDbId,
                ':t' => TimeStamp::toSQLFormat(TimeStamp::now()),
                ':p' => $priority,
                ':c' => $categories,
                ':e' => $entry
            ]
        );
    }


    public function getTestState(int $testId): array {

        $test = $this->_(
            'SELECT tests.laststate FROM tests WHERE tests.id=:testId',
            [
                ':testId' => $testId
            ]
        );

        return ($test) ? JSON::decode($test['laststate'], true) : [];
    }


    public function getTestSession(int $testId): array {

        $testSession = $this->_(
            'SELECT
                    login_sessions.id as login_id,
                    logins.mode,
                    login_sessions.workspace_id,
                    logins.group_name as group_name,
                    login_sessions.token as login_token,
                    person_sessions.code,
                    person_sessions.token as person_token,
                    tests.person_id, 
                    tests.laststate as testState,
                    tests.id,
                    tests.locked,
                    tests.running,
                    tests.label
                FROM 
                    tests 
                    LEFT JOIN person_sessions on person_sessions.id = tests.person_id
                    LEFT JOIN login_sessions on person_sessions.login_sessions_id = login_sessions.id
                    LEFT JOIN logins on logins.name = login_sessions.name
                WHERE 
                    tests.id=:testId',
            [
                ':testId' => $testId
            ]
        );

        if ($testSession == null) {
            throw new HttpError("Test not found", 404);
        }

        $testSession['laststate'] = $this->getTestFullState($testSession);

        return $testSession;
    }


    // TODO use data-collection class for $statePatch (key-vale pairs)
    public function updateTestState(int $testId, array $statePatch): array {

        $testData = $this->_(
            'SELECT tests.laststate FROM tests WHERE tests.id=:testId',
            [
                ':testId' => $testId
            ]
        );

        if ($testData == null) {
            throw new HttpError("Test not found", 404);
        }

        $oldState = $testData['laststate'] ? JSON::decode($testData['laststate'], true) : [];
        $newState = array_merge($oldState, $statePatch);

        $this->_(
         'UPDATE tests SET laststate = :laststate, timestamp_server = :timestamp WHERE id = :id',
             [
                 ':laststate' => json_encode($newState),
                 ':id' => $testId,
                 ':timestamp' => TimeStamp::toSQLFormat(TimeStamp::now())
             ]
        );

         return $newState;
    }


    public function getUnitState(int $testId, string $unitName): array {

        $unitData = $this->_(
            'SELECT units.laststate FROM units
            WHERE units.name = :unitname and units.booklet_id = :testId',
            [
                ':unitname' => $unitName,
                ':testId' => $testId
            ]
        );

        return $unitData ? JSON::decode($unitData['laststate'], true) : [];
    }


    // TODO unit test
    public function updateUnitState(int $testId, string $unitName, array $statePatch): array {

        $unitDbId = $this->getOrCreateUnitId($testId, $unitName);

        $unitData = $this->_(
            'SELECT units.laststate FROM units WHERE units.id=:unitId',
            [
                ':unitId' => $unitDbId
            ]
        );

        $oldState = $unitData['laststate'] ? JSON::decode($unitData['laststate'], true) : [];
        $newState = array_merge($oldState, $statePatch);

        // todo save states in separate key-value table instead of JSON blob
        $this->_(
            'UPDATE units SET laststate = :laststate WHERE id = :id',
            [
                ':laststate' => json_encode($newState),
                ':id' => $unitDbId
            ]
        );

        return $newState;
    }


    // TODO unit test
    public function lockTest(int $testId): void {

        $this->_('UPDATE tests SET locked = :locked , timestamp_server = :timestamp WHERE id = :id',
            [
                ':locked' => '1',
                ':id' => $testId,
                ':timestamp' => TimeStamp::toSQLFormat(TimeStamp::now())
            ]
        );
    }


    // TODO unit test
    public function changeTestLockStatus(int $testId, bool $unlock = true): void {

        $this->_('UPDATE tests SET locked = :locked , timestamp_server = :timestamp WHERE id = :id',
            [
                ':locked' => $unlock ? '0' : '1',
                ':id' => $testId,
                ':timestamp' => TimeStamp::toSQLFormat(TimeStamp::now())
            ]
        );
    }


    // TODO unit test
    // todo reduce nr of queries by using replace...into syntax
    private function getOrCreateUnitId(int $testId, string $unitName): string {

        $unit = $this->_(
            'SELECT units.id FROM units
            WHERE units.name = :unitname and units.booklet_id = :testId',
            [
                ':unitname' => $unitName,
                ':testId' => $testId
            ]
        );

        if (!$unit) {

            $this->_(
                'INSERT INTO units (booklet_id, name) 
                VALUES(:testId, :name)',
                [
                    ':testId' => $testId,
                    ':name' => $unitName
                ]
            );
            return $this->pdoDBhandle->lastInsertId();

        }

        return (string) $unit['id'];
    }


    public function getDataParts(int $testId, string $unitName): array {

        $result = $this->_(
            'SELECT
                    unit_data.part_id,
                    unit_data.content,
                    unit_data.response_type
                FROM
                    unit_data
                    left join units on units.id = unit_data.unit_id
                WHERE
                    units.name = :unitname
                    and units.booklet_id = :testId
                ',
            [
                ':unitname' => $unitName,
                ':testId' => $testId
            ], true
        );

        $unitData = [];
        foreach ($result as $row) {
            $unitData[$row['part_id']] = $row['content'];
        }

        return [
            "dataParts" => $unitData,
            "dataType" => $row['response_type'] ?? ''
        ];
    }


    public function updateDataParts(int $testId, string $unitName, array $dataParts, string $type, int $timestamp) : void {

        $unitDbId = $this->getOrCreateUnitId($testId, $unitName);
        foreach ($dataParts as $partId => $content) {
            $this->_('replace into unit_data(unit_id, part_id, content, ts, response_type)
                          values (:unit_id, :part_id, :content, :ts, :response_type)',
                [
                    ':part_id' => $partId,
                    ':content' => $content,
                    ':ts' => $timestamp,
                    ':response_type' => $type,
                    ':unit_id' => $unitDbId
                ]
            );
        }
    }


    // TODO unit test
    public function addUnitLog(int $testId, string $unitName, string $logKey, int $timestamp, string $logContent = ""): void {

        $unitId = $this->getOrCreateUnitId($testId, $unitName);

        $this->_(
            'INSERT INTO unit_logs (unit_id, logentry, timestamp) 
            VALUES(
                :unitId,
                :logentry, 
                :ts
            )',
            [
                ':unitId' => $unitId,
                ':logentry' => $logKey . ($logContent ? ' = ' . $logContent : ''),
                ':ts' => $timestamp
            ]
        );
    }


    // TODO unit test
    public function addTestLog(int $testId, string $logKey, int $timestamp, string $logContent = ""): void {

        $this->_('INSERT INTO test_logs (booklet_id, logentry, timestamp) VALUES (:bookletId, :logentry, :timestamp)',
            [
                ':bookletId' => $testId,
                ':logentry' => $logKey . ($logContent ? ' : ' . $logContent : ''), // TODO add value-column to log-tables instead of this shit
                ':timestamp' => $timestamp
            ]
        );
    }

    // TODO unit test
    public function setTestRunning(int $testId) {

        $this->_('UPDATE tests SET running = :running , timestamp_server = :timestamp WHERE id = :id',
            [
                ':running' => '1',
                ':id' => $testId,
                ':timestamp' => TimeStamp::toSQLFormat(TimeStamp::now())
            ]
        );
    }


    public function getCommands(int $testId, ?int $lastCommandId = null): array {

        $sql = "select * from test_commands where test_id = :test_id and executed = 0 order by timestamp";
        $replacements = [':test_id' => $testId];
        if ($lastCommandId) {
            $replacements[':last_id'] = $lastCommandId;
            $sql = str_replace('where', 'where timestamp > (select timestamp from test_commands where id = :last_id) and ', $sql);
        }

        $commands = [];
        foreach ($this->_($sql, $replacements, true) as $line) {
            $commands[] = new Command(
                (int) $line['id'],
                $line['keyword'],
                (int) $line['timestamp'],
                ...JSON::decode($line['parameter'], true)
            );
        }
        return $commands;
    }


    public function setCommandExecuted(int $testId, int $commandId): bool {

        $command = $this->_(
            'select executed from test_commands where test_id = :testId and id = :commandId',
            [':testId' => $testId, ':commandId' => $commandId]
        );

        if (!$command) {

            throw new HttpError("Command `$commandId` not found on test `$testId`", 404);
        }

        if ($command['executed']) {

            return false;
        }

        $this->_(
            'update test_commands set executed = 1 where test_id = :testId and id = :commandId',
            [':testId' => $testId, ':commandId' => $commandId]
        );

        return true;
    }
}
