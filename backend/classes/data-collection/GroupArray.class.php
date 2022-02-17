<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class GroupArray implements IteratorAggregate {

    protected $array = [];

    public function __construct(Group... $groups) {

        $this->array = $groups;
    }


    public function add(Group $group) {

        $this->array[] = $group;
    }


    public function getIterator(): Iterator {

        return new ArrayIterator($this->array);
    }


    public function asArray() : array {

        return $this->array;
    }
}
