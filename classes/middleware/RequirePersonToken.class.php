<?php

/** @noinspection PhpUnhandledExceptionInspection */

class RequirePersonToken extends RequireToken {

    function createTokenObject(string $tokenString): AuthToken { // TODO unit-test

        $sessionDAO = new SessionDAO();
        $person = $sessionDAO->getPerson($tokenString);

        return new PersonAuthToken($tokenString, $person['workspace_id'], $person['id'], $person['login_id']);
    }

    function getTokenName(): string {

        return 'p';
    }
}

