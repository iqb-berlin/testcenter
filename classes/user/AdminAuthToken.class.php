<?php

class AdminAuthToken extends AuthToken {

    const type = "admin";

    private $_isSuperAdmin;

    function __construct($token, $isSuperAdmin) {

        $this->_token = $token;
        $this->_isSuperAdmin = $isSuperAdmin;
    }

}
