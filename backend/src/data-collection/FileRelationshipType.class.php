<?php
declare(strict_types=1);


enum FileRelationshipType {
    case hasBooklet;
    case containsUnit;
    case usesPlayer;
    case usesScheme;
    case usesPlayerResource;
    case isDefinedBy;
    case unknown;
}