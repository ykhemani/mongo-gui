#!/bin/bash

# logging functions
_log() {
	local type="$1"; shift
	# accept argument string or stdin
	local text="$*"; if [ "$#" -eq 0 ]; then text="$(cat)"; fi
	local dt; dt="$(date --rfc-3339=seconds)"
	printf '%s [%s] [Entrypoint]: %s\n' "$dt" "$type" "$text"
}
_info() {
	_log INFO "$@"
}
_warn() {
	_log WARN "$@" >&2
}
_error() {
	_log ERROR "$@" >&2
	exit 1
}

# usage: file_env VAR [DEFAULT]
#    ie: file_env 'SECRET' 'example'
# (will allow for "$SECRET_FILE" to fill in the value of
#  "$SECRET" from a file, especially for Docker's secrets feature)
file_env() {
	local var="$1"
	local fileVar="${var}_FILE"
	local def="${2:-}"
	if [ "${!var:-}" ] && [ "${!fileVar:-}" ]; then
		mysql_error "Both $var and $fileVar are set (but are exclusive)"
	fi
	local val="$def"
	if [ "${!var:-}" ]; then
		val="${!var}"
	elif [ "${!fileVar:-}" ]; then
		val="$(< "${!fileVar}")"
	fi
	export "$var"="$val"
  _info "$var=$val"
	unset "$fileVar"
}

docker_setup_env() {
	# Initialize values that might be stored in a file
	file_env 'PORT' '3001'
	file_env 'PRIVKEY'
	file_env 'CERT'
	file_env 'CA_CERT'
	file_env 'URL'
}

_main() {
  # Load various environment variables
  docker_setup_env "$@"
  node server.js
}

_main "$@"
