<?php


class PersonAuthToken extends AuthToken {

    const type = 'person';

    private $_loginToken = '';

    public function __construct(string $token, string $loginToken) {

        $this->_loginToken = $loginToken;
        parent::__construct($token);
    }
}
