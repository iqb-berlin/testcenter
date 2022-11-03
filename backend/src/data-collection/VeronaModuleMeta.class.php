<?php

class VeronaModuleMeta implements JsonSerializable {

    public string $veronaVersion = "";
    public string $version = "";
    public string $playerId = "";
    public string $description = "";
    public string $label = "";
    public string $veronaModuleType = "";

    public function jsonSerialize(): array{

        $jsonData = [];

        foreach ($this as $key => $value) {

            if ($value) {
                $jsonData[$key] = $value;
            }
        }

        return $jsonData;
    }
}