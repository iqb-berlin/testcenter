#!/usr/bin/php
<?php
/**
 * # Parameters
 * ```
 * --overwrite_existing_installation
 * --skip_db_integrity_check
 * --skip_read_workspace_files
 * --dont_create_sample_data
 * ```
 */

if (php_sapi_name() !== 'cli') {
  header('HTTP/1.0 403 Forbidden');
  echo "This is only for usage from command line.";
  exit(1);
}

ini_set('memory_limit', '1G');

define('ROOT_DIR', realpath(__DIR__ . '/..'));
const DATA_DIR = ROOT_DIR . '/data';

require_once "vendor/autoload.php";

try {
  SystemConfig::readVersion();
  $systemVersion = SystemConfig::$system_version;
  CLI::h1("IQB TESTCENTER BACKEND $systemVersion");

  if(file_exists(ROOT_DIR . '/backend/config/init.lock')) {
    throw new InvalidArgumentException("Initialize is already running.");
  }
  if (file_exists(ROOT_DIR . '/backend/config/error.lock')) {
    $msg = file_get_contents(ROOT_DIR . '/backend/config/error.lock');
    unlink(ROOT_DIR . '/backend/config/error.lock');
    CLI::warning("Last initialize failed with error: $msg.");
    CLI::warning("Trying again:");
  }
  file_put_contents(ROOT_DIR . '/backend/config/init.lock', '.');

  $opt = CLI::getOpt();
  $args = [
    'overwrite_existing_installation' => isset($opt['overwrite_existing_installation']),
    'skip_db_integrity_check' => isset($opt['skip_db_integrity_check']),
    'skip_read_workspace_files' => isset($opt['skip_read_workspace_files']),
    'dont_create_sample_data' => isset($opt['dont_create_sample_data'])
  ];

  if (count($opt)) {
    CLI::h2("Initialization Options:");
    foreach ($args as $arg => $isset) {
      if ($isset) {
        CLI::p(" * $arg");
      }
    }
  }

  CLI::h2("System-Config");
  try {
    SystemConfig::readFromEnvironment();
    CLI::connectDBWithRetries();
    SystemConfig::write();
    CLI::success("New config file created at `/backend/config/config.ini`.");
  } catch (Exception $e) {
    CLI::warning("Failed to write new config file:" . $e->getMessage());
    if (!file_exists(ROOT_DIR . '/backend/config/config.ini')) {
      throw new Exception("No Config file found at `/backend/config/config.ini`!");
    }
    SystemConfig::read();
    CLI::connectDBWithRetries();
    CLI::success("Config file found at `/backend/config/config.ini`.");
  }

  CLI::h2("Check Database Settings");
  $initDAO = new InitDAO();
  if (!$initDAO->checkSQLMode()) {
    throw new Exception('SQLMode is not set properly. Check the config and restart.');
  }
  CLI::success("SQL-Mode seems to be OK.");

  CLI::h2("Database Structure");

  $dbStatus = $initDAO->getDbStatus();
  CLI::p("Database status: {$dbStatus['message']}");

  if ($args['overwrite_existing_installation']) {
    CLI::warning("Clear database");
    $tablesDropped = $initDAO->clearDB();
    CLI::p("Tables dropped: " . implode(', ', $tablesDropped));
  }

  if ($args['overwrite_existing_installation'] or ($dbStatus['tables'] == 'empty')) {
    CLI::p("Install basic database structure");
    $initDAO->runFile(ROOT_DIR . "/scripts/database/base.sql");
  }

  $dbSchemaVersion = $initDAO->getDBSchemaVersion();
  $isCurrentVersion = Version::compare($dbSchemaVersion); // 1 : System is older than DB!, -1 : DB is outdated
  CLI::p("Database schema version is $dbSchemaVersion, system version is $systemVersion");
  if ($isCurrentVersion >= 0) {
    echo ": O.K.";

  } else {
    CLI::p("Install patches if necessary");
    $allowFailing = (in_array($dbSchemaVersion, ['0.0.0-no-table', '0.0.0-no-value']));
    $patchInstallReport = $initDAO->installPatches(ROOT_DIR . "/scripts/database/patches.d", $allowFailing);
    foreach ($patchInstallReport['patches'] as $patch) {
      if (isset($patchInstallReport['errors'][$patch])) {
        CLI::warning("* $patch: {$patchInstallReport['errors'][$patch]}");

      } else {
        CLI::success("* $patch: installed successfully.");
      }
    }
    if (count($patchInstallReport['errors']) and !$allowFailing) {
      throw new Exception('Installing database patches failed.');
    }
  }

  $newDbStatus = $initDAO->getDbStatus();
  if (!($newDbStatus['tables'] == 'complete') and !$args['skip_db_integrity_check']) {
    throw new Exception("Database integrity check failed: {$newDbStatus['message']}");
  }
  $initDAO->setDBSchemaVersion($systemVersion);
  CLI::success("DB passed integrity check.");

  CLI::h2("Workspaces");

  if (!file_exists(DATA_DIR)) {
    mkdir(DATA_DIR);
    CLI::success("Data-Directory created: `" . DATA_DIR . "`");
  }

  $initializer = new WorkspaceInitializer();

  if ($args['overwrite_existing_installation']) {
    foreach (Workspace::getAll() as /* @var $workspace Workspace */ $workspace) {
      $filesInWorkspace = array_reduce($workspace->countFilesOfAllSubFolders(), function($carry, $item) {
        return $carry + $item;
      }, 0);

      $initializer->cleanWorkspace($workspace->getId());
      CLI::warning("Workspace-folder `ws_{$workspace->getId()}` was DELETED. It contained {$filesInWorkspace} files.");

      Folder::deleteContentsRecursive($workspace->getWorkspacePath());
    }
  }

  $workspaceIds = [];

  foreach (Workspace::getAll() as /* @var $workspace Workspace */ $workspace) {
    $workspaceData = $initDAO->createWorkspaceIfMissing($workspace);
    $workspaceIds[] = $workspaceData['id'];
    CLI::h3("Workspace `{$workspaceData['name']}`");
    if (isset($workspaceData['restored'])) {
      CLI::warning("Orphaned workspace-folder found `ws_{$workspaceData['id']}` and restored in DB.");
    }

    if (!$args['skip_read_workspace_files']) {
      $t1 = microtime(true);

      $currentHashOfFiles = $workspace->getWorkspaceHash();
      if ($workspace->hasFilesChanged($currentHashOfFiles)) {
        $stats = $workspace->storeAllFiles();
        $workspace->setWorkspaceHash();
        CLI::p("Logins updated: -{$stats['logins']['deleted']} / +{$stats['logins']['added']}");

        $statsString = implode(
          ", ",
          array_filter(
            array_map(
              function($key, $value) {
                return $value ? "$key: $value" : null;
              },
              array_keys($stats['valid']),
              array_values($stats['valid']),
            )
          )
        );
        $t2 = microtime(true);
        $duration = $t2 - $t1;
        CLI::p("Files found: " . $statsString);
        CLI::p("Processing time: $duration sec.");

        if ($stats['invalid']) {
          CLI::warning("Invalid files found: {$stats['invalid']}");
        }

      } else {
        CLI::p("No changes in files detected.");
      }
    }
  }

  if (!count($workspaceIds) and !$args['dont_create_sample_data']) {
    $sampleWorkspaceId = $initDAO->createWorkspace('Sample Workspace');
    $sampleWorkspace = new Workspace($sampleWorkspaceId);

    CLI::success("Sample Workspace as `ws_$sampleWorkspaceId` created");

    $initializer->importSampleFiles($sampleWorkspaceId);

    if (!$args['skip_read_workspace_files']) {
      $stats = $sampleWorkspace->storeAllFiles();
      $sampleWorkspace->setWorkspaceHash();
      CLI::p("{$stats['valid']} files were stored.");
    }

    CLI::success("Sample content files created.");

    $workspaceIds[] = $sampleWorkspaceId;
  }

  CLI::h2("Sys-Admin");

  if (!$initDAO->adminExists() and !$args['dont_create_sample_data']) {
    CLI::warning("No Sys-Admin found.");

    $adminId = $initDAO->createAdmin('super', 'Superpasswort-10');
    CLI::success("Sys-Admin created: `Superpasswort-10`.");

    $initDAO->addWorkspacesToAdmin($adminId, $workspaceIds);
    foreach ($workspaceIds as $workspaceId) {
      CLI::p("Workspace `ws_$workspaceId` added to `Superpasswort-10`.");
    }

  } else {
    CLI::p("At least one Sys-Admin found; nothing to do.");
  }

  $bsStatus = BroadcastService::getStatus();
  if ($bsStatus == 'online') {
    CLI::h2("Flashing Broadcasting-Service");
    BroadcastService::send('system/clean');
  }

  CLI::h1("Ready.");

} catch (InvalidArgumentException $e) {
  CLI::warning($e->getMessage());
  exit(0);

} catch (Exception $e) {
  CLI::error($e->getMessage());
  echo "\n";
  ErrorHandler::logException($e, true);
  if(file_exists(ROOT_DIR . '/backend/config/init.lock')) {
    unlink(ROOT_DIR . '/backend/config/init.lock');
  }
  file_put_contents(ROOT_DIR . '/backend/config/error.lock', $e->getMessage());
  exit(1);
}

if(file_exists(ROOT_DIR . '/backend/config/init.lock')) {
  unlink(ROOT_DIR . '/backend/config/init.lock');
}

echo "\n";
exit(0);
