<!-- This file outlines the steps necessary for creating a new release -->

- make docs-user
- make interfaces
- optionally update schema references in sampledata files. This is onlt necessary if the sample files actually use new
  features.
- update version in package.json (root)
- Move content of next.sql to version specific new file. Delete next.sql!
- Make sure changelog.md is up to date
- Update versions in scripts/helm/testcenter/chart.yml
  - Here the application version needs to be updated AND the chart version needs to be rasied as well.
- Update versions in scrips/helm/helm-install-tc.sh
- Push helm changes TODO
<!-- helm push () -->
<!--   helm package testcenter && helm push testcenter-$(CHART_VERSION).tgz oci://registry-1.docker.io/iqbberlin && rm testcenter-$(CHART_VERSION).tgz -->