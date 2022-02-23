<?php

spl_autoload_register(function($className) {

    $className = explode("\\", $className);
    $className = array_pop($className);

    $includeDirs = [
        ROOT_DIR . "/backend/src"
    ];

    foreach ($includeDirs as $includeDir) {
        foreach (glob("$includeDir/{,*/,*/*/,*/*/*/}$className{.class.php,.php}", GLOB_BRACE) as $classFile) {
            require_once $classFile;
            return;
        }
    }

    throw new Exception("Fatal error: Class not found: $className");
});
