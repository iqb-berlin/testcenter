# XSD defintions changelog

## 4.0.0-group-monitor

#### Testtakers
- introduced optional attribute `label` for `<group>`-element

#### Booklet
- changed defintion of `<Testlet>`-element to get rid of a warning, 
that `<Unit>` was not allowed in some legal constellations 
- `id`-attribute is now mandatory for testlets
- `<Units>`-element can not contain `id` or `label` (since it won't be 
visible anywhere anyway), and first `<Restrictions>` can not contain
 `<CodeToEnter>`, which would not make any sense
- Made `<Restriction>` more readable: generic `parameter`-paremater is 
now renamed to `minutes` in context of `<TimeMax>` and to `code` for
 `<CodeToEnter>`-element.  
