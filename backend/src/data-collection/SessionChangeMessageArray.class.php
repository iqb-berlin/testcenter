<?php

/** @noinspection PhpUnhandledExceptionInspection */
// TODO unit-test

class SessionChangeMessageArray implements IteratorAggregate {

    protected $array = [];

    public function __construct(SessionChangeMessage... $messages) {

        $this->array = $messages;
    }


    public function add(SessionChangeMessage $message) {

        $this->array[] = $message;
    }


    public function getIterator(): Iterator {

        return new ArrayIterator($this->array);
    }


    public function asArray() : array {

        return $this->array;
    }
}
