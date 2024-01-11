<?php /** @noinspection HtmlUnknownAttribute */

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class XMLFileSysCheckTest extends TestCase {
  public static function setUpBeforeClass(): void {
    require_once "test/unit/VfsForTest.class.php";
    VfsForTest::setUpBeforeClass();
  }

  public function setUp(): void {
    require_once "test/unit/mock-classes/ExternalFileMock.php";
    VfsForTest::setUp();
  }

  // crossValidate is implicitly tested by WorkspaceValidatorTest -> validate

  function test_getUnitId() {
    $xmlFile = new XMLFileSysCheck(DATA_DIR . '/ws_1/SysCheck/SAMPLE_SYSCHECK.XML');
    $expected = 'UNIT.SAMPLE';
    $result = $xmlFile->getUnitId();
    $this->assertEquals($expected, $result);
  }

  function test_getSaveKey() {
    $xmlFile = new XMLFileSysCheck(DATA_DIR . '/ws_1/SysCheck/SAMPLE_SYSCHECK.XML');
    $expected = 'SAVEME';
    $result = $xmlFile->getSaveKey();
    $this->assertEquals($expected, $result);
  }

  function test_hasSaveKey() {
    $xmlFile = new XMLFileSysCheck(DATA_DIR . '/ws_1/SysCheck/SAMPLE_SYSCHECK.XML');
    $result = $xmlFile->hasSaveKey();
    $this->assertTrue($result);

    $xmlFile = XMLFileSysCheck::fromString("<SysCheck><Metadata><Id>x</Id></Metadata></SysCheck>");
    $result = $xmlFile->hasSaveKey();
    $this->assertFalse($result);
  }

  function test_hasUnit() {
    $xmlFile = new XMLFileSysCheck(DATA_DIR . '/ws_1/SysCheck/SAMPLE_SYSCHECK.XML');
    $result = $xmlFile->hasUnit();
    $this->assertTrue($result);

    $xmlFile = XMLFileSysCheck::fromString("<SysCheck><Metadata><Id>x</Id></Metadata></SysCheck>");
    $result = $xmlFile->hasUnit();
    $this->assertFalse($result);
  }

  function test_getCustomTexts() {
    $xml = "<SysCheck><Metadata><Id>x</Id><Label>l</Label></Metadata><Config>"
      . "<CustomText key='some'>thing</CustomText>"
      . "<CustomText key='any'>way</CustomText>"
      . "</Config></SysCheck>";
    $xmlFile = XMLFileSysCheck::fromString($xml);
    $result = $xmlFile->getCustomTexts();
    $expectation = [['key' => 'some', 'value' => 'thing'], ['key' => 'any', 'value' => 'way']];
    $this->assertEquals($expectation, $result);
  }

  function test_getSkipNetwork() {
    $xmlFile = new XMLFileSysCheck(DATA_DIR . '/ws_1/SysCheck/SAMPLE_SYSCHECK.XML');
    $result = $xmlFile->getSkipNetwork();
    $this->assertFalse($result);

    $xmlFile = XMLFileSysCheck::fromString("<SysCheck><Metadata><Id>x</Id><Label>l</Label></Metadata><Config skipnetwork='true'></Config></SysCheck>");
    $result = $xmlFile->getSkipNetwork();
    $this->assertTrue($result);

    $xmlFile = XMLFileSysCheck::fromString("<SysCheck><Metadata><Id>x</Id><Label>l</Label></Metadata></SysCheck>");
    $result = $xmlFile->getSkipNetwork();
    $this->assertFalse($result);
  }

  function test_getQuestions() {
    $xml = "<SysCheck><Metadata><Id>x</Id><Label>l</Label></Metadata><Config>"
      . '<Q id="1" type="header" prompt="some_title" required="true"/>'
      . '<Q id="2" type="string" prompt="or_so">1#2#3</Q>'
      . "</Config></SysCheck>";
    $xmlFile = XMLFileSysCheck::fromString($xml);
    $result = $xmlFile->getQuestions();
    $expectation = [
      [
        'id' => "1",
        'type' => "header",
        'prompt' => "some_title",
        'required' => true,
        'options' => []
      ],
      [
        'id' => "2",
        'type' => "string",
        'prompt' => "or_so",
        'required' => false,
        'options' => [1, 2, 3]
      ]
    ];
    $this->assertEquals($expectation, $result);
  }

  function test_getSpeedtestUploadParams() {
    $xmlFile = new XMLFileSysCheck(DATA_DIR . '/ws_1/SysCheck/SAMPLE_SYSCHECK.XML');
    $result = $xmlFile->getSpeedtestUploadParams();
    $expectation = [
      "min" => 1024,
      "good" => 2048,
      "maxDevianceBytesPerSecond" => 10000,
      "maxErrorsPerSequence" => 0,
      "maxSequenceRepetitions" => 15,
      "sequenceSizes" => ["100000", "200000", "400000", "800000"]
    ];
    $this->assertEquals($expectation, $result);
  }
}


