<?php
declare(strict_types=1);

enum FileRelationshipType {
  case hasBooklet;
  case containsUnit;
  case usesPlayer;
  case usesPlayerResource;
  case isDefinedBy;
  case usesScheme;
  case unknown;
}