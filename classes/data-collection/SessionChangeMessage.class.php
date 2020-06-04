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


    public static function login(int $personId, Login $login, $code): SessionChangeMessage {

        $p = new SessionChangeMessage($personId);

        $p->personLabel = $login->getName() . ($code ? '/' . $code : '');
        $p->mode = $login->getMode();
        $p->groupName = $login->getGroupName();
        $p->groupLabel = $login->getGroupLabel();

        return $p;
    }


    public static function testState(int $personId, int $testId, array $testState, string $bookletName = null): SessionChangeMessage {

        $p = new SessionChangeMessage($personId);

        $p->testId = $testId;
        $p->testState = $testState;
        if ($bookletName !== null) {
            $p->bookletName = $bookletName;
        }

        return $p;
    }


    public static function unitState(int $personId, int $testId, string $unitName, array $unitState): SessionChangeMessage {

        $p = new SessionChangeMessage($personId);

        $p->testId = $testId;
        $p->unitName = $unitName;
        $p->unitState = $unitState;

        return $p;
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
