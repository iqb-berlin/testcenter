<?php


class PersonAuthToken extends AuthToken {

    const type = 'person';

    private $_workspaceId;
    private $_personId;
    private $_loginId;
    private $_mode;

    public function __construct(string $token, int $workspaceId, int $personId, int $loginId, string $mode) {

        $this->_workspaceId = $workspaceId;
        $this->_personId = $personId;
        $this->_loginId = $loginId;
        $this->_mode = $mode;

        parent::__construct($token);
    }


    public function getWorkspaceId(): int {

        return $this->_workspaceId;
    }

    public function getPersonId(): int {

        return $this->_personId;
    }

    public function getLoginId(): int {

        return $this->_loginId;
    }

    public function getMode(): string {

        return $this->_mode;
    }
}
