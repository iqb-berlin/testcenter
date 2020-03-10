<?php

/** @noinspection PhpUnhandledExceptionInspection */

class AbstractDataCollection {

    function __construct($initData) {

        foreach ($initData as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            } else {
                throw new Exception("TestSession creation error:`$key` is unknown in `" . get_class($this) . "`");
            }
        }

        foreach ($this as $key => $value) {

            if ($value === null) {
                throw new Exception("TestSession creation error: `$key` is shall not be null after creation");
            }
        }
    }
}
