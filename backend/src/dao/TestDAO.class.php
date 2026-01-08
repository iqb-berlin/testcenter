<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class TestDAO extends DAO {
  // TODO unit test
  public function getTestByPerson(int $personId, string $testName): TestData | null {
    $test = $this->_(
      'select tests.locked, tests.name, tests.id, tests.file_id, tests.laststate, tests.label, tests.running from tests
            where tests.person_id=:personId and tests.name=:testname',
      [
        ':personId' => $personId,
        ':testname' => $testName
      ]
    );

    if (!$test) {
      return null;
    }
    return new TestData(
      $test['id'],
      $test['name'],
      $test['file_id'],
      $test['label'],
      '',
      (bool) $test['locked'],
      (bool) $test['running'],
      JSON::decode($test['laststate'])
    );
  }

  // TODO unit test
  public function createTest(int $personId, TestName $testName, string $bookletLabel): TestData {
    $state = (object) [];
    $this->_(
      'insert into tests (person_id, name, label, laststate, file_id) values (:person_id, :name, :label, :state, :file_id)',
      [
        ':person_id' => $personId,
        ':name' => $testName->name,
        ':label' => $bookletLabel,
        ':state' => json_encode($state),
        ':file_id' => $testName->bookletFileId
      ]
    );

    return new TestData(
      (int) $this->pdoDBhandle->lastInsertId(),
      $testName->name,
      $testName->bookletFileId,
      $bookletLabel,
      '',
      false,
      false,
      $state
    );
  }

  // TODO unit test
  public function getTestById(int $testId): TestData|null {
    $test = $this->_(
      'select tests.locked, tests.name, tests.id, tests.file_id, tests.laststate, tests.label, tests.running from tests where id = :id',
      [
        ':id' => $testId
      ]
    );

    if (!$test) {
      return null;
    }

    return new TestData(
      $test['id'],
      $test['name'],
      $test['file_id'],
      $test['label'],
      '',
      (bool) $test['locked'],
      (bool) $test['running'],
      JSON::decode($test['laststate'])
    );
  }

  // TODO unit test
  public function addTestReview(
    int $testId,
    int $priority,
    string $categories,
    string $entry,
    string $userAgent,
    int $personId
  ): void {
    $this->_(
      'insert into test_reviews (booklet_id, person_id, reviewtime, priority, categories, entry, user_agent) values(:b, :person, :t, :p, :c, :e, :u)',
      [
        ':b' => $testId,
        ':person' => $personId,
        ':t' => TimeStamp::toSQLFormat(TimeStamp::now()),
        ':p' => $priority,
        ':c' => $categories,
        ':e' => $entry,
        ':u' => $userAgent
      ]
    );
  }

  // TODO unit test
  public function addUnitReview(
    int $testId,
    string $unitName,
    int $priority,
    string $categories,
    string $entry,
    string $userAgent,
    string $originalUnitId,
    int $personId,
    ?int $page = null,
    ?string $pageLabel = null,
  ): void {
    $this->_(
      'insert ignore into units (name, test_id, original_unit_id) values(:u, :t, :o)',
      [
        ':u' => $unitName,
        ':t' => $testId,
        ':o' => $originalUnitId
      ]
    );
    $this->_(
      'insert into unit_reviews (
            unit_name,
            person_id,
            test_id,
            reviewtime,
            priority,
            categories,
            entry,
            page,
            pagelabel,
            user_agent
        ) values (:unit_name, :person_id, :test_id, :t, :p, :c, :e, :pa, :pl, :ua)
          ',
      [
        ':unit_name' => $unitName,
        ':person_id' => $personId,
        ':test_id' => $testId,
        ':t' => TimeStamp::toSQLFormat(TimeStamp::now()),
        ':p' => $priority,
        ':c' => $categories,
        ':e' => $entry,
        ':pa' => $page,
        ':pl' => $pageLabel,
        ':ua' => $userAgent,
      ]
    );
  }

  public function getUnitReviews(int $testId, string $unitName, int $personId): array {
    return $this->_(
      'select 
            unit_reviews.id,
            unit_reviews.unit_name,
            unit_reviews.test_id,
            unit_reviews.person_id,
            unit_reviews.reviewtime,
            unit_reviews.priority,
            unit_reviews.categories,
            unit_reviews.entry,
            unit_reviews.page,
            unit_reviews.pagelabel,
            unit_reviews.user_agent as userAgent,
            units.original_unit_id as originalUnitId
          from unit_reviews
          left join units on units.test_id = unit_reviews.test_id 
              and units.name = unit_reviews.unit_name
          where unit_reviews.test_id = :test_id 
            and unit_reviews.unit_name = :unit_name
            and unit_reviews.person_id = :person_id
          order by unit_reviews.reviewtime desc',
      [
        ':test_id' => $testId,
        ':unit_name' => $unitName,
        ':person_id' => $personId
      ],
      true
    );
  }

  public function getTestReviews(int $testId, int $personId): array {
    return $this->_(
        'select
          id,
          booklet_id,
          person_id,
          reviewtime,
          priority,
          categories,
          entry,
          user_agent as userAgent
        from test_reviews
        where booklet_id = :test_id
          and person_id = :person_id
        order by reviewtime desc',
        [
          ':test_id' => $testId,
          ':person_id' => $personId
        ],
        true
      );
  }

  public function deleteUnitReview(int $reviewId, int $personId): void {
    $this->_(
      'delete from unit_reviews 
        where id = :id 
            and person_id = :person_id',
      [
        ':id' => $reviewId,
        ':person_id' => $personId
      ]
    );
  }
    public function deleteTestReview(int $reviewId, int $personId): void {
      $this->_(
        'delete from test_reviews 
        where id = :id 
          and person_id = :person_id',
        [
          ':id' => $reviewId,
          ':person_id' => $personId
        ]
      );
  }

  public function updateUnitReview(
    int $reviewId,
    int $priority,
    string $categories,
    string $entry,
    string $userAgent,
    int $personId
  ): void {
    $this->_(
      'update unit_reviews
      set
        priority = :p,
        categories = :c,
        entry = :e,
        user_agent = :u,
        person_id = :person_id
      where id = :id',
      [
        ':id' => $reviewId,
        ':p' => $priority,
        ':c' => $categories,
        ':e' => $entry,
        ':u' => $userAgent,
        ':person_id' => $personId
      ]
    );
  }

  public function updateTestReview(
    int $reviewId,
    int $priority,
    string $categories,
    string $entry,
    string $userAgent,
    int $personId
  ): void {
    $this->_(
      'update test_reviews
      set
        priority = :p,
        categories = :c,
        entry = :e,
        user_agent = :u,
        person_id = :person_id
      where id = :id',
      [
        ':id' => $reviewId,
        ':p' => $priority,
        ':c' => $categories,
        ':e' => $entry,
        ':u' => $userAgent,
        ':person_id' => $personId
      ]
    );
  }

  public function unitReviewExists(int $reviewId, int $personId): bool {
    $result = $this->_(
      'select count(*) as count 
     from unit_reviews 
     where id = :id 
       and person_id = :person_id',
      [
        ':id' => $reviewId,
        ':person_id' => $personId
      ],
      true
    );
    return $result && $result[0]['count'] > 0;
  }

  public function testReviewExists(int $reviewId, int $personId): bool {
    $result = $this->_(
      'select count(*) as count 
     from test_reviews 
     where id = :id 
       and person_id = :person_id',
      [
        ':id' => $reviewId,
        ':person_id' => $personId
      ],
      true
    );
    return $result && $result[0]['count'] > 0;
  }

  public function getTestState(int $testId): array {
    $test = $this->_(
      'select tests.laststate from tests where tests.id=:testId',
      [
        ':testId' => $testId
      ]
    );

    return ($test) ? JSON::decode($test['laststate'], true) : [];
  }

  // TODO use data-collection class
  public function getTestSession(int $testId): array {
    $testSession = $this->_(
      'select
        login_sessions.id as login_id,
        logins.mode,
        login_sessions.workspace_id,
        logins.group_name as group_name,
        login_sessions.token as login_token,
        person_sessions.code,
        person_sessions.token as person_token,
        tests.person_id, 
        tests.laststate as testState,
        tests.id,
        tests.locked,
        tests.running,
        tests.label
      from 
        tests 
        left join person_sessions on person_sessions.id = tests.person_id
        left join login_sessions on person_sessions.login_sessions_id = login_sessions.id
        left join logins on logins.name = login_sessions.name
      where 
        tests.id=:testId',
      [
        ':testId' => $testId
      ]
    );

    if ($testSession == null) {
      throw new HttpError("Test not found", 404);
    }

    $testSession['laststate'] = $this->getTestFullState($testSession);

    return $testSession;
  }

  // TODO use data-collection class for $statePatch (key-vale pairs)
  public function updateTestState(int $testId, array $statePatch): array {
    $testData = $this->_(
      'select tests.laststate from tests where tests.id=:testId',
      [
        ':testId' => $testId
      ]
    );

    if ($testData == null) {
      throw new HttpError("Test not found", 404);
    }

    $oldState = $testData['laststate'] ? JSON::decode($testData['laststate'], true) : [];
    // TODO add column laststate_update_ts analogous to unit_state to avoid race conditions
    $newState = State::applyPatch($statePatch, $oldState);

    $this->_(
      'update tests set laststate = :laststate, timestamp_server = :timestamp where id = :id',
      [
        ':laststate' => json_encode((object)$newState['newState']),
        ':id' => $testId,
        ':timestamp' => TimeStamp::toSQLFormat(TimeStamp::now())
      ]
    );

    return $newState['newState'];
  }

  public function getUnitState(int $testId, string $unitName): array {
    $unitData = $this->_(
      'select units.laststate from units where units.name = :unitname and units.test_id = :testId',
      [
        ':unitname' => $unitName,
        ':testId' => $testId
      ]
    );

    return $unitData ? JSON::decode($unitData['laststate'], true) : [];
  }

  public function updateUnitState(
    int $testId,
    string $unitName,
    array $statePatch,
    string $originalUnitId = ''
  ): array {
    $unitData = $this->_(
      'select laststate, laststate_update_ts from units where test_id = :testId and name = :unitName',
      [
        ':testId' => $testId,
        ':unitName' => $unitName
      ]
    );
    $oldState = $unitData['laststate'] ? JSON::decode($unitData['laststate'], true) : [];
    $oldStateUpdateTs = $unitData['laststate_update_ts'] ? JSON::decode($unitData['laststate_update_ts'], true) : [];
    $newState = State::applyPatch($statePatch, $oldState, $oldStateUpdateTs);

    // todo save states in separate key-value table instead of JSON blob
    $this->_(
      'insert into units (test_id, name, laststate, laststate_update_ts, original_unit_id)
      values (:testId, :unitName, :laststate, :laststate_update_ts, :originalUnitId)
      on duplicate key update laststate = :laststate, laststate_update_ts = :laststate_update_ts;',
      [
        ':laststate' => json_encode((object)$newState['newState']),
        ':laststate_update_ts' => json_encode($newState['updateTs']),
        ':testId' => $testId,
        ':unitName' => $unitName,
        ':originalUnitId' => $originalUnitId
      ]
    );

    return $newState['newState'];
  }

  // TODO unit test
  public function lockTest(int $testId): void {
    $this->changeTestLockStatus($testId, unlock: false);
  }

  // TODO unit test
  public function unlockTest(int $testId): void {
    $this->changeTestLockStatus($testId, unlock: true);
  }

  // TODO unit test
  private function changeTestLockStatus(int $testId, bool $unlock): void {
    $this->_(
      'update tests set locked = :locked , timestamp_server = :timestamp where id = :id',
      [
        ':locked' => $unlock ? '0' : '1',
        ':id' => $testId,
        ':timestamp' => TimeStamp::toSQLFormat(TimeStamp::now())
      ]
    );
  }

  /* TODO decide on what to do with the different dataTypes per player/unit: the database makes it possible, but the
  application code does treat it like its not possible, because the verona interface does only work with one responseType
  per player/unit */
  public function getDataParts(int $testId, string $unitName): array {
    $result = $this->_(
      'select
          unit_data.part_id,
          unit_data.content,
          unit_data.response_type
        from
          unit_data
        where
          unit_data.unit_name = :unitname
          and unit_data.test_id = :testId
        ',
      [
        ':unitname' => $unitName,
        ':testId' => $testId
      ],
      true
    );

    $unitData = [];
    foreach ($result as $row) {
      $unitData[$row['part_id']] = $row['content'];
    }

    return [
      "dataParts" => $unitData,
      "dataType" => $row['response_type'] ?? '' // TODO see function head
    ];
  }

  public function updateDataParts(
    int $testId,
    string $unitName,
    array $dataParts,
    string $type,
    int $timestamp
  ): void {
    foreach ($dataParts as $partId => $content) {
      $this->_(
      'insert into unit_data(unit_name, test_id, part_id, content, ts, response_type)
            values (:unit_name, :test_id, :part_id, :content, :ts, :response_type)
            on duplicate key update
              content = if (ts < :ts, :content, content),
              ts = if (ts < :ts, :ts, ts),
              response_type = if (ts < :ts, :response_type, response_type);',
        [
          ':unit_name' => $unitName,
          ':test_id' => $testId,
          ':part_id' => $partId,
          ':content' => $content,
          ':ts' => $timestamp,
          ':response_type' => $type
        ]
      );
    }
  }

  // TODO unit test
  public function deleteAttachmentDataPart(string $partId): void {
    // unitId is not necessary for identification, because partId contains unitName and TestId in case of attachments
    $this->_(
      'delete from unit_data where part_id = :partId',
      [':partId' => $partId]
    );
  }

  /**
   * @param UnitLog[] $unitLogs
   */
  public function addUnitLogs(array $unitLogs): void {
    if (empty($unitLogs)) {
      return;
    }

    foreach ($unitLogs as $unitLog) {
      if (!$unitLog instanceof UnitLog) {
        throw new \http\Exception\InvalidArgumentException('All array elements must be UnitLog instances');
      }
    }

    $placeholders = [];
    $params = [];

    /** @var UnitLog $log */
    foreach ($unitLogs as $index => $log) {
      $placeholders[] = "(:unitName{$index}, :testId{$index}, :logentry{$index}, :timestamp{$index})";

      $params[":unitName{$index}"] = $log->unitName;
      $params[":testId{$index}"] = $log->testId;
      $params[":logentry{$index}"] = $log->logKey . ($log->logContent ? ' = ' . $log->logContent : '');
      $params[":timestamp{$index}"] = $log->timestamp;
    }

    $sql = 'insert into unit_logs (unit_name, test_id, logentry, timestamp) values ' . implode(', ', $placeholders);
    $this->_($sql, $params);
  }

  /**
   * @param TestLog[] $testLogs
   */
  public function addTestLogs(array $testLogs): void {
    if (empty($testLogs)) {
      return;
    }

    foreach ($testLogs as $testLog) {
      if (!$testLog instanceof TestLog) {
        throw new \http\Exception\InvalidArgumentException('All array elements must be TestLog instances');
      }
    }

    $placeholders = [];
    $params = [];

    /** @var TestLog $log */
    foreach ($testLogs as $index => $log) {
      $placeholders[] = "(:bookletId{$index}, :logentry{$index}, :timestamp{$index})";

      $params[":bookletId{$index}"] = $log->testId;
      $params[":logentry{$index}"] = $log->logKey . ($log->logContent ? ' : ' . $log->logContent : '');
      $params[":timestamp{$index}"] = $log->timestamp;
    }

    $sql = 'insert into test_logs (booklet_id, logentry, timestamp) values ' . implode(', ', $placeholders);

    $this->_($sql, $params);
  }

  // TODO unit test
  public function setTestRunning(int $testId): void {
    $this->_(
      'update tests set running = :running , timestamp_server = :timestamp where id = :id',
      [
        ':running' => '1',
        ':id' => $testId,
        ':timestamp' => TimeStamp::toSQLFormat(TimeStamp::now())
      ]
    );
  }

  public function getCommands(int $testId, ?int $lastCommandId = null): array {
    $sql = "select * from test_commands where test_id = :test_id and executed = 0 order by timestamp";
    $replacements = [':test_id' => $testId];
    if ($lastCommandId) {
      $replacements[':last_id'] = $lastCommandId;
      $sql = str_replace(
        'where',
        'where timestamp > (select timestamp from test_commands where id = :last_id) and ',
        $sql
      );
    }

    $commands = [];
    foreach ($this->_($sql, $replacements, true) as $line) {
      $commands[] = new Command(
        (int) $line['id'],
        $line['keyword'],
        TimeStamp::fromSQLFormat($line['timestamp']),
        ...JSON::decode($line['parameter'], true)
      );
    }
    return $commands;
  }

  public function setCommandExecuted(int $testId, int $commandId): bool {
    $command = $this->_(
      'select executed from test_commands where test_id = :testId and id = :commandId',
      [':testId' => $testId, ':commandId' => $commandId]
    );

    if (!$command) {
      throw new HttpError("Command `$commandId` not found on test `$testId`", 404);
    }

    if ($command['executed']) {
      return false;
    }

    $this->_(
      'update test_commands set executed = 1 where test_id = :testId and id = :commandId',
      [':testId' => $testId, ':commandId' => $commandId]
    );

    return true;
  }

}
