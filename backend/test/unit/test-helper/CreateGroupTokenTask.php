<?php

use Amp\Cancellation;
use Amp\Parallel\Worker\Task;
use Amp\Sync\Channel;
use function Amp\delay;

require_once "test/unit/bootstrap.php";
require_once "test/unit/mock-classes/PasswordMock.php";
require_once "test/unit/TestDB.class.php";

readonly class CreateGroupTokenTask implements Task {
  public function __construct(
    private Login $login,
  ){  }

  public function run(Channel $channel, Cancellation $cancellation): string {
    DB::connectToTestDB();
    SystemConfig::$debug_useStaticTokens = true;
    $slowerSessionDao = new class extends SessionDAO {
      public function _(string $sql, array $replacements = [], $multiRow = false): ?array {
        delay(1);
        return parent::_($sql, $replacements, $multiRow);
      }
    };
    try {
      return $slowerSessionDao->getOrCreateGroupToken($this->login);
    } catch (Exception $e) {
      return $e->getMessage();
    }

  }
}