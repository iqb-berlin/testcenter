<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

require_once('DBConnection.php');

class DBConnectionSession extends DBConnection {
    private $idletimeSession = 60 * 30;

    // for all functions here: $sessiontoken is the token as stored in the
    // database; the sessiontoken given to other functions and used by the 
    // client is a  combination of sessiontoken (db) + booklet-DB-id

    // __________________________
    public function canWriteBookletData($sessiontoken, $bookletDBId) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $booklet_select = $this->pdoDBhandle->prepare(
                'SELECT booklets.locked FROM booklets
                    INNER JOIN sessions ON sessions.id = booklets.session_id
                    WHERE sessions.token=:token and booklets.id=:bookletId');
                
            if ($booklet_select->execute(array(
                ':token' => $sessiontoken,
                ':bookletId' => $bookletDBId
                ))) {

                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                if ($bookletdata !== false) {
                    if ($bookletdata['locked'] !== 't') {
                        $myreturn = true;
                    }
                }
            }
        }
        return $myreturn;
    }


    // __________________________
    public function getWorkspaceByLogintoken($logintoken) {
        $myreturn = 0;
        if ($this->pdoDBhandle != false) {
            $login_select = $this->pdoDBhandle->prepare(
                'SELECT logins.workspace_id FROM logins
                    WHERE logins.token=:token');
                
            if ($login_select->execute(array(
                ':token' => $logintoken
                ))) {

                $logindata = $login_select->fetch(PDO::FETCH_ASSOC);
                if ($logindata !== false) {
                    $myreturn = 0 + $logindata['workspace_id'];
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getWorkspaceBySessiontoken($sessiontoken) {
        $myreturn = 0;
        if ($this->pdoDBhandle != false) {
            $login_select = $this->pdoDBhandle->prepare(
                'SELECT logins.workspace_id FROM logins
                    INNER JOIN sessions ON sessions.login_id = logins.id
                    WHERE sessions.token=:token');
                
            if ($login_select->execute(array(
                ':token' => $sessiontoken
                ))) {

                $logindata = $login_select->fetch(PDO::FETCH_ASSOC);
                if ($logindata !== false) {
                    $myreturn = 0 + $logindata['workspace_id'];
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getBookletStatus($bookletDBId) {
        $myreturn = [];
        if ($this->pdoDBhandle != false) {
            $booklet_select = $this->pdoDBhandle->prepare(
                'SELECT booklets.locked, booklets.laststate FROM booklets
                    WHERE booklets.id=:bookletId');
                
            if ($booklet_select->execute(array(
                ':bookletId' => $bookletDBId
                ))) {

                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                if ($bookletdata !== false) {
                    $myreturn = json_decode($bookletdata['laststate'], true);
                    if ($bookletdata['locked'] === 't') {
                        $myreturn['locked'] = true;
                    }
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getBookletName($bookletDBId) {
        $myreturn = '';
        if ($this->pdoDBhandle != false) {
            $booklet_select = $this->pdoDBhandle->prepare(
                'SELECT booklets.name FROM booklets
                    WHERE booklets.id=:bookletId');
                
            if ($booklet_select->execute(array(
                ':bookletId' => $bookletDBId
                ))) {

                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                if ($bookletdata !== false) {
                    $myreturn =  $bookletdata['name'];
                }
            }
        }
        return $myreturn;
    }
        

    // __________________________
    // check via canWriteBookletData before calling this!
    public function setBookletStatus($bookletDBId, $laststate) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $booklet_update = $this->pdoDBhandle->prepare(
                'UPDATE booklets SET laststate = :laststate WHERE id = :id');
            if ($booklet_update -> execute(array(
                ':laststate' => json_encode($laststate),
                ':id' => $bookletDBId))) {
                $myreturn = true;
            }
        }
        return $myreturn;
    }

    // __________________________
    public function start_session($logintoken, $code, $booklet) {
        $myreturn = '';
        if ($this->pdoDBhandle != false) {
            $login_select = $this->pdoDBhandle->prepare(
                'SELECT logins.id FROM logins
                    WHERE logins.token=:token');
                
            if ($login_select->execute(array(
                ':token' => $logintoken
                ))) {

                $logindata = $login_select->fetch(PDO::FETCH_ASSOC);
                if ($logindata !== false) {
                    $sessions_select = $this->pdoDBhandle->prepare(
                        'SELECT sessions.id FROM sessions
                            WHERE sessions.login_id=:id and sessions.code=:code');
                        
                    if ($sessions_select->execute(array(
                        ':id' => $logindata['id'],
                        ':code' => $code
                        ))) {
        
                        $myreturn = uniqid('a', true);
                        $laststate_session = ['lastbooklet' => $booklet];
                        $sessiondata = $sessions_select->fetch(PDO::FETCH_ASSOC);
                        if ($sessiondata !== false) {
                            // overwrite token
                            $session_update = $this->pdoDBhandle->prepare(
                                'UPDATE sessions SET valid_until =:valid_until, token=:token, laststate=:laststate WHERE id = :id');
                            if (!$session_update -> execute(array(
                                ':valid_until' => date('Y-m-d G:i:s', time() + $this->idletimeSession),
                                ':laststate' => json_encode($laststate_session),
                                ':token' => $myreturn,
                                ':id' => $sessiondata['id']))) {
                                $myreturn = '';
                            }
                        } else {
                            $session_insert = $this->pdoDBhandle->prepare(
                                'INSERT INTO sessions (token, code, login_id, valid_until, laststate) 
                                    VALUES(:token, :code, :login_id, :valid_until, :laststate)');
        
                            if (!$session_insert->execute(array(
                                ':token' => $myreturn,
                                ':code' => $code,
                                ':login_id' => $logindata['id'],
                                ':valid_until' => date('Y-m-d G:i:s', time() + $this->idletimeSession),
                                ':laststate' => json_encode($laststate_session)
                                ))) {
                                    $myreturn = '';
                            }
                        }
                    }
                }

                $sessions_select = $this->pdoDBhandle->prepare(
                    'SELECT sessions.id FROM sessions
                        WHERE sessions.token=:token');
                    
                if ($sessions_select->execute(array(
                    ':token' => $myreturn
                    ))) {
    
                    $sessiondata = $sessions_select->fetch(PDO::FETCH_ASSOC);
                    if ($sessiondata !== false) {
                        $laststate_booklet = ['u' => 0];
                        $booklet_select = $this->pdoDBhandle->prepare(
                            'SELECT booklets.locked, booklets.id FROM booklets
                                WHERE booklets.session_id=:sessionId and booklets.name=:bookletname');
                            
                        if ($booklet_select->execute(array(
                            ':sessionId' => $sessiondata['id'],
                            ':bookletname' => $booklet
                            ))) {
            
                            $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                            if ($bookletdata !== false) {
                                if ($bookletdata['locked'] === 't') {
                                    $myreturn = '';
                                } else {
                                    $myreturn = $myreturn . "##" . $bookletdata['id'];
                                }
                            } else {
                                $booklet_insert = $this->pdoDBhandle->prepare(
                                    'INSERT INTO booklets (session_id, name, laststate) 
                                        VALUES(:session_id, :name, :laststate)');
            
                                if ($booklet_insert->execute(array(
                                    ':session_id' => $sessiondata['id'],
                                    ':name' => $booklet,
                                    ':laststate' => json_encode($laststate_booklet)
                                    ))) {

                                    $booklet_select = $this->pdoDBhandle->prepare(
                                        'SELECT booklets.id FROM booklets
                                            WHERE booklets.session_id=:sessionId and booklets.name=:bookletname');
                                        
                                    if ($booklet_select->execute(array(
                                        ':sessionId' => $sessiondata['id'],
                                        ':bookletname' => $booklet
                                        ))) {
                        
                                        $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                                        if ($bookletdata !== false) {
                                            $myreturn = $myreturn . "##" . $bookletdata['id'];
                                        } else {
                                            $myreturn = '';
                                        }
                                    } else {
                                        $myreturn = '';
                                    }
                                } else {
                                    $myreturn = '';
                                }
                            }
                        }
                    }
                }
            }
        }
        return $myreturn;
    }
    
    /*
    // __________________________
    public function stop_session($sessiontoken, $mode) {
        // mode: (by testee) 'cancelled', 'intended', (by test-mc) 'killed'
        $myreturn = '';
        if (($this::: != false) and 
                (count($sessiontoken) > 0)) {

            $sessionquery = :::select($this:::, 'sessions', ['token' => $sessiontoken]);
            if (($sessionquery != false) and (count($sessionquery) > 0)) {
                // remove token
                $laststate_booklet = ['lastunit' => '', 'finished' => $mode];
                :::update($this:::, 'sessions', 
                        ['valid_until' => date('Y-m-d G:i:s', time()), 'token' => '', 'laststate' => json_encode($laststate_booklet)],
                        ['id' => $sessionquery[0]['id']]);
            }
        }
        return $myreturn;
    }
    */


    // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
    //  . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

    // __________________________
    public function getUnitStatus($bookletDBId, $unit) {
        $myreturn = ['restorepoint' => ''];
        if ($this->pdoDBhandle != false) {
            $unit_select = $this->pdoDBhandle->prepare(
                'SELECT units.laststate FROM units
                    WHERE units.name=:name and units.booklet_id=:bookletId');
                
            if ($unit_select->execute(array(
                ':name' => $unit,
                ':bookletId' => $bookletDBId
                ))) {

                $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
                if ($unitdata !== false) {
                    $myreturn['restorepoint'] = $unitdata['laststate'];
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function setUnitStatus_laststate($bookletDBId, $unit, $laststate) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $unit_select = $this->pdoDBhandle->prepare(
                'SELECT units.id FROM units
                    WHERE units.name=:name and units.booklet_id=:bookletId');
                
            if ($unit_select->execute(array(
                ':name' => $unit,
                ':bookletId' => $bookletDBId
                ))) {

                $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
                if ($unitdata !== false) {
                    $unit_update = $this->pdoDBhandle->prepare(
                        'UPDATE units SET laststate=:laststate WHERE id = :id');
                    if ($unit_update -> execute(array(
                        ':laststate' => json_encode($laststate),
                        ':id' => $unitdata['id']))) {
                        $myreturn = true;
                    }
                } else {
                    $unit_insert = $this->pdoDBhandle->prepare(
                        'INSERT INTO units (booklet_id, name, laststate) 
                            VALUES(:bookletId, :name, :laststate)');

                    if ($unit_insert->execute(array(
                        ':bookletId' => $bookletDBId,
                        ':name' => $unit,
                        ':laststate' => json_encode($laststate)
                        ))) {
                            $myreturn = true;
                    }
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function setUnitStatus_responses($bookletDBId, $unit, $responses) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $unit_select = $this->pdoDBhandle->prepare(
                'SELECT units.id FROM units
                    WHERE units.name=:name and units.booklet_id=:bookletId');
                
            if ($unit_select->execute(array(
                ':name' => $unit,
                ':bookletId' => $bookletDBId
                ))) {

                $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
                if ($unitdata !== false) {
                    $unit_update = $this->pdoDBhandle->prepare(
                        'UPDATE units SET responses=:responses WHERE id = :id');
                    if ($unit_update -> execute(array(
                        ':responses' => $responses,
                        ':id' => $unitdata['id']))) {
                        $myreturn = true;
                    }
                } else {
                    $unit_insert = $this->pdoDBhandle->prepare(
                        'INSERT INTO units (booklet_id, name, responses) 
                            VALUES(:bookletId, :name, :responses)');

                    if ($unit_insert->execute(array(
                        ':bookletId' => $bookletDBId,
                        ':name' => $unit,
                        ':responses' => $responses
                        ))) {
                            $myreturn = true;
                    }
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function setUnitStatus_restorepoint($bookletDBId, $unit, $restorepoint) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $unit_select = $this->pdoDBhandle->prepare(
                'SELECT units.id FROM units
                    WHERE units.name=:name and units.booklet_id=:bookletId');
                
            if ($unit_select->execute(array(
                ':name' => $unit,
                ':bookletId' => $bookletDBId
                ))) {

                $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
                if ($unitdata !== false) {
                    $unit_update = $this->pdoDBhandle->prepare(
                        'UPDATE units SET laststate=:laststate WHERE id = :id');
                    if ($unit_update -> execute(array(
                        ':laststate' => $restorepoint,
                        ':id' => $unitdata['id']))) {
                        $myreturn = true;
                    }
                } else {
                    $unit_insert = $this->pdoDBhandle->prepare(
                        'INSERT INTO units (booklet_id, name, laststate) 
                            VALUES(:bookletId, :name, :laststate)');

                    if ($unit_insert->execute(array(
                        ':bookletId' => $bookletDBId,
                        ':name' => $unit,
                        ':laststate' => $restorepoint
                        ))) {
                            $myreturn = true;
                    }
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function setUnitStatus_log($bookletDBId, $unit, $log) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $unit_select = $this->pdoDBhandle->prepare(
                'SELECT units.id FROM units
                    WHERE units.name=:name and units.booklet_id=:bookletId');
                
            if ($unit_select->execute(array(
                ':name' => $unit,
                ':bookletId' => $bookletDBId
                ))) {

                $unitdata = $unit_select->fetch(PDO::FETCH_ASSOC);
                if ($unitdata !== false) {
                    $unitlog_insert = $this->pdoDBhandle->prepare(
                        'INSERT INTO unitlogs (unit_id, logentry, logtime) 
                            VALUES(:unitId, :logentry, :logtime)');

                    if ($unitlog_insert->execute(array(
                        ':unitId' => $unitdata['id'],
                        ':logentry' => $log,
                        ':logtime' => date('Y-m-d G:i:s', time())
                        ))) {
                            $myreturn = true;
                    }
                }
            }
        }
        return $myreturn;
    }
}

?>