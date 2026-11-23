# S3 storage

By default the backend keeps the files of the workspaces in its data volume. Instead, it can keep them in a bucket of
an S3-compatible service, e.g. AWS, STACKIT or SeaweedFS. This page describes what changes then and what the
Testcenter needs from the bucket.

## What changes

- All files of the workspaces are in the bucket: uploaded files, unpacked resource packages, unit attachments and
  the images uploaded by the superadmin. The database stays where it is.
- Test-takers' browsers load the files of the tests (units, players, resources) **directly from the bucket**. The
  file server checks the group token as before and then redirects the browser to a signed link to the file in the
  bucket. It keeps these redirects (see [Caching](#caching)), so the backend is asked once per file and interval, not
  for every test-taker. Without file server (`FILE_SERVER_ENABLED=false`) the backend redirects itself and handles
  every file request; that suits small installations.
- The S3 address must therefore be reachable from the networks test-takers work in. Where school networks allow only
  listed addresses, the S3 host has to be on the list next to the Testcenter.

::: warning New installations only
S3 storage is for new installations. An existing installation stays on the filesystem: files already stored are not
moved, and after a switch the Testcenter does not find them.
:::

## Bucket

- Give each Testcenter installation a bucket that no other application or installation uses. The Testcenter keeps all
  files below `data/` and deletes whole directories there, e.g. when a workspace is deleted.
- Create the bucket beforehand, unless the service creates it on the first write (SeaweedFS does, AWS does not).
- The access key the Testcenter uses (`S3_ACCESS_KEY`, `S3_SECRET_KEY`) needs permission to read, write, list and
  delete objects in the bucket.
- When the backend initializes (on start, with Helm in its init job), it writes and deletes a probe file and stops
  if that fails; the error names bucket and endpoint.

## Configuration

With Docker Compose in `.env.prod` (see `.env.prod-template` for the descriptions):

```
STORAGE_DRIVER=s3
S3_ENDPOINT=https://object.storage.example
S3_REGION=eu01
S3_BUCKET=testcenter
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_USE_PATH_STYLE=true
S3_PUBLIC_ENDPOINT=
S3_PUBLIC_ORIGIN=
S3_URL_RENEWAL_INTERVAL=3600
```

With Helm, the section `objectStore` in `values.yaml` holds the same settings; the keys come from an existing Secret
named in `objectStore.existingSecret`. The chart then creates no data volume for the backend, so several backend
replicas need no ReadWriteMany volume.

- `S3_ENDPOINT` is empty for AWS. The region must be set in any case; services that ignore it accept any value.
- `S3_PUBLIC_ENDPOINT` is needed if browsers reach the S3 API under another address than the backend does, e.g.
  when the backend uses an address inside the cluster.
- `S3_PUBLIC_ORIGIN` is allowed in the Content Security Policy of the frontend, so that browsers may load files from
  there. By default it is `S3_PUBLIC_ENDPOINT`, or `S3_ENDPOINT`. Set it if the bucket is a subdomain
  (`S3_USE_PATH_STYLE=false`): then it is `https://<bucket>.<endpoint host>`, at AWS without endpoint
  `https://<bucket>.s3.<region>.amazonaws.com`. If it is wrong, the browser console names the blocked address.

## CORS

Players and resources may load files with scripts (`fetch`, fonts, modules), which the browser only allows if the
bucket permits the Testcenter's origin. Allow `GET` and `HEAD` from the address test-takers open the Testcenter at,
e.g. with the AWS CLI:

```
aws s3api put-bucket-cors --bucket testcenter --cors-configuration \
  '{"CORSRules": [{"AllowedOrigins": ["https://testcenter.example.org"], "AllowedMethods": ["GET", "HEAD"]}]}'
```

## Caching

The signed links stay the same for `S3_URL_RENEWAL_INTERVAL` seconds (default one hour), so that browsers can cache
the files; each link stays valid five minutes longer. The file server keeps the redirects for as long, so the backend
is asked once per file and interval. Stored files carry `Cache-Control: private, max-age=3600`: browsers keep them for
up to an hour, shared caches such as school proxies do not keep them.

This has consequences:

- A file replaced during a test reaches browsers that already loaded it only after up to an hour.
- A deleted file is still redirected to until the interval ends; the browser then gets S3's error instead of the
  Testcenter's.
- After changing the S3 keys, redirects the file server keeps were signed with the old keys and fail once those are
  revoked. Restarting the file server clears them.

## Backup

The backup set of `make testcenter-backup` holds only the database then; see
[What a backup set does not contain](installation-prod#what-a-backup-set-does-not-contain).
