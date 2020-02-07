<?php

class AuthToken {

    protected $_token = "";

    public function getToken(): string {
        return $this->_token;
    }
}
