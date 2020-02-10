<?php

abstract class AuthToken {

    const type = 'abstract token';

    protected $_token = "";

    public function getToken(): string {
        return $this->_token;
    }
}
