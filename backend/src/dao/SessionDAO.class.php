<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class SessionDAO extends DAO {
  public function getToken(string $tokenString, array $requiredTypes): AuthToken {
    $tokenInfo = $this->_(
      'select
                    admin_sessions.token,
                    users.id,
                    \'admin\' as "type",
                    -1 as "workspaceId",
                    case when (users.is_superadmin) then \'super-admin\' else \'admin\' end as "mode",
                    valid_until as "validTo",
                    \'[admins]\' as "group"
                from admin_sessions
                     left join users on (users.id = admin_sessions.user_id)
                where
                    admin_sessions.token = :token
            union
                select
                    person_sessions.token,
                    person_sessions.id as "id",
                    \'person\' as "type",
                    logins.workspace_id as "workspaceId",
                    logins.mode,
                    person_sessions.valid_until as "validTo",
                    logins.group_name as "group"
                from person_sessions
                     left join login_sessions on (person_sessions.login_sessions_id = login_sessions.id)
                     left join logins on (logins.name = login_sessions.name)
                where
                    person_sessions.token = :token
            union
                select
                    token,
                    login_sessions.id as "id",
                    \'login\' as "type",
                    logins.workspace_id as "workspaceId",
                    logins.mode,
                    logins.valid_to as "validTo",
                    logins.group_name as "group"
                from login_sessions
                     left join logins on (logins.name = login_sessions.name)
                where
                    login_sessions.token = :token
            limit 1',
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
      'select         
              logins.name,
              logins.mode,
              logins.group_name,
              logins.group_label,
              login_session_groups.token as group_token,
              logins.codes_to_booklets,
              logins.workspace_id,
              logins.valid_to,
              logins.valid_from,
              logins.valid_for,
              logins.custom_texts,
              logins.password,
              logins.monitors
            from 
              logins
              left join login_sessions on (logins.name = login_sessions.name and logins.group_name = login_sessions.group_name)  
              left join login_session_groups on (login_sessions.group_name = login_session_groups.group_name and login_sessions.workspace_id = login_session_groups.workspace_id)
            where 
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
      JSON::decode($result['monitors'], true)
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
      'insert ignore into login_sessions (token, name, workspace_id, group_name)
            values(:token, :name, :ws, :group_name)
            on duplicate key update group_name = :group_name',
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
      'select id, token from login_sessions where name = :name and workspace_id = :ws_id',
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
      'select 
                    login_sessions.id, 
                    logins.name,
                    login_sessions.token,
                    logins.mode,
                    logins.group_name,
                    logins.group_label,
                    login_session_groups.token as group_token,
                    logins.codes_to_booklets,
                    login_sessions.workspace_id,
                    logins.custom_texts,
                    logins.password,
                    logins.valid_for,
                    logins.valid_to,
                    logins.valid_from,
                    logins.monitors
                from
                    logins
                    left join login_sessions on (logins.name = login_sessions.name)
                    left join login_session_groups on (login_sessions.group_name = login_session_groups.group_name and login_sessions.workspace_id = login_session_groups.workspace_id)
                where
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
        JSON::decode($loginSession['monitors'], true)
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
        select id, valid_until, token from person_sessions where login_sessions_id = :lsi and name_suffix = :suffix',
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
            'update person_sessions set token=:token where login_sessions_id = :lsi and name_suffix = :suffix',
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
        "insert into person_sessions (token, code, login_sessions_id, valid_until, name_suffix)
            values (:token, :code, :login_id, :valid_until, :suffix)",
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
      'select 
                login_sessions.id,
                logins.codes_to_booklets,
                login_sessions.workspace_id,
                logins.mode,
                logins.password,
                logins.group_name,
                login_session_groups.group_label,
                login_session_groups.token as group_token,
                login_sessions.token,
                login_sessions.name,
                logins.custom_texts,
                logins.valid_to,
                logins.valid_from,
                logins.valid_for,
                logins.monitors,
                person_sessions.id as "person_id",
                person_sessions.code,
                person_sessions.valid_until,
                person_sessions.name_suffix
            from person_sessions
                inner join login_sessions on login_sessions.id = person_sessions.login_sessions_id
                inner join logins on logins.name = login_sessions.name
                left join login_session_groups on (login_sessions.group_name = login_session_groups.group_name and login_sessions.workspace_id = login_session_groups.workspace_id)
            where person_sessions.token = :token',
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
          JSON::decode($personSession['monitors'], true)
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
      'insert ignore into login_session_groups (group_name, workspace_id, group_label, token) values (?, ?, ?, ?)',
      [
        $groupName,
        $workspaceId,
        $groupLabel,
        $newGroupToken
      ]
    );

    if ($this->lastAffectedRows) {
      return $newGroupToken;
    }

    $res = $this->_(
      'select token from login_session_groups where group_name = ? and workspace_id = ?',
      [
        $groupName,
        $workspaceId
      ]
    );

    if (!isset($res['token'])) {
      throw new Exception("Could not retrieve group token for `{$login->getGroupName()}`.");
    }

    return $res['token'];
  }


  public function groupTokenExists(int $workspaceId, string $groupTokenString): bool {
    $res = $this->_(
      'select
            count(token) as count
          from
            login_session_groups
            left join logins on login_session_groups.group_name = logins.group_name
          where
            token = ? and login_session_groups.workspace_id = ?',
      [
        $groupTokenString,
        $workspaceId
      ]
    );
    return !!$res['count'];
  }

  public function getTestStatus(string $personToken, string $bookletName): array {
    $testStatus = $this->_(
      'select
             tests.locked,
             tests.running,
             files.label
            from
              person_sessions
              left join login_sessions on (person_sessions.login_sessions_id = login_sessions.id)
              left join logins on (logins.name = login_sessions.name)
              left join files on (files.workspace_id = logins.workspace_id)
              left join tests on (person_sessions.id = tests.person_id and tests.name = files.id)
            where person_sessions.token = :token
              and files.id = :bookletname',
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
            select
              logins.codes_to_booklets,
              login_sessions.id,
              person_sessions.code
            from logins
              left join login_sessions on logins.name = login_sessions.name
              left join person_sessions on login_sessions.id = person_sessions.login_sessions_id
            where
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
      'select tests.locked from tests
              inner join person_sessions on person_sessions.id = tests.person_id
              where person_sessions.token=:token and tests.id=:testId',
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
      with ba (test_name, booklet_file_id) as (
        values 
          $virtualTable
      )
      select
        ba.test_name,
        tests.person_id,
        tests.id,
        tests.locked,
        tests.running,
        files.name,
        files.id as bookletId,
        files.label as testLabel,
        files.description
      from ba
        left outer join tests
          on ba.test_name = tests.name
            and tests.person_id = ?
        left outer join files
          on ba.booklet_file_id = files.id
            and files.workspace_id = ?
            and files.type = 'Booklet'
      order by
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
    $this->_("update person_sessions set token=null where token = :token", [':token' => $authToken->getToken()]);
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
      "select
        group_name,
        group_label,
        valid_from,
        valid_to
      from
        logins
      where
        workspace_id = :ws_id
        and $modeSelector
      group by group_name, group_label, valid_from, valid_to
      order by group_label";

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
    $filterSQL = implode(' and ', $filterSQL);
    $filterSQL = $filterSQL !== '' ? $filterSQL : ' 1 = 1';

    $sql = "select
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
      login_session_groups.token as group_token 
    from
      logins
      left join login_sessions on (logins.name = login_sessions.name)
      left join login_session_groups on (login_sessions.group_name = login_session_groups.group_name and login_sessions.workspace_id = login_session_groups.workspace_id)
    where
      $filterSQL
    order by id";

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
      select * 
      from files 
      left join logins on files.workspace_id = logins.workspace_id
      where 
        files.type = 'SysCheck' and
        logins.name = :session_name and
        logins.workspace_id = :ws_id and
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
