<?php
declare(strict_types=1);

readonly class LocalDeliveryConfig implements DeliveryMethodConfig {
  public function createMethod(string $root): DeliveryMethod {
    return new LocalDelivery();
  }
}
