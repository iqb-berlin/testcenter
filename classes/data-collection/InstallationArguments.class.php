<?php /** @noinspection PhpUnhandledExceptionInspection */

class InstallationArguments extends DataCollection {

    public $user_name = 'super';
    public $user_password = 'user123';
    public $workspace = 'workspace_name';
    public $test_login_name = "test";
    public $test_login_password = "user123";
    public $test_person_codes = "xxx yyy";

    public $overwrite_existing_installation = false;

    public function __construct($initData) {

        if ($initData['user_password'] and (strlen($initData['user_password']) < 7)) {

            throw new Exception("Password must have at least 7 characters!");
        }

        if (!isset($initData['test_person_codes']) or !$initData['test_person_codes']) {

            $initData['test_person_codes'] = implode(" ", $this->createLoginCodes());
        }

        parent::__construct($initData);
    }


    private function createLoginCodes() {

        return array_map([$this, 'generateLogin'], range(0, 9));
    }


    private function generateLogin() {

        $login = "";
        while (strlen($login) < 3) {
            $login .= substr("abcdefghijklmnopqrstuvwxyz", rand(0, 25), 1);
        }
        return $login;
    }

}
