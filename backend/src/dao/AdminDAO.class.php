<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

use Slim\Exception\HttpBadRequestException;

class AdminDAO extends DAO {
  /**
   * @codeCoverageIgnore
   */
  public function refreshAdminToken(string $token): void {
    $this->_(
      'UPDATE admin_sessions
            SET valid_until =:value
            WHERE token =:token',
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
      'SELECT * FROM users WHERE users.name = :name',
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
      'DELETE FROM admin_sessions WHERE admin_sessions.user_id = :id',
      [':id' => $userId]
    );
  }

  private function storeToken(int $userId, string $token, ?int $validTo = null): void {
    $validTo = $validTo ?? TimeStamp::expirationFromNow(0, $this->timeUserIsAllowedInMinutes);

    $this->_(
      'INSERT INTO admin_sessions (token, user_id, valid_until)
			VALUES(:token, :user_id, :valid_until)',
      [
        ':token' => $token,
        ':user_id' => $userId,
        ':valid_until' => TimeStamp::toSQLFormat($validTo)
      ]
    );
  }

  public function getAdmin(string $token): Admin {
    $admin = $this->_(
      'SELECT
        users.id,
        users.name,
        users.email,
        users.is_superadmin,
        users.pw_set_by_admin,
        admin_sessions.valid_until
      FROM users
			INNER JOIN admin_sessions ON users.id = admin_sessions.user_id
			WHERE admin_sessions.token=:token',
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
      "DELETE FROM login_session_groups WHERE group_name = :group_name AND workspace_id = :workspace_id",
      [
        ':workspace_id' => $workspaceId,
        ':group_name' => $groupName
      ]
    );
  }

  public function deleteResultDataByPersonAndBooklet(int $workspaceId, array $setsToDelete): void {
    $placeholders = [];
    $params = [':workspace_id' => $workspaceId];
    foreach ($setsToDelete as $index => $set) {
      $placeholders[] = "(:login_name_$index, :code_$index, :name_suffix_$index, :booklet_name_$index)";
      $params[":login_name_$index"] = $set['loginName'];
      $params[":code_$index"] = $set['code'];
      $params[":name_suffix_$index"] = $set['nameSuffix'];
      $params[":booklet_name_$index"] = $set['bookletName'];
    }

    $affectedGroups = $this->_(
      "
      SELECT DISTINCT login_sessions.group_name
       FROM tests
       INNER JOIN person_sessions ON tests.person_id = person_sessions.id
       INNER JOIN login_sessions ON person_sessions.login_sessions_id = login_sessions.id
       WHERE login_sessions.workspace_id = :workspace_id
          AND (login_sessions.name, person_sessions.code, person_sessions.name_suffix, tests.name) IN (" . implode(',', $placeholders) . ")",
      $params,
      true
    );

    $this->_(
      "
      DELETE tests 
       FROM tests
       INNER JOIN person_sessions ON tests.person_id = person_sessions.id
       INNER JOIN login_sessions ON person_sessions.login_sessions_id = login_sessions.id
       WHERE login_sessions.workspace_id = :workspace_id
          AND (login_sessions.name, person_sessions.code, person_sessions.name_suffix, tests.name) IN (" . implode(',', $placeholders) . ")" ,
      $params
    );

    foreach ($affectedGroups as $row) {
      $this->_('
        UPDATE login_session_groups 
        SET last_modified = :now
        WHERE workspace_id = :workspace_id 
          AND group_name = :group_name',
        [
          ':now' => TimeStamp::toSQLFormat(TimeStamp::now()),
          ':workspace_id' => $workspaceId,
          ':group_name' => $row['group_name']
        ]
      );
    }
  }

  /** @return WorkspaceData[] */
  public function getWorkspaces(string $token): array {
    $workspaces = $this->_(
      'SELECT
        workspaces.id,
        workspaces.name,
        workspace_users.role
      FROM workspaces
        INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
        INNER JOIN users ON workspace_users.user_id = users.id
        INNER JOIN admin_sessions ON  users.id = admin_sessions.user_id
      WHERE
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
      'SELECT workspaces.id FROM workspaces
				INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
				INNER JOIN users ON workspace_users.user_id = users.id
				INNER JOIN admin_sessions ON  users.id = admin_sessions.user_id
				WHERE admin_sessions.token =:token AND workspaces.id = :wsId',
      [
        ':token' => $token,
        ':wsId' => $workspaceId
      ]
    );

    return $data != false;
  }

  public function hasMonitorAccessToWorkspace(string $token, int $workspaceId): bool {
    $data = $this->_(
      'SELECT workspaces.id FROM workspaces
				INNER JOIN login_sessions ON workspaces.id = login_sessions.workspace_id
				INNER JOIN person_sessions ON person_sessions.login_sessions_id = login_sessions.id
				WHERE person_sessions.token =:token AND workspaces.id = :wsId',
      [
        ':token' => $token,
        ':wsId' => $workspaceId
      ]
    );

    return $data != false;
  }

