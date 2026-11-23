# Schema-Definition

In older Test Center versions, the XSD files for schema definitions were located in this folder!
The XSD schema definitions have been moved now to dedicated repositories
under the [iqb-specifications](https://github.com/iqb-specifications)
organisation on GitHub and are accessible via stable permalinks.

## Schema Repositories

| Schema | Repository | Permalink |
|---|---|---|
| Booklet | [testcenter-booklet-xml](https://github.com/iqb-specifications/testcenter-booklet-xml) | `https://w3id.org/iqb/spec/testcenter-booklet-xml/{version}` |
| Testtakers | [testcenter-testtaker-xml](https://github.com/iqb-specifications/testcenter-testtaker-xml) | `https://w3id.org/iqb/spec/testcenter-testtaker-xml/{version}` |
| Unit | [unit-xml](https://github.com/iqb-specifications/unit-xml) | `https://w3id.org/iqb/spec/unit-xml/{version}` |
| SysCheck | [testcenter-syscheck-xml](https://github.com/iqb-specifications/testcenter-syscheck-xml) | `https://w3id.org/iqb/spec/testcenter-syscheck-xml/{version}` |

**The major versions the Testcenter supports for each schema are defined in [compatibility.json](compatibility.json).**

## Usage

Reference the desired schema version in your XML files (example for booklet-xml):
```xml
<Booklet xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="https://w3id.org/iqb/spec/testcenter-booklet-xml/18.0">
```

## Introducing a new schema version

1. Put the new XSD into the backend's schema cache as `data/.schemas/<repository>/<version>/<repository>.xsd`, so
   that the backend validates against it before it is published.
2. Reference the new version in the XML files that use the change and check that they validate.
3. Implement and test the change in the Testcenter.
4. For a new major version, raise `max` of the schema in [compatibility.json](compatibility.json).
5. Release the Testcenter.
6. Commit the XSD to its schema repository and release the version there. Its release notes name the Testcenter
   version that is required.

The order is deliberate: the schema's release notes can only name a Testcenter version that exists. Until the schema
is released, an installation cannot download it, so XML files that use it fail validation.
