<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test


class RequireLoginToken extends RequireToken {

    function createTokenObject(string $tokenString): AuthToken { // TODO unit-test

        $sessionDAO = new SessionDAO();
        $sessionDAO->getLoginId($tokenString);
        return new LoginAuthToken($tokenString);
    }

    function getTokenName(): string {

        return "l";
    }
}

