<?php

use PHPUnit\Framework\TestCase;

class XMLFileTesttakersExposed extends XMLFileTesttakers {
  public static function collectBookletsPerCode(SimpleXMLElement $element): array {
    return parent::collectBookletsPerCode($element);
  }

  public static function getCodesFromBookletElement(SimpleXMLElement $element): array {
    return parent::getCodesFromBookletElement($element);
  }
}
;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class XMLFilesTesttakersTest extends TestCase {
  private $exampleXML1 = <<<END
<Testtakers>
  <Metadata>
    <Description>example</Description>
  </Metadata>
  
  <CustomTexts>
    <CustomText key="first_key">first_value</CustomText>
    <CustomText key="second_key">second_value</CustomText>
  </CustomTexts>

  <Group id="first_group" label="1st">
    <Login mode="run-hot-return" name="duplicateInDifferentGroup" pw="one" />
    <Login mode="run-hot-return" name="duplicateInSameGroup" pw="two" />
    <Login mode="run-hot-return" name="duplicateInSameGroup" pw="three" />
    <Login mode="run-hot-return" name="noDuplicate" pw="four" />
  </Group>

  <Group id="second_group" label="2nd">
    <Login mode="run-hot-return" name="duplicateInDifferentGroup" pw="two" />
    <Login mode="run-hot-return" name="noDuplicateAgain" pw="four" />
  </Group>
</Testtakers>
END;

  private $exampleXML2 = <<<END
<Testtakers>
  <Metadata>
    <Description>example</Description>
  </Metadata>
  
  <CustomTexts>
    <CustomText key="first_key">first_value</CustomText>
    <CustomText key="second_key">second_value</CustomText>
  </CustomTexts>

  <Group id="first_group" label="1st">
    <Login mode="run-hot-return" name="noDuplicate" pw="four" />
  </Group>

  <Group id="second_group" label="2nd">
    <Login mode="run-hot-return" name="noDuplicateAgain" pw="four" />
  </Group>
</Testtakers>
END;

  public static function setUpBeforeClass(): void {
    require_once "test/unit/VfsForTest.class.php";
    VfsForTest::setUpBeforeClass();
    VfsForTest::setUp();
  }

  public function setUp(): void {
    require_once "test/unit/mock-classes/PasswordMock.php";
    require_once "test/unit/mock-classes/ExternalFileMock.php";
  }

  // crossValidate is implicitly tested by WorkspaceValidatorTest -> validate

  function test_getPersonsInSameGroup() {
    $xmlFile = new XMLFileTesttakers(DATA_DIR . '/ws_1/Testtakers/SAMPLE_TESTTAKERS.XML');
    $expected = new LoginArray(
      new Login(
        'test',
        'user123',
        'run-hot-return',
        'sample_group',
        'Primary Sample Group',
        [
          "xxx" => [
            "BOOKLET.SAMPLE-1",
            "BOOKLET.SAMPLE-3",
            "BOOKLET.SAMPLE-2"
          ],
          "yyy" => [
            "BOOKLET.SAMPLE-1",
            "BOOKLET.SAMPLE-3",
            "BOOKLET.SAMPLE-2"
          ]
        ],
        13,
        0,
        1583053200,
        0,
        (object) ['somestr' => 'string']
      )
    );
    $result = $xmlFile->getLoginsInSameGroup('test-group-monitor', 13);
    $this->assertEquals($expected, $result);
  }

  function test_collectBookletsPerCode() {
    $xml = <<<END
<Login name="someName" password="somePass">
    <Booklet codes="aaa bbb">first_booklet</Booklet>
    <Booklet>second_booklet</Booklet>
    <Booklet codes="bbb ccc">third_booklet</Booklet>
    <Booklet codes="will not appear"></Booklet>
    <Will codes="also">not appear</Will>
</Login>
END;

    $result = XMLFileTesttakersExposed::collectBookletsPerCode(new SimpleXMLElement($xml));

    //print_r($result);

    $expected = [
      'aaa' => [
        'FIRST_BOOKLET',
        'SECOND_BOOKLET'
      ],
      'bbb' => [
        'FIRST_BOOKLET',
        'THIRD_BOOKLET',
        'SECOND_BOOKLET'
      ],
      'ccc' => [
        'THIRD_BOOKLET',
        'SECOND_BOOKLET'
      ]
    ];

    $this->assertEquals($expected, $result, 'code-using and non-code-unsing logins present');

    $xml = <<<END
<Login name="someName" password="somePass">
    <Booklet>first_booklet</Booklet>
    <Booklet>second_booklet</Booklet>
    <Will>not appear</Will>
</Login>
END;

    $result = XMLFileTesttakersExposed::collectBookletsPerCode(new SimpleXMLElement($xml));

    //print_r($result);

    $expected = [
      '' => [
        'FIRST_BOOKLET',
        'SECOND_BOOKLET'
      ]
    ];

    $this->assertEquals($expected, $result, 'no code-using booklets present');
  }

  function test_getCodesFromBookletElement() {
    $xml = '<Booklet codes="aaa bbb aaa">first_booklet</Booklet>';
    $expected = ['aaa', 'bbb'];
    $result = XMLFileTesttakersExposed::getCodesFromBookletElement(new SimpleXMLElement($xml));
    $this->assertEquals($expected, $result);

    $xml = '<Booklet codes="">first_booklet</Booklet>';
    $expected = [];
    $result = XMLFileTesttakersExposed::getCodesFromBookletElement(new SimpleXMLElement($xml));
    $this->assertEquals($expected, $result);

    $xml = '<Booklet>first_booklet</Booklet>';
    $expected = [];
    $result = XMLFileTesttakersExposed::getCodesFromBookletElement(new SimpleXMLElement($xml));
    $this->assertEquals($expected, $result);
  }

  function test_getGroups() {
    $xmlFile = new XMLFileTesttakers(DATA_DIR . '/ws_1/Testtakers/SAMPLE_TESTTAKERS.XML');

    $expected = [
      'sample_group' => new Group(
        'sample_group',
        'Primary Sample Group'
      ),
      'review_group' => new Group(
        'review_group',
        'A Group of Reviewers'
      ),
      'trial_group' => new Group(
        'trial_group',
        'A Group for Trials and Demos'
      ),
      'passwordless_group' => new Group(
        'passwordless_group',
        'A group of persons without password'
      ),
      'expired_group' => new Group(
        'expired_group',
        'An already expired group'
      ),
      'future_group' => new Group(
        'future_group',
        'An not yet active group'
      ),
      'study_group' => new Group(
        'study_group',
        "A group for the study monitor"
      )
    ];

    $result = $xmlFile->getGroups();

    $this->assertEquals($expected, $result);
  }

  function test_getAllLogins() {
    $xmlFile = new XMLFileTesttakers(DATA_DIR . '/ws_1/Testtakers/SAMPLE_TESTTAKERS.XML');

    $expected = new LoginArray(
      new Login(
        'test',
        'user123',
        'run-hot-return',
        'sample_group',
        'Primary Sample Group',
        [
          'xxx' => [
            'BOOKLET.SAMPLE-1',
            'BOOKLET.SAMPLE-3',
            'BOOKLET.SAMPLE-2'
          ],
          'yyy' => [
            'BOOKLET.SAMPLE-1',
            'BOOKLET.SAMPLE-3',
            'BOOKLET.SAMPLE-2'
          ]
        ],
        -1,
        0,
        1583053200,
        0,
        (object) ["somestr" => "string"]
      ),
      new Login(
        'test-group-monitor',
        'user123',
        'monitor-group',
        'sample_group',
        'Primary Sample Group',
        [
          '' => [
            'BOOKLET.SAMPLE-1',
            'BOOKLET.SAMPLE-3',
            'BOOKLET.SAMPLE-2'
          ]
        ],
        -1,
        0,
        1583053200,
        0,
        (object) ["somestr" => "string"],
      ),
      new Login (
        'test-study-monitor',
        'user123',
        'monitor-study',
        'study_group',
        'A group for the study monitor',
        ['' => []],
        -1,
        0,
        0,
        0,
        (object) ["somestr" => "string"],
      ),
      new Login(
        'test-review',
        'user123',
        'run-review',
        'review_group',
        'A Group of Reviewers',
        ['' => ["BOOKLET.SAMPLE-1"]],
        -1,
        0,
        0,
        0,
        (object) ["somestr" => "string"]
      ),
      new Login(
        'test-trial',
        'user123',
        'run-trial',
        'trial_group',
        'A Group for Trials and Demos',
        ['' => ["BOOKLET.SAMPLE-1"]],
        -1,
        0,
        0,
        45,
        (object) ["somestr" => "string"]
      ),
      new Login(
        'test-demo',
        'user123',
        'run-demo',
        'trial_group',
        'A Group for Trials and Demos',
        ['' => ["BOOKLET.SAMPLE-1"]],
        -1,
        0,
        0,
        45,
        (object) ["somestr" => "string"]
      ),
      new Login(
       'test-simulation',
       'user123',
       'run-simulation',
       'trial_group',
       'A Group for Trials and Demos',
        ['' => ["BOOKLET.SAMPLE-1"]],
       -1,
       0,
       0,
       45,
        (object) ["somestr" => "string"]
      ),
      new Login(
        'test-no-pw',
        '',
        'run-hot-restart',
        'passwordless_group',
        'A group of persons without password',
        ['' => ["BOOKLET.SAMPLE-1"]],
        -1,
        0,
        0,
        0,
        (object) ["somestr" => "string"]
      ),
      new Login(
        'test-no-pw-trial',
        '',
        'run-trial',
        'passwordless_group',
        'A group of persons without password',
        ['' => ["BOOKLET.SAMPLE-1"]],
        -1,
        0,
        0,
        0,
        (object) ["somestr" => "string"]
      ),
      new Login(
        'test-expired',
        '',
        'run-hot-restart',
        'expired_group',
        'An already expired group',
        ['' => ["BOOKLET.SAMPLE-1"]],
        -1,
        1583087400,
        0,
        0,
        (object) ["somestr" => "string"]
      ),
      new Login(
        'expired-group-monitor',
        'user123',
        'monitor-group',
        'expired_group',
        'An already expired group',
        ['' => ['BOOKLET.SAMPLE-1']],
        -1,
        1583087400,
        0,
        0,
        (object) ["somestr" => "string"]
      ),
      new Login(
        'expired-study-monitor',
        'user123',
        'monitor-study',
        'expired_group',
        'An already expired group',
        ['' => []],
        -1,
        1583087400,
        0,
        0,
        (object) ["somestr" => "string"]
      ),
      new Login(
        'test-future',
        '',
        'run-hot-restart',
        'future_group',
        'An not yet active group',
        ['' => ["BOOKLET.SAMPLE-1"]],
        -1,
        0,
        1900742400,
        0,
        (object) ["somestr" => "string"],
      )
    );

    $result = $xmlFile->readAllLogins();

    $this->assertEquals($expected, $result);
  }

  function test_getAllLoginNames() {
    $xmlFile = XMLFileTesttakers::fromString($this->exampleXML2, false);

    $expected = [
      'noDuplicate',
      'noDuplicateAgain'
    ];

    $result = $xmlFile->getAllLoginNames();

    $this->assertEquals($expected, $result);
  }

  function test_getCustomTexts() {
    $xmlFile = XMLFileTesttakers::fromString($this->exampleXML1, false);

    $expected = (object) [
      'first_key' => 'first_value',
      'second_key' => 'second_value'
    ];

    $result = $xmlFile->getCustomTexts();

    $this->assertEquals($expected, $result);
  }
}