  public function getWorkspaceRole(string $token, int $workspaceId): string {
    $user = $this->_(
      'SELECT workspace_users.role FROM workspaces
				INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
				INNER JOIN users ON workspace_users.user_id = users.id
				INNER JOIN admin_sessions ON  users.id = admin_sessions.user_id
				WHERE admin_sessions.token =:token AND workspaces.id = :wsId',
      [
        ':token' => $token,
        ':wsId' => $workspaceId
      ]
    );

    return $user['role'] ?? '';
  }

  public function getTestSessions(int $workspaceId, array $groups): SessionChangeMessageArray {
    $sql = 'SELECT
               person_sessions.id AS "person_id",
               login_sessions.name AS "loginName",
               login_sessions.id AS "login_sessions_id",
               logins.name,
               logins.mode,
               logins.group_name,
               logins.group_label,
               logins.workspace_id,
               person_sessions.code,
               person_sessions.name_suffix,
               tests.id AS "test_id",
               tests.name AS "booklet_name",
               tests.locked,
               tests.running,
               tests.laststate AS "testState",
               tests.timestamp_server AS "test_timestamp_server"
          FROM person_sessions
               LEFT JOIN tests ON person_sessions.id = tests.person_id
               LEFT JOIN login_sessions ON login_sessions.id = person_sessions.login_sessions_id
               LEFT JOIN logins ON logins.name = login_sessions.name
          WHERE
              login_sessions.workspace_id = :workspaceId
              AND tests.id IS NOT NULL';

    $params = [':workspaceId' => $workspaceId];

    if ($groups) {
      $groupPlaceholders = [];
      $index = 0;
      foreach ($groups as $groupName) {
        $placeholder = ":g$index";
        $groupPlaceholders[] = $placeholder;
        $params[$placeholder] = $groupName;
        $index++;
      }
      $sql .= ' AND logins.group_name IN (' . implode(', ', $groupPlaceholders) . ')';
    }

    $modes = Mode::getByCapability('monitorable');
    if ($modes) {
      $modePlaceholders = [];
      $index = 0;
      foreach ($modes as $mode) {
        $placeholder = ":m$index";
        $modePlaceholders[] = $placeholder;
        $params[$placeholder] = $mode;
        $index++;
      }
      $sql .= ' AND logins.mode IN (' . implode(', ', $modePlaceholders) . ')';
    }

    $testSessionsData = $this->_($sql, $params, true);

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
        $sessionChangeMessage->setUnitState($currentUnitName, $currentUnitState);
      }

