<?php
define('ROOT_DIR', realpath(__DIR__ . '/../..'));
const DATA_DIR = ROOT_DIR . '/data';
require_once(ROOT_DIR . '/backend/autoload.php');

$args = CLI::getOpt();

define("WORKSPACES", $args['workspaces'] ?? 2);
define("TTFILES_PER_WORKSPACE", $args['ttfiles_per_workspace'] ?? 2);
define("GROUPS_PER_TTFILE", $args['groups_per_ttfile'] ?? 5);
define("LOGINS_PER_GROUP", $args['logins_per_group'] ?? 10);
define("CODES_PER_LOGIN", $args['codes_per_login'] ?? 5);
define("CODE_LENGTH", $args['code_length'] ?? 3);
define("PASSWORD_LENGTH", $args['password_length'] ?? 8);
define("BOOKLETS_PER_PERSON", explode(',', $args['booklet_per_person'] ?? 'BOOKLET.SAMPLE-1,BOOKLET.SAMPLE-2,BOOKLET.SAMPLE-3'));
define("START_TEST_PROBABILITY", $args['start_test_probability'] ?? 0.3);
define("LOCK_TEST_PROBABILITY", $args['lock_test_probability'] ?? 0.3);

$runCode = Random::string(10, false, "abcdefghijklmnopqrstuvwxyz0123456789");

// https://gist.github.com/Clicketyclick/7803adb4b2b3da6ec1b7c9b1f29d9552
function progressBar(int|float $done, int|float $total, string $info="", int $width = 50, string $off = '_', string $on = '#'): string {
  $perc = round(($done * 100) / $total);
  $bar = round(($width * $perc) / 100);

  if ( $bar > $width )  // Catch overflow where done > total
    $bar = $width;

  return sprintf(
    "%s [%s%s] %3.3s%% %s/%s\r",
    $info,
    str_repeat( $on, $bar),
    str_repeat($off, $width - $bar), $perc, $done, $total
  );
}

try {
  CLI::h1("Create Massive Test Data!");
  CLI::p("Run code: `$runCode`");

  CLI::h2("Connect to Database");
  CLI::connectDBWithRetries();

  $initDAO = new InitDAO();
  $initializer = new WorkspaceInitializer();

  $logins = [];

  if (CODES_PER_LOGIN) {
    $codes = array_map(
      function($a) {
        return Random::string(CODE_LENGTH, false);
      },
      range(1, CODES_PER_LOGIN)
    );
    $codesStr = 'codes="' . implode(' ', $codes) . '"';
  } else {
    $codes = [''];
    $codesStr = '';
  }

  CLI::h2("Files");

  for ($wsIndex = 0; $wsIndex < WORKSPACES; $wsIndex++) {
    CLI::h3("Workspace #$wsIndex");

    $wsId = $initDAO->createWorkspace("#$runCode#$wsIndex");
    $ws = new Workspace($wsId);

    $initializer->importSampleFiles($wsId);

    $ws->deleteFiles(["Testtakers/SAMPLE_TESTTAKERS.XML"]);

    for ($ttFileIndex = 0; $ttFileIndex < TTFILES_PER_WORKSPACE; $ttFileIndex++) {
      $ttFileName = "{$runCode}_{$wsIndex}_{$ttFileIndex}";
      $ttFile = '<?xml version="1.0" encoding="utf-8"?><Testtakers><Metadata/>';

      for ($groupIndex = 0; $groupIndex < GROUPS_PER_TTFILE; $groupIndex++) {
        $groupName = "{$ttFileName}_$groupIndex";
        $groupLabel = "Group: $groupName";

        $ttFile .= "\n<Group id=\"$groupName\" label=\"$groupLabel\">";

        for ($loginIndex = 0; $loginIndex < LOGINS_PER_GROUP; $loginIndex++) {
          $login = "login_{$groupName}_$loginIndex";
          $code2booklets = [];
          foreach ($codes as $code) {
            $code2booklets[$code] = BOOKLETS_PER_PERSON;
          }
          $password = Random::string(PASSWORD_LENGTH, false);
          $logins[] = new Login(
            $login,
            $password,
            'run-hot-restart',
            $groupName,
            $groupLabel,
            $code2booklets,
            $wsId
          );
          $passwordStr = PASSWORD_LENGTH ? "pw=\"$password\"" : '';
          $ttFile .= "\n<Login mode=\"run-hot-return\" name=\"$login\" $passwordStr>\n";
          $ttFile .=
            implode("\n",
              array_map(
                function($bookletId) use ($codesStr) {
                  return "<Booklet $codesStr>$bookletId</Booklet>";
                },
                BOOKLETS_PER_PERSON
              )
            );
          $ttFile .= "\n</Login>";
        }

        $ttFile .= "\n<Login mode=\"monitor-group\" name=\"monitor_{$groupName}\" />";
        $ttFile .= "\n</Group>";
      }

      $ttFile .= "\n</Testtakers>";
//      echo $ttFile;

      file_put_contents($ws->getWorkspacePath() . "/Testtakers/$ttFileName.xml", $ttFile);
    }

    $stats = $ws->storeAllFiles();
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
    CLI::p("Created Files: " . $statsString);
    if ($stats['invalid']) {
      CLI::warning("Invalid files found: {$stats['invalid']}");
    }
  }

  CLI::h3("Sessions");
  echo "\n";

  $sessionDAO = new SessionDAO();

  $personSessions = [];
  foreach ($logins as $login) {
    /* @var $login Login */
    foreach ($codes as $code) {
      $loginSession = $sessionDAO->createLoginSession($login);
      $personSessions[] = $sessionDAO->createOrUpdatePersonSession($loginSession, $code);
    }
    echo progressBar(count($personSessions), count($logins) * count($codes));
  }
  CLI::p("Created " . count($personSessions) . " PersonSessions");

  CLI::h3("Tests");

  $testDAO = new TestDAO();
  $tests = [];
  echo "\n";
  foreach ($personSessions as $personSession) {
    /* @var $personSession PersonSession */
    foreach (BOOKLETS_PER_PERSON as $bookletId) {
      $tests[] = $testDAO->getOrCreateTest($personSession->getPerson()->getId(), $bookletId, "Label: $bookletId");
    }
    echo progressBar(count($tests), count($personSessions) * count(BOOKLETS_PER_PERSON));
  }

  CLI::p("Created " . count($tests) . " Tests");

  if (START_TEST_PROBABILITY or LOCK_TEST_PROBABILITY) {
    echo "\n";
    $statsTestsRunning = 0;
    $statsTestsLocked = 0;
    $statsTestsTouched = 0;
    foreach ($tests as $test) {
      if (rand(0, 100) <= START_TEST_PROBABILITY * 100) {
        $testDAO->setTestRunning($test['id']);
        $statsTestsRunning++;
      }
      if (rand(0, 100) <= LOCK_TEST_PROBABILITY * 100) {
        $testDAO->lockTest($test['id']);
        $statsTestsLocked++;
      }
      echo progressBar($statsTestsTouched++, count($tests));
    }

    CLI::p("$statsTestsRunning tests made running and $statsTestsLocked locked.");
  }

} catch (Exception $e) {
  CLI::error($e->getMessage());
  echo "\n";
  ErrorHandler::logException($e, true);
  exit(1);
}

echo "\n";
exit(0);



