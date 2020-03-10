<?php

/** @noinspection PhpUnhandledExceptionInspection */


class SuperAdminDAO extends DAO {


    public function getWorkspaces(): array {

        return $this->_(
            'SELECT workspaces.id, workspaces.name FROM workspaces ORDER BY workspaces.name',
            array(),
            true
        );
    }


    // name, id, email, is_superadmin
    public function getUsers(): array {

        return $this->_(
            'SELECT users.name, users.id, users.email, users.is_superadmin FROM users ORDER BY users.name',
            array(),
            true
        );
    }

    // name, id, email, is_superadmin
    public function getUserByName(string $userName): array {

        return $this->_(
            'SELECT users.name, users.id, users.email, users.is_superadmin FROM users WHERE users.name=:user_name',
            array(':user_name' => $userName)
        );
    }

    // id, name, selected, role
    public function getWorkspacesByUser(int $userId): array {

        $userRolesByWorkspace = $this->getMapWorkspaceToRoleByUser($userId);

        $allWorkspaces = $this->_(
            'SELECT workspaces.id, workspaces.name FROM workspaces ORDER BY workspaces.name',
            array(),
            true
        );

        $allWorkspacesWithUsersRole = [];
        foreach ($allWorkspaces as $workspace) {
            array_push($allWorkspacesWithUsersRole, [
                'id' => $workspace['id'],
                'name' => $workspace['name'],
                'selected' => isset($userRolesByWorkspace[$workspace['id']]),
                'role' => isset($userRolesByWorkspace[$workspace['id']]) ? $userRolesByWorkspace[$workspace['id']] : ''
            ]);
        }

        return $allWorkspacesWithUsersRole;
    }


    public function getMapWorkspaceToRoleByUser(int $userId): array {

        $userWorkspaces = $this->_(
            'SELECT 
                workspace_users.workspace_id as id, 
                workspace_users.role as role  
            FROM workspace_users
                INNER JOIN users ON users.id = workspace_users.user_id
            WHERE 
                users.id = :user_id',
            array(':user_id' => $userId),
            true
        );

        $mapWorkspaceToRole= array();
        foreach ($userWorkspaces as $userWorkspace) {
            $mapWorkspaceToRole[$userWorkspace['id']] = $userWorkspace['role'];
        }
        return $mapWorkspaceToRole;
    }


    public function setWorkspaceRightsByUser(int $userId, array $listOfWorkspaceIdsAndRoles) {

        $this->_('DELETE FROM workspace_users WHERE workspace_users.user_id=:user_id', array(':user_id' => $userId));
        foreach($listOfWorkspaceIdsAndRoles as $workspaceIdAndRole) {
            if (strlen($workspaceIdAndRole->role) > 0) {
                $this->_(
                    'INSERT INTO workspace_users (workspace_id, user_id, role) VALUES(:workspaceId, :userId, :role)',
                    array(
                        ':workspaceId' => $workspaceIdAndRole->id,
                        ':role' => $workspaceIdAndRole->role,
                        ':userId' => $userId
                    )
                );
            }
        }
    }


    public function setPassword(int $userId, string $password): void {

        $this->_(
            'UPDATE users SET password = :password WHERE id = :user_id',
            array(
                ':user_id' => $userId,
                ':password' => $this->encryptPassword($password)
            )
        );
    }


    public function checkPassword(int $userId, string $password): bool {

        $user = $this->_(
            'SELECT * FROM users
			WHERE users.id = :id AND users.password = :password',
            array(
                ':id' => $userId,
                ':password' => $password
            )
        );
        return !!$user;
    }


    public function addUser(string $userName, string $password): void {

        // TODO maybe prove $userName and $password for validity

        $user = $this->_(
            'SELECT users.name FROM users WHERE users.name=:user_name',
            array(':user_name' => $userName)
        );

        if($user) {
            throw new HttpError("User with name `$userName` already exists!", 400);
        }

        $this->_(
            'INSERT INTO users (name, password) VALUES (:user_name, :user_password)',
            array(
                ':user_name' => $userName,
                ':user_password' => $this->encryptPassword($password)
            )
        );
    }


