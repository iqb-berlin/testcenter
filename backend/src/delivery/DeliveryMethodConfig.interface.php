<?php
declare(strict_types=1);

/** The settings of one delivery method, without the storage root, which test mode switches. */
interface DeliveryMethodConfig {
  /** @param string $root the outermost segment of every stored file's location */
  public function createMethod(string $root): DeliveryMethod;
}
