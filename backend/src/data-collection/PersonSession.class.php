<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class PersonSession extends DataCollectionTypeSafe {


    protected LoginSession $loginSession;
    protected Person $person;

    public function __construct(LoginSession $loginSession, Person $person) {

        $this->loginSession = $loginSession;
        $this->person = $person;
    }


    public function getLoginSession(): LoginSession {

        return $this->loginSession;
    }


    public function getPerson(): Person {

        return $this->person;
    }


    public function withNewToken(string $token): PersonSession {

       return new PersonSession(
           $this->loginSession,
           $this->person->withNewToken($token)
       );
    }
}
