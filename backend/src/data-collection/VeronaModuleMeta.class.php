<?php

class VeronaModuleMeta implements jsonSerializable {

    public string $veronaModuleType;
    public string $veronaModuleId;
    public int $versionMayor;
    public int $versionMinor;
    public int $versionPatch;
    public string $versionLabel;
    public string $veronaVersion;
    public string $version;

    public function __construct(
        string $veronaModuleType = "",
        string $veronaModuleId = "",
        int $versionMayor = 0,
        int $versionMinor = 0,
        int $versionPatch = 0,
        string $versionLabel = "",
        string $veronaVersion = ""
    ) {

        $this->veronaModuleType = $veronaModuleType;
        $this->veronaModuleId = $veronaModuleId;
        $this->versionMayor = $versionMayor;
        $this->versionMinor = $versionMinor;
        $this->versionPatch = $versionPatch;
        $this->versionLabel = $versionLabel;
        $this->veronaVersion = $veronaVersion;
        $this->version = Version::asString($versionMayor, $versionMinor, $versionPatch, $versionLabel);
    }

    public function jsonSerialize(): mixed {

        $output = (object) [];
        if ($this->veronaModuleType) {
            $output->veronaModuleType = $this->veronaModuleType;
            $output->veronaVersion = $this->veronaVersion;
            $output->version = $this->version;
        }
        return $output;
    }

}