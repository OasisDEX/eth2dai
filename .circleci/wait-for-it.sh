#!/usr/bin/env bash

echoerr() { echo "$@" 1>&2; }

# USAGE!
usage()
{
    cat << USAGE >&2
Usage:
    $cmdname host:port [host:port] [-t seconds] [-- command args]
    -t TIMEOUT                  Timeout in seconds, zero for no timeout
    -- COMMAND ARGS             Execute command with args after the test finishes
USAGE
    exit 1
}

connect() {
    (echo > /dev/tcp/$1/$2) >/dev/null 2>&1
    res=$?
    if [ $res -eq 1 ]; then
        echoerr "$(date) - waiting for $1 $2";
    else
        echoerr "Connection to $1 $2 succeeded [tcp]"
    fi
    return $res
}

timeout() {
    timeout=$1
    shift 1
    start=$(date +%s)
    taken=0
    while [ $taken -lt $timeout ]; do
        $@
        res=$?
        if [ $res -eq 0 ]; then break; fi
        let taken=$(date +%s)-start
        sleep 1.0;
    done
    if [ $res -eq 1 ]; then
        echoerr "Timeout while waiting for $@"
    fi
    return $res
}


# process arguments
HOSTS=()
while [ $# -gt 0 ]
do
    case "$1" in
        *:* )
        hostport=(${1//:/ })
        HOSTS+=(${hostport[0]},${hostport[1]})
        shift 1
        ;;
        -t)
        TIMEOUT=$2
        shift 2
        ;;
        --)
        shift
        CLI="$@"
        break
        ;;
        --help|-h)
        usage
        ;;
        *)
        echoerr "Unknown argument: $1"
        usage
        ;;
    esac
done

if [ ${#HOSTS[@]} -eq 0 ]; then
    usage
fi

TIMEOUT=${TIMEOUT:-15}

OLDIFS=$IFS
for h in ${HOSTS[@]}; do
    IFS=","
    set -- $h
    timeout $TIMEOUT connect $1 $2
    res=$?
    if [ $res -eq 1 ] ;then break; fi
done
IFS=$OLDIFS

if [ $res -ne 0 ]; then
    echo "Cannot exec \"$CLI\" due to failing connection"
    exit $res
else
    exec $CLI
fi