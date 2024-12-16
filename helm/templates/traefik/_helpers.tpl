{{/*
Common Traefik annotations
*/}}
{{- define "traefik.annotations" -}}
"helm.sh/hook-weight": "10"
{{- end }}