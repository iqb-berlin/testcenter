<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/** The behaviour every StorageDriver shares. Each driver's test extends this and provides an empty storage. */
abstract class StorageDriverContractTestCase extends TestCase {
  protected StorageDriver $driver;
  private array $localFiles = [];

  abstract protected function createEmptyStorage(): StorageDriver;

  function setUp(): void {
    $this->driver = $this->createEmptyStorage();
  }

  function tearDown(): void {
    foreach ($this->localFiles as $localFile) {
      @unlink($localFile);
    }
  }

  private function createLocalFile(string $contents): string {
    $localPath = tempnam(sys_get_temp_dir(), 'storage-test-');
    file_put_contents($localPath, $contents);
    $this->localFiles[] = $localPath;
    return $localPath;
  }

  function test_put_storesACopyOfTheLocalFile(): void {
    $localPath = $this->createLocalFile('content');

    $this->driver->put(StoragePath::fromString('ws_1/Unit/unit.xml'), $localPath);

    $this->assertSame('content', $this->driver->get(StoragePath::fromString('ws_1/Unit/unit.xml')));
    $this->assertFileExists($localPath);
  }

  function test_put_overwrites(): void {
    $path = StoragePath::fromString('ws_1/Unit/unit.xml');
    $this->driver->put($path, $this->createLocalFile('old'));

    $this->driver->put($path, $this->createLocalFile('new content'));

    $this->assertSame('new content', $this->driver->get($path));
    $this->assertSame(11, $this->driver->getFileInfo($path)->size);
  }

  function test_putContents_overwrites(): void {
    $path = StoragePath::fromString('ws_1/Unit/unit.xml');
    $this->driver->putContents($path, 'old');

    $this->driver->putContents($path, 'new content');

    $this->assertSame('new content', $this->driver->get($path));
    $this->assertSame(11, $this->driver->getFileInfo($path)->size);
  }

  function test_get_failsOnMissingFile(): void {
    $this->expectException(Exception::class);

    $this->driver->get(StoragePath::fromString('ws_1/Unit/missing.xml'));
  }

  function test_getStream(): void {
    $path = StoragePath::fromString('ws_1/Resource/player.html');
    $this->driver->putContents($path, '<html></html>');

    $this->assertSame('<html></html>', (string) $this->driver->getStream($path));
  }

  function test_getStream_failsOnMissingFile(): void {
    $this->expectException(Exception::class);

    $this->driver->getStream(StoragePath::fromString('ws_1/Resource/missing.html'));
  }

  function test_getFileInfo(): void {
    $path = StoragePath::fromString('ws_1/Unit/unit.xml');
    $before = time();
    $this->driver->putContents($path, '12345');
    $after = time();

    $fileInfo = $this->driver->getFileInfo($path);

    $this->assertSame(5, $fileInfo->size);
    $this->assertGreaterThanOrEqual($before - 1, $fileInfo->modificationTime);
    $this->assertLessThanOrEqual($after + 1, $fileInfo->modificationTime);
  }

  function test_getFileInfo_isNullForMissingFileAndForDirectory(): void {
    $this->driver->putContents(StoragePath::fromString('ws_1/Resource/package/index.html'), 'x');

    $this->assertNull($this->driver->getFileInfo(StoragePath::fromString('ws_1/Resource/missing.html')));
    $this->assertNull($this->driver->getFileInfo(StoragePath::fromString('ws_1/Resource/package')));
  }

  function test_listFiles_returnsOnlyFilesDirectlyInTheDirectorySortedByName(): void {
    $this->driver->putContents(StoragePath::fromString('ws_1/Resource/b.html'), 'bb');
    $this->driver->putContents(StoragePath::fromString('ws_1/Resource/a.html'), 'a');
    $this->driver->putContents(StoragePath::fromString('ws_1/Resource/package/index.html'), 'x');
    $this->driver->putContents(StoragePath::fromString('ws_1/Unit/unit.xml'), 'x');

    $files = $this->driver->listFiles(StorageDirectory::fromString('ws_1/Resource'));

    $this->assertSame(['a.html', 'b.html'], array_keys($files));
    $this->assertSame(1, $files['a.html']->size);
    $this->assertSame(2, $files['b.html']->size);
  }

