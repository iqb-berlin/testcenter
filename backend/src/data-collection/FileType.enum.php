<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

enum FileType: string
{
  case TESTTAKERS = 'Testtakers';
  case BOOKLET = 'Booklet';
  //case SYSTEMCHECK = 'Syscheck';
  case UNIT = 'Unit';
  case RESOURCE = 'Resource';

  /** @return string[] */
  public static function getDependantTypes(self $type): array {
    $rightDepOnLeft = ['Testtakers', 'Booklet', 'Unit', 'Resource'];
    $dependantTypes = [];

    $isDependent = false;
    foreach ($rightDepOnLeft as $dependant) {
      if ($isDependent) {
        $dependantTypes[] = $dependant;
        continue;
      }

      if ($dependant == $type->value) {
        $isDependent = true;
        $dependantTypes[] = $dependant;
      }
    }

    return $dependantTypes;
  }

  /**
   * @param string[] $types
   * @return self|null
   */
  public static function getTopRootDependentType(array $types): ?self {
    $rightDepOnLeft = ['Testtakers', 'Booklet', 'Unit', 'Resource'];

    foreach ($rightDepOnLeft as $topRoot) {
      foreach ($types as $type) {
        if ($type == $topRoot) return self::tryFrom($type);
      }
    }
    return null;
  }
}
