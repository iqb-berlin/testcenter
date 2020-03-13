<?php

use org\bovigo\vfs\vfsStream;

/**
 * set up virtual file system and DB - for e2e tests
 */

try {

    $vfs = vfsStream::setup('root', 0777);
    vfsStream::newDirectory('vo_data', 0777)->at($vfs);

    define('DATA_DIR', vfsStream::url('root/vo_data'));

    DB::connect(new DBConfig([
        'type' => 'temp',
        'staticTokens' => true
    ]));

    $initArgs = [
        'user_name' => 'super',
        'user_password' => 'user123',
        'workspace' => '1',
        'test_login_name' => 'test',
        'test_login_password' => 'user123',
        'test_person_codes' => 'xxx yyy'
    ];

    $initDAO = new InitDAO();
    $initDAO->runFile('scripts/sql-schema/sqlite.sql');
    $adminDAO = new AdminDAO();

    $initializer = new WorkspaceInitializer();
    $initializer->importSampleData(1, $initArgs);

    $initDAO->addSuperuser($initArgs['user_name'], $initArgs['user_password']);
    $adminDAO->createAdminToken($initArgs['user_name'], $initArgs['user_password']);
    $initDAO->addWorkspace('sample_workspace');
    $initDAO->grantRights($initArgs['user_name'], 1);

    $initializer->createSampleLoginsReviewsLogs('xxx');

    $fullState = "# State of DATA_DIR\n\n";
    $fullState .= print_r(Folder::getContentsRecursive(DATA_DIR), 1);
    $fullState .= "\n\n# State of DB\n";
    $fullState .= $initDAO->getDBContentDump();
    file_put_contents(ROOT_DIR . '/integration/tmp/lastVEState.md', $fullState);

} catch (Exception $e) {

    $errorUniqueId = ErrorHandler::logException($e, true);
    http_response_code(500);
    header("Error-ID:$errorUniqueId");
    echo "Could not create virtual environment: " . $e->getMessage();
    exit(1);
}
