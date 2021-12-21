<?php
/** @noinspection PhpUnhandledExceptionInspection */


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
}
