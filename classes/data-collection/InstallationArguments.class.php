<?php /** @noinspection PhpUnhandledExceptionInspection */

class InstallationArguments extends DBConfig {

    public $user_name = null;
    public $user_password = null;
    public $workspace = 'workspace_name';
    public $test_login_name  = null;
    public $test_login_password  = null;
    public $test_person_codes;

    public $create_test_sessions = false;
    public $delete_tables_if_present = false;
    public $delete_files_if_present = false;
    public $delete_config_if_present = false;

    public function __construct($initData) {

        if (!isset($initData['user_name'])) {

            throw new Exception("user name not provided. use: --user_name=...");
        }

        if (!isset($initData['user_password'])) {

            throw new Exception("password not provided. use: --user_password=...");
        }

        if (strlen($initData['user_password']) < 7) {

            throw new Exception("Password must have at least 7 characters!");
        }


        if (!isset($initData['test_person_codes']) or !$initData['test_person_codes']) {

            $loginCodes = $this->createLoginCodes();

        } else {

            $loginCodes = explode(',', $initData['test_person_codes']);
        }

        $initData['test_person_codes'] = implode(" ", $loginCodes);

        parent::__construct($initData);
    }


    private function createLoginCodes() {

        return array_map([$this, '_generateLogin'], range(0, 9));
    }

}
