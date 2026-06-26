---
layout: default
---

```
<?xml version="1.0" encoding="utf-8"?>
<Booklet xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-booklet-xml/18.0">
  <Metadata>
    <Id>BOOKLET.SAMPLE-2</Id>
    <Label>Adaptive Booklet</Label>
    <Description>This Booklet demonstrates the adaptivity features.</Description>
  </Metadata>

  <BookletConfig></BookletConfig>

  <States>
    <State id="level" label="Schwierigkeitsstufe">
      <Option id="professional" label="schwer">
        <If>
          <Count>
            <If><Value of="var1" from="decision-unit" /><Is greaterThan="150" /></If>
            <If>
              <Sum>
                <Value of="var2" from="decision-unit" />
                <Value of="var3" from="decision-unit" />
              </Sum>
              <Is greaterThan="2" />
            </If>
          </Count>
          <Is greaterThan="0" />
        </If>
      </Option>
      <Option id="advanced" label="mittel">
        <If><Value of="derived_var" from="decision-unit" /><Is greaterThan="99" /></If>
      </Option>
      <Option id="beginner" label="leicht "/>
    </State>
  </States>

  <Units>
    <Unit id="UNIT.SAMPLE-2" label="Decision Unit" labelshort="D" alias="decision-unit" />

    <Testlet id="stage1">
      <Testlet id="stage1-professional" label="Stage ① Block Ⓒ">
        <Restrictions>
          <Show if="level" is="professional" />
        </Restrictions>
        <Unit id="UNIT.SAMPLE-2" label="Ⓒ Professional Unit" labelshort="Ⓒ" alias="professional-unit" />
      </Testlet>

      <Testlet id="stage1-advanced" label="Stage ① Block Ⓑ">
        <Restrictions>
          <Show if="level" is="advanced" />
        </Restrictions>
        <Unit id="UNIT.SAMPLE-2" label="Ⓑ Advanced Unit" labelshort="Ⓑ" alias="advanced-unit" />
      </Testlet>

      <Testlet id="stage1-beginner" label="Stage ① Block Ⓐ">
        <Restrictions>
          <Show if="level" is="beginner" />
        </Restrictions>
        <Unit id="UNIT.SAMPLE-2" label="Ⓐ Beginner Unit" labelshort="Ⓐ" alias="beginner-unit" />
      </Testlet>
    </Testlet>
  </Units>
</Booklet>
```

# Booklet: Adaptives Testen

Diese Dokumentation beschreibt die Konfiguration von Variablen (`States`) und logischen Bedingungen, um verzweigte oder adaptive Testhefte zu steuern.
