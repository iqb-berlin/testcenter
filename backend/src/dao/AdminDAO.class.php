<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class AdminDAO extends DAO {
  /**
   * @codeCoverageIgnore
   */
  public function refreshAdminToken(string $token): void {
    $this->_(
      'update admin_sessions
            set valid_until =:value
            where token =:token',
      [
        ':value' => TimeStamp::toSQLFormat(TimeStamp::expirationFromNow(0, $this->timeUserIsAllowedInMinutes)),
        ':token' => $token
      ]
    );
  }

  public function createAdminToken(string $username, string $password, ?int $validTo = null): string | FailedLogin {
    if ((strlen($username) == 0) or (strlen($username) > 50)) {
      throw new Exception("Invalid Username `$username`", 400);
    }

    $user = $this->getUserByNameAndPassword($username, $password);

    if (is_a($user, FailedLogin::class)) return $user;

    $this->deleteTokensByUser((int) $user['id']);
    $token = Token::generate('admin', $username);
    $this->storeToken((int) $user['id'], $token, $validTo);

    return $token;
  }

  private function getUserByNameAndPassword(string $userName, string $password): array | FailedLogin {
    $usersOfThisName = $this->_(
      'select * from users where users.name = :name',
      [':name' => $userName],
      true
    );

    $return = (!count($usersOfThisName)) ? FailedLogin::usernameNotFound : FailedLogin::wrongPassword;

    // we always check at least one user to not leak the existence of username to time-attacks
    $usersOfThisName = (!count($usersOfThisName)) ? [['password' => 'dummy']] : $usersOfThisName;

    foreach ($usersOfThisName as $user) {
      if (Password::verify($password, $user['password'], $this->passwordSalt)) {
        return $user;
      }
    }

    // obfuscate the time taken even more
    usleep(rand(000000, 100000));
    return $return;
  }

  private function deleteTokensByUser(int $userId): void {
    $this->_(
      'delete from admin_sessions where admin_sessions.user_id = :id',
      [':id' => $userId]
    );
  }

  private function storeToken(int $userId, string $token, ?int $validTo = null): void {
    $validTo = $validTo ?? TimeStamp::expirationFromNow(0, $this->timeUserIsAllowedInMinutes);

    $this->_(
      'insert into admin_sessions (token, user_id, valid_until)
			values(:token, :user_id, :valid_until)',
      [
        ':token' => $token,
        ':user_id' => $userId,
        ':valid_until' => TimeStamp::toSQLFormat($validTo)
      ]
    );
  }

  public function getAdmin(string $token): Admin {
    $admin = $this->_(
      'select
        users.id,
        users.name,
        users.email,
        users.is_superadmin,
        users.pw_set_by_admin,
        admin_sessions.valid_until
      from users
			inner join admin_sessions on users.id = admin_sessions.user_id
			where admin_sessions.token=:token',
      [':token' => $token]
    );

    if (!$admin) {
      throw new HttpError("Token not valid! ($token)", 403);
    }

    TimeStamp::checkExpiration(0, TimeStamp::fromSQLFormat($admin['valid_until']));

    return new Admin(
      $admin['id'],
      $admin['name'],
      $admin['email'] ?? '',
      !!$admin['is_superadmin'],
      $token,
      (bool) $admin['pw_set_by_admin']
    );
  }

  public function deleteResultData(int $workspaceId, string $groupName): void {
    $this->_(
      "delete from login_session_groups where group_name = :group_name and workspace_id = :workspace_id",
      [
        ':workspace_id' => $workspaceId,
        ':group_name' => $groupName
      ]
    );
  }

  /** @return WorkspaceData[] */
  public function getWorkspaces(string $token): array {
    $workspaces = $this->_(
      'select
        workspaces.id,
        workspaces.name,
        workspace_users.role
      from workspaces
        inner join workspace_users on workspaces.id = workspace_users.workspace_id
        inner join users on workspace_users.user_id = users.id
        inner join admin_sessions on  users.id = admin_sessions.user_id
      where
        admin_sessions.token =:token',
      [':token' => $token],
      true
    );
    return array_map(
      function (array $ws): WorkspaceData {
        return new WorkspaceData($ws['id'], $ws['name'], $ws['role']);
      },
      $workspaces
    );
  }

  public function hasAdminAccessToWorkspace(string $token, int $workspaceId): bool {
    $data = $this->_(
      'select workspaces.id from workspaces
				inner join workspace_users on workspaces.id = workspace_users.workspace_id
				inner join users on workspace_users.user_id = users.id
				inner join admin_sessions on  users.id = admin_sessions.user_id
				where admin_sessions.token =:token and workspaces.id = :wsId',
      [
        ':token' => $token,
        ':wsId' => $workspaceId
      ]
    );

    return $data != false;
  }

  public function hasMonitorAccessToWorkspace(string $token, int $workspaceId): bool {
    $data = $this->_(
      'select workspaces.id from workspaces
				inner join login_sessions on workspaces.id = login_sessions.workspace_id
				inner join person_sessions on person_sessions.login_sessions_id = login_sessions.id
				where person_sessions.token =:token and workspaces.id = :wsId',
      [
        ':token' => $token,
        ':wsId' => $workspaceId
      ]
    );

    return $data != false;
  }

  public function getWorkspaceRole(string $token, int $workspaceId): string {
    $user = $this->_(
      'select workspace_users.role from workspaces
				inner join workspace_users on workspaces.id = workspace_users.workspace_id
				inner join users on workspace_users.user_id = users.id
				inner join admin_sessions on  users.id = admin_sessions.user_id
				where admin_sessions.token =:token and workspaces.id = :wsId',
      [
        ':token' => $token,
        ':wsId' => $workspaceId
      ]
    );

    return $user['role'] ?? '';
  }

  public function getTestSessions(int $workspaceId, array $groups): SessionChangeMessageArray {
    $groupSelector = false;
    if (count($groups)) {
      $groupSelector = "'" . implode("', '", $groups) . "'";
    }

    $modeSelector = "'" . implode("', '", Mode::getByCapability('monitorable')) . "'";

    $sql = 'SELECT
                 person_sessions.id as "person_id",
                 login_sessions.name as "loginName",
                 login_sessions.id as "login_sessions_id",
                 logins.name,
                 logins.mode,
                 logins.group_name,
                 logins.group_label,
                 logins.workspace_id,
                 person_sessions.code,
                 person_sessions.name_suffix,
                 tests.id as "test_id",
                 tests.name as "booklet_name",
                 tests.locked,
                 tests.running,
                 tests.laststate as "testState",
                 tests.timestamp_server as "test_timestamp_server"
            FROM person_sessions
                 LEFT JOIN tests ON person_sessions.id = tests.person_id
                 LEFT JOIN login_sessions ON login_sessions.id = person_sessions.login_sessions_id
                 LEFt JOIN logins on logins.name = login_sessions.name
            WHERE
                login_sessions.workspace_id = :workspaceId
                AND tests.id is not null'
      . ($groupSelector ? " AND logins.group_name IN ($groupSelector)" : '')
      . " AND logins.mode IN ($modeSelector)";

    $testSessionsData = $this->_($sql, [':workspaceId' => $workspaceId], true);

    $sessionChangeMessages = new SessionChangeMessageArray();

    foreach ($testSessionsData as $testSession) {
      $testState = $this->getTestFullState($testSession);

      $sessionChangeMessage = SessionChangeMessage::session(
        (int) $testSession['test_id'],
        new PersonSession(
          new LoginSession(
            (int) $testSession['login_sessions_id'],
            '',
            '',
            new Login(
              $testSession['name'],
              '',
              $testSession['mode'],
              $testSession['group_name'],
              $testSession['group_label'],
              [],
              (int) ['workspace_id']
            )
          ),
          new Person(
            (int) $testSession['person_id'],
            '',
            $testSession['code'],
            (string) $testSession['name_suffix'],
          )
        ),
        TimeStamp::fromSQLFormat($testSession['test_timestamp_server']),
      );
      $sessionChangeMessage->setTestState(
        $testState,
        $testSession['booklet_name'] ?? ""
      );

      $currentUnitName = $testState['CURRENT_UNIT_ID'] ?? null;

      if ($currentUnitName) {
        $currentUnitState = $this->getUnitState((int) $testSession['test_id'], $currentUnitName);

        if ($currentUnitState) {
          $sessionChangeMessage->setUnitState($currentUnitName, (array) $currentUnitState);
        }
      }

      $sessionChangeMessages->add($sessionChangeMessage);
    }

    return $sessionChangeMessages;
  }

  private function getUnitState(int $testId, string $unitName): stdClass {
    $unitData = $this->_("
      select
          laststate
      from
          units
      where
          units.booklet_id = :testId
          and units.name = :unitName",
      [
        ':testId' => $testId,
        ':unitName' => $unitName
      ]
    );

    if (!$unitData) {
      return (object) [];
    }

    $state = JSON::decode($unitData['laststate'], true) ?? (object) [];

    return (object) $state ?? (object) [];
  }

  public function getResponseReportData($workspaceId, $groups): ?array {
    $groupsPlaceholders = implode(',', array_fill(0, count($groups), '?'));
    $bindParams = array_merge([$workspaceId], $groups);

    // TODO: use data class
    $data = $this->_(<<<EOT
      select
        login_sessions.group_name as groupname,
        login_sessions.name as loginname,
        person_sessions.name_suffix as code,
        tests.name as bookletname,
        units.name as unitname,
        units.laststate,
        units.id as unit_id,
        units.original_unit_id as originalUnitId
      from
        login_sessions
          inner join person_sessions on login_sessions.id = person_sessions.login_sessions_id
          inner join tests on person_sessions.id = tests.person_id
          inner join units on tests.id = units.booklet_id
      where
        login_sessions.workspace_id = ?
          and login_sessions.group_name in ($groupsPlaceholders)
          and tests.id is not null
      EOT,
      $bindParams,
      true
    );

    foreach ($data as $index => $row) {
      $data[$index]['responses'] = $this->getResponseDataParts((int) $row['unit_id']);
      unset($data[$index]['unit_id']);
    }

    return $data;
  }

  public function getResponseDataParts(int $unitId): array {
    $data = $this->_(
      'select
         part_id as id,
         content,
         ts,
         response_type as responseType
       from
         unit_data
       where
         unit_id = :unit_id',
      [':unit_id' => $unitId],
      true
    );
    foreach ($data as $index => $row) {
      $data[$index]['ts'] = (int) $row['ts'];
    }
    return $data;
  }

  public function getLogReportData($workspaceId, $groups): ?array {
    $groupsPlaceholders = implode(',', array_fill(0, count($groups), '?'));
    $bindParams = array_merge([$workspaceId], $groups, [$workspaceId], $groups);

    // TODO: use data class
    return $this->_("
        SELECT
			      login_sessions.group_name as groupname,
            login_sessions.name as loginname,
            person_sessions.name_suffix as code,
            tests.name as bookletname,
            units.name as unitname,
            units.original_unit_id as originalUnitId,
				    unit_logs.timestamp,
            unit_logs.logentry
			  FROM
			      login_sessions,
            person_sessions,
            tests,
            units,
            unit_logs
			  WHERE
            login_sessions.workspace_id = ? AND
            login_sessions.group_name IN ($groupsPlaceholders) AND
            login_sessions.id = person_sessions.login_sessions_id AND
            person_sessions.id = tests.person_id AND
            tests.id = units.booklet_id AND
            units.id = unit_logs.unit_id
        
        UNION ALL
        
        SELECT
				    login_sessions.group_name as groupname,
            login_sessions.name as loginname,
            person_sessions.name_suffix as code,
            tests.name as bookletname,
            '' as unitname,
            '' as originalUnitId,
            test_logs.timestamp,
            test_logs.logentry
			  FROM
            login_sessions,
            person_sessions,
            tests,
            test_logs
        WHERE
            login_sessions.workspace_id = ? AND
            login_sessions.group_name IN ($groupsPlaceholders) AND
            login_sessions.id = person_sessions.login_sessions_id AND
            person_sessions.id = tests.person_id AND
            tests.id = test_logs.booklet_id
			",
      $bindParams,
      true
    );
  }

  public function getReviewReportData($workspaceId, $groups): ?array {
    $groupsPlaceholders = implode(',', array_fill(0, count($groups), '?'));
    $bindParams = array_merge([$workspaceId], $groups, [$workspaceId], $groups);

    // TODO: use data class
    return $this->_(
      "
      SELECT
        login_sessions.group_name as groupname,
        login_sessions.name as loginname,
        person_sessions.name_suffix as code,
        tests.name as bookletname,
        units.name as unitname,
        unit_reviews.priority,
        unit_reviews.categories,
        unit_reviews.reviewtime,
        unit_reviews.entry,
        unit_reviews.page,
        unit_reviews.pagelabel,
        units.original_unit_id as originalUnitId,
        unit_reviews.user_agent as userAgent
			FROM
        login_sessions,
        person_sessions,
        tests,
        units,
        unit_reviews
			WHERE
        login_sessions.workspace_id = ? AND
        login_sessions.group_name IN ($groupsPlaceholders) AND
        login_sessions.id = person_sessions.login_sessions_id AND
        person_sessions.id = tests.person_id AND
        tests.id = units.booklet_id AND
        units.id = unit_reviews.unit_id
			
			UNION ALL
        
      SELECT
        login_sessions.group_name as groupname,
        login_sessions.name as loginname,
        person_sessions.name_suffix as code,
        tests.name as bookletname,
        '' as unitname,
        test_reviews.priority,
        test_reviews.categories,
        test_reviews.reviewtime,
        test_reviews.entry,
        null as page,
        null as pagelabel,
        '' as originalUnitId,
        test_reviews.user_agent as userAgent
			FROM
        login_sessions,
        person_sessions,
        tests,
        test_reviews
			WHERE
        login_sessions.workspace_id = ? AND
        login_sessions.group_name IN ($groupsPlaceholders) AND
        login_sessions.id = person_sessions.login_sessions_id AND
        person_sessions.id = tests.person_id AND
        tests.id = test_reviews.booklet_id
			",
      $bindParams,
      true
    );
  }

  public function getResultStats(int $workspaceId): array {
    $resultStats = $this->_('
      select
        group_name,
        group_label,
        count(*) as bookletsStarted,
        min(num_units) as num_units_min,
        max(num_units) as num_units_max,
        sum(num_units) as num_units_total,
        avg(num_units) as num_units_mean,
        max(timestamp_server) as lastchange
      from (
        select
          login_sessions.group_name,
          group_label,
          count(distinct units.id) as num_units,
          max(tests.timestamp_server) as timestamp_server
        from
          tests
          left join person_sessions 
            on person_sessions.id = tests.person_id
          inner join login_sessions
            on login_sessions.id = person_sessions.login_sessions_id
          left join units
            on units.booklet_id = tests.id
          left join unit_reviews
            on units.id = unit_reviews.unit_id
          left join test_reviews
            on tests.id = test_reviews.booklet_id
          left join login_session_groups on 
            login_sessions.group_name = login_session_groups.group_name
              and login_sessions.workspace_id = login_session_groups.workspace_id
        where
          login_sessions.workspace_id = :workspaceId
          and (
            tests.laststate is not null
              or unit_reviews.entry is not null
              or test_reviews.entry is not null
          )
          and tests.running = 1
          group by tests.name, person_sessions.id, login_sessions.group_name, group_label
      ) as byGroup
      group by group_name',
      [
        ':workspaceId' => $workspaceId
      ],
      true
    );

    return array_map(function ($groupStats) {
      return [
        "groupName" => $groupStats["group_name"],
        "groupLabel" => $groupStats["group_label"],
        "bookletsStarted" => (int) $groupStats["bookletsStarted"],
        "numUnitsMin" => (int) $groupStats["num_units_min"],
        "numUnitsMax" => (int) $groupStats["num_units_max"],
        "numUnitsTotal" => (int) $groupStats["num_units_total"],
        "numUnitsAvg" => (float) $groupStats["num_units_mean"],
        "lastChange" => TimeStamp::fromSQLFormat((string) $groupStats["lastchange"])
      ];
    }, $resultStats);
  }

  public function storeCommand(int $commanderId, int $testId, Command $command): int {
    if ($command->getId() === -1) {
      $maxId = $this->_("select max(id) as max from test_commands");
      $commandId = isset($maxId['max']) ? (int) $maxId['max'] + 1 : 1;
    } else {
      $commandId = $command->getId();
    }

    $this->_("insert into test_commands (id, test_id, keyword, parameter, commander_id, timestamp)
                values (:id, :test_id, :keyword, :parameter, :commander_id, :timestamp)",
      [
        ':id' => $commandId,
        ':test_id' => $testId,
        ':keyword' => $command->getKeyword(),
        ':parameter' => json_encode($command->getArguments()),
        ':commander_id' => $commanderId,
        ':timestamp' => TimeStamp::toSQLFormat($command->getTimestamp())
      ]
    );

    return $commandId;
  }

  // TODO use typed class instead of array
  public function getTest(int $testId): ?array {
    return $this->_(
      'select tests.locked, tests.id, tests.laststate, tests.label from tests where tests.id=:id',
      [':id' => $testId]
    );
  }

  public function getGroup(string $groupName): ?Group {
    $group = $this->_(
      'select group_name, group_label
                from logins
                where group_name=:group_name
                group by group_name, group_label',
      [
        ":group_name" => $groupName
      ]
    );
    return ($group == null) ? null : new Group($group['group_name'], $group['group_label']);
  }

  // TODO unit-test
  public function getAttachmentById(string $attachmentId): Attachment {
    $attachments = $this->getAttachments(0, [], $attachmentId);

    if (!count($attachments)) {
      throw new HttpError("Attachment not found: `$attachmentId`", 404);
    }

    return $attachments[0];
  }

  // TODO unit-test
  public function getAttachments(int $workspaceId = 0, array $groups = [], string $attachmentId = ''): array {
    $selectors = [];
    $replacements = [];

    if (count($groups)) {
      $selectors[] = "logins.group_name in (" . implode(',', array_fill(0, count($groups), '? ')) . ")";
      $replacements = $groups;
    }

    if ($workspaceId) {
      $selectors[] = "logins.workspace_id = ?";
      $replacements[] = $workspaceId;
    }

    if ($attachmentId) {
      list($testId, $unitName, $variableId) = Attachment::decodeId($attachmentId);
      $selectors[] = "tests.id = ?";
      $selectors[] = "unit_name = ?";
      $selectors[] = "variable_id = ?";
      $replacements[] = $testId;
      $replacements[] = $unitName;
      $replacements[] = $variableId;
    }

    $sql = "select
                group_label as groupLabel,
                logins.group_name as groupName,
                logins.name as loginName,
                name_suffix as nameSuffix,
                tests.label as testLabel,
                tests.id as testId,
                tests.name as bookletName,
                unit_name as unitName,
                unit_name as unitLabel, -- TODO get real unitLabel
                variable_id as variableId,
                attachment_type as attachmentType,
                unit_data.content as dataPartContent,
                (tests.id || ':' || unit_name ||  ':' || variable_id) as attachmentId,
                unit_data.ts as lastModified
            from
                unit_defs_attachments
                left join tests on booklet_name = tests.name
                left join person_sessions on tests.person_id = person_sessions.id
                left join login_sessions on person_sessions.login_sessions_id = login_sessions.id
                left join logins on logins.name = login_sessions.name
                left join unit_data on part_id = (tests.id || ':' || unit_name || ':' || variable_id)
            where " . implode(' and ', $selectors);

    $attachments = $this->_($sql, $replacements, true);

    $attachmentData = [];
    foreach ($attachments as $attachment) {
      $dataPart = JSON::decode($attachment['dataPartContent'], true);
      $attachmentFileIds = $dataPart ? $dataPart[0]['value'] : [];

      $attachmentData[] = new Attachment(
        $attachment['attachmentId'],
        $attachment['attachmentType'],
        $attachment['dataPartContent'] ? explode(':', $attachmentFileIds[0])[0] : 'missing',
        $attachmentFileIds,
        $attachment['lastModified'],
        $attachment['groupName'],
        $attachment['groupLabel'],
        $attachment['loginName'],
        $attachment['nameSuffix'],
        $attachment['testLabel'],
        $attachment['bookletName'],
        $attachment['unitLabel']
      );
    }
    return $attachmentData;
  }

  public function deleteAdminSession(AuthToken $authToken): void {
    $this->_('delete from admin_sessions where token =:token', [':token' => $authToken->getToken()]);
  }

  public function doesWSwitTypeSyscheckExist(): bool {
    return $this->_("select count(*) as count from workspaces where content_type = 'sysCheck'")['count'] > 0;
  }
}
