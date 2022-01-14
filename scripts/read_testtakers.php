<?php

if (php_sapi_name() !== 'cli') {

    header('HTTP/1.0 403 Forbidden');
    echo "This is only for usage from command line.";
    exit(1);
}

define('ROOT_DIR', realpath(dirname(__FILE__) . '/..'));
define('DATA_DIR', ROOT_DIR . '/vo_data');

require_once(ROOT_DIR . '/autoload.php');

try {

    DB::connect();
    $initDAO = new InitDAO();

    foreach (Workspace::getAll() as /* @var $workspace Workspace */ $workspace) {

        CLI::h1("workspace " . $workspace->getId());
        $initDAO->createWorkspaceIfMissing($workspace);
        $validator = new WorkspaceValidator($workspace->getId());

        foreach (Folder::glob($workspace->getOrCreateSubFolderPath('Testtakers'), "*.[xX][mM][lL]") as $fullFilePath) {

            $xFile = new XMLFileTesttakers($fullFilePath);
            $xFile->crossValidate($validator);

            if ($xFile->isValid()) {

                $deleted = $initDAO->deleteLoginSource($workspace->getId(), $xFile->getName());
                $added = $initDAO->addLoginSource($workspace->getId(), $xFile->getName(), $xFile->getAllLogins());
                CLI::h2("file: {$xFile->getName()}  (-$deleted/+$added)");
            } else {
                CLI::h2("file: {$xFile->getName()}");
                CLI::warning('invalid: ' . implode(', ', $xFile->getValidationReportSorted()['error']));
            }
        }
    }
} catch (Exception $e) {

    CLI::error($e->getMessage());
    echo "\n";
    ErrorHandler::logException($e, true);
    exit(1);
}

echo "\n";
exit(0);