<?php

use org\bovigo\vfs\vfsStream;

/**
 * set up virtual file system and DB - for unit tests for example
 */

/*
* STAND umbau
* # Root dir überall gegen conf, data und Code ersetzen
* # Beim Aufruf  vm conf und root virtualisieren (damit wird auch die DB virtualisiert)
* Sicherstellen, dass keine clevel fs Funktionen erlaubt sind - was passiert überhaupt, wenn sie benutzt werden
* Init SQL und data trennen für unit Tests
* Dredd den test Header mit schicken lassen und Copy files löschen
*
*
*/

try {

    $vfs = vfsStream::setup('root', 0777);
    vfsStream::newDirectory('config', 0777)->at($vfs);
    vfsStream::newDirectory('vo_data', 0777)->at($vfs);
    file_put_contents(vfsStream::url('root/config/DBConnectionData.json'), '{"type": "temp"}');
    file_put_contents(vfsStream::url('root/config/customTexts.json'), '{"aCustomText_key": "a Custom Text Value"}');

    define('DATA_DIR', vfsStream::url('root/vo_data'));
    define('CONFIG_DIR', vfsStream::url('root/config'));
    define('GLOBAL_PDO', new PDO('sqlite::memory:'));

    DB::connect();

    $initArgs = [
        'user_name' => 'super',
        'user_password' => 'user123',
        'workspace' => '1',
        'test_login_name' => 'test',
        'test_login_password' => 'user123',
        'test_person_codes' => 'xxx yyy'
    ];

    $initDAO = new InitDAO();
    $initDAO->runFile('scripts/sql-schema/sqlite.sql'); // TODO split database schema and test data

    $initializer = new WorkspaceInitializer();
    $initializer->importSampleData(1, $initArgs);
//
//    $initDAO->addSuperuser($initArgs['user_name'], $initArgs['user_password']);
//    $initDAO->grantRights($initArgs['user_name'], 1);
//    $initializer->createSampleLoginsReviewsLogs('xxx');

} catch (Exception $e) {

    http_response_code(500);
    error_log('Fatal error creating virtual environment:' . $e->getMessage());
    error_log($errorPlace = $e->getFile() . ' | line ' . $e->getLine());
    echo "Could not create virtual environment: " . $e->getMessage();
    exit(1);
}
