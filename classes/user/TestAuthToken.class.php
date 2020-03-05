<?php


class TestAuthToken extends AuthToken {

    private $_personToken = '';

    function __construct(string $loginToken, string $personToken) {

        $this->_token = $loginToken;
        $this->_personToken = $personToken;
    }


    public function getPersonToken(): string {

        return $this->_personToken;
    }
}
