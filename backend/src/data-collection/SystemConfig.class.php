<?php
/** @noinspection PhpUnhandledExceptionInspection */

class SystemConfig extends DataCollection {

    public string $broadcastServiceUriPush = "";
    public string $broadcastServiceUriSubscribe = "";
    public string $fileServiceUri = "";
    public bool $allowExternalXMLSchema = true;
}
