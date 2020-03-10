<?php

/** @noinspection PhpUnhandledExceptionInspection */


class DBConnectionTC extends DBConnection {


    // TODO unit test
    public function canWriteTestData(string $personToken, string $testId): bool {

        $test = $this->_(
            'SELECT booklets.locked FROM booklets
                INNER JOIN persons ON persons.id = booklets.person_id
                WHERE persons.token=:token and booklets.id=:testId',
            [
                ':token' => $personToken,
                ':testId' => $testId
            ]
        );

        // TODO check for mode?!

        return !$test or ($test['locked'] == '1');
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
            array(
                ':b' => $testId,
                ':t' => date('Y-m-d H:i:s', time()),
                ':r' => '-', // field is deprecated, reviewer is identified by bookelet. TODO remove field from DB
                ':p' => $priority,
                ':c' => $categories,
                ':e' => $entry
            )
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
            'SELECT booklets.laststate FROM booklets WHERE booklets.id=:testId FOR UPDATE',
            [
                ':testId' => $testId
            ]
        );

        $state = (strlen($testData['laststate']) > 0) ? JSON::decode($testData['laststate'], true) : [];
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
        return JSON::decode($unitData['laststate']);
    }


    // TODO unit test
    public function updateUnitLastState($testId, $unitName, $stateKey, $stateValue): void {

        $unitDbId = $this->getOrCreateUnitId($testId, $unitName);

        $unitData = $this->_(
            'SELECT units.laststate FROM units WHERE units.id=:unitId FOR UPDATE',
            [
                ':unitId' => $unitDbId
            ]
        );

        $state = (strlen($unitData['laststate']) > 0) ? JSON::decode($unitData['laststate'], true) : [];
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
    public function lockBooklet($bookletDbId): void {

        $this->_('UPDATE booklets SET locked = :locked WHERE id = :id',
            [
                ':locked' => '1',
                ':id' => $bookletDbId
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
            array(
                ':unitname' => $unitName,
                ':testId' => $testId
            )
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
    public function addResponse(int $testId, string $unitName, string $responses, string $type, int $timestamp) : void {

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
    public function addUnitLog($testId, $unitName, $logEntry, $timestamp) { // TODO manchmal wird die subquery 0 ?!

        $this->_(
            'INSERT INTO unitlogs (unit_id, logentry, timestamp) 
            VALUES(
                (SELECT id FROM units WHERE name=:unitName AND booklet_id=:testId),
                :logentry, 
                :timestamp
            )',
            [
                ':testId' => $testId,
                ':unitName' => $unitName,
                ':logentry' => $logEntry,
                ':timestamp' => $timestamp
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
