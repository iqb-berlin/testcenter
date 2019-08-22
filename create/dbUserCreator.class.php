<?php

/**
 * Class DBConnectionStarter
 */
class dbUserCreator extends DBConnection {

    /**
     * @param $username
     * @param $userpassword
     * @return string
     * @throws Exception
     */
    public function addSuperuser($username, $userpassword) {
        $sql = $this->pdoDBhandle->prepare('SELECT users.name FROM users');

        if (!$sql->execute()) {
            throw new Exception('could not select from users');
        }

        $data = $sql->fetchAll(PDO::FETCH_ASSOC);

        if (($data === false) || count($data) ) {
            throw new Exception('user table must be empty');
        }

        $sql = $this->pdoDBhandle->prepare('INSERT INTO users (name, password, is_superadmin) VALUES (:user_name, :user_password, true)');
        $params = array(
            ':user_name' => $username,
            ':user_password' => $this->encryptPassword($userpassword)
        );

        if (!$sql->execute($params)) {
            throw new Exception('could not select from users');
        }

    }
}
