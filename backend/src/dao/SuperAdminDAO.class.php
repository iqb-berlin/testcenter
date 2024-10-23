<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class SuperAdminDAO extends DAO {
  public function getWorkspaces(): array {
    return $this->_(
      'select workspaces.id, workspaces.name, MAX(files.modification_ts) AS latest_modification_ts
      FROM workspaces
      LEFT JOIN files ON workspaces.id = files.workspace_id
      GROUP BY workspaces.id, workspaces.name
      ORDER BY workspaces.name',
      [],
      true
    );
  }

  public function getUsers(): array {
    return array_map(
      function($user) {
        $user['isSuperadmin'] = (bool) $user['isSuperadmin'];
        return $user;
      },
      $this->_(
        'select users.name, users.id, users.email, users.is_superadmin as "isSuperadmin" from users order by users.name',
        [],
        true
      ));
  }

  public function getUserByName(string $userName): array { // TODO isSuperadmin should be boolean
    $user = $this->_(
      'select 
                    users.name, 
                    users.id, 
                    users.email, 
                    users.is_superadmin as "isSuperadmin" 
                from users 
                where users.name=:user_name',
      [':user_name' => $userName]
    );
    if ($user == null) {
      throw new Exception("User `$userName` does not exist");
    }
    return $user;
  }

  // id, name, selected, role
  public function getWorkspacesByUser(int $userId): array {
    $userRolesByWorkspace = $this->getMapWorkspaceToRoleByUser($userId);

    $allWorkspaces = $this->_(
      'select workspaces.id, workspaces.name from workspaces order by workspaces.name',
      [],
      true
    );

    $allWorkspacesWithUsersRole = [];
    foreach ($allWorkspaces as $workspace) {
      $allWorkspacesWithUsersRole[] = [
        'id' => $workspace['id'],
        'name' => $workspace['name'],
        'selected' => isset($userRolesByWorkspace[$workspace['id']]),
        'role' => $userRolesByWorkspace[$workspace['id']] ?? ''
      ];
    }

    return $allWorkspacesWithUsersRole;
  }

  public function getMapWorkspaceToRoleByUser(int $userId): array {
    $userWorkspaces = $this->_(
      'select 
                workspace_users.workspace_id as id, 
                workspace_users.role as role  
            from workspace_users
                inner join users on users.id = workspace_users.user_id
            where 
                users.id = :user_id',
      [':user_id' => $userId],
      true
    );

    $mapWorkspaceToRole = [];
    foreach ($userWorkspaces as $userWorkspace) {
      $mapWorkspaceToRole[$userWorkspace['id']] = $userWorkspace['role'];
    }
    return $mapWorkspaceToRole;
  }

  public function setWorkspaceRightsByUser(int $userId, array $listOfWorkspaceIdsAndRoles) {
    $this->_('delete from workspace_users where workspace_users.user_id=:user_id', [':user_id' => $userId]);

    foreach ($listOfWorkspaceIdsAndRoles as $workspaceIdAndRole) {
      if (strlen($workspaceIdAndRole->role) > 0) {
        $this->_(
          'insert into workspace_users (workspace_id, user_id, role) values (:workspaceId, :userId, :role)',
          [
            ':workspaceId' => $workspaceIdAndRole->id,
            ':role' => $workspaceIdAndRole->role,
            ':userId' => $userId
          ]
        );
      }
    }
  }

  public function setPassword(int $userId, string $password, ?AuthToken $authToken = null): void {
    Password::validate($password);

    $this->_(
      'update users set password = :password, pw_set_by_admin = :pw_set_by_admin where id = :user_id',
      [
        ':user_id' => $userId,
        ':pw_set_by_admin' => not_null($authToken) && $authToken->getMode() === 'super-admin' ? 1 : 0,
        ':password' => Password::encrypt($password, $this->passwordSalt, $this->insecurePasswords)
      ]
    );
  }

  public function checkPassword(int $userId, string $password): bool {
    $usersOfThisName = $this->_(
      'select * from users where users.id = :id',
      [':id' => $userId],
      true
    );

    // we always check at least one user to not leak the existence of username to time-attacks
    $usersOfThisName = (!count($usersOfThisName)) ? ['password' => 'dummy'] : $usersOfThisName;

    foreach ($usersOfThisName as $user) {
      if (Password::verify($password, $user['password'], $this->passwordSalt)) {
        return true;
      }
    }

    return false;
  }

  public function createUser(string $userName, string $password, bool $isSuperadmin = false, bool $pwSetByAdmin = false): array {
    Password::validate($password);

    $user = $this->_(
      'select users.name from users where users.name=:user_name',
      [':user_name' => $userName]
    );

    if ($user) {
      throw new HttpError("User with name `$userName` already exists!", 400);
    }

    $this->_(
      'insert into users (name, password, is_superadmin, pw_set_by_admin) values (:user_name, :user_password, :is_superadmin, :pw_set_by_admin)',
      [
        ':user_name' => $userName,
        ':user_password' => Password::encrypt($password, $this->passwordSalt, $this->insecurePasswords),
        ':is_superadmin' => $isSuperadmin ? 1 : 0,
        ':pw_set_by_admin' => $pwSetByAdmin ? 1 : 0
      ]
    );

    return [
      'id' => $this->pdoDBhandle->lastInsertId(),
      'name' => $userName,
      'email' => null,
      'isSuperadmin' => $isSuperadmin ? 1 : 0
    ];
  }

  public function deleteUsers(array $userIds): void { // TODO add unit test

    foreach ($userIds as $userId) {
      $this->_(
        'delete from users where users.id = :user_id',
        [':user_id' => $userId]
      );
    }
  }

  public function getOrCreateWorkspace(string $name): array {
    $workspace = $this->_(
      "select workspaces.id, workspaces.name from workspaces where `name` = :ws_name",
      [':ws_name' => $name]
    );

    if ($workspace != null) {
      return $workspace;
    }

    return $this->createWorkspace($name);
  }

  public function createWorkspace($name): array {
    $workspace = $this->_(
      'select workspaces.id from workspaces where workspaces.name=:ws_name',
      [':ws_name' => $name]
    );

    if ($workspace) {
      throw new HttpError("Workspace with name `$name` already exists!", 400);
    }

    $this->_(
      'insert into workspaces (name) values (:ws_name)',
      [':ws_name' => $name]
    );

    return [
      'id' => $this->pdoDBhandle->lastInsertId(),
      'name' => $name
    ];
  }

  public function setWorkspaceName($wsId, $newName) {
    $workspace = $this->_(
      'select workspaces.id from workspaces where workspaces.id=:ws_id',
      [':ws_id' => $wsId]
    );

    if (!$workspace) {
      throw new HttpError("Workspace with id `$wsId` does not exist!", 400);
    }

    $workspace = $this->_(
      "select workspaces.id, workspaces.name from workspaces where `name` = :ws_name",
      [':ws_name' => $newName]
    );

    if ($workspace) {
      throw new HttpError("Workspace with name `$newName` already exists!", 400);
    }

    $this->_(
      'update workspaces set name = :name where id = :id',
      [
        ':name' => $newName,
        ':id' => $wsId
      ]
    );
  }

  public function deleteWorkspaces(array $wsIds): void {
    foreach ($wsIds as $wsId) {
      $this->_(
        'delete from workspaces
                where workspaces.id = :ws_id',
        [':ws_id' => $wsId]
      );
    }
    // TODO ROLLBACK if one fails!
  }

  public function getUsersByWorkspace(int $workspaceId): array {
    $workspaceRolesPerUser = $this->getMapUserToRoleByWorkspace($workspaceId);

    $allUsers = $this->_('select users.id, users.name from users order by users.name', [], true);

    $allUsersWithTheirRolesOnWorkspace = [];
    foreach ($allUsers as $user) {
      $allUsersWithTheirRolesOnWorkspace[] = [
        'id' => $user['id'],
        'name' => $user['name'],
        'selected' => isset($workspaceRolesPerUser[$user['id']]),
        'role' => $workspaceRolesPerUser[$user['id']] ?? '',
      ];
    }
    return $allUsersWithTheirRolesOnWorkspace;
  }

  public function getMapUserToRoleByWorkspace(int $workspaceId): array {
    $workspaceUsers = $this->_(
      'select 
                workspace_users.user_id as id, 
                workspace_users.role as role 
            from workspace_users
            where workspace_users.workspace_id=:ws_id',
      [':ws_id' => $workspaceId],
      true
    );
    $workspaceRolesPerUser = [];
    foreach ($workspaceUsers as $workspaceUser) {
      $workspaceRolesPerUser[$workspaceUser['id']] = $workspaceUser['role'];
    }
    return $workspaceRolesPerUser;
  }

  public function setUserRightsForWorkspace(int $wsId, array $listOfUserIdsAndRoles): void {
    $this->_('delete from workspace_users where workspace_users.workspace_id=:ws_id', [':ws_id' => $wsId]);

    foreach ($listOfUserIdsAndRoles as $userIdAndRole) {
      if (strlen($userIdAndRole->role) > 0) {
        $this->_(
          'insert into workspace_users (workspace_id, user_id, role) 
                    values(:workspaceId, :userId, :role)',
          [
            ':workspaceId' => $wsId,
            ':role' => $userIdAndRole->role,
            ':userId' => $userIdAndRole->id
          ]
        );
      }
    }
  }

  public function setSuperAdminStatus(int $userId, bool $isSuperAdmin): void {
    $this->_(
      'update users set is_superadmin = :is_superadmin where id = :user_id',
      [
        ':user_id' => $userId,
        ':is_superadmin' => $isSuperAdmin ? 1 : 0
      ]
    );
  }
}