  function test_listFiles_isEmptyForMissingDirectory(): void {
    $this->assertSame([], $this->driver->listFiles(StorageDirectory::fromString('ws_1/Resource')));
  }

  function test_listSubdirectories_returnsSubdirectoriesDirectlyInTheDirectorySortedByName(): void {
    $this->driver->putContents(StoragePath::fromString('ws_2/Unit/unit.xml'), 'x');
    $this->driver->putContents(StoragePath::fromString('ws_1/Resource/package/index.html'), 'x');
    $this->driver->putContents(StoragePath::fromString('top-level-file.txt'), 'x');

    $this->assertSame(['ws_1', 'ws_2'], $this->driver->listSubdirectories(StorageDirectory::root()));
    $this->assertSame(['Resource'], $this->driver->listSubdirectories(StorageDirectory::fromString('ws_1')));
    $this->assertSame([], $this->driver->listSubdirectories(StorageDirectory::fromString('ws_3')));
  }

  function test_delete(): void {
    $path = StoragePath::fromString('ws_1/Unit/unit.xml');
    $this->driver->putContents($path, 'x');

    $this->assertTrue($this->driver->delete($path));
    $this->assertNull($this->driver->getFileInfo($path));
    $this->assertFalse($this->driver->delete($path));
  }

  function test_delete_ofTheLastFileRemovesItsDirectories(): void {
    $this->driver->putContents(StoragePath::fromString('ws_1/Unit/unit.xml'), 'x');
    $this->driver->putContents(StoragePath::fromString('ws_2/Unit/unit.xml'), 'x');

    $this->driver->delete(StoragePath::fromString('ws_1/Unit/unit.xml'));

    $this->assertSame(['ws_2'], $this->driver->listSubdirectories(StorageDirectory::root()));
  }

  function test_deleteDirectory_leavesSiblingsThatOnlyStartWithTheSameName(): void {
    $this->driver->putContents(StoragePath::fromString('ws_1/Resource/foo/index.html'), 'x');
    $this->driver->putContents(StoragePath::fromString('ws_1/Resource/foo/js/app.js'), 'x');
    $this->driver->putContents(StoragePath::fromString('ws_1/Resource/foo.itcr.zip'), 'x');
    $this->driver->putContents(StoragePath::fromString('ws_1/Resource/foobar/index.html'), 'x');

    $this->driver->deleteDirectory(StorageDirectory::fromString('ws_1/Resource/foo'));

    $resources = StorageDirectory::fromString('ws_1/Resource');
    $this->assertSame(['foo.itcr.zip'], array_keys($this->driver->listFiles($resources)));
    $this->assertSame(['foobar'], $this->driver->listSubdirectories($resources));
  }

  function test_deleteDirectory_ofTheLastFilesRemovesTheParentDirectories(): void {
    $this->driver->putContents(StoragePath::fromString('ws_1/Resource/foo/index.html'), 'x');
    $this->driver->putContents(StoragePath::fromString('ws_2/Unit/unit.xml'), 'x');

    $this->driver->deleteDirectory(StorageDirectory::fromString('ws_1/Resource/foo'));

    $this->assertSame(['ws_2'], $this->driver->listSubdirectories(StorageDirectory::root()));
  }

  function test_deleteDirectory_ignoresMissingDirectory(): void {
    $this->driver->deleteDirectory(StorageDirectory::fromString('ws_1/Resource/foo'));

    $this->assertSame([], $this->driver->listSubdirectories(StorageDirectory::root()));
  }

  function test_deleteDirectory_refusesTheRoot(): void {
    $this->driver->putContents(StoragePath::fromString('ws_1/Unit/unit.xml'), 'x');

    try {
      $this->driver->deleteDirectory(StorageDirectory::root());
      $this->fail('Expected an exception');
    } catch (InvalidArgumentException) {
    }

    $this->assertSame('x', $this->driver->get(StoragePath::fromString('ws_1/Unit/unit.xml')));
  }
}
