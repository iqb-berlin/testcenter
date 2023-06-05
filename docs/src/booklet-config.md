---
layout: default
---

# Booklet config
There are some configuration parameters for adjusting the behaviour during the test.This 
document describes the ways to bring the parameters to the application and lists
all possible keys.
 
## Configuration via booklet XML
The configuration can be set for every single booklet. You need to add one XML-Element 
into the booklet-file. Example:
```
...
</Metadata>
<BookletConfig>
    <Config key="force_responses_complete">OFF</CustomText>
    <Config key="unit_navibuttons">ARROWS_ONLY</CustomText>
...
</BookletConfig>
```

## List of parameters
