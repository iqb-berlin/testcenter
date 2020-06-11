<?php
declare(strict_types=1);
// TODO unit-tests

class SessionChangeMessage implements JsonSerializable {

    /**
     * @var int
     */
    protected $personId;

    /**
     * @var string
     */
    protected $groupName;
        
    /**
     * @var string
     */
    protected $personLabel = "";

    /**
     * @var string
     */
    protected $groupLabel = "";
    
    /**
     * @var string
     */
    protected $mode = "";
    
    /**
     * @var int
     */
    protected $testId = -1;

    /**
     * @var string
     */
    protected $testState = [];

    /**
     * @var string
     */
    protected $bookletName = "";

    /**
     * @var string
     */
    protected $unitName = "";

    /**
     * @var array
     */
    protected $unitState = [];

    /**
     * @var int
     */
    protected $timestamp = 0;


    public function __construct(int $personId, string $groupName) {

        $this->personId = $personId;
        $this->groupName = $groupName;

        $this->timestamp = TimeStamp::now();
    }


    public static function login(AuthToken $authToken, Login $login, string $code): SessionChangeMessage {

        $message = new SessionChangeMessage($authToken->getId(), $authToken->getGroup());
        $message->setLogin(
            $login->getName(),
            $login->getMode(),
            $login->getGroupLabel(),
            $code
        );
        return $message;
    }


    public static function testState(AuthToken $authToken, int $testId, array $testState, string $bookletName = null): SessionChangeMessage {

        $message = new SessionChangeMessage($authToken->getId(), $authToken->getGroup());
        $message->setTestState($testId, $testState, $bookletName);
        return $message;
    }


    public static function unitState(AuthToken $authToken, int $testId, string $unitName, array $unitState): SessionChangeMessage {

        $message = new SessionChangeMessage($authToken->getId(), $authToken->getGroup());
        $message->testId = $testId;
        $message->setUnitState($unitName, $unitState);
        return $message;
    }


    public function setLogin(string $loginLabel, string $mode, string $groupLabel, string $code): void {

        $this->personLabel = $loginLabel  . ($code ? '/' . $code : '');
        $this->mode = $mode;
        $this->groupLabel = $groupLabel;
    }


    public function setTestState(int $testId, array $testState, string $bookletName = null): void {

        $this->testId = $testId;
        $this->testState = $testState;
        if ($bookletName !== null) {
            $this->bookletName = $bookletName;
        }
    }

    public function setUnitState(string $unitName, array $unitState) {

        $this->unitName = $unitName;
        $this->unitState = $unitState;
    }


    public function jsonSerialize() {

        $jsonData = [];

        foreach ($this as $key => $value) {

            if ($value !== "") {
                $jsonData[$key] = $value;
            }
        }

        return $jsonData;
    }
}
