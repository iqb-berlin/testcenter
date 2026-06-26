---
layout: default
---

```
<?xml version="1.0" encoding="utf-8"?>
<Testtakers xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-testtaker-xml/18.0">

  <Metadata>
    <Description></Description>
  </Metadata>

  <CustomTexts>
    <CustomText key="booklet_codeToEnterTitle">Bitte Code eingeben</CustomText>
  </CustomTexts>

  <Profiles>
    <GroupMonitor>
      <Profile
        id="small"
        label="Superklein"
        blockColumn="hide"
        unitColumn="hide"
        groupColumn="hide"
        bookletColumn="hide"
        bookletStatesColumns=""
        view="small"
        filterLocked="yes"
        filterPending="yes"
      >
        <Filter label="Reduced Booklet" type="equal" field="bookletLabel" value="Reduced Booklet" />
      </Profile>
      <Profile
        id="all"
        label="Alles zeigen"
        blockColumn="show"
        unitColumn="show"
        groupColumn="show"
        bookletColumn="show"
        bookletStatesColumns="level bonus"
        view="full"
        filterLocked="no"
        filterPending="no"
        autoselectNextBlock="no"
      >
      </Profile>
    </GroupMonitor>
  </Profiles>

  <Group id="sample_group" validFrom="1/3/2020 10:00" label="Primary Sample Group">

    <AssetAssignments>
      <Asset slot="logo">bildLogo-1.png</Asset>
      <Asset slot="codeInputIllustration">bildCode.jpg</Asset>
    </AssetAssignments>

    <Login mode="run-hot-return" name="test" pw="user123">
      <Booklet>BOOKLET.SAMPLE-1</Booklet>
      <AssetAssignments>
        <Asset slot="logo">bildLogo-2.png</Asset>
      </AssetAssignments>
      <ViewSettings>
        <theme>Primar</theme>
        <codeInput>
          <type>text-field</type>
          <length>3</length>
        </codeInput>
        <monitorBookletVisibility>hidden</monitorBookletVisibility>
      </ViewSettings>
    </Login>

    <Login mode="run-hot-return" name="test2" pw="user123">
      <Booklet>BOOKLET.SAMPLE-2</Booklet>
      <ViewSettings>
        <theme>Sekundar</theme>
        <codeInput>
          <type>keypad-numbers</type>
          <length>3</length>
        </codeInput>
      </ViewSettings>
    </Login>
    
    <Login mode="monitor-group" name="test-group-monitor" pw="user123">
      <Profile id="all" />
      <Profile id="small" />
      <ViewSettings>
        <monitorBookletVisibility>hidden</monitorBookletVisibility>
      </ViewSettings>
    </Login>
    <Login mode="sys-check-login" name="sys-check" />
  </Group>

</Testtakers>
```

# Root-Elemente