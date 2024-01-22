<?php

use PHPUnit\Framework\TestCase;

class XMLFileBookletExposed extends XMLFileBooklet {
  public function getUnitIds(bool $useAlias = false): array {
    return parent::getUnitIds();
  }
}
;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class XMLFilesBookletTest extends TestCase {
  private static string $bookletTemplate = '<Booklet><Metadata><Id>i</Id><Label>l</Label></Metadata><Units><Testlet id="t1"><Restrictions>%%</Restrictions><Unit id="u1" label="u1"></Unit></Testlet></Units></Booklet>';

  public static function setUpBeforeClass(): void {
    require_once "test/unit/VfsForTest.class.php";
    VfsForTest::setUpBeforeClass();
  }

  public function setUp(): void {
    require_once "src/data-collection/DataCollectionTypeSafe.class.php";
    require_once "src/helper/FileTime.class.php";
    require_once "src/helper/XMLSchema.class.php";
    require_once "src/helper/JSON.class.php";
    require_once "src/files/File.class.php";
    require_once "src/files/XMLFile.class.php";
    require_once "src/files/XMLFileBooklet.class.php";
    require_once "test/unit/mock-classes/ExternalFileMock.php";

    VfsForTest::setUp();
  }

  function test_getAllUnitIds() {
    $xmlFile = new XMLFileBookletExposed(DATA_DIR . '/ws_1/Booklet/SAMPLE_BOOKLET.XML');

    $expected = ['UNIT.SAMPLE', 'UNIT.SAMPLE-2', 'UNIT.SAMPLE'];

    $result = $xmlFile->getUnitIds();

    $this->assertEquals($expected, $result);
  }

  function test_RestrictionsSyntax_none(): void {
    $xmlFile = XMLFileBooklet::fromString(str_replace('%%', '', self::$bookletTemplate,));
    $this->assertTrue($xmlFile->isValid());
  }

  function test_RestrictionsSyntax_gibberish(): void {
    $xmlFile = XMLFileBooklet::fromString(str_replace('%%', '<i>i</i>', self::$bookletTemplate));
    $this->assertFalse($xmlFile->isValid());
  }

  function test_RestrictionsSyntax_validConditions(): void {
    $validConditions = '
        <If><Value of="var1" from="alias" /><Is equal="richtige Antwort" /></If>
        <If><Status of="var1" from="alias" /><Is equal="VALUE_CHANGED" /></If>
        <If><Code of="var1" from="alias" /><Is equal="155" /></If>
        <If><Score of="var1" from="alias" /><Is equal="10" /></If>
        <If><Score of="var1" from="alias" /><Is equal="7" /></If>
        <If><Score of="var1" from="alias" /><Is greaterThan="5" /></If>
        <If><Score of="var1" from="alias" /><Is lowerThan="10" /></If>
        <If><Score of="var1" from="alias" /><Is notEqual="10" /></If>

        <If><Value of="4" from="4"/><Is/></If>
        <If><Value of="4" from="4"/><Is greaterThan="5" lowerThan="7"/></If>

        <If>
          <Sum>
            <Code of="var-1" from="alias" />
            <Code of="var-1" from="alias" />
          </Sum>
          <Is greaterThan="15" />
        </If>

        <!-- oder Median. -->
        <If>
          <Median>
            <Score of="var1" from="alias" />
            <Score of="var2" from="alias" />
            <Score of="var3" from="alias" />
          </Median>
          <Is greaterThan="50" />
        </If>

        <!-- Es gibt auch die Möglichkeit, zutreffende Bedingungen zu zählen, -->
        <!-- dies kann auch als oder-Verknüpfung dienen. -->
        <!-- Folgendes Beispiel, zeigt, wie man prüft, ob als die Hälfte der Variablen ist nicht missing -->
        <If>
          <Count>
            <If><Code of="var1" from="alias" /><Is notEqual="0" /></If>
            <If><Code of="var2" from="alias" /><Is notEqual="0" /></If>
            <If><Code of="var3" from="alias" /><Is notEqual="0" /></If>
            <If><Code of="var4" from="alias" /><Is notEqual="0" /></If>
          </Count>
          <Is greaterThan="2" />
        </If>';

    $xmlFile = XMLFileBooklet::fromString(str_replace('%%', $validConditions, self::$bookletTemplate));
    $this->assertTrue($xmlFile->isValid());
  }

  function test_RestrictionsSyntax_invalidConditions(): void {
    $stringForNumber = '<If><Score of="var1" from="alias" /><Is greaterThan="STRING" /></If>';
    $xmlFile = XMLFileBooklet::fromString(str_replace('%%', $stringForNumber, self::$bookletTemplate));
    $this->assertFalse($xmlFile->isValid());

    $mixedItemTypes = '<If>
          <Median>
            <Score of="var1" from="alias" />
            <Code of="var2" from="alias" />
          </Median>
          <Is greaterThan="50" />
        </If>';
    $xmlFile = XMLFileBooklet::fromString(str_replace('%%', $mixedItemTypes, self::$bookletTemplate));
    $this->assertFalse($xmlFile->isValid());
  }
}