      $sessionChangeMessages->add($sessionChangeMessage);
    }

    return $sessionChangeMessages;
  }

  /**
   * @return array<string, array<int, TestSession>> Associative array of test session data grouped by group_name
   */
  public function getTestSessionsWithState(int $workspaceId): array {

    $sql = 'SELECT
                 login_sessions.name,
                 login_session_groups.group_name,
                 login_session_groups.group_label,
                 person_sessions.code,
                 person_sessions.name_suffix,
                 tests.name AS "booklet_name",
                 tests.label AS "booklet_label"
            FROM person_sessions
                 LEFT JOIN tests ON person_sessions.id = tests.person_id
                 LEFT JOIN login_sessions ON login_sessions.id = person_sessions.login_sessions_id
                 LEFT JOIN login_session_groups ON login_session_groups.group_name = login_sessions.group_name
            WHERE
                login_sessions.workspace_id = :workspaceId
                AND tests.id IS NOT NULL
                AND tests.laststate != \'{}\'
                AND tests.laststate IS NOT NULL
            ORDER BY login_sessions.group_name, tests.id';

    $testSessionsData = $this->_($sql, [':workspaceId' => $workspaceId], true);

    $groupedSessions = [];
    foreach ($testSessionsData as $session) {
      $groupName = $session['group_name'];
      if (!isset($groupedSessions[$groupName])) {
        $groupedSessions[$groupName] = [];
      }
      $groupedSessions[$groupName][] = new TestSession(
        $session['name'],
        $session['group_name'],
        $session['group_label'],
        $session['code'],
        $session['name_suffix'],
        $session['booklet_name'],
        $session['booklet_label']
      );
    }
    
    return $groupedSessions;
  }

  private function getUnitState(int $testId, string $unitName): array {
    $unitData = $this->_("
      SELECT
        laststate
      FROM
        units
      WHERE
        units.test_id = :testId
        AND units.name = :unitName",
      [
        ':testId' => $testId,
        ':unitName' => $unitName
      ]
    );

    if (!$unitData) {
      return [];
    }

    $state = JSON::decode($unitData['laststate'], true) ?? [];

    return $state ?? [];
  }

  public function getResponseReportData($workspaceId, $groups): ?array {
    $groupsPlaceholders = implode(',', array_fill(0, count($groups), '?'));
    $bindParams = array_merge([$workspaceId], $groups);

    // TODO: use data class
    $data = $this->_(<<<EOT
      SELECT
        login_sessions.group_name AS groupname,
        login_sessions.name AS loginname,
        person_sessions.name_suffix AS code,
        tests.name AS bookletname,
        tests.id AS testId,
        units.name AS unitname,
        units.laststate,
        units.original_unit_id AS originalUnitId
      FROM
        login_sessions
          INNER JOIN person_sessions ON login_sessions.id = person_sessions.login_sessions_id
          INNER JOIN tests ON person_sessions.id = tests.person_id
          INNER JOIN units ON tests.id = units.test_id
      WHERE
        login_sessions.workspace_id = ?
          AND login_sessions.group_name IN ($groupsPlaceholders)
      ORDER BY
        login_sessions.group_name,
        login_sessions.name,
        person_sessions.name_suffix,
        tests.name,
        units.name,
        units.original_unit_id
      EOT,
      $bindParams,
      true
    );

    foreach ($data as $index => $row) {
      $data[$index]['responses'] = $this->getResponseDataParts($row['unitname'], $row['testId']);
      unset($data[$index]['testId']);
    }

    return $data;
  }

  public function getResponseDataParts(string $unitName, int $testId): array {
    $data = $this->_(
      'SELECT
          part_id AS id,
          content,
          ts,
          response_type AS responseType
        FROM
          unit_data
        WHERE
          unit_name = :unit_name
          AND test_id = :test_id',
        [
          ':unit_name' => $unitName,
          ':test_id' => $testId
        ],
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
			      login_sessions.group_name AS groupname,
            login_sessions.name AS loginname,
            person_sessions.name_suffix AS code,
            tests.name AS bookletname,
            units.name AS unitname,
            units.original_unit_id AS originalUnitId,
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
            tests.id = units.test_id AND
            units.test_id = unit_logs.test_id AND 
            units.name = unit_logs.unit_name
        
        UNION ALL
        
        SELECT
				    login_sessions.group_name AS groupname,
            login_sessions.name AS loginname,
            person_sessions.name_suffix AS code,
            tests.name AS bookletname,
            '' AS unitname,
            '' AS originalUnitId,
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
        login_sessions.group_name AS groupname,
        login_sessions.name AS loginname,
        person_sessions.name_suffix AS code,
        tests.name AS bookletname,
        units.name AS unitname,
        unit_reviews.priority,
        unit_reviews.categories,
        unit_reviews.reviewtime,
        unit_reviews.entry,
        unit_reviews.page,
        unit_reviews.pagelabel,
        units.original_unit_id AS originalUnitId,
        unit_reviews.user_agent AS userAgent,
        unit_reviews.reviewer
			FROM
        unit_reviews
        LEFT JOIN units ON units.test_id = unit_reviews.test_id AND units.name = unit_reviews.unit_name
        LEFT JOIN tests ON tests.id = units.test_id
        LEFT JOIN person_sessions ON person_sessions.id = tests.person_id
        LEFT JOIN login_sessions ON login_sessions.id = person_sessions.login_sessions_id
			WHERE
        login_sessions.workspace_id = ? AND
        login_sessions.group_name IN ($groupsPlaceholders)
			
			UNION ALL
        
      SELECT
        login_sessions.group_name AS groupname,
        login_sessions.name AS loginname,
        person_sessions.name_suffix AS code,
        tests.name AS bookletname,
        '' AS unitname,
        test_reviews.priority,
        test_reviews.categories,
        test_reviews.reviewtime,
        test_reviews.entry,
        NULL AS page,
        NULL AS pagelabel,
        '' AS originalUnitId,
        test_reviews.user_agent AS userAgent,
        test_reviews.reviewer
			FROM
        test_reviews
        LEFT JOIN tests ON test_reviews.booklet_id = tests.id
        LEFT JOIN person_sessions ON tests.person_id = person_sessions.id
        LEFT JOIN login_sessions ON person_sessions.login_sessions_id = login_sessions.id
			WHERE
        login_sessions.workspace_id = ? AND
        login_sessions.group_name IN ($groupsPlaceholders)
			",
      $bindParams,
      true
    );
  }

  public function getResultStats(int $workspaceId, array $groups = []): array {
    $groupFilter = '';
    $params = [':workspaceId' => $workspaceId];

    if (count($groups)) {
      $placeholders = [];
      foreach ($groups as $index => $group) {
        $key = ":group$index";
        $placeholders[] = $key;
        $params[$key] = $group;
      }
      $groupFilter = 'AND login_sessions.group_name IN (' . implode(',', $placeholders) . ')';
    }

    $resultStats = $this->_("
      SELECT
        group_name,
        group_label,
        COUNT(*) AS bookletsStarted,
        MIN(num_units) AS num_units_min,
        MAX(num_units) AS num_units_max,
        SUM(num_units) AS num_units_total,
        AVG(num_units) AS num_units_mean,
        GREATEST(
          MAX(timestamp_server),
          MAX(group_last_modified)
        ) AS lastchange
      FROM (
        SELECT
          login_sessions.group_name,
          group_label,
          COUNT(DISTINCT units.name, units.test_id) AS num_units,
          MAX(tests.timestamp_server) AS timestamp_server,
          login_session_groups.last_modified AS group_last_modified
        FROM
          tests
          LEFT JOIN person_sessions
            ON person_sessions.id = tests.person_id
          INNER JOIN login_sessions
            ON login_sessions.id = person_sessions.login_sessions_id
          LEFT JOIN units
            ON units.test_id = tests.id
          LEFT JOIN unit_reviews
            ON units.name = unit_reviews.unit_name AND unit_reviews.test_id = units.test_id
          LEFT JOIN test_reviews
            ON tests.id = test_reviews.booklet_id
          LEFT JOIN login_session_groups ON
            login_sessions.group_name = login_session_groups.group_name
              AND login_sessions.workspace_id = login_session_groups.workspace_id
        WHERE
          login_sessions.workspace_id = :workspaceId
          $groupFilter
          AND (
            tests.laststate IS NOT NULL
              OR unit_reviews.entry IS NOT NULL
              OR test_reviews.entry IS NOT NULL
          )
          AND tests.running = 1
          GROUP BY tests.name, person_sessions.id, login_sessions.group_name, group_label, login_session_groups.last_modified
      ) as byGroup
      GROUP BY group_name",
      $params,
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
      $maxId = $this->_("SELECT MAX(id) AS max FROM test_commands");
      $commandId = isset($maxId['max']) ? (int) $maxId['max'] + 1 : 1;
    } else {
      $commandId = $command->getId();
    }

    $this->_("INSERT INTO test_commands (id, test_id, keyword, parameter, commander_id, timestamp)
                VALUES (:id, :test_id, :keyword, :parameter, :commander_id, :timestamp)",
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
      'SELECT tests.locked, tests.id, tests.laststate, tests.label FROM tests WHERE tests.id=:id',
      [':id' => $testId]
    );
  }

  public function getGroup(string $groupName): ?Group {
    $group = $this->_(
      'SELECT group_name, group_label
                FROM logins
                WHERE group_name=:group_name
                GROUP BY group_name, group_label',
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
      $selectors[] = "logins.group_name IN (" . implode(',', array_fill(0, count($groups), '? ')) . ")";
      $replacements = $groups;
    }

    if ($workspaceId) {
      $selectors[] = "logins.workspace_id = ?";
      $replacements[] = $workspaceId;
    }

    if ($attachmentId) {
      list($testId, $unitName, $variableId) = Attachment::decodeId($attachmentId);
      $selectors[] = "tests.id = ?";
      $selectors[] = "unit_defs_attachments.unit_name = ?";
      $selectors[] = "variable_id = ?";
      $replacements[] = $testId;
      $replacements[] = $unitName;
      $replacements[] = $variableId;
    }

    $sql = "SELECT
                group_label AS groupLabel,
                logins.group_name AS groupName,
                logins.name AS loginName,
                name_suffix AS nameSuffix,
                tests.label AS testLabel,
                tests.id AS testId,
                tests.name AS bookletName,
                unit_defs_attachments.unit_name AS unitName,
                unit_defs_attachments.unit_name AS unitLabel, -- TODO get real unitLabel
                variable_id AS variableId,
                attachment_type AS attachmentType,
                unit_data.content AS dataPartContent,
                (tests.id || ':' || unit_defs_attachments.unit_name ||  ':' || variable_id) AS attachmentId,
                unit_data.ts AS lastModified
            FROM
                unit_defs_attachments
                LEFT JOIN tests ON booklet_name = tests.name
                LEFT JOIN person_sessions ON tests.person_id = person_sessions.id
                LEFT JOIN login_sessions ON person_sessions.login_sessions_id = login_sessions.id
                LEFT JOIN logins ON logins.name = login_sessions.name
                LEFT JOIN unit_data ON part_id = (tests.id || ':' || unit_defs_attachments.unit_name || ':' || variable_id)
            WHERE " . implode(' AND ', $selectors);

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
    $this->_('DELETE FROM admin_sessions WHERE token =:token', [':token' => $authToken->getToken()]);
  }

  public function doesWSwitTypeSyscheckExist(): bool {
    return $this->_("SELECT COUNT(*) AS count FROM workspaces WHERE content_type = 'sysCheck'")['count'] > 0;
  }
}
