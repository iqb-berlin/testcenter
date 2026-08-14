#!/usr/bin/env php
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
  SystemConfig::applyVersionFromPackageJson();
  $systemVersion = SystemConfig::$system_version;
  CLI::h1("IQB TESTCENTER BACKEND $systemVersion");

  if (file_exists(ROOT_DIR . '/backend/config/init.lock')) {
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
  SystemConfig::readEnvironment();
  CLI::success("Environment variables successfully read.");
  CLI::connectDBWithRetries();
  CLI::success("Database successfully connected.");

  CLI::h2("Check Database Settings");
  $initDAO = new InitDAO();

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
    $initDAO->runFile(ROOT_DIR . "/scripts/database/full.postgres.sql");
  }

  $dbSchemaVersion = $initDAO->getDBSchemaVersion();
  $isCurrentVersion = Version::compare($dbSchemaVersion) >= 0; // 1 : DB is current version!, -1 : DB is outdated
  CLI::p("Database schema version is $dbSchemaVersion, system version is $systemVersion");
  if ($isCurrentVersion) {
    echo ": DB Schema is uptodate";
  } else {
    CLI::p("Looking for new patches to install.");
    $patchInstallReport = $initDAO->installPatches(ROOT_DIR . "/scripts/database/patches.d");
    foreach ($patchInstallReport['patches'] as $patch) {
      if (isset($patchInstallReport['errors'][$patch])) {
        CLI::warning("* $patch: {$patchInstallReport['errors'][$patch]}");
      } else {
        CLI::success("* $patch: installed successfully.");
      }
    }
    if (count($patchInstallReport['errors'])) {
      throw new Exception('Installing database patches failed.');
    }
  }

  $newDbStatus = $initDAO->getDbStatus();
  if (!($newDbStatus['tables'] == 'complete') and !$args['skip_db_integrity_check']) {
    throw new Exception("Database integrity check failed: {$newDbStatus['message']}");
  }
  $initDAO->setDBSchemaVersion($systemVersion);
  CLI::success("DB passed integrity check.");

  // todo postgres is full.sql still needed after migration
  // tables is 'complete', if the current database has all tables, declared in self::tables; not the case for initialize/general scripts that test incomplete table states
  if ($newDbStatus['tables'] === 'complete') {
    $initDAO->writeFullSchema(ROOT_DIR . '/scripts/database/full.sql');
  }

