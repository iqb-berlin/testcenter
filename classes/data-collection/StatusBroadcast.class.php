<?php
/** @noinspection PhpUnhandledExceptionInspection */
// TODO unit-tests

class StatusBroadcast extends DataCollection {

    /**
     * @var int
     */
    protected $personId = null;
        
    /**
     * @var string
     */
    protected $personLabel = "";

    /**
     * @var int
     */
    protected $groupId = -1;
    
    /**
     * @var string
     */
    protected $groupLabel = "";
    
    /**
     * @var string
     */
    protected $personStatus = "";
    
    /**
     * @var int
     */
    protected $testId = -1;
    
    /**
     * @var string
     */
    protected $testLabel = "";

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
     * @var string
     */
    protected $unitLabel = "";

    /**
     * @var array
     */
    protected $unitState = [];

    /**
     * @var int
     */
    protected $timestamp = 0;




    
    public function __construct(int $personId, array $initData) {

        $this->personId = $personId;

        $integers = ['groupId', 'testId'];

        foreach ($initData as $key => $value) {

            if (in_array($key, $integers)) {
                $initData[$key] = (int) $value;
            }
        }

        // TODO evaluate somehow that teststae and unistet are arrays of key-value pairs...

        parent::__construct($initData);

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
