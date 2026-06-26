---
layout: default
---

# Booklet-XML

```
<?xml version="1.0" encoding="utf-8"?>
<Booklet xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-booklet-xml/18.0">
  <Metadata>
    <Id>BOOKLET.SAMPLE-1</Id>
    <Label>Sample booklet</Label>
    <Description>This a sample booklet.</Description>
  </Metadata>

  <BookletConfig></BookletConfig>

  <States></States>

  <Units>

    <Unit id="unit-1" label="first unit" labelshort="Unit 1" />

    <Testlet id="tslt-1" label="First Block">
      <Restrictions>
        <CodeToEnter code="sample">Please insert the word `sample`.</CodeToEnter>
        <TimeMax minutes="1" />
        <DenyNavigationOnIncomplete response="ON" presentation="ON" />
        <LockAfterLeaving confirm="true" scope="testlet" />
       </Restrictions>
      <Unit id="unit-2" label="second unit" labelshort="unit-2" />
    </Testlet>

  </Units>
</Booklet>

```
# Root-Elemente

> An dieser Stelle werden nur die nicht optionalen Felder der primären Knoten (Wurzelelemente) beschrieben.<br> Die optionalen Felder sind aufgeführt, die Dokumentation dazu wird aber separat geführt.