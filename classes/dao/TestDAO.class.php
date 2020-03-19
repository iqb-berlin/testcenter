<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class TestDAO extends DAO {


    public function getBookletName(int $testId): string { // TODO add unit test.

        $booklet = $this->_(
            'SELECT booklets.name FROM booklets
            WHERE booklets.id=:bookletId',
            [':bookletId' => $testId]
        );

        if ($booklet === null) {
            throw new HttpError("No test with id `{$testId}` found in db.", 404);
        }

        return $booklet['name'];
    }


    // TODO unit test
    public function getOrCreateTest(string $personId, string $bookletName, string $bookletLabel) {

        $test = $this->_(
            'SELECT booklets.locked, booklets.id, booklets.laststate, booklets.label FROM booklets
            WHERE booklets.person_id=:personId and booklets.name=:bookletname',
            [
                ':personId' => $personId,
                ':bookletname' => $bookletName
            ]
        );

        if ($test !== null) {

            if ($test['locked'] != '1') {

                $this->_( // TODO is this necessary?
                    'UPDATE booklets SET label = :label WHERE id = :id',
                    [
                        ':label' => $bookletLabel,
                        ':id' => $test['id']
                    ]
                );

            }

            return $test;

        }

        $this->_(
            'INSERT INTO booklets (person_id, name, label) VALUES(:person_id, :name, :label)',
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
            'lastState' => ''
        ];
    }


    // TODO unit test
    public function isTestLocked(int $testId) {

        $test = $this->_(
            'SELECT booklets.locked FROM booklets
                WHERE booklets.id=:bookletId',
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
            'INSERT INTO bookletreviews (booklet_id, reviewtime, reviewer, priority, categories, entry) 
            VALUES(:b, :t, :r, :p, :c, :e)',
            [
                ':b' => $testId,
                ':t' => date('Y-m-d H:i:s', time()),
                ':r' => '-', // field is deprecated, reviewer is identified by bookelet. TODO remove field from DB
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
            'INSERT INTO unitreviews (unit_id, reviewtime, reviewer, priority, categories, entry) 
            VALUES(:u, :t, :r, :p, :c, :e)',
            [
                ':u' => $unitDbId,
                ':t' => date('Y-m-d H:i:s', time()),
                ':r' => '-', // field is deprecated, reviewer is identified by bookelet. TODO remove field from DB
                ':p' => $priority,
                ':c' => $categories,
                ':e' => $entry
            ]
        );
    }


    // TODO unit test
    public function getTestLastState(int $testId): array {

        $booklet = $this->_(
            'SELECT booklets.laststate FROM booklets WHERE booklets.id=:testId',
            [
                ':testId' => $testId
            ]
        );

        return  ($booklet) ? [] : JSON::decode($booklet['laststate'], true);
    }


    // TODO unit test
    public function updateTestLastState($testId, $stateKey, $stateValue): void {

        $testData = $this->_(
            'SELECT booklets.laststate FROM booklets WHERE booklets.id=:testId',
            [
                ':testId' => $testId
            ]
        );

        $state = $testData['laststate'] ? JSON::decode($testData['laststate'], true) : [];
        $state[$stateKey] = $stateValue;

         $this->_(
             'UPDATE booklets SET laststate = :laststate WHERE id = :id',
             [
                 ':laststate' => json_encode($state),
                 ':id' => $testId
             ]
         );
    }


    // TODO unit test
    public function getUnitLastState(int $testId, string $unitName): stdClass {

        $unitData = $this->_(
            'SELECT units.laststate FROM units
            WHERE units.name = :unitname and units.booklet_id = :testId',
            [
                ':unitname' => $unitName,
                ':testId' => $testId
            ]
        );
        // TODO Exception if not found
        return JSON::decode($unitData['laststate']);
    }


    // TODO unit test
    public function updateUnitLastState(int $testId, string $unitName, string $stateKey, string $stateValue): void {

        $unitDbId = $this->getOrCreateUnitId($testId, $unitName);

        $unitData = $this->_(
            'SELECT units.laststate FROM units WHERE units.id=:unitId',
            [
                ':unitId' => $unitDbId
            ]
        );

        $state = $unitData['laststate'] ? JSON::decode($unitData['laststate'], true) : [];
        $state[$stateKey] = $stateValue;

        $this->_(
            'UPDATE units SET laststate = :laststate WHERE id = :id',
            [
                ':laststate' => json_encode($state),
                ':id' => $unitDbId
            ]
        );
    }


    // TODO unit test
    public function lockBooklet(int $testId): void {

        $this->_('UPDATE booklets SET locked = :locked WHERE id = :id',
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

        return $unit['id'];
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
    public function addUnitLog(int $testId, string $unitName, string $logEntry, float $timestamp): void {

        $unitId = $this->getOrCreateUnitId($testId, $unitName);

        $this->_(
            'INSERT INTO unitlogs (unit_id, logentry, timestamp) 
            VALUES(
                :unitId,
                :logentry, 
                :ts
            )',
            [
                ':unitId' => $unitId,
                ':logentry' => $logEntry,
                ':ts' => $timestamp
            ]
        );
    }


    // TODO unit test
    public function addBookletLog($testId, $logEntry, $timestamp) {

        $this->_('INSERT INTO bookletlogs (booklet_id, logentry, timestamp) VALUES (:bookletId, :logentry, :timestamp)',
            [
                ':bookletId' => $testId,
                ':logentry' => $logEntry,
                ':timestamp' => $timestamp
            ]
        );
    }


}
