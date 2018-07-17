<?php

require_once('DBConnection.php');

class DBConnectionLogin extends DBConnection {
    private $idletime = 60 * 30;

    // __________________________
    public function login($workspace, $name, $mode, $sessiondef) {
        $myreturn = '';
        if (($this->dbhandle != false) and 
                (count($workspace) > 0) and 
                (count($name) > 0) and (count($name) < 50)) {

            $myreturn = uniqid('a', true);
            $query = pg_select($this->dbhandle, 'logins', ['name' => $name, 'workspace_id' => $workspace]);
            if (($query != false) and (count($query) > 0)) {
                // überschreiben Session-Definitionen und Timestamp; altes Token bleibt erhalten
                // todo: Token überschreiben, wenn zu alt
                pg_update($this->dbhandle, 'logins', 
                    ['valid_until' => date('Y-m-d G:i:s', time() + $this->idletime), 
                        'session_def' => $sessiondef],
                    ['id' => $query[0]['id']]);
                $myreturn = $query[0]['token'];
            } else {
                // Eintragen eines neuen Tokens
                $insertreturn = pg_insert($this->dbhandle, 'logins', ['token' => $myreturn, 'session_def' => $sessiondef,
                                                    'name' => $name, 'mode' => $mode, 'workspace_id' => $workspace,
                                                    'valid_until' => date('Y-m-d G:i:s', time() + $this->idletime)]);
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getSessions($logintoken) {
		$myreturn = ['ws' => '', 'sessions' => [], 'mode' => ''];
        if (($this->dbhandle != false) and (count($logintoken) > 0)) {
            $query = pg_select($this->dbhandle, 'logins', ['token' => $logintoken]);
            if (($query != false) and (count($query) > 0)) {
                $myreturn['sessions'] = json_decode($query[0]['session_def'], true);
                $myreturn['ws'] = $query[0]['workspace_id'];
                $myreturn['mode'] = trim($query[0]['mode']);
                // update valid_until
                pg_update($this->dbhandle, 'logins', 
                    ['valid_until' => date('Y-m-d G:i:s', time() + $this->idletime)],
                    ['id' => $query[0]['id']]);
            }
        }
        return $myreturn;
    }

    // __________________________
    // returns all possible booklets of a login for each possible code
    public function getBooklets($logintoken) {
		$myreturn = ['ws' => '', 'booklets' => [], 'mode' => ''];
        if (($this->dbhandle != false) and (count($logintoken) > 0)) {
            $query = pg_select($this->dbhandle, 'logins', ['token' => $logintoken]);
            if (($query != false) and (count($query) > 0)) {
                $myreturn['ws'] = $query[0]['workspace_id'];
                $myreturn['mode'] = trim($query[0]['mode']);

                $bookletDef = json_decode($query[0]['session_def'], true);
                // collect all codes
                $allCodes = [];
                foreach($bookletDef as $b) {
                    if (count($b['codes']) > 0) {
                        foreach($b['codes'] as $c) {
                            // ?? strtoupper
                            if (! in_array($c, $allCodes)) {
                                array_push($allCodes, $c);
                            }
                        }
                    }
                }
                foreach($bookletDef as $b) {
                    $myBookletObject = ['name' => strtoupper($b['name'])];

                    if ((count($b['codes']) == 0) && (count($allCodes) > 0)) {
                        // add all possible codes
                        foreach($allCodes as $c) {
                            if (!isset($myreturn['booklets'][$c])) {
                                $myreturn['booklets'][$c] = [];
                            }
                            if (!in_array($c, $myreturn['booklets'][$c])) {
                                array_push($myreturn['booklets'][$c], $myBookletObject);
                            }
                        }
                    } else {
                        if (count($b['codes']) > 0) {
                            foreach($b['codes'] as $c) {
                                if (!isset($myreturn['booklets'][$c])) {
                                    $myreturn['booklets'][$c] = [];
                                }
                                if (!in_array($c, $myreturn['booklets'][$c])) {
                                    array_push($myreturn['booklets'][$c], $myBookletObject);
                                }
                            }
                        } else {
                            if (!isset($myreturn['booklets'][''])) {
                                $myreturn['booklets'][''] = [];
                            }
                            if (!in_array($c, $myreturn['booklets'][''])) {
                                array_push($myreturn['booklets'][''], $myBookletObject);
                            }
                        }
                    }
                }                
                
                // update valid_until
                pg_update($this->dbhandle, 'logins', 
                    ['valid_until' => date('Y-m-d G:i:s', time() + $this->idletime)],
                    ['id' => $query[0]['id']]);
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getBookletStatus($logintoken, $code, $bookletname) {
        $myreturn = ['canStart' => false, 'statusLabel' => 'Zugriff verweigert', 'lastUnit' => 0];
        
        if (($this->dbhandle != false) and (count($logintoken) > 0)) {
            $query = pg_select($this->dbhandle, 'logins', ['token' => $logintoken]);
            if (($query != false) and (count($query) > 0)) {
                $bookletDef = json_decode($query[0]['session_def'], true);
                // check whether code and booklet are part of login
                $bookletFound = false;
                foreach($bookletDef as $b) {
                    // todo: notbefore/notafter
                    if ($b['name'] == $bookletname) {
                        if (count($b['codes']) > 0) {
                            if (in_array($code, $b['codes'])) {
                                $bookletFound = true;
                            }
                        } else {
                            $bookletFound = true;
                        }
                    }
                    if ($bookletFound) {
                        break;
                    }
                }
                $myreturn['canStart'] = true;
                $myreturn['statusLabel'] = 'Zum Starten hier klicken';

                $sessionquery = pg_select($this->dbhandle, 'sessions', 
                    ['login_id' => $query[0]['id'], 'code' => $code]);

                if (($sessionquery != false) and (count($sessionquery) > 0)) {
                    $bookletquery = pg_select($this->dbhandle, 'booklets', 
                            ['session_id' => $sessionquery[0]['id'], 'name' => $bookletname]);
                    if (($bookletquery != false) and (count($bookletquery) > 0)) {
                        $laststate = json_decode($bookletquery[0]['laststate'], true);
                        if (isset($laststate['u'])) {
                            $myreturn['lastUnit'] = $laststate['u'];
                        }
                        if ($bookletquery[0]['locked'] === 't') {
                            $myreturn['canStart'] = false;
                            $myreturn['statusLabel'] = 'Gesperrt';
                            // later: differentiate between finished, cancelled etc.
                        } else {
                            $myreturn['statusLabel'] = 'Zum Fortsetzen hier klicken';
                        }
                    }
                }
            }
        }
        return $myreturn;
    }
    

    // __________________________
    public function logout($token) {
        $myreturn = '';
        if (($this->dbhandle != false) and (count($token) > 0)) {
            $query = pg_delete($this->dbhandle, 'logins', ['token' => $logintoken]);
        }
        return $myreturn;
    }

    // __________________________

}

?>