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

  private function prepareBookletWithStates(string $states, string $restrictions): XMLFileBooklet {
    $xml = <<<EOT
<Booklet>
  <Metadata>
    <Id>i</Id>
    <Label>l</Label>
  </Metadata>
  $states
  <Units>
    <Testlet id="t1">
      <Restrictions>$restrictions</Restrictions>
      <Unit id="u1" label="u1"></Unit>
    </Testlet>
  </Units>
</Booklet>
EOT;
    return XMLFileBooklet::fromString($xml);
  }

  private function prepareBookletWithConditions(string $conditions): XMLFileBooklet {
    $states =  <<<EOT
      <States>
        <State id="somestate">
          <Option id="conditional-option-1">
            $conditions
          </Option>
          <DefaultOption id="default" />
        </State>
      </States>
    EOT;
    $restriction = '<Show if="somestate" is="conditional-option-1" />';
    return $this->prepareBookletWithStates($states, $restriction);
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

      <If>
        <Median>
          <Score of="var1" from="alias" />
          <Score of="var2" from="alias" />
          <Score of="var3" from="alias" />
        </Median>
        <Is greaterThan="50" />
      </If>

      <If>
        <Count>
          <If><Code of="var1" from="alias" /><Is notEqual="0" /></If>
          <If><Code of="var2" from="alias" /><Is notEqual="0" /></If>
          <If><Code of="var3" from="alias" /><Is notEqual="0" /></If>
          <If><Code of="var4" from="alias" /><Is notEqual="0" /></If>
        </Count>
        <Is greaterThan="2" />
      </If>';


    $xmlFile = $this->prepareBookletWithConditions($validConditions);
    $this->assertTrue($xmlFile->isValid());
  }

  function test_RestrictionsSyntax_invalidConditions(): void {
    $stringForNumber = '<If><Score of="var1" from="alias" /><Is greaterThan="STRING" /></If>';
    $xmlFile = $this->prepareBookletWithConditions($stringForNumber);
    $this->assertFalse($xmlFile->isValid());

    $mixedItemTypes = '<If>
          <Median>
            <Score of="var1" from="alias" />
            <Code of="var2" from="alias" />
          </Median>
          <Is greaterThan="50" />
        </If>';
    $xmlFile = $this->prepareBookletWithConditions($mixedItemTypes);
    $this->assertFalse($xmlFile->isValid());
  }

  function test_validateAssertions() : void {
    $aStatesObject = '
      <States>
        <State id="booklet-variant">
          <Option id="option-1"></Option>
          <Option id="option-2"></Option>
          <DefaultOption id="default-option"></DefaultOption>
        </State>
      </States>
    ';

    $referringToUndefinedState = '<Show if="missing-state" is="option-1" />';
    $xmlFile = $this->prepareBookletWithStates($aStatesObject, $referringToUndefinedState);
    $this->assertFalse($xmlFile->isValid());

    $referringToUndefinedOption = '<Show if="booklet-variant" is="missing-option" />';
    $xmlFile = $this->prepareBookletWithStates($aStatesObject, $referringToUndefinedOption);
    $this->assertFalse($xmlFile->isValid());

    $correctReference = '<Show if="booklet-variant" is="option-1" />';
    $xmlFile = $this->prepareBookletWithStates($aStatesObject, $correctReference);
    $this->assertTrue($xmlFile->isValid());
  }
}


