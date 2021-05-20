<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

/*
 * data holding class
 *
 * for some data-classes we use this weak-typed class, for those where it seemed to be especially important
 * a typesafe variant with getters/setters
 * TODO with PHP7.4 both can be merged and will be typesafe without getters/setters
 *
 */

abstract class DataCollection implements JsonSerializable {


    static function fromFile(string $path = null): DataCollection {

        if (!file_exists($path)) {
            throw new Exception("JSON file not found: `$path`");
        }

        $initData = JSON::decode(file_get_contents($path), true);

        $class = get_called_class();

        return new $class($initData);
    }


    function __construct($initData, bool $allowAdditionalInitData = false) {

        $class = get_called_class();

        foreach ($initData as $key => $value) {
            if (property_exists($this, $key)) {

                $isEmptyString = (($value === "") and is_string($this->$key));
                $this->$key = ($isEmptyString or $value) ? $value : $this->$key;
            } else if (!$allowAdditionalInitData) {
                throw new Exception("$class creation error:`$key` is unknown in `" . get_class($this) . "`.");
            }
        }

        foreach ($this as $key => $value) {

            if ($value === null) {
                throw new Exception("$class creation error: `$key` shall not be null after creation.");
            }
        }
    }


    public function jsonSerialize(): array{

        $jsonData = [];

        foreach ($this as $key => $value) {

            if (substr($key,0 ,1) != '_') {
                $jsonData[$key] = $value;
            }
        }

        return $jsonData;
    }
}
