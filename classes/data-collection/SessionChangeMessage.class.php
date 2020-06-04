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

        $message->personLabel = $login->getName() . ($code ? '/' . $code : '');
        $message->mode = $login->getMode();
        $message->groupName = $login->getGroupName();
        $message->groupLabel = $login->getGroupLabel();

        return $message;
    }


    public static function testState(int $personId, int $testId, array $testState, string $bookletName = null): SessionChangeMessage {

        $message = new SessionChangeMessage($personId);

        $message->testId = $testId;
        $message->testState = $testState;
        if ($bookletName !== null) {
            $message->bookletName = $bookletName;
        }

        return $message;
    }


    public static function unitState(int $personId, int $testId, string $unitName, array $unitState): SessionChangeMessage {

        $message = new SessionChangeMessage($personId);

        $message->testId = $testId;
        $message->unitName = $unitName;
        $message->unitState = $unitState;

        return $message;
    }


    public static function init(
        int $personId,
        string $loginName,
        string $groupName,
        string $groupLabel,
        string $mode,
        string $code,
        int $testId,
        array $testState,
        string $bookletName,
        string $unitName,
        array $unitState
    ) {

        $message = new SessionChangeMessage($personId);

        $message->personLabel = $loginName . ($code ? '/' . $code : '');
        $message->mode = $mode;
        $message->groupName = $groupName;
        $message->groupLabel = $groupLabel;
        $message->testId = $testId;
        $message->testState = $testState;
        $message->bookletName = $bookletName;
        $message->unitName = $unitName;
        $message->unitState = $unitState;

        return $message;
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
