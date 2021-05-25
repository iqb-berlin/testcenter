<?php /** @noinspection PhpUnhandledExceptionInspection */

class InstallationArguments extends DataCollection {

    public string $user_name = 'super';
    public string $user_password = 'user123';
    public string $workspace = 'sample_workspace';

    public bool $overwrite_existing_installation = false;
    public bool $skip_db_integrity_check = false;

    public function __construct($initData, bool $allowAdditionalInitData = false) {

        if (isset($initData['user_password']) and (strlen($initData['user_password']) < 7)) {

            throw new Exception("Password must have at least 7 characters!");
        }

        $initData['overwrite_existing_installation'] = isset($initData['overwrite_existing_installation']);
        $initData['skip_db_integrity_check'] = isset($initData['skip_db_integrity_check']);

        parent::__construct($initData, $allowAdditionalInitData);
    }
}