    public function deleteUsers(array $userIds): void { // TODO add unit test

        foreach ($userIds as $userId) {
            $this->_('DELETE FROM users WHERE users.id = :user_id', array(':user_id' => $userId));
        }
    }


    public function addWorkspace($name) {

        $workspace = $this->_(
            'SELECT workspaces.id FROM workspaces 
            WHERE workspaces.name=:ws_name',
            array(':ws_name' => $name)
        );

        if ($workspace) {
            throw new HttpError("Workspace with name `$name` already exists!", 400);
        }

        $this->_(
            'INSERT INTO workspaces (name) VALUES (:ws_name)',
            array(':ws_name' => $name)
        );
    }


    public function setWorkspaceName($wsId, $newName) {

        $workspace = $this->_(
            'SELECT workspaces.id FROM workspaces 
            WHERE workspaces.id=:ws_id',
            array(':ws_id' => $wsId)
        );

        if (!$workspace) {
            throw new HttpError("Workspace with id `$wsId` does not exist!", 400);
        }

        $this->_(
            'UPDATE workspaces SET name = :name WHERE id = :id',
            array(
                ':name' => $newName,
                ':id' => $wsId
            )
        );
    }


    public function deleteWorkspaces($wsIds) {

        foreach ($wsIds as $wsId) {
            $this->_(
                'DELETE FROM workspaces
                WHERE workspaces.id = :ws_id',
                array(':ws_id' => $wsId)
            );
        }
        // TODO ROLLBACK if one fails!
    }


    public function getUsersByWorkspace(int $workspaceId): array {

        $workspaceRolesPerUser = $this->getMapUserToRoleByWorkspace($workspaceId);

        $allUsers = $this->_('SELECT users.id, users.name FROM users ORDER BY users.name', array(), true);

        $allUsersWithTheirRolesOnWorkspace = array();
        foreach ($allUsers as $user) {
            array_push($allUsersWithTheirRolesOnWorkspace, [
                'id' => $user['id'],
                'name' => $user['name'],
                'selected' => isset($workspaceRolesPerUser[$user['id']]),
                'role' => isset($workspaceRolesPerUser[$user['id']]) ? $workspaceRolesPerUser[$user['id']] : '',
            ]);
        }
        return $allUsersWithTheirRolesOnWorkspace;
    }


    public function getMapUserToRoleByWorkspace(int $workspaceId) {

        $workspaceUsers = $this->_(
            'SELECT 
                workspace_users.user_id as id, 
                workspace_users.role as role 
            FROM workspace_users
            WHERE workspace_users.workspace_id=:ws_id',
            array(':ws_id' => $workspaceId),
            true
        );
        $workspaceRolesPerUser = [];
        foreach ($workspaceUsers as $workspaceUser) {
            $workspaceRolesPerUser[$workspaceUser['id']] = $workspaceUser['role'];
        }
        return $workspaceRolesPerUser;
    }



    public function setUserRightsForWorkspace(int $wsId, array $listOfUserIdsAndRoles): void {

        $this->_('DELETE FROM workspace_users WHERE workspace_users.workspace_id=:ws_id', array(':ws_id' => $wsId));

        foreach ($listOfUserIdsAndRoles as $userIdAndRole) {
            if (strlen($userIdAndRole->role) > 0) {
                $this->_(
                    'INSERT INTO workspace_users (workspace_id, user_id, role) 
                    VALUES(:workspaceId, :userId, :role)',
                    array(
                        ':workspaceId' => $wsId,
                        ':role' => $userIdAndRole->role,
                        ':userId' => $userIdAndRole->id
                    )
                );
            }
        }
    }


    public function getWorkspaceName($workspaceId): string {

        $data = $this->_(
            'SELECT workspaces.name 
            FROM workspaces
            WHERE workspaces.id=:workspace_id',
            array(':workspace_id' => $workspaceId)
        );

        return $data['name'];
    }


}
