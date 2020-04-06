<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test


class RequirePersonToken extends RequireToken {

    function createTokenObject(string $tokenString): AuthToken { // TODO unit-test

        $sessionDAO = new SessionDAO();
        $person = $sessionDAO->getPerson($tokenString);

        return new PersonAuthToken(
            $tokenString,
            (int) $person['workspace_id'],
            (int) $person['id'],
            (int) $person['login_id'],
            $person['mode']
        );
    }

    function getTokenName(): string {

        return 'p';
    }
}

