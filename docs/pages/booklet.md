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

## Metadata

Pflichtangaben zur Identifikation des Booklets.

## ▪ `metadata.id` (`string` • `Pflichtfeld`)


## ▪ `metadata.label` (`string` • `Pflichtfeld`)


## ▪ `metadata.description` (`string`)



## BookletConfig (optional)

Optionale Konfigurationsparameter zur Steuerung von Darstellung und Verhalten des Testhefts.

→ Siehe [Booklet-Konfiguration](booklet-config.html)

## States (optional)

Definition von adaptiven Variablen (Zuständen) für das Testheft. Ermöglicht die komplexe Steuerung von bedingten Blöcken.

→ Siehe [Booklet-Adaptives Testen](adaptive-config.html)

## Units 

Die Teststruktur (Wurzel-Testlet). Muss Restriktionen und Kind-Elemente enthalten.

Struktur:  → Siehe Abschnitt: [Testlet (Hauptblock / Startabschnitt)](#testlet-hauptblock-startabschnitt)

---
# Kind-Elemente

> Hier werden die Attribute der Kind-Elemente beschrieben.


<a id="testlet-hauptblock-startabschnitt"></a>
## Testlet (Hauptblock / Startabschnitt)

## ▪ `Testlet.restrictions` (`object`)


## ▪ `Testlet.children` (`array`)


Typ: Array aus Elementen von → Siehe Abschnitt: [Unit](#unit),  → Siehe Abschnitt: [Testlet (Abschnitt / Block)](#testlet-abschnitt-block)



<a id="testlet-abschnitt-block"></a>
## Testlet (Abschnitt / Block)

## ▪ `Testlet.id` (`string` • `Pflichtfeld`)


## ▪ `Testlet.label` (`string`)


## ▪ `Testlet.restrictions` (`object`)


Struktur:  → Siehe Abschnitt: [Restrictions](#restrictions)

## ▪ `Testlet.children` (`array`)


Typ: Array aus Elementen von → Siehe Abschnitt: [Unit](#unit),  → Siehe Abschnitt: [Testlet (Abschnitt / Block)](#testlet-abschnitt-block)



<a id="unit"></a>
## Unit

## ▪ `Unit.id` (`string` • `Pflichtfeld`)


## ▪ `Unit.label` (`string` • `Pflichtfeld`)


## ▪ `Unit.labelshort` (`string`)


## ▪ `Unit.alias` (`string`)


Standard: `alias`



<a id="restrictions"></a>
## Restrictions

## ▪ `Restrictions.CodeToEnter` (`object`)


Struktur:  → Siehe Abschnitt: [CodeToEnter](#codetoenter)

## ▪ `Restrictions.TimeMax` (`object`)


Struktur:  → Siehe Abschnitt: [TimeMax](#timemax)

## ▪ `Restrictions.denyNavigationOnIncomplete` (`object`)


Struktur:  → Siehe Abschnitt: [DenyNavigationOnIncomplete](#denynavigationonincomplete)

## ▪ `Restrictions.lockAfterLeaving` (`object`)


Struktur:  → Siehe Abschnitt: [LockAfterLeaving](#lockafterleaving)



<a id="codetoenter"></a>
## CodeToEnter

## ▪ `CodeToEnter.code` (`string`)




<a id="timemax"></a>
## TimeMax

## ▪ `TimeMax.minutes` (`number`)


## ▪ `TimeMax.leave` (`enum`)


Standard: `confirm`

Erlaubte Werte:
* `forbidden`
* `confirm`: *(Standard)*
* `allowed`



<a id="denynavigationonincomplete"></a>
## DenyNavigationOnIncomplete

## ▪ `DenyNavigationOnIncomplete.presentation` (`enum`)


Erlaubte Werte:
* `ON`
* `OFF`
* `ALWAYS`

## ▪ `DenyNavigationOnIncomplete.response` (`enum`)


Erlaubte Werte:
* `ON`
* `OFF`
* `ALWAYS`



<a id="lockafterleaving"></a>
## LockAfterLeaving

## ▪ `LockAfterLeaving.confirm` (`boolean`)


## ▪ `LockAfterLeaving.scope` (`enum`)


Erlaubte Werte:
* `unit`
* `testlet`


