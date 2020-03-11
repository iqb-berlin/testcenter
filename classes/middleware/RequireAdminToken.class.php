<?php

/** @noinspection PhpUnhandledExceptionInspection */


class RequireAdminToken extends RequireToken {

    function getTokenName(): string {
        return "at";
    }

    function createTokenObject(string $tokenString): AuthToken { // TODO unit-test

        $adminDAO = new AdminDAO();

        $tokenInfo = $adminDAO->getAdmin($tokenString);

        return new AdminAuthToken($tokenString, $tokenInfo['isSuperadmin']);
    }
}
