<?php

spl_autoload_register(function($className) {

    $className = explode("\\", $className);
    $className = array_pop($className);

    if (class_exists($className)) {
        throw new Exception("Class EXIST: $className");
    }

    $includeDirs = [
        ROOT_DIR . "/backend/src"
    ];

    foreach ($includeDirs as $includeDir) {
        foreach (glob("$includeDir/{,*/,*/*/,*/*/*/}$className{.class.php,.php,.enum.php}", GLOB_BRACE) as $classFile) {
            require_once $classFile;
            return;
        }
    }
});
