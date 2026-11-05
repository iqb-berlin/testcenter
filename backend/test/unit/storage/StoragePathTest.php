<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class StoragePathTest extends TestCase {
  function test_fromString(): void {
    $path = StoragePath::fromString('ws_1/Resource/package/index.html');

    $this->assertSame(['ws_1', 'Resource', 'package'], $path->directory->segments);
    $this->assertSame('index.html', $path->name);
    $this->assertSame('ws_1/Resource/package/index.html', (string) $path);
  }

  function test_fromString_inTheRoot(): void {
    $path = StoragePath::fromString('file.txt');

    $this->assertTrue($path->directory->isRoot());
    $this->assertSame('file.txt', (string) $path);
  }

  static function invalidPaths(): array {
    return [
      'empty' => [''],
      'leading slash' => ['/ws_1/Unit/unit.xml'],
      'trailing slash' => ['ws_1/Unit/'],
      'double slash' => ['ws_1//unit.xml'],
      'dot dot' => ['ws_1/Unit/../../ws_2/Unit/unit.xml'],
      'dot dot as name' => ['ws_1/Unit/..'],
      'dot' => ['ws_1/./unit.xml'],
      'null byte' => ["ws_1/Unit/unit.xml\0.html"]
    ];
  }

  /** @dataProvider invalidPaths */
  function test_fromString_rejectsInvalidPaths(string $path): void {
    $this->expectException(InvalidArgumentException::class);

    StoragePath::fromString($path);
  }

  function test_directoryFromString(): void {
    $this->assertSame('ws_1/Resource/', (string) StorageDirectory::fromString('ws_1/Resource'));
    $this->assertSame('ws_1/Resource/', (string) StorageDirectory::fromString('ws_1/Resource/'));
    $this->assertTrue(StorageDirectory::fromString('')->isRoot());
    $this->assertSame('', (string) StorageDirectory::root());
  }

  static function invalidDirectories(): array {
    return [
      'only slash' => ['/'],
      'leading slash' => ['/ws_1'],
      'double trailing slash' => ['ws_1//'],
      'dot dot' => ['ws_1/..'],
    ];
  }

  /** @dataProvider invalidDirectories */
  function test_directoryFromString_rejectsInvalidDirectories(string $directory): void {
    $this->expectException(InvalidArgumentException::class);

    StorageDirectory::fromString($directory);
  }

  function test_directoryBuilding(): void {
    $workspace = StorageDirectory::root()->createSubdirectory('ws_1');

    $this->assertSame('ws_1/Resource/', (string) $workspace->createSubdirectory('Resource'));
    $this->assertSame('ws_1/unit.xml', (string) $workspace->createFilePath('unit.xml'));
    $this->assertSame('ws_1/', (string) $workspace->createSubdirectory('Resource')->getParent());
    $this->assertTrue($workspace->getParent()->isRoot());
  }

  function test_directoryBuilding_rejectsInvalidSegments(): void {
    $this->expectException(InvalidArgumentException::class);

    StorageDirectory::root()->createSubdirectory('ws_1', '..');
  }

  function test_rootHasNoParent(): void {
    $this->expectException(LogicException::class);

    StorageDirectory::root()->getParent();
  }
}
