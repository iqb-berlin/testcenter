<?php


class AdminAuthToken extends AuthToken {

    const type = "admin";

    /* @var $_isSuperAdmin boolean */
    private $_isSuperAdmin;

    function __construct($token, $isSuperAdmin) {

        $this->_isSuperAdmin = $isSuperAdmin;
        parent::__construct($token);
    }


    public function isSuperAdmin(): bool {

        return $this->_isSuperAdmin;
    }

}
