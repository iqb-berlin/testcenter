<?php

use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class XMLFilesUnitTest extends TestCase {


    public function setUp(): void {

        require_once "src/data-collection/DataCollectionTypeSafe.class.php";
        require_once "src/data-collection/ValidationReportEntry.class.php";
        require_once "src/data-collection/RequestedAttachment.class.php";
        require_once "src/data-collection/FileData.class.php";
        require_once "src/files/File.class.php";
        require_once "src/files/XMLFile.class.php";
        require_once "src/files/XMLFileUnit.class.php";
        require_once "src/files/ResourceFile.class.php";
        require_once "src/helper/FileName.class.php";
        require_once "src/helper/FileTime.class.php";
        require_once "src/workspace/Workspace.class.php";
        require_once "src/workspace/WorkspaceValidator.class.php";
        require_once "test/unit/mock-classes/ResourceFileMock.php";
        require_once "test/unit/mock-classes/WorkspaceValidatorMock.php";

        VfsForTest::setUp();
    }


    public static function setUpBeforeClass(): void {

        require_once "test/unit/VfsForTest.class.php";
        VfsForTest::setUpBeforeClass();
    }


    function test_getPlayerId() {

        $xmlFile = new XMLFileUnit(DATA_DIR . '/ws_1/Unit/SAMPLE_UNIT.XML');
        $expected = 'VERONA-PLAYER-SIMPLE-4.HTML';
        $result = $xmlFile->getPlayerId();
        $this->assertEquals($expected, $result);

        $xmlFile = new XMLFileUnit('<Unit><Metadata><Id>some</Id></Metadata><Definition player="x_player">a</Definition></Unit>', false, true);
        $expected = 'X_PLAYER.HTML';
        $result = $xmlFile->getPlayerId();
        $this->assertEquals($expected, $result);
    }


    function test_getPlayerIfExists() {

        $unitString = '<Unit><Metadata><Id>i</Id></Metadata><Definition player="%s">a</Definition></Unit>';

        $validator = new WorkspaceValidatorMock([
            'SUPER-PLAYER-1.7.HTML',
            'SUPER-PLAYER-1.HTML',
            'SUPER-PLAYER-1.5.HTML',
            'SUPER-PLAYER-2.HTML',
            'OTHER-PLAYER-1.2.3.HTML',
            'thirdplayer.html'
        ]);

        $xmlFile = new XMLFileUnit(sprintf($unitString, 'super-player'), false, true);
        $result = $xmlFile->getPlayerIfExists($validator);
        $this->assertNull($result);

        $xmlFile = new XMLFileUnit(sprintf($unitString, 'super-player-1'), false, true);
        $result = $xmlFile->getPlayerIfExists($validator);
        $this->assertEquals('SUPER-PLAYER-1.7.HTML', $result->getName());

        $xmlFile = new XMLFileUnit(sprintf($unitString, 'super-player-1.5'), false, true);
        $result = $xmlFile->getPlayerIfExists($validator);
        $this->assertEquals('SUPER-PLAYER-1.5.HTML', $result->getName());

        $xmlFile = new XMLFileUnit(sprintf($unitString, 'super-player-1.6'), false, true);
        $result = $xmlFile->getPlayerIfExists($validator);
        $this->assertEquals('SUPER-PLAYER-1.7.HTML', $result->getName());

        $xmlFile = new XMLFileUnit(sprintf($unitString, 'super-player-1.7'), false, true);
        $result = $xmlFile->getPlayerIfExists($validator);
        $this->assertEquals('SUPER-PLAYER-1.7.HTML', $result->getName());

        $xmlFile = new XMLFileUnit(sprintf($unitString, 'super-player-1.8'), false, true);
        $result = $xmlFile->getPlayerIfExists($validator);
        $this->assertEquals('SUPER-PLAYER-1.7.HTML', $result->getName());

        $xmlFile = new XMLFileUnit(sprintf($unitString, 'super-player-1.9.1'), false, true);
        $result = $xmlFile->getPlayerIfExists($validator);
        $this->assertEquals('SUPER-PLAYER-1.7.HTML', $result->getName());

        $xmlFile = new XMLFileUnit(sprintf($unitString, 'super-player-2.0.0'), false, true);
        $result = $xmlFile->getPlayerIfExists($validator);
        $this->assertEquals('SUPER-PLAYER-2.HTML', $result->getName());

        $xmlFile = new XMLFileUnit(sprintf($unitString, 'other-player-1.3.4.html'), false, true);
        $result = $xmlFile->getPlayerIfExists($validator);
        $this->assertEquals('OTHER-PLAYER-1.2.3.HTML', $result->getName());

        $xmlFile = new XMLFileUnit(sprintf($unitString, 'thirdplayer-2.html'), false, true);
        $result = $xmlFile->getPlayerIfExists($validator);
        $this->assertNull($result);

        $xmlFile = new XMLFileUnit(sprintf($unitString, 'thirdplayer.html'), false, true);
        $result = $xmlFile->getPlayerIfExists($validator);
        $this->assertEquals('thirdplayer.html', $result->getName());
    }


    function test_getContent() {

        $validator = new WorkspaceValidatorMock([
            'SUPER-PLAYER-1.7.HTML',
            'A_UNITS_CONTENT.VOUD'
        ]);

        $unitString = '<Unit><Metadata><Id>i</Id></Metadata><Definition player="super-player-1">a unit definition</Definition></Unit>';
        $xmlFile = new XMLFileUnit($unitString, false, true);
        $result = $xmlFile->getContent($validator);
        $this->assertEquals("a unit definition", $result);


        $unitString = '<Unit><Metadata><Id>i</Id></Metadata><DefinitionRef player="super-player-1">A_UNITS_CONTENT.VOUD</DefinitionRef></Unit>';
        $xmlFile = new XMLFileUnit($unitString, false, true);
        $result = $xmlFile->getContent($validator);
        $this->assertEquals("content of: A_UNITS_CONTENT.VOUD", $result);
    }
}


