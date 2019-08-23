<?php

/**
 * Class DBConnectionStarter
 */
class dbUserCreator extends DBConnection {

    /**
     *
     * adds a new super user to db, if user table is empty (!)
     *
     * @param $username - name for the super user to create
     * @param $userpassword  - password for the super user to create
     * @return boolean - true if user was created, false if not (but o error occurred)
     * @throws Exception - if error occurs during connection
     */
    public function addSuperuser($username, $userpassword) {
        $sql = $this->pdoDBhandle->prepare('SELECT users.name FROM users');

        if (!$sql->execute()) {
            throw new Exception('Could not select from table `users` - database not initialized correctly?');
        }

        $data = $sql->fetchAll(PDO::FETCH_ASSOC);

        if (($data === false) || count($data) ) {
            return false;
        }

        $sql = $this->pdoDBhandle->prepare('INSERT INTO users (name, password, is_superadmin) VALUES (:user_name, :user_password, true)');
        $params = array(
            ':user_name' => $username,
            ':user_password' => $this->encryptPassword($userpassword)
        );

        if (!$sql->execute($params)) {
            throw new Exception('Could not insert into table `users`');
        }

        return true;
    }
}
