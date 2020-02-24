<?php

/** @noinspection PhpUnhandledExceptionInspection */


class DBConnectionTC extends DBConnection {


    // =================================================================
    // used as entry check in tc_post.php
    public function canWriteBookletData($persontoken, $bookletDbId) {
        $myreturn = false;
        $booklet_select = $this->pdoDBhandle->prepare(
            'SELECT booklets.locked FROM booklets
                INNER JOIN persons ON persons.id = booklets.person_id
                WHERE persons.token=:token and booklets.id=:bookletId');
            
        if ($booklet_select->execute(array(
            ':token' => $persontoken,
            ':bookletId' => $bookletDbId
            ))) {

            $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
            if ($bookletdata !== false) {
                $myreturn = $bookletdata['locked'] != '1';
            }
        }
        return $myreturn;
    }


    public function addBookletReview(int $testId, int $priority, string $categories, string $entry): void {

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


    public function addUnitReview(int $testId, string $unit, int $priority, string $categories, string $entry): void {

        $unitDbId = $this->findOrAddUnit($testId, $unit);
        $this->_(
            'INSERT INTO unitreviews (unit_id, reviewtime, reviewer, priority, categories, entry) 
            VALUES(:u, :t, :r, :p, :c, :e)',
            array(
                ':u' => $unitDbId,
                ':t' => date('Y-m-d H:i:s', time()),
                ':r' => '-', // field is deprecated, reviewer is identified by bookelet. TODO remove field from DB
                ':p' => $priority,
                ':c' => $categories,
                ':e' => $entry
            )
        );
    }


    public function getBookletLastState($bookletDbId) {

        $booklet = $this->_(
            'SELECT booklets.laststate FROM booklets WHERE booklets.id=:bookletId', array(
            ':bookletId' => $bookletDbId
        ));

        return  ($booklet) ? [] : JSON::decode($booklet['laststate'], true);
    }


    public function isBookletLocked($bookletDbId) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $booklet_select = $this->pdoDBhandle->prepare(
                'SELECT booklets.locked FROM booklets
                    WHERE booklets.id=:bookletId');
                
            if ($booklet_select->execute(array(
                ':bookletId' => $bookletDbId
                ))) {

                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                if ($bookletdata !== false) {
                    if ($bookletdata['locked'] == '1') {
                        $myreturn = true;
                    }
                }
            }
        }
        return $myreturn;
    }

    // =================================================================
    public function setBookletLastState($bookletDbId, $stateKey, $stateValue) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            try {
                $this->pdoDBhandle->beginTransaction();
                $booklet_select = $this->pdoDBhandle->prepare(
                    'SELECT booklets.laststate FROM booklets
                        WHERE booklets.id=:bookletId FOR UPDATE');
                    
                $booklet_select->execute(array(':bookletId' => $bookletDbId));
                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);

                $stateStr = $bookletdata['laststate'];
                $state = [];
                if (isset($stateStr)) {
                    if(strlen($stateStr) > 0) {
                        $state = JSON::decode($stateStr, true);
                    }
                }
                $state[$stateKey] = $stateValue;
                $booklet_update = $this->pdoDBhandle->prepare(
                    'UPDATE booklets SET laststate = :laststate WHERE id = :id');
                $booklet_update -> execute(array(
                    ':laststate' => json_encode($state),
                    ':id' => $bookletDbId));
                $this->pdoDBhandle->commit();
                $myreturn = true;
            } 

            catch(Exception $e){
                $this->pdoDBhandle->rollBack();
            }

        }
        return $myreturn;
    }

    // =================================================================
    public function setUnitLastState($bookletDbId, $unitname, $stateKey, $stateValue) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            try {
                $this->pdoDBhandle->beginTransaction();
                $unitDbId = $this->findOrAddUnit($bookletDbId, $unitname);
                $unit_select = $this->pdoDBhandle->prepare(
                    'SELECT units.laststate FROM units
                        WHERE units.id=:unitId FOR UPDATE');
                    
                $unit_select->execute(array(':unitId' => $unitDbId));
                $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);

                $stateStr = $unitdata['laststate'];
                $state = [];
                if (isset($stateStr)) {
                    if(strlen($stateStr) > 0) {
                        $state = JSON::decode($stateStr, true);
                    }
                }
                $state[$stateKey] = $stateValue;
                $unit_update = $this->pdoDBhandle->prepare(
                    'UPDATE units SET laststate = :laststate WHERE id = :id');
                $unit_update -> execute(array(
                    ':laststate' => json_encode($state),
                    ':id' => $unitDbId));
                $this->pdoDBhandle->commit();
                $myreturn = true;
            } 

            catch(Exception $e){
                $this->pdoDBhandle->rollBack();
            }

        }
        return $myreturn;
    }

    // =================================================================
    public function lockBooklet($bookletDbId) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $booklet_update = $this->pdoDBhandle->prepare(
                'UPDATE booklets SET locked = :locked WHERE id = :id');
            if ($booklet_update -> execute(array(
                ':locked' => '1',
                ':id' => $bookletDbId))) {
                $myreturn = true;
            }
        }
        return $myreturn;
    }




    // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
    //  . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

    // =================================================================
    public function getUnitLastState($bookletDbId, $unit) {
        $myreturn = [];
        if ($this->pdoDBhandle != false) {
            $unit_select = $this->pdoDBhandle->prepare(
                'SELECT units.laststate FROM units
                    WHERE units.name = :unitname and units.booklet_id = :bookletId');
                
            if ($unit_select->execute(array(
                ':unitname' => $unit,
                ':bookletId' => $bookletDbId
                ))) {
                
                $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
                if ($unitdata !== false) {
                    $myreturn = JSON::decode($unitdata['laststate'], true);
                }
            }
        }
        return $myreturn;
    }
 
    // =================================================================
    public function getUnitRestorePoint($bookletDbId, $unit) {
        $myreturn = '';
        if ($this->pdoDBhandle != false) {
            $unit_select = $this->pdoDBhandle->prepare(
                'SELECT units.restorepoint FROM units
                    WHERE units.name = :unitname and units.booklet_id = :bookletId');
                
            if ($unit_select->execute(array(
                ':unitname' => $unit,
                ':bookletId' => $bookletDbId
                ))) {
                
                $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
                if ($unitdata !== false) {
                    $myreturn = $unitdata['restorepoint'];
                }
            }
        }
        return $myreturn;
    }


    private function findOrAddUnit($testId, $unitname) {

        $unit = $this->_(
            'SELECT units.id FROM units
            WHERE units.name = :unitname and units.booklet_id = :bookletId',
            array(
                ':unitname' => $unitname,
                ':bookletId' => $testId
            )
        );

        if (!$unit) {

            $this->_(
                'INSERT INTO units (booklet_id, name) 
                VALUES(:bookletId, :name)',
                array(
                    ':bookletId' => $testId,
                    ':name' => $unitname
                )
            );
            return $this->pdoDBhandle->lastInsertId();

        }

        return $unit['id'];
    }

    // °\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/
    public function newRestorePoint($bookletDbId, $unitname, $restorepoint, $time) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            try {
                $this->pdoDBhandle->beginTransaction();
                $unitDbId = $this->findOrAddUnit($bookletDbId, $unitname);
                $unit_update = $this->pdoDBhandle->prepare(
                    'UPDATE units SET restorepoint=:rp, restorepoint_ts=:rp_ts
                    WHERE id = :unitId and restorepoint_ts < :ts');
                if ($unit_update -> execute(array(
                    ':ts' => $time,
                    ':rp' => $restorepoint,
                    ':rp_ts' => $time,
                    ':unitId' => $unitDbId))) {
                    $myreturn = true;
                }
                $this->pdoDBhandle->commit();
                $myreturn = true;
            } 

            catch(Exception $e){
                $this->pdoDBhandle->rollBack();
            }
        }
        return $myreturn;
    }

    // °\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/°\o/
    public function newResponses($bookletDbId, $unitname, $responses, $responseType, $time) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            try {
                $this->pdoDBhandle->beginTransaction();
                $unitDbId = $this->findOrAddUnit($bookletDbId, $unitname);
                $unit_update = $this->pdoDBhandle->prepare(
                    'UPDATE units SET responses=:r, responses_ts=:r_ts, responsetype=:rt
                    WHERE id = :unitId and responses_ts < :ts');
                if ($unit_update -> execute(array(
                    ':ts' => $time,
                    ':r' => $responses,
                    ':r_ts' => $time,
                    ':rt' => $responseType,
                    ':unitId' => $unitDbId))) {
                    $myreturn = true;
                }
                $this->pdoDBhandle->commit();
                $myreturn = true;
            } 

            catch(Exception $e){
                $this->pdoDBhandle->rollBack();
            }
        }

        return $myreturn;
    }

    // =================================================================
    public function addUnitLog($bookletDbId, $unitname, $logentry, $time) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            try {
                $this->pdoDBhandle->beginTransaction();
                $unitDbId = $this->findOrAddUnit($bookletDbId, $unitname);
                $unitlog_insert = $this->pdoDBhandle->prepare(
                    'INSERT INTO unitlogs (unit_id, logentry, timestamp) 
                        VALUES(:unitId, :logentry, :timestamp)');
    
                if ($unitlog_insert->execute(array(
                    ':unitId' => $unitDbId,
                    ':logentry' => $logentry,
                    ':timestamp' => $time))) {
                    $myreturn = true;
                };
                $this->pdoDBhandle->commit();
            } 

            catch(Exception $e){
                $this->pdoDBhandle->rollBack();
            }
        }

        return $myreturn;
    }

    // =================================================================
    public function addBookletLog($bookletDbId, $logentry, $time) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            try {
                $this->pdoDBhandle->beginTransaction();
                $bookletlog_insert = $this->pdoDBhandle->prepare(
                    'INSERT INTO bookletlogs (booklet_id, logentry, timestamp) 
                        VALUES(:bookletId, :logentry, :timestamp)');
    
                if ($bookletlog_insert->execute(array(
                    ':bookletId' => $bookletDbId,
                    ':logentry' => $logentry,
                    ':timestamp' => $time))) {

                    $myreturn = true;
                }
                $this->pdoDBhandle->commit();
            } 

            catch(Exception $e){
                $this->pdoDBhandle->rollBack();
            }
        }

        return $myreturn;
    }
}

?>
