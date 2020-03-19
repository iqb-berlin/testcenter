<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test


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
