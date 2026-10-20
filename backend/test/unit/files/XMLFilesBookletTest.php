<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class XMLFileBookletExposed extends XMLFileBooklet {
  public function getUnitIds(bool $useAlias = false): array {
    return parent::getUnitIds();
  }
}

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
    require_once "src/helper/XMLSchema.class.php";
    require_once "src/helper/JSON.class.php";
    require_once "src/files/File.class.php";
    require_once "src/files/XMLFile.class.php";
    require_once "src/files/XMLFileBooklet.class.php";
    require_once "test/unit/mock-classes/ExternalFileMock.php";
    SystemConfig::$xmlSchema_validation = true;

    VfsForTest::setUp();
  }

  function test_getAllUnitIds() {
    $xmlFile = new XMLFileBookletExposed(StoragePath::fromString('ws_1/Booklet/SAMPLE_BOOKLET.XML'));

    $expected = ['UNIT.SAMPLE', 'UNIT.SAMPLE-2', 'UNIT.SAMPLE'];

    $result = $xmlFile->getUnitIds();

    static::assertEquals($expected, $result);
  }

  private function prepareBookletWithStates(string $states, string $restrictions): XMLFileBooklet {
    $xml = <<<EOT
<Booklet xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-booklet-xml/18.0">
  <Metadata>
    <Id>i</Id>
    <Label>l</Label>
  </Metadata>
  $states
  <Units>
    <Testlet id="t1">
      <Restrictions>$restrictions</Restrictions>
      <Unit id="u1" label="u1" alias="alias"></Unit>
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
          <Option id="default" />
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

      <If><Value of="4" from="alias"/><Is/></If>
      <If><Value of="4" from="alias"/><Is greaterThan="5" lowerThan="7"/></If>

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
    static::assertTrue($xmlFile->isValid());
  }

  function test_RestrictionsSyntax_invalidConditions(): void {
    $stringForNumber = '<If><Score of="var1" from="alias" /><Is greaterThan="STRING" /></If>';
    $xmlFile = $this->prepareBookletWithConditions($stringForNumber);
    static::assertFalse($xmlFile->isValid());

    $mixedItemTypes = '<If>
          <Median>
            <Score of="var1" from="alias" />
            <Code of="var2" from="alias" />
          </Median>
          <Is greaterThan="50" />
        </If>';
    $xmlFile = $this->prepareBookletWithConditions($mixedItemTypes);
    static::assertFalse($xmlFile->isValid());
  }

  function test_validateAssertions() : void {
    $aStatesObject = '
      <States>
        <State id="booklet-variant">
          <Option id="option-1"></Option>
          <Option id="option-2"></Option>
          <Option id="default-option"></Option>
        </State>
      </States>
    ';

    $referringToUndefinedState = '<Show if="missing-state" is="option-1" />';
    $xmlFile = $this->prepareBookletWithStates($aStatesObject, $referringToUndefinedState);
    static::assertFalse($xmlFile->isValid());
    static::assertCount(3, $xmlFile->getValidationReport()['error']);

    $referringToUndefinedOption = '<Show if="booklet-variant" is="missing-option" />';
    $xmlFile = $this->prepareBookletWithStates($aStatesObject, $referringToUndefinedOption);
    static::assertFalse($xmlFile->isValid());

    $correctReference = '<Show if="booklet-variant" is="option-1" />';
    $xmlFile = $this->prepareBookletWithStates($aStatesObject, $correctReference);
    static::assertTrue($xmlFile->isValid());


    $noReferenceAtAll = '<TimeMax minutes="5" />';
    $xmlFile = $this->prepareBookletWithStates($aStatesObject, $noReferenceAtAll);
    static::assertTrue($xmlFile->isValid());

    $statesObjectWithNoDefault = '
      <States>
        <State id="booklet-variant">
          <Option id="option-1">
            <If><Code of="var1" from="alias" /><Is notEqual="0" /></If>
          </Option>
          <Option id="option-2">
            <If><Code of="var1" from="alias" /><Is equal="0" /></If>
          </Option>
        </State>
      </States>
    ';
    $xmlFile = $this->prepareBookletWithStates($statesObjectWithNoDefault, $correctReference);
    static::assertFalse($xmlFile->isValid());
    static::assertCount(1, $xmlFile->getValidationReport()['error']);

    $referringToUndefinedUnit = '
      <States>
        <State id="booklet-variant">
          <Option id="option-1">
            <If><Code of="var1" from="i-am-not-defined" /><Is notEqual="0" /></If>
          </Option>
          <Option id="option-2">
            <If>
              <Median>
                <Score of="var1" from="i-am-also-not-defined" />
                <Score of="var2" from="alias" />
              </Median>
              <Is greaterThan="50" />
            </If>
          </Option>
          <Option id="option-default"></Option>
        </State>
      </States>
    ';
    $xmlFile = $this->prepareBookletWithStates($referringToUndefinedUnit, $correctReference);
    static::assertFalse($xmlFile->isValid());
    static::assertCount(2, $xmlFile->getValidationReport()['error']);
  }

  private function prepareBookletWithWidgets(string $units): XMLFileBooklet {
    $xml = <<<EOT
      <Booklet xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-booklet-xml/18.1">
        <Metadata>
          <Id>i</Id>
          <Label>l</Label>
        </Metadata>
        <Widgets>
          <Widget id="calc" model="CALCULATOR">
            <Parameter key="JOURNAL_LINES">2</Parameter>
          </Widget>
          <Widget id="calc-no-journal" model="CALCULATOR" />
          <Widget id="periodic" model="PERIODIC_TABLE" />
        </Widgets>
        $units
      </Booklet>
      EOT;
    return XMLFileBooklet::fromString($xml);
  }

  /**
   * @return string[]
   */
  private function getErrors(XMLFileBooklet $booklet): array {
    return $booklet->getValidationReport()['error'] ?? [];
  }

  function test_widgets_offeredAndInherited(): void {
    $booklet = $this->prepareBookletWithWidgets('
      <Units widgets="calc periodic">
        <Unit id="u1" label="u1" />
        <Unit id="u2" label="u2" widgets="calc-no-journal" />
        <Testlet id="t1" widgets="">
          <Unit id="u3" label="u3" />
        </Testlet>
      </Units>
    ');
    static::assertSame([], $this->getErrors($booklet));
  }

  function test_widgets_undefined(): void {
    $booklet = $this->prepareBookletWithWidgets('
      <Units>
        <Unit id="u1" label="u1" widgets="calc formulas" />
      </Units>
    ');
    static::assertSame(
      [
        'Advanced XML validation: Assertion `All widgets offered must be defined` failed: Widget not defined: `formulas`.'
      ],
      $this->getErrors($booklet)
    );
  }

  function test_widgets_twoOfOneModel(): void {
    $booklet = $this->prepareBookletWithWidgets('
      <Units>
        <Testlet id="t1" widgets="calc periodic calc-no-journal">
          <Unit id="u1" label="u1" />
        </Testlet>
      </Units>
    ');
    static::assertSame(
      [
        'Advanced XML validation: Assertion `At most one widget per model` failed: Widgets `calc`, `calc-no-journal` are ' .
          'offered together but share the model `CALCULATOR`.'
      ],
      $this->getErrors($booklet)
    );
  }

  function test_widgets_duplicateIdRejectedBySchema(): void {
    $booklet = XMLFileBooklet::fromString('
      <Booklet xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-booklet-xml/18.1">
        <Metadata><Id>i</Id><Label>l</Label></Metadata>
        <Widgets>
          <Widget id="calc" model="CALCULATOR" />
          <Widget id="calc" model="PERIODIC_TABLE" />
        </Widgets>
        <Units><Unit id="u1" label="u1" /></Units>
      </Booklet>
    ');
    static::assertFalse($booklet->isValid());
  }
}


