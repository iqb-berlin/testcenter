<?php

class PlayerMeta implements JsonSerializable {

    public string $veronaVersion = "";
    public string $version = "";
    public string $playerId = "";
    public string $description = "";
    public string $label = "";

    public function jsonSerialize(): mixed {

        $jsonData = [];

        foreach ($this as $key => $value) {

            if ($value) {
                $jsonData[$key] = $value;
            }
        }

        return $jsonData;
    }
}