<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

enum FileType: string
{
  case TESTTAKERS = 'Testtakers';
  case BOOKLET = 'Booklet';
  case SYSTEMCHECK = 'SysCheck';
  case UNIT = 'Unit';
  case RESOURCE = 'Resource';

  /** @return string[] */
  public static function getDependenciesOfType(self $dependantType): array {
    $leftDepOnRight = ['Testtakers', 'Booklet', 'Unit', 'Resource'];
    $dependencies = [];

    $dependencyStartsHere = false;
    foreach ($leftDepOnRight as $dependency) {
      if ($dependencyStartsHere) {
        $dependencies[] = $dependency;
        break;
      }

      if ($dependency == $dependantType->value) {
        $dependencyStartsHere = true;
        $dependencies[] = $dependency;
      }
    }

    return $dependencies;
  }

  /**
   * @param string[] $types
   * @return self|null
   */
  public static function getTopRootDependentType(array $types): ?self {
    $rightDepOnLeft = array_map(fn(self $type) => $type->value, self::cases());

    foreach ($rightDepOnLeft as $topRoot) {
      foreach ($types as $type) {
        if ($type == $topRoot) return self::tryFrom($type);
      }
    }
    return null;
  }
}
