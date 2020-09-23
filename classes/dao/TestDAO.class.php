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
            'lastState' => ''
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
                ':t' => date('Y-m-d H:i:s', time()),
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
                ':t' => date('Y-m-d H:i:s', time()),
                ':p' => $priority,
                ':c' => $categories,
                ':e' => $entry
            ]
        );
    }


    public function getTestState(int $testId): array {

        $booklet = $this->_(
            'SELECT tests.laststate FROM tests WHERE tests.id=:testId',
            [
                ':testId' => $testId
            ]
        );

        return ($booklet) ? JSON::decode($booklet['laststate'], true) : [];
    }


    // TODO use data-collection class for $statePatch (key-vale pairs)
    public function updateTestState(int $testId, array $statePatch): array {

        $testData = $this->_(
            'SELECT tests.laststate FROM tests WHERE tests.id=:testId',
            [
                ':testId' => $testId
            ]
        );

        $oldState = $testData['laststate'] ? JSON::decode($testData['laststate'], true) : [];
        $newState = array_merge($oldState, $statePatch);

         $this->_(
             'UPDATE tests SET laststate = :laststate WHERE id = :id',
             [
                 ':laststate' => json_encode($newState),
                 ':id' => $testId
             ]
         );

         return $newState;
    }


    // TODO unit test
    public function getUnitState(int $testId, string $unitName): array {

        $unitData = $this->_(
            'SELECT units.laststate FROM units
            WHERE units.name = :unitname and units.booklet_id = :testId',
            [
                ':unitname' => $unitName,
                ':testId' => $testId
            ]
        );
        if ($unitData == null) {
            return [];
        }
        return JSON::decode($unitData['laststate'], true);
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
    public function lockBooklet(int $testId): void {

        $this->_('UPDATE tests SET locked = :locked WHERE id = :id',
            [
                ':locked' => '1',
                ':id' => $testId
            ]
        );
    }


    // TODO unit test
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


    // TODO unit test
    public function getRestorePoint(int $testId, string $unitName): string {

        $unitData = $this->_(
            'SELECT units.restorepoint FROM units
            WHERE units.name = :unitname and units.booklet_id = :testId',
            [
                ':unitname' => $unitName,
                ':testId' => $testId
            ]
        );
        return (!$unitData or !$unitData['restorepoint']) ? '' : $unitData['restorepoint'];
    }


    // TODO unit test
    public function updateRestorePoint(int $testId, string $unitName, string $restorePoint, int $timestamp): void {

        $unitDbId = $this->getOrCreateUnitId($testId, $unitName);
        $this->_(
            'UPDATE units SET restorepoint=:rp, restorepoint_ts=:rp_ts
             WHERE id = :unitId and restorepoint_ts < :ts',
            [
                ':ts' => $timestamp,
                ':rp' => $restorePoint,
                ':rp_ts' => $timestamp,
                ':unitId' => $unitDbId
            ]
        );
    }


    // TODO unit test
    public function addResponse(int $testId, string $unitName, string $responses, string $type, float $timestamp) : void {

        $unitDbId = $this->getOrCreateUnitId($testId, $unitName);
        $this->_('UPDATE units SET responses=:r, responses_ts=:r_ts, responsetype=:rt
                WHERE id = :unitId and responses_ts < :ts',
            [
                ':ts' => $timestamp,
                ':r' => $responses,
                ':r_ts' => $timestamp,
                ':rt' => $type,
                ':unitId' => $unitDbId
            ]
        );
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

        $this->_('UPDATE tests SET running = :running WHERE id = :id',
            [
                ':running' => '1',
                ':id' => $testId
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
                TimeStamp::fromSQLFormat($line['timestamp']),
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
