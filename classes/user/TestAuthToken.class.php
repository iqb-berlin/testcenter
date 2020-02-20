<?php


class TestAuthToken extends AuthToken {

    private $_loginToken = '';

    function __construct(string $personToken, string $loginToken) {

        $this->_token = $personToken;
        $this->_loginToken = $loginToken;
    }


    public function getLoginToken(): string {

        return $this->_loginToken;
    }
}
