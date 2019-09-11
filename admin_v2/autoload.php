<?php

spl_autoload_register(function($className) {

    $className = array_pop(explode("\\", $className));

    error_log("TRY to autoload $className");
    $includeDirs = [
        ROOT_DIR . "/vo_code",
        ROOT_DIR . "/admin_v2/classes"
    ];

    foreach ($includeDirs as $includeDir) {
        foreach (glob("$includeDir/{,*/,*/*/,*/*/*/}$className{.class.php,.php}", GLOB_BRACE) as $classFile) {
            error_log("found class file: $classFile");
            require_once $classFile;
            return;
        }
    }

    throw new Exception("Fatal error: Class not found: $className");
});
