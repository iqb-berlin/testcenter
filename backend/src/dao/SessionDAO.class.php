<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class SessionDAO extends DAO {
  public function getToken(string $tokenString, array $requiredTypes): AuthToken {
    $tokenInfo = $this->_(
      'SELECT
                    admin_sessions.token,
                    users.id,
                    \'admin\' AS "type",
                    -1 AS "workspaceId",
                    CASE WHEN (users.is_superadmin) THEN \'super-admin\' ELSE \'admin\' END AS "mode",
                    valid_until AS "validTo",
                    \'[admins]\' AS "group"
                FROM admin_sessions
                     LEFT JOIN users ON (users.id = admin_sessions.user_id)
                WHERE
                    admin_sessions.token = :token
            UNION
                SELECT
                    person_sessions.token,
                    person_sessions.id AS "id",
                    \'person\' AS "type",
                    logins.workspace_id AS "workspaceId",
                    logins.mode,
                    person_sessions.valid_until AS "validTo",
                    logins.group_name AS "group"
                FROM person_sessions
                     LEFT JOIN login_sessions ON (person_sessions.login_sessions_id = login_sessions.id)
                     LEFT JOIN logins ON (logins.name = login_sessions.name)
                WHERE
                    person_sessions.token = :token
            UNION
                SELECT
                    token,
                    login_sessions.id AS "id",
                    \'login\' AS "type",
                    logins.workspace_id AS "workspaceId",
                    logins.mode,
                    logins.valid_to AS "validTo",
                    logins.group_name AS "group"
                FROM login_sessions
                     LEFT JOIN logins ON (logins.name = login_sessions.name)
                WHERE
                    login_sessions.token = :token
            LIMIT 1',
      [':token' => $tokenString]
    );

    if ($tokenInfo == null) {
      throw new HttpError("Invalid token: `$tokenString`", 403);
    }

    if ($tokenInfo['workspaceId'] == null) {
      throw new HttpError("Login removed: `$tokenString`", 410);
    }

    if (!in_array($tokenInfo["type"], $requiredTypes)) {
      throw new HttpError("Token `$tokenString` of "
        . "type `{$tokenInfo["type"]}` has wrong type - `"
        . implode("` or `", $requiredTypes) . "` required.", 403);
    }

    TimeStamp::checkExpiration(0, TimeStamp::fromSQLFormat($tokenInfo['validTo']));

    return new AuthToken(
      $tokenInfo['token'],
      (int) $tokenInfo['id'],
      $tokenInfo['type'],
      (int) $tokenInfo['workspaceId'],
      $tokenInfo['mode'],
      $tokenInfo['group']
    );
  }

  /**
   * @codeCoverageIgnore
   */
  public function getOrCreateLoginSession(string $name, string $password): LoginSession | FailedLogin {
    $login = $this->getLogin($name, $password);

    if (!is_a($login, Login::class)) {
      return $login;
    }

    return $this->createLoginSession($login);
  }

  public function getLogin(string $name, string $password): Login | FailedLogin {
    $result = $this->_(
      'SELECT
              logins.name,
              logins.mode,
              logins.group_name,
              logins.group_label,
              logins.codes_to_booklets,
              logins.workspace_id,
              logins.valid_to,
              logins.valid_from,
              logins.valid_for,
              logins.custom_texts,
              logins.password,
              logins.monitors,
              logins.view_settings
            FROM
              logins
            WHERE
              logins.name = :name',
      [
        ':name' => $name
      ]
    );

    if (!$result) {
      // we always check one password to not leak the existence of username to time-attacks
      Password::verify($password, 'dummy', 't');
      return FailedLogin::usernameNotFound;
    }

    TimeStamp::checkExpiration(
      TimeStamp::fromSQLFormat($result['valid_from']),
      TimeStamp::fromSQLFormat($result['valid_to'])
    );

    $login = new Login(
      $result['name'],
      '',
      $result['mode'],
      $result['group_name'],
      $result['group_label'],
      JSON::decode($result['codes_to_booklets'], true),
      (int) $result['workspace_id'],
      TimeStamp::fromSQLFormat($result['valid_to']),
      TimeStamp::fromSQLFormat($result['valid_from']),
      (int) $result['valid_for'],
      JSON::decode($result['custom_texts']),
      JSON::decode($result['monitors'], true),
      JSON::decode($result['view_settings'], true) ?? []
    );


    // TODO also use customizable use salt for testees? -> change would break current sessions
    if (!Password::verify($password, $result['password'], 't')) {
      return Mode::hasCapability($login->getMode(), 'protectedLogin') ?
        FailedLogin::wrongPasswordProtectedLogin :
        FailedLogin::wrongPassword;
    }

    return $login;
  }

  public function createLoginSession(Login $login): LoginSession {
    $loginToken = Token::generate('login', $login->getName());
    $groupToken = $this->getOrCreateGroupToken(
      $login->getWorkspaceId(),
      $login->getGroupName(),
      $login->getGroupLabel()
    );

    // We don't check for existence of the sessions before inserting it because timing issues occurred: If the same
    // login was requested two times at the same moment it could happen that it was created twice.

    $this->_(
      'INSERT IGNORE INTO login_sessions (token, name, workspace_id, group_name)
            VALUES(:token, :name, :ws, :group_name)
            ON DUPLICATE KEY UPDATE group_name = :group_name',
      [
        ':token' => $loginToken,
        ':name' => $login->getName(),
        ':ws' => $login->getWorkspaceId(),
        ':group_name' => $login->getGroupName()
      ]
    );

    if ($this->lastAffectedRows) {
      $id = (int) $this->pdoDBhandle->lastInsertId();
      return new LoginSession($id, $loginToken, $groupToken, $login);
    }

    // there is no way in MySQL to combine insert & select into one query, so have to retrieve it to get the id
    $session = $this->_(
      'SELECT id, token FROM login_sessions WHERE name = :name AND workspace_id = :ws_id',
      [
        ':name' => $login->getName(),
        ':ws_id' => $login->getWorkspaceId()
      ]
    );

    // usually there must be a session, because it was just inserted. But in some case of some error conditions:
    if (!$session) {
      throw new Exception("Could not retrieve login-session: `{$login->getName()}`!");
    }

    return new LoginSession((int) $session['id'], $session['token'], $groupToken, $login);
  }

  public function getLoginSessionByToken(string $loginToken): LoginSession {
    $loginSession = $this->_(
      'SELECT 
                    login_sessions.id, 
                    logins.name,
                    login_sessions.token,
                    logins.mode,
                    logins.group_name,
                    logins.group_label,
                    login_session_groups.token AS group_token,
                    logins.codes_to_booklets,
                    login_sessions.workspace_id,
                    logins.custom_texts,
                    logins.password,
                    logins.valid_for,
                    logins.valid_to,
                    logins.valid_from,
                    logins.monitors,
                    logins.view_settings
                FROM
                    logins
                    LEFT JOIN login_sessions ON (logins.name = login_sessions.name)
                    LEFT JOIN login_session_groups ON (login_sessions.group_name = login_session_groups.group_name AND login_sessions.workspace_id = login_session_groups.workspace_id)
                WHERE
                    login_sessions.token=:token',
      [':token' => $loginToken]
    );

    if ($loginSession == null) {
      throw new HttpError("LoginToken invalid: `$loginToken`", 403);
    }

    TimeStamp::checkExpiration(
      TimeStamp::fromSQLFormat($loginSession['valid_from']),
      TimeStamp::fromSQLFormat($loginSession['valid_to'])
    );

    return new LoginSession(
      (int) $loginSession["id"],
      $loginSession["token"],
      $loginSession["group_token"],
      new Login(
        $loginSession['name'],
        '',
        $loginSession['mode'],
        $loginSession['group_name'],
        $loginSession['group_label'],
        JSON::decode($loginSession['codes_to_booklets'], true),
        (int) $loginSession['workspace_id'],
        TimeStamp::fromSQLFormat($loginSession['valid_to']),
        TimeStamp::fromSQLFormat($loginSession['valid_from']),
        (int) $loginSession['valid_for'],
        JSON::decode($loginSession['custom_texts']),
        JSON::decode($loginSession['monitors'], true),
        JSON::decode($loginSession['view_settings'], true) ?? []
      )
    );
  }

  public function createOrUpdatePersonSession(
    LoginSession $loginSession,
    string $code,
    bool $allowExpired = false,
    bool $forceUpdateToken = true
  ): PersonSession {
    $login = $loginSession->getLogin();

    if (count($login->testNames()) and !$login->codeExists($code)) {
      throw new HttpError("`$code` is no valid code for `{$login->getName()}`", 400);
    }

    if (!$allowExpired) {
      TimeStamp::checkExpiration($login->getValidFrom(), $login->getValidTo());
    }

    $suffix = [];
    if ($code) {
      $suffix[] = $code;
    }
    if (Mode::hasCapability($loginSession->getLogin()->getMode(), 'alwaysNewSession')) {
      // we use random strings to identify the persons, not subsequent numbers, because that caused trouble when
      // two logged in in the very same moment
      $suffix[] = Random::string(8, false);
    }
    $suffix = implode('/', $suffix);

    if (!Mode::hasCapability($loginSession->getLogin()->getMode(), 'alwaysNewSession')) {
      $personSession = $this->_('
        SELECT id, valid_until, token FROM person_sessions WHERE login_sessions_id = :lsi AND name_suffix = :suffix',
        [
          ':lsi' => $loginSession->getId(),
          ':suffix' => $suffix
        ]
      );

      if ($personSession) {
        if (!$allowExpired) {
          TimeStamp::checkExpiration(0, TimeStamp::fromSQLFormat($personSession['valid_until']));
        }
        $token = $personSession['token'];
        if (!$token or $forceUpdateToken) {
          $token = Token::generate('person', "{$login->getGroupName()}_{$login->getName()}_$code");
          $this->_(
            'UPDATE person_sessions SET token=:token WHERE login_sessions_id = :lsi AND name_suffix = :suffix',
            [
              ':lsi' => $loginSession->getId(),
              ':suffix' => $suffix,
              ':token' => $token
            ]
          );
        }
        return new PersonSession(
          $loginSession,
          new Person(
            $personSession['id'],
            $token,
            $code,
            $suffix,
            TimeStamp::fromSQLFormat($personSession['valid_until'])
          )
        );
      }
    }

    $validUntil = TimeStamp::expirationFromNow($login->getValidTo(), $login->getValidForMinutes());
    $token = Token::generate('person', "{$login->getGroupName()}_{$login->getName()}_$code");

    try {
      $this->_(
        "INSERT INTO person_sessions (token, code, login_sessions_id, valid_until, name_suffix)
            VALUES (:token, :code, :login_id, :valid_until, :suffix)",
        [
          ':token' => $token,
          ':code' => $code,
          ':login_id' => $loginSession->getId(),
          ':valid_until' => TimeStamp::toSQLFormat($validUntil),
          ':suffix' => $suffix
        ]
      );
    } catch (Exception $ee) {
      // allow retry on duplicate suffix - unlikely in prod, but always happens in testing when rand is static
      if ($originalException = $ee->getPrevious()) {
        if (
          property_exists($originalException, 'errorInfo')
          and ($originalException->errorInfo[1] == 1062)
          and ($originalException->getCode() == 23000)
          and (str_ends_with($originalException->errorInfo[2], "for key 'person_sessions.unique_person_session'"))
        ) {
          error_log("Create person-session: retry on duplicate suffix (`{$loginSession->getLogin()->getName()}` / `$suffix`)");
          return $this->createOrUpdatePersonSession($loginSession, $code, $allowExpired, $forceUpdateToken);
        }
      }
      throw $ee;
    }


    return new PersonSession(
      $loginSession,
      new Person(
        (int) $this->pdoDBhandle->lastInsertId(),
        $token,
        $code,
        $suffix,
        $validUntil
      )
    );
  }

  public function getPersonSessionByToken(string $personToken): PersonSession {
    $personSession = $this->_(
      'SELECT 
                login_sessions.id,
                logins.codes_to_booklets,
                login_sessions.workspace_id,
                logins.mode,
                logins.password,
                logins.group_name,
                login_session_groups.group_label,
                login_session_groups.token AS group_token,
                login_sessions.token,
                login_sessions.name,
                logins.custom_texts,
                logins.valid_to,
                logins.valid_from,
                logins.valid_for,
                logins.monitors,
                logins.view_settings,
                person_sessions.id AS "person_id",
                person_sessions.code,
                person_sessions.valid_until,
                person_sessions.name_suffix
            FROM person_sessions
                INNER JOIN login_sessions ON login_sessions.id = person_sessions.login_sessions_id
                INNER JOIN logins ON logins.name = login_sessions.name
                LEFT JOIN login_session_groups ON (login_sessions.group_name = login_session_groups.group_name AND login_sessions.workspace_id = login_session_groups.workspace_id)
            WHERE person_sessions.token = :token',
      [':token' => $personToken]
    );

    if ($personSession === null) {
      throw new HttpError("PersonToken invalid: `$personToken`", 403);
    }

    TimeStamp::checkExpiration(0, Timestamp::fromSQLFormat($personSession['valid_until']));
    TimeStamp::checkExpiration(
      TimeStamp::fromSQLFormat($personSession['valid_from']),
      TimeStamp::fromSQLFormat($personSession['valid_to'])
    );

    return new PersonSession(
      new LoginSession(
        (int) $personSession['id'],
        $personSession['token'],
        $personSession['group_token'],
        new Login(
          $personSession['name'],
          '',
          $personSession['mode'],
          $personSession['group_name'],
          $personSession['group_label'],
          JSON::decode($personSession['codes_to_booklets'], true),
          (int) $personSession['workspace_id'],
          Timestamp::fromSQLFormat($personSession['valid_to']),
          Timestamp::fromSQLFormat($personSession['valid_from']),
          $personSession['valid_for'],
          JSON::decode($personSession['custom_texts']),
          JSON::decode($personSession['monitors'], true),
          JSON::decode($personSession['view_settings'], true) ?? []
        )
      ),
      new Person(
        (int) $personSession['person_id'],
        $personToken,
        $personSession['code'] ?? '',
        $personSession['name_suffix'] ?? '',
        TimeStamp::fromSQLFormat($personSession['valid_until'])
      )
    );
  }

  public function getOrCreateGroupToken(int $workspaceId, string $groupName, string $groupLabel): string {
    $newGroupToken = Token::generate('group', $groupName);
    $this->_(
      'INSERT IGNORE INTO login_session_groups (group_name, workspace_id, group_label, token, last_modified) VALUES (?, ?, ?, ?, ?)',
      [
        $groupName,
        $workspaceId,
        $groupLabel,
        $newGroupToken,
        TimeStamp::toSQLFormat(TimeStamp::now())
      ]
    );

    if ($this->lastAffectedRows) {
      return $newGroupToken;
    }

    $res = $this->_(
      'SELECT token FROM login_session_groups WHERE group_name = ? AND workspace_id = ?',
      [
        $groupName,
        $workspaceId
      ]
    );

    if (!isset($res['token'])) {
      throw new Exception("Could not retrieve group token for `{$groupName}`.");
    }

    return $res['token'];
  }


  public function groupTokenExists(int $workspaceId, string $groupTokenString): bool {
    $res = $this->_(
      'SELECT
            COUNT(token) AS count
          FROM
            login_session_groups
            LEFT JOIN logins ON login_session_groups.group_name = logins.group_name
          WHERE
            token = ? AND login_session_groups.workspace_id = ?',
      [
        $groupTokenString,
        $workspaceId
      ]
    );
    return !!$res['count'];
  }

  public function getTestStatus(string $personToken, string $bookletName): array {
    $testStatus = $this->_(
      'SELECT
             tests.locked,
             tests.running,
             files.label
            FROM
              person_sessions
              LEFT JOIN login_sessions ON (person_sessions.login_sessions_id = login_sessions.id)
              LEFT JOIN logins ON (logins.name = login_sessions.name)
              LEFT JOIN files ON (files.workspace_id = logins.workspace_id)
              LEFT JOIN tests ON (person_sessions.id = tests.person_id AND tests.name = files.id)
            WHERE person_sessions.token = :token
              AND files.id = :bookletname',
      [
        ':token' => $personToken,
        ':bookletname' => $bookletName
      ]
    );

    if ($testStatus == null) {
      throw new HttpError("Test `$bookletName` not found!", 404);
    }

    $testStatus['running'] = (bool) $testStatus['running'];
    $testStatus['locked'] = (bool) $testStatus['locked'];

    return $testStatus;
  }

  public function personHasBooklet(string $personToken, string $bookletName): bool {
    $bookletDef = $this->_('
            SELECT
              logins.codes_to_booklets,
              login_sessions.id,
              person_sessions.code
            FROM logins
              LEFT JOIN login_sessions ON logins.name = login_sessions.name
              LEFT JOIN person_sessions ON login_sessions.id = person_sessions.login_sessions_id
            WHERE
              person_sessions.token = :token',
      [
        ':token' => $personToken
      ]
    );

    $code = $bookletDef['code'];
    $codes2booklets = JSON::decode($bookletDef['codes_to_booklets'], true);

    return $codes2booklets and isset($codes2booklets[$code]) and in_array($bookletName, $codes2booklets[$code]);
  }

  public function ownsTest(string $personToken, string $testId): bool {
    $test = $this->_(
      'SELECT tests.locked FROM tests
              INNER JOIN person_sessions ON person_sessions.id = tests.person_id
              WHERE person_sessions.token=:token AND tests.id=:testId',
      [
        ':token' => $personToken,
        ':testId' => $testId
      ]
    );

    return !!$test;
  }

  public function getTestsOfPerson(PersonSession $personSession): array {
    $testNames = $personSession->getLoginSession()->getLogin()->testNames()[$personSession->getPerson()->getCode() ?? ''];
    if (!count($testNames)) return [];

    $replacementsVirtualTable = [];
    foreach ($testNames as $testName) {
      $testName = TestName::fromString($testName);
      $replacementsVirtualTable[] = $testName->name;
      $replacementsVirtualTable[] = $testName->bookletFileId;
    }

    $virtualTable = implode(",\n", array_fill(0, count($testNames), 'row (?, ?)'));
    $orderField = implode(', ', array_fill(0, count($testNames), '?'));

    $sql = "
      WITH ba (test_name, booklet_file_id) AS (
        VALUES 
          $virtualTable
      )
      SELECT
        ba.test_name,
        tests.person_id,
        tests.id,
        tests.locked,
        tests.running,
        files.name,
        files.id AS bookletId,
        files.label AS testLabel,
        files.description
      FROM ba
        LEFT OUTER JOIN tests
          ON ba.test_name = tests.name
            AND tests.person_id = ?
        LEFT OUTER JOIN files
          ON ba.booklet_file_id = files.id
            AND files.workspace_id = ?
            AND files.type = 'Booklet'
      ORDER BY
        field(ba.test_name, $orderField)
    ";
    $tests = $this->_(
      $sql,
      [
        ...$replacementsVirtualTable,
        $personSession->getPerson()->getId(),
        $personSession->getLoginSession()->getLogin()->getWorkspaceId(),
        ...$testNames
      ],
      true
    );
    return array_map(
      function(array $res): TestData {
        return new TestData(
          (int) $res['id'],
          $res['test_name'],
          $res['bookletId'],
          $res['testLabel'],
          $res['description'],
          (bool) $res['locked'],
          (bool) $res['running'],
          (object) []
        );
      },
      $tests
    );
  }

  public function deletePersonToken(AuthToken $authToken): void {
    // we can not delete the session entirely, because this would delete the whole response data.
    $this->_("UPDATE person_sessions SET token=NULL WHERE token = :token", [':token' => $authToken->getToken()]);
  }

  /**
   * @return Group[]
   */
  public function getGroupMonitors(PersonSession $personSession): array {
    switch ($personSession->getLoginSession()->getLogin()->getMode()) {
      default: return [];
      case 'monitor-group':
        return [
          new Group(
            $personSession->getLoginSession()->getLogin()->getGroupName(),
            $personSession->getLoginSession()->getLogin()->getGroupLabel()
          )
        ];
      case 'monitor-study':
        return $this->getGroups($personSession->getLoginSession()->getLogin()->getWorkspaceId());
    }
  }

  /**
   * @return Group[]
   */
  public function getGroups(int $workspaceId): array {
    $modeSelector = "mode in ('" . implode("', '", Mode::getByCapability('monitorable')) . "')";
    $sql =
      "SELECT
        group_name,
        group_label,
        valid_from,
        valid_to
      FROM
        logins
      WHERE
        workspace_id = :ws_id
        AND $modeSelector
      GROUP BY group_name, group_label, valid_from, valid_to
      ORDER BY group_label";

    return array_reduce(
      $this->_($sql, [':ws_id' => $workspaceId], true),
      function(array $agg, array $row): array {
        $expiration = TimeStamp::isExpired(
          TimeStamp::fromSQLFormat($row['valid_from']),
          TimeStamp::fromSQLFormat($row['valid_to'])
        );
        $agg[$row['group_name']] = new Group($row['group_name'], $row['group_label'], $expiration);
        return $agg;
      },
      []
    );
  }

  public function getDependantSessions(LoginSession $login): array {
    return match ($login->getLogin()->getMode()) {
      'monitor-group' => $this->getLoginSessions([
        'logins.workspace_id' => $login->getLogin()->getWorkspaceId(),
        'logins.group_name' => $login->getLogin()->getGroupName()
      ]),
      'monitor-study' => $this->getLoginSessions([
        'logins.workspace_id' => $login->getLogin()->getWorkspaceId()
      ]),
      default => [],
    };
  }

  /** @return LoginSession[] */
  protected function getLoginSessions(array $filters = []): array {
    $logins = [];

    $replacements = [];
    $filterSQL = [];
    foreach ($filters as $filter => $filterValue) {
      $filterName = ':' . str_replace('.', '_', $filter);
      $replacements[$filterName] = $filterValue;
      $filterSQL[] = "$filter = $filterName";
    }
    $filterSQL = implode(' AND ', $filterSQL);
    $filterSQL = $filterSQL !== '' ? $filterSQL : ' 1 = 1';

    $sql = "SELECT
      logins.name,
      logins.mode,
      logins.group_name,
      logins.group_label,
      logins.codes_to_booklets,
      logins.custom_texts,
      logins.password,
      logins.valid_for,
      logins.valid_to,
      logins.valid_from,
      logins.workspace_id,
      login_sessions.id,
      login_sessions.token,
      login_session_groups.token AS group_token 
    FROM
      logins
      LEFT JOIN login_sessions ON (logins.name = login_sessions.name)
      LEFT JOIN login_session_groups ON (login_sessions.group_name = login_session_groups.group_name AND login_sessions.workspace_id = login_session_groups.workspace_id)
    WHERE
      $filterSQL
    ORDER BY id";

    $result = $this->_($sql, $replacements, true);

    foreach ($result as $row) {
      $logins[] =
        new LoginSession(
          (int) $row["id"],
          $row["token"],
          $row["group_token"],
          new Login(
            $row['name'],
            '',
            $row['mode'],
            $row['group_name'],
            $row['group_label'],
            JSON::decode($row['codes_to_booklets'], true),
            (int) $row['workspace_id'],
            TimeStamp::fromSQLFormat($row['valid_to']),
            TimeStamp::fromSQLFormat($row['valid_from']),
            (int) $row['valid_for'],
            JSON::decode($row['custom_texts'])
          )
        );
    }

    return $logins;
  }

  /** @return SystemCheck[] */
  public function getSysChecksOfPerson(PersonSession $personSession): array
  {
    $wsId = $personSession->getLoginSession()->getLogin()->getWorkspaceId();
    $sessionName = $personSession->getLoginSession()->getLogin()->getName();

    $syschecks = $this->_("
      SELECT * 
      FROM files 
      LEFT JOIN logins ON files.workspace_id = logins.workspace_id
      WHERE 
        files.type = 'SysCheck' AND
        logins.name = :session_name AND
        logins.workspace_id = :ws_id AND
        logins.mode = 'sys-check-login'
      ",
      [
        'session_name' => $sessionName,
        'ws_id' => $wsId,
      ],
      true
    );

    return array_map(
      function (array $sysCheck) {
        return new SystemCheck(
          (string) $sysCheck['workspace_id'],
          (string) $sysCheck['id'],
          $sysCheck['name'],
          $sysCheck['label'],
          $sysCheck['description']
        );
      },
      $syschecks
    );
  }
}