//  CLI::h2("Workspaces");
//
//  if (!file_exists(DATA_DIR)) {
//    mkdir(DATA_DIR);
//    CLI::success("Data-Directory created: `" . DATA_DIR . "`");
//  }
//
//  $initializer = new WorkspaceInitializer();
//
//  if ($args['overwrite_existing_installation']) {
//    foreach (Workspace::getAll() as /* @var $workspace Workspace */ $workspace) {
//      $filesInWorkspace = array_reduce($workspace->countFilesOfAllSubFolders(), function($carry, $item) {
//        return $carry + $item;
//      }, 0);
//
//      $initializer->cleanWorkspace($workspace->getId());
//      CLI::warning("Workspace-folder `ws_{$workspace->getId()}` was DELETED. It contained {$filesInWorkspace} files.");
//
//      Folder::deleteContentsRecursive($workspace->getWorkspacePath());
//    }
//  }
//
//  $workspaceIds = [];
//
//  foreach (Workspace::getAll() as /* @var $workspace Workspace */ $workspace) {
//    $workspaceData = $initDAO->createWorkspaceIfMissing($workspace);
//    $workspaceIds[] = $workspaceData['id'];
//    CLI::h3("Workspace `{$workspaceData['name']}`");
//    if (isset($workspaceData['restored'])) {
//      CLI::warning("Orphaned workspace-folder found `ws_{$workspaceData['id']}` and restored in DB.");
//    }
//
//    if (!$args['skip_read_workspace_files']) {
//      $t1 = microtime(true);
//
//      $currentHashOfFiles = $workspace->getWorkspaceHash();
//      if ($workspace->hasFilesChanged($currentHashOfFiles)) {
//        $stats = $workspace->storeAllFiles();
//        $workspace->setWorkspaceHash();
//        CLI::p("Logins updated: -{$stats['logins']['deleted']} / +{$stats['logins']['added']}");
//
//        $statsString = implode(
//          ", ",
//          array_filter(
//            array_map(
//              function($key, $value) {
//                return $value ? "$key: $value" : null;
//              },
//              array_keys($stats['valid']),
//              array_values($stats['valid']),
//            )
//          )
//        );
//        $t2 = microtime(true);
//        $duration = $t2 - $t1;
//        CLI::p("Files found: " . $statsString);
//        CLI::p("Processing time: $duration sec.");
//
//        if ($stats['invalid']) {
//          CLI::warning("Invalid files found: {$stats['invalid']}");
//        }
//        $i = 0;
//        foreach ($stats['reports'] as $file => $report) {
//          if ($i++ > 4) {
//            CLI::warning('.. and ' . ($stats['invalid'] - 5) . ' more.');
//            break;
//          }
//          CLI::warning(' - ' . $file);
//          foreach ($report as $entry) {
//            CLI::warning('   - ' . $entry);
//          }
//        }
//
//      } else {
//        CLI::p("No changes in files detected.");
//      }
//    }
//  }
//
//  if (!count($workspaceIds) and !$args['dont_create_sample_data']) {
//    $sampleWorkspaceId = $initDAO->createWorkspace('Sample Workspace');
//    $sampleWorkspace = new Workspace($sampleWorkspaceId);
//
//    CLI::success("Sample Workspace as `ws_$sampleWorkspaceId` created");
//
//    $initializer->importSampleFiles($sampleWorkspaceId);
//
//    if (!$args['skip_read_workspace_files']) {
//      $stats = $sampleWorkspace->storeAllFiles();
//      $sampleWorkspace->setWorkspaceHash();
//      array_map(
//        fn($k, $v) => CLI::p("$v ($k) files were stored."),
//        array_keys($stats['valid']),
//        array_values($stats['valid'])
//      );
//    }
//
//    CLI::success("Sample content files created.");
//
//    $workspaceIds[] = $sampleWorkspaceId;
//  }
//
//  CLI::h2("Sys-Admin");
//
//  if (!$initDAO->adminExists() and !$args['dont_create_sample_data']) {
//    CLI::warning("No Sys-Admin found.");
//
//    $initial_admin_password = SystemConfig::$admin_init_password;
//    $adminId = $initDAO->createAdmin('super', $initial_admin_password);
//    CLI::success("Sys-Admin \"super\" created.");
//
//    $initDAO->addWorkspacesToAdmin($adminId, $workspaceIds);
//    foreach ($workspaceIds as $workspaceId) {
//      CLI::p("Workspace `ws_$workspaceId` added to \"super\".");
//    }
//
//  } else {
//    CLI::p("At least one Sys-Admin found; nothing to do.");
//  }
//
//  $bsStatus = BroadcastService::getStatus();
//  if ($bsStatus == 'online') {
//    CLI::h2("Flashing Broadcaster");
//    BroadcastService::send('system/clean');
//  }
//
  CLI::h1("Ready.");

} catch (InvalidArgumentException $e) {
  CLI::warning($e->getMessage());
  exit(0);

} catch (Exception $e) {
  CLI::error($e->getMessage());
  echo "\n";
  ErrorHandler::logException($e, true);
  if (file_exists(ROOT_DIR . '/backend/config/init.lock')) {
    unlink(ROOT_DIR . '/backend/config/init.lock');
  }
  file_put_contents(ROOT_DIR . '/backend/config/error.lock', $e->getMessage());
  exit(1);
}

if (file_exists(ROOT_DIR . '/backend/config/init.lock')) {
  unlink(ROOT_DIR . '/backend/config/init.lock');
}

echo "\n";
exit(0);
