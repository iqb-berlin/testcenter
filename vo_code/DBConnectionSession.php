<?php

require_once('DBConnection.php');

class DBConnectionSession extends DBConnection {
    private $idletimeSession = 60 * 30;

    // for all functions here: $sessiontoken is the token as stored in the
    // database; the sessiontoken given to other functions and used by the 
    // client is a  combination of sessiontoken (db) + booklet-DB-id

    // __________________________
    public function canWriteBookletData($sessiontoken, $bookletDBId) {
        $myreturn = false;
        $query = pg_select($this->dbhandle, 'sessions', ['token' => $sessiontoken]);
        if (($query != false) and (count($query) > 0)) {
            $bookletquery = pg_select($this->dbhandle, 'booklets', ['session_id' => $query[0]['id'], 'id' => $bookletDBId]);
            if (($bookletquery != false) and (count($bookletquery) > 0)) {
                if ($bookletquery[0]['locked'] !== 't') {
                    $myreturn = true;
                }
            }
        }
        return $myreturn;
    }


    // __________________________
    public function getWorkspaceByLogintoken($logintoken) {
        $myreturn = 0;
        if (($this->dbhandle != false) and (count($logintoken) > 0)) {
            $loginquery = pg_select($this->dbhandle, 'logins', ['token' => $logintoken]);
            if (($loginquery != false) and (count($loginquery) > 0)) {
                $myreturn = 0 + $loginquery[0]['workspace_id'];
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getWorkspaceBySessiontoken($sessiontoken) {
        $myreturn = 0;
        if (($this->dbhandle != false) and (count($sessiontoken) > 0)) {
            $sessionquery = pg_select($this->dbhandle, 'sessions', ['token' => $sessiontoken]);
            if (($sessionquery != false) and (count($sessionquery) > 0)) {
                $loginId = $sessionquery[0]['login_id'];

                $loginquery = pg_select($this->dbhandle, 'logins', ['id' => $loginId]);
                if (($loginquery != false) and (count($loginquery) > 0)) {
                    $myreturn = 0 + $loginquery[0]['workspace_id'];
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getBookletStatus($bookletDBId) {
        $myreturn = 'ccc';
        if ($this->dbhandle != false) {
            $bookletquery = pg_select($this->dbhandle, 'booklets', ['id' => $bookletDBId]);
            if (($bookletquery != false) and (count($bookletquery) > 0)) {
                $myreturn = json_decode($bookletquery[0]['laststate'], true);
                if ($bookletquery[0]['locked'] === 't') {
                    $myreturn['locked'] = true;
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getBookletName($bookletDBId) {
        $myreturn = '';
        if ($this->dbhandle != false) {
            $bookletquery = pg_select($this->dbhandle, 'booklets', ['id' => $bookletDBId]);
            if (($bookletquery != false) and (count($bookletquery) > 0)) {
                $myreturn =  $bookletquery[0]['name'];
            }
        }
        return $myreturn;
    }
        

    // __________________________
    // check via canWriteBookletData before calling this!
    public function setBookletStatus($bookletDBId, $laststate) {
        $myreturn = '?';
        if (($this->dbhandle != false)) {
            $bookletquery = pg_select($this->dbhandle, 'booklets', ['id' => $bookletDBId]);
            if (($bookletquery != false) and (count($bookletquery) > 0)) {
                pg_update($this->dbhandle, 'booklets', 
                    ['laststate' => json_encode($laststate)],
                    ['id' => $bookletDBId]);
                    $myreturn = 'ok';
            }
        }
        return $myreturn;
    }

    // __________________________
    public function start_session($logintoken, $code, $booklet) {
        $myreturn = '';
        if (($this->dbhandle != false) and 
                (count($logintoken) > 0) and 
                (count($booklet) > 0) and (count($booklet) < 50)) {

            $loginquery = pg_select($this->dbhandle, 'logins', ['token' => $logintoken]);
            if (($loginquery != false) and (count($loginquery) > 0)) {
                $myreturn = uniqid('a', true);
                $query = pg_select($this->dbhandle, 'sessions', ['login_id' => $loginquery[0]['id'], 'code' => $code]);
                $laststate_session = ['lastbooklet' => $booklet];
                if (($query != false) and (count($query) > 0)) {
                    // überschreiben des alten Tokens
                    pg_update($this->dbhandle, 'sessions', 
                        ['valid_until' => date('Y-m-d G:i:s', time() + $this->idletimeSession),
                             'token' => $myreturn, 'laststate' => json_encode($laststate_session)],
                        ['id' => $query[0]['id']]);
                } else {
                    // Eintragen eines neuen Tokens
                    $insertreturn = pg_insert($this->dbhandle, 'sessions', ['token' => $myreturn, 
                                                        'code' => $code, 'login_id' => $loginquery[0]['id'],
                                                        'valid_until' => date('Y-m-d G:i:s', time() + $this->idletimeSession),
                                                        'laststate' => json_encode($laststate_session)]);
                }

                $query = pg_select($this->dbhandle, 'sessions', ['token' => $myreturn]);
                if (($query != false) and (count($query) > 0)) {
                    $sessionId = $query[0]['id'];
                    $laststate_booklet = ['u' => 0];
                    $bookletquery = pg_select($this->dbhandle, 'booklets', ['session_id' => $sessionId, 'name' => $booklet]);
                    
                    if (($bookletquery != false) and (count($bookletquery) > 0)) {
                        if ($bookletquery[0]['locked'] === 't') {
                            $myreturn = '';
                        } else {
                            $myreturn = $myreturn . "##" . $bookletquery[0]['id'];
                        }
                    } else {
                        $insertreturn = pg_insert($this->dbhandle, 'booklets', ['session_id' => $sessionId, 'name' => $booklet, 'laststate' => json_encode($laststate_booklet)]);
                        $bookletquery = pg_select($this->dbhandle, 'booklets', ['session_id' => $sessionId, 'name' => $booklet]);

                        if (($bookletquery != false) and (count($bookletquery) > 0)) {
                            $myreturn = $myreturn . "##" . $bookletquery[0]['id'];
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
        if (($this->dbhandle != false) and 
                (count($sessiontoken) > 0)) {

            $sessionquery = pg_select($this->dbhandle, 'sessions', ['token' => $sessiontoken]);
            if (($sessionquery != false) and (count($sessionquery) > 0)) {
                // remove token
                $laststate_booklet = ['lastunit' => '', 'finished' => $mode];
                pg_update($this->dbhandle, 'sessions', 
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
        if ($this->dbhandle != false) {
            $unitquery = pg_select($this->dbhandle, 'units', ['booklet_id' => $bookletDBId, 'name' => $unit]);
            if (($unitquery != false) and (count($unitquery) > 0)) {
                $myreturn['restorepoint'] = $unitquery[0]['laststate'];
            }
        }
        return $myreturn;
    }

    // __________________________
    public function setUnitStatus_laststate($bookletDBId, $unit, $laststate) {
        $myreturn = '?';
        if ($this->dbhandle != false) {
            $unitquery = pg_select($this->dbhandle, 'units', ['booklet_id' => $bookletDBId, 'name' => $unit]);
            if (($unitquery != false) and (count($unitquery) > 0)) {
                pg_update($this->dbhandle, 'units', 
                    ['laststate' => json_encode($laststate)],
                    ['id' => $unitquery[0]['id']]);
                $myreturn = 'ok - u';
            } else {
                $insertreturn = pg_insert($this->dbhandle, 'units', 
                    ['booklet_id' => $bookletDBId, 'name' => $unit, 
                     'laststate' => json_encode($laststate)]);
                $myreturn = 'ok - i';
            }
        }
        return $myreturn;
    }

    // __________________________
    public function setUnitStatus_responses($bookletDBId, $unit, $responses) {
        $myreturn = '?';
        if ($this->dbhandle != false) {
            $unitquery = pg_select($this->dbhandle, 'units', ['booklet_id' => $bookletDBId, 'name' => $unit]);
            if (($unitquery != false) and (count($unitquery) > 0)) {
                pg_update($this->dbhandle, 'units', 
                    ['responses' => $responses],
                    ['id' => $unitquery[0]['id']]);
                $myreturn = 'ok - u';
            } else {
                $insertreturn = pg_insert($this->dbhandle, 'units', 
                    ['booklet_id' => $bookletDBId, 'name' => $unit, 
                     'responses' => $responses]);
                $myreturn = 'ok - i';
            }
        }
        return $myreturn;
    }

    // __________________________
    public function setUnitStatus_restorepoint($bookletDBId, $unit, $restorepoint) {
        $myreturn = '?';
        if ($this->dbhandle != false) {
            $unitquery = pg_select($this->dbhandle, 'units', ['booklet_id' => $bookletDBId, 'name' => $unit]);
            if (($unitquery != false) and (count($unitquery) > 0)) {
                pg_update($this->dbhandle, 'units', 
                    ['laststate' => $restorepoint],
                    ['id' => $unitquery[0]['id']]);
                $myreturn = 'ok - u';
            } else {
                $insertreturn = pg_insert($this->dbhandle, 'units', 
                    ['booklet_id' => $bookletDBId, 'name' => $unit, 
                     'laststate' => $restorepoint]);
                $myreturn = 'ok - i';
            }
        }
        return $myreturn;
    }

    // __________________________
    public function setUnitStatus_log($bookletDBId, $unit, $log) {
        $myreturn = '?';
        if ($this->dbhandle != false) {
            $unitquery = pg_select($this->dbhandle, 'units', ['booklet_id' => $bookletDBId, 'name' => $unit]);
            if (($unitquery == false) or (count($unitquery) == 0)) {
                $insertreturn = pg_insert($this->dbhandle, 'units', 
                    ['booklet_id' => $bookletDBId, 'name' => $unit]);
                $unitquery = pg_select($this->dbhandle, 'units', ['booklet_id' => $bookletDBId, 'name' => $unit]);
            }
            if (($unitquery != false) and (count($unitquery) > 0)) {
                $insertreturn = pg_insert($this->dbhandle, 'unitlogs', 
                    ['unit_id' => $unitquery[0]['id'], 'logentry' => $log,
                    'logtime' => date('Y-m-d G:i:s', time())]);
                $myreturn = 'ok';
            }
        }
        return $myreturn;
    }
}

?>