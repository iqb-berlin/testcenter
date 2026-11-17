<?php
declare(strict_types=1);

class Delivery {
  private static ?DeliveryMethod $method = null;

  static function getMethod(): DeliveryMethod {
    if (!self::$method) {
      self::$method = SystemConfig::$delivery_method->createMethod(SystemConfig::$storage_root);
    }
    return self::$method;
  }
}
