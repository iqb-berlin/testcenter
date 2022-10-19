---
layout: default
---

## Trouble Shooting

### Timeouts when building fresh images

Build them separately or increase docker-compose timeout:

`export COMPOSE_HTTP_TIMEOUT=300`.

### Error when using Make commands

Should any produce an error, you may have to build the command manually. Refer the the Makefile-target you used and replace `up` with `stop`.

For example if you ran `make run-prod-nontls-detached`, you can stop with:

```

docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml stop

```