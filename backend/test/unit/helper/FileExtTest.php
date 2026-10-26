<?php

use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class FileExtTest extends TestCase {
  function test_get() {
    static::assertEquals('ddd', FileExt::get('/xxx/yyy/aaa.bbb.ccc.ddd'));
    static::assertEquals('ccc.ddd', FileExt::get('/xxx/yyy/aaa.bbb.ccc.ddd', 1));
    static::assertEquals('bbb.ccc.ddd', FileExt::get('/xxx/yyy/aaa.bbb.ccc.ddd', 2));
    static::assertEquals('', FileExt::get('one.dot', 2));
    static::assertEquals('dot', FileExt::get('one.dot', 0));
    static::assertEquals('', FileExt::get('nodotatall', 2));
    static::assertEquals('', FileExt::get('nodotatall', 0));
  }

  function test_has() {
    static::assertTrue(FileExt::has('/xxx/yyy/aaa.bbb.ccc.ddd', 'ccc.ddd'));
    static::assertTrue(FileExt::has('/xxx/yyy/aaa.bbb.ccc.ddd', 'ddd'));
    static::assertTrue(FileExt::has('/xxx/yyy/aaa.bbb.ccc.ddD', 'dDd'));
    static::assertFalse(FileExt::has('/xxx/yyy/aaa.bbb.ccc.ddd', 'aaa.bbb.ccc.ddd'));
  }

}

