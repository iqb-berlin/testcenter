<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

enum FileType: string
{
  case SYSTEMCHECK = 'SysCheck';
  case TESTTAKERS = 'Testtakers';
  case BOOKLET = 'Booklet';
  case UNIT = 'Unit';
  case RESOURCE = 'Resource';

  /**
   * Returns the types of the input type and its dependencies in the correct order.
   * @return string[]
   */
  public static function getDependenciesOfType(self $dependantType): array {
    $leftDepOnRight = [
      self::SYSTEMCHECK->value,
      self::TESTTAKERS->value,
      self::BOOKLET->value,
      self::UNIT->value,
      self::RESOURCE->value,
    ];
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
}
