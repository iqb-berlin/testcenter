<?php /** @noinspection PhpUnhandledExceptionInspection */

class InstallationArguments extends DataCollection {

    /**
     * STAND
     * - neues init script fertig machen (mit clean.php verschmelzen)
     *
     * - möglichkeit bauen dredd gegen die echte Datenbank laufen zu lassen
     * --- STAND:
     * --- random static und stataicTokens muss gesetzt werden: über ENV am ehesten!
     * - testen, testen, testen
     * - deployen
     */

    public $user_name = '';
    public $user_password = '';
    public $workspace = 'workspace_name';
    public $test_login_name = "test";
    public $test_login_password = "user123";
    public $test_person_codes = "xxx yyy";

    public $create_test_sessions = false;
    public $overwrite_existing_installation = false;
    public $delete_files_if_present = false;

    public function __construct($initData) {

        if (!isset($initData['user_name'])) {

            var_dump($initData);
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

    private function _generateLogin() {

        $login = "";
        while (strlen($login) < 3) {
            $login .= substr("abcdefghijklmnopqrstuvwxyz", rand(0, 25), 1);
        }
        return $login;
    }

}
