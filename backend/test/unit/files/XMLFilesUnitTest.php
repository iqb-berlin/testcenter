<?php

use PHPUnit\Framework\TestCase;


/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class XMLFilesUnitTest extends TestCase {


    public function setUp(): void {

        require_once "src/data-collection/DataCollectionTypeSafe.class.php";
        require_once "src/data-collection/RequestedAttachment.class.php";
        require_once "src/data-collection/FileData.class.php";
        require_once "src/data-collection/FileRelation.class.php";
        require_once "src/data-collection/FileRelationshipType.class.php";
        require_once "src/files/File.class.php";
        require_once "src/files/XMLFile.class.php";
        require_once "src/files/XMLFileUnit.class.php";
        require_once "src/files/ResourceFile.class.php";
        require_once "src/helper/FileTime.class.php";
        require_once "src/helper/FileID.class.php";
        require_once "src/helper/Version.class.php";
        require_once "src/helper/JSON.class.php";
        require_once "src/helper/XMLSchema.class.php";
        require_once "src/workspace/Workspace.class.php";
        require_once "src/workspace/WorkspaceCache.class.php";
        require_once "test/unit/mock-classes/ResourceFileMock.php";
        require_once "test/unit/mock-classes/WorkspaceCacheMock.php";

        VfsForTest::setUp();
    }


    public static function setUpBeforeClass(): void {

        require_once "test/unit/VfsForTest.class.php";
        VfsForTest::setUpBeforeClass();
    }


//    function test_getPlayerId() {
//
//        $xmlFile = new XMLFileUnit(DATA_DIR . '/ws_1/Unit/SAMPLE_UNIT.XML');
//        $expected = 'VERONA-PLAYER-SIMPLE-4.HTML';
//        $result = $xmlFile->getPlayerId();
//        $this->assertEquals($expected, $result);
//
//        $xmlFile = new XMLFileUnit('<Unit><Metadata><Id>some</Id></Metadata><Definition player="x_player">a</Definition></Unit>', false, true);
//        $expected = 'X_PLAYER.HTML';
//        $result = $xmlFile->getPlayerId();
//        $this->assertEquals($expected, $result);
//    }


    function test_getPlayerIfExists() {

        $unitString = '<Unit><Metadata><Id>i</Id><Label>l</Label></Metadata><Definition player="%s">a</Definition></Unit>';

        $workspaceCache = new WorkspaceCacheMock([
            'SUPER-PLAYER-1.7.HTML',
            'SUPER-PLAYER-1.HTML',
            'SUPER-PLAYER-2.HTML',
            'OTHER-PLAYER-1.2.3.HTML',
            'thirdplayer.html'
        ]);

        $xmlFile = XMLFileUnit::fromString(sprintf($unitString, 'super-player'));
        $result = $xmlFile->getPlayerIfExists($workspaceCache);
        $this->assertNull($result);

        $xmlFile = XMLFileUnit::fromString(sprintf($unitString, 'super-player-1'));
        $result = $xmlFile->getPlayerIfExists($workspaceCache);
        $this->assertEquals('SUPER-PLAYER-1.HTML', $result->getName());

        $xmlFile = XMLFileUnit::fromString(sprintf($unitString, 'super-player-1.5'));
        $result = $xmlFile->getPlayerIfExists($workspaceCache);
        $this->assertNull($result);

        $xmlFile = XMLFileUnit::fromString(sprintf($unitString, 'super-player-1.7'));
        $result = $xmlFile->getPlayerIfExists($workspaceCache);
        $this->assertEquals('SUPER-PLAYER-1.7.HTML', $result->getName());

        $xmlFile = XMLFileUnit::fromString(sprintf($unitString, 'other-player-1.2'));
        $result = $xmlFile->getPlayerIfExists($workspaceCache);
        $this->assertEquals('OTHER-PLAYER-1.2.3.HTML', $result->getName());

        $xmlFile = XMLFileUnit::fromString(sprintf($unitString, 'thirdplayer.html'));
        $result = $xmlFile->getPlayerIfExists($workspaceCache);
        $this->assertEquals('thirdplayer.html', $result->getName());
    }
}


