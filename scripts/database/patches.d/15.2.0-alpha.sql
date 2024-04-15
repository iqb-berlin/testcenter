alter table file_relations
  modify relationship_type enum ('hasBooklet', 'containsUnit', 'usesPlayer', 'usesPlayerResource', 'isDefinedBy', 'usesScheme', 'unknown') not null;
