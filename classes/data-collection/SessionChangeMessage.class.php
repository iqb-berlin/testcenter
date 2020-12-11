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
     * @var int
     */
    protected $testId;

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


    public function __construct(int $personId, string $groupName, int $testId) {

        $this->personId = $personId;
        $this->groupName = $groupName;
        $this->testId = $testId;

        $this->timestamp = TimeStamp::now();
    }


    public static function newSession(Login $login, Person $person, int $testId): SessionChangeMessage {

        $message = new SessionChangeMessage($person->getId(), $person->getGroup(), $testId);
        $message->setLogin(
            $login->getName(),
            $login->getMode(),
            $login->getGroupLabel(),
            $person->getCode()
        );
        return $message;
    }


    public static function testState(AuthToken $authToken, int $testId, array $testState, string $bookletName = null): SessionChangeMessage {

        $message = new SessionChangeMessage($authToken->getId(), $authToken->getGroup(), $testId);
        $message->setTestState($testState, $bookletName);
        return $message;
    }


    public static function unitState(AuthToken $authToken, int $testId, string $unitName, array $unitState): SessionChangeMessage {

        $message = new SessionChangeMessage($authToken->getId(), $authToken->getGroup(), $testId);
        $message->testId = $testId;
        $message->setUnitState($unitName, $unitState);
        return $message;
    }


    public function setLogin(string $loginLabel, string $mode, string $groupLabel, string $code): void {

        $this->personLabel = $loginLabel  . ($code ? '/' . $code : '');
        $this->mode = $mode;
        $this->groupLabel = $groupLabel;
    }


    public function setTestState(array $testState, string $bookletName = null): void {

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
