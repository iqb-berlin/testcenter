<?php


class DataCollection2 implements JsonSerializable {


    static function fromFile(string $path = null): DataCollection {

        if (!file_exists($path)) {
            throw new Exception("JSON file not found: `$path`");
        }

        $connectionData = JSON::decode(file_get_contents($path));

        $class = get_called_class();

        return new $class($connectionData);
    }


    public function jsonSerialize() {

        $jsonData = [];

        foreach ($this as $key => $value) {

            if (substr($key,0 ,1) != '_') {
                $jsonData[$key] = $value;
            }
        }

        return $jsonData;
    }
}
