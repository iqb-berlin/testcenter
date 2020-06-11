<?php
/** @noinspection PhpUnhandledExceptionInspection */
// TODO unit-tests

class SessionChangeMessage implements JsonSerializable {

    /**
     * @var int
     */
    protected $personId = null;
        
    /**
     * @var string
     */
    protected $personLabel = "";

    /**
     * @var string
     */
    protected $groupName = "";

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


    public static function login(int $personId, Login $login, string $code): SessionChangeMessage {

        $message = new SessionChangeMessage($personId);
        $message->setLogin(
            $login->getName(),
            $login->getMode(),
            $login->getGroupName(),
            $login->getGroupLabel(),
            $code
        );
        return $message;
    }


    public static function testState(int $personId, int $testId, array $testState, string $bookletName = null): SessionChangeMessage {

        $message = new SessionChangeMessage($personId);
        $message->setTestState($testId, $testState, $bookletName);
        return $message;
    }


    public static function unitState(int $personId, int $testId, string $unitName, array $unitState): SessionChangeMessage {

        $message = new SessionChangeMessage($personId);
        $message->testId = $testId;
        $message->setUnitState($unitName, $unitState);
        return $message;
    }


    public function setLogin(string $loginLabel, string $mode, string $groupName, string $groupLabel, string $code): void {

        $this->personLabel = $loginLabel  . ($code ? '/' . $code : '');
        $this->mode = $mode;
        $this->groupName = $groupName;
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

    
    public function __construct(int $personId) {

        $this->personId = $personId;

        $this->timestamp = TimeStamp::now();
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
