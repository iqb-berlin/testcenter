<!-- This file outlines the steps necessary for creating a new release -->

- make docs-user
- make create-interfaces
- Optionally update schema references in `sampledata` files. This is only necessary if the sample files actually use new
  features of the new schemas.
- Update version in package.json (root).
- Move content of `next.sql` file with release name, e.g. `17.5.0.sql`. Delete `next.sql`!
- Make sure `CHANGELOG.md` is up to date.
- Update versions in scripts/helm/testcenter/Chart.yml
  - appVersion AND (chart) version need to be raised.
- Update TESTCENTER_VERSION and TESTCENTER_CHART_VERSION in scrips/helm/helm-install-tc.sh
- Push helm changes TODO
<!-- helm push () -->
<!--   helm package testcenter && helm push testcenter-$(CHART_VERSION).tgz oci://registry-1.docker.io/iqbberlin && rm testcenter-$(CHART_VERSION).tgz -->