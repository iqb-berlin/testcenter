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

<a id="state"></a>
## State
## ▪ `State.id` (`string` • `Pflichtfeld`)


## ▪ `State.label` (`string`)


## ▪ `State.options` (`array` • `Pflichtfeld`)


Typ: Array aus  → Siehe Abschnitt: [Option](#option)



<a id="option"></a>
## Option
## ▪ `Option.id` (`string` • `Pflichtfeld`)


## ▪ `Option.label` (`string`)


## ▪ `Option.if` (`array`)


Typ: Array aus  → Siehe Abschnitt: [If](#if)



<a id="if"></a>
## If
## ▪ `If.Value` (`object`)


Struktur:  → Siehe Abschnitt: [Variable Referenz](#variable-referenz)

## ▪ `If.Status` (`object`)


Struktur:  → Siehe Abschnitt: [Variable Referenz](#variable-referenz)

## ▪ `If.Code` (`object`)


Struktur:  → Siehe Abschnitt: [Variable Referenz](#variable-referenz)

## ▪ `If.Score` (`object`)

Struktur für Score-Einträge innerhalb von Aggregationen.

Struktur:  → Siehe Abschnitt: [AggregationScore](#aggregationscore)

## ▪ `If.Sum` (`object`)


Struktur:  → Siehe Abschnitt: [Variable Aggregation](#variable-aggregation)

## ▪ `If.Median` (`object`)


Struktur:  → Siehe Abschnitt: [Variable Aggregation](#variable-aggregation)

## ▪ `If.Mean` (`object`)


Struktur:  → Siehe Abschnitt: [Variable Aggregation](#variable-aggregation)

## ▪ `If.Count` (`object`)

Zählt, wie viele der untergeordneten Bedingungen zutreffen.

Struktur:  → Siehe Abschnitt: [CountDefinition](#countdefinition)

## ▪ `If.Is` (`object`)

Vergleichsoperatoren für die Bedingung (is).

Struktur:  → Siehe Abschnitt: [Is](#is)



<a id="variable-referenz"></a>
## Variable Referenz
## ▪ `Variable.of` (`string`)


## ▪ `Variable.from` (`string`)




<a id="variable-aggregation"></a>
## Variable Aggregation
## ▪ `Variable.Value` (`array`)


Typ: Array aus  → Siehe Abschnitt: [Variable Referenz](#variable-referenz)

## ▪ `Variable.Code` (`array`)


Typ: Array aus  → Siehe Abschnitt: [Variable Referenz](#variable-referenz)

## ▪ `Variable.Score` (`array`)


Typ: Array aus  → Siehe Abschnitt: [AggregationScore](#aggregationscore)



<a id="is"></a>
## Is
*Vergleichsoperatoren für die Bedingung (is).*

## ▪ `Is.lowerThan` (`number`)


## ▪ `Is.greaterThan` (`number`)


## ▪ `Is.equal` (`string`)


## ▪ `Is.notEqual` (`string`)




<a id="countdefinition"></a>
## CountDefinition
*Zählt, wie viele der untergeordneten Bedingungen zutreffen.*

## ▪ `CountDefinition.if` (`array` • `Pflichtfeld`)


Typ: Array aus  → Siehe Abschnitt: [If](#if)



<a id="aggregationscore"></a>
## AggregationScore
*Struktur für Score-Einträge innerhalb von Aggregationen.*

## ▪ `AggregationScore.of` (`string` • `Pflichtfeld`)


## ▪ `AggregationScore.from` (`string` • `Pflichtfeld`)


## ▪ `AggregationScore.or` (`number`)



