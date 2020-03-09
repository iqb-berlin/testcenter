<?php


abstract class AuthToken {

    const type = 'abstract token';

    protected $_token = "";

    public function __construct($token) {

        $this->_token = $token;
    }

    public function getToken(): string {

        return $this->_token;
    }
}
