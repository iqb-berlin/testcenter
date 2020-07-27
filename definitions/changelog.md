# XSD defintions changelog

## 4.0.0-group-monitor


#### Testtakers
- `name`-attribute of `<group>`-element is now called `<id>`
- introduced optional attribute `label` for `<group>`-element
- in `<Metadata>`-element, only the optional `<Description>` field remains

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
- in `<Metadata>`-element, the elements `<ID>` and `<Label>` are mandatory, 
and `<Description>` is optional, the rest does not exist anymore.

#### SysCheck
- in `<Metadata>`-element, the elements `<ID>` and `<Label>` are mandatory, 
and `<Description>` is optional, the rest does not exist anymore.

#### Unit
- in `<Metadata>`-element, the elements `<ID>` and `<Label>` are mandatory, 
and `<Description>` is optional, the rest does not exist anymore.
