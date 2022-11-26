#!/bin/sh

set -e

# flightware dump1090
R_VERSION=$(git ls-remote https://github.com/flightaware/dump1090.git | grep tags | tail -1 | sed 's/.*\///')
L_VERSION=$(python3 -c 'import sys, yaml, json; data = yaml.full_load(sys.stdin); print(data["parts"]["dump1090"]["source-branch"]);' < snap/snapcraft.yaml)
if [ "$L_VERSION" != "$R_VERSION" ]; then
	echo "Upgrade dump1090, dump978 and piaware to $R_VERSION"
fi
R_VERSION=$(python3 -c 'import sys, yaml, json; data = yaml.full_load(sys.stdin); print(data["parts"]["dump1090"]["source-branch"]);' < snap/snapcraft.yaml)
L_VERSION=$(python3 -c 'import sys, yaml, json; data = yaml.full_load(sys.stdin); print(data["parts"]["piaware"]["source-branch"]);' < snap/snapcraft.yaml)
if [ "$L_VERSION" != "$R_VERSION" ]; then
	echo "dump1090($R_VERSION) and piaware($L_VERSION) have different versions"
fi

# fr24feed (amd64)
wget -q -O fr24feed_versions.json https://repo-feed.flightradar24.com/fr24feed_versions.json
R_VERSION=$(python3 -c 'import sys, json; data = json.load(sys.stdin); print(data["platform"]["linux_x86_64_tgz"]["url"]["software"]);' < fr24feed_versions.json)
L_VERSION=$(grep "fr24feed_.*_amd64.tgz" snap/snapcraft.yaml | sed 's/.*on amd64: //')
if [ "$L_VERSION" != "$R_VERSION" ]; then
	echo "Upgrade fr24feed(amd64) to $R_VERSION"
fi

# fr24feed (i386)
R_VERSION=$(python3 -c 'import sys, json; data = json.load(sys.stdin); print(data["platform"]["linux_x86_tgz"]["url"]["software"]);' < fr24feed_versions.json)
L_VERSION=$(grep "fr24feed_.*_i386.tgz" snap/snapcraft.yaml | sed 's/.*on i386: //')
if [ "$L_VERSION" != "$R_VERSION" ]; then
	echo "Upgrade fr24feed(i386) to $R_VERSION"
fi

# fr24feed (armhf)
R_VERSION=$(python3 -c 'import sys, json; data = json.load(sys.stdin); print(data["platform"]["linux_arm_tgz"]["url"]["software"]);' < fr24feed_versions.json)
L_VERSION=$(grep "fr24feed_.*_armhf.tgz" snap/snapcraft.yaml | grep "on armhf" | sed 's/.*on armhf: //')
if [ "$L_VERSION" != "$R_VERSION" ]; then
	echo "Upgrade fr24feed(armhf) to $R_VERSION"
fi

# opensky network (amd64)
#echo "Check https://opensky-network.org/community/projects/30-dump1090-feeder"
R_VERSION=$(curl -s https://opensky-network.org/repos/debian/dists/opensky/custom/binary-amd64/Packages | grep-dctrl --show-field Filename -Pw opensky-feeder | cut -c 11-)
L_VERSION=$(grep "opensky-feeder_.*_amd64.deb" snap/snapcraft.yaml | grep "on amd64" | sed 's/.*on amd64: https:\/\/opensky-network.org\/repos\/debian\///')
if [ "$L_VERSION" != "$R_VERSION" ]; then
	echo "Upgrade opensky-feeder(amd64) to $R_VERSION"
fi

# opensky network (i386)
R_VERSION=$(curl -s https://opensky-network.org/repos/debian/dists/opensky/custom/binary-i386/Packages | grep-dctrl --show-field Filename -Pw opensky-feeder | cut -c 11-)
L_VERSION=$(grep "opensky-feeder_.*_i386.deb" snap/snapcraft.yaml | grep "on i386" | sed 's/.*on i386: https:\/\/opensky-network.org\/repos\/debian\///')
if [ "$L_VERSION" != "$R_VERSION" ]; then
	echo "Upgrade opensky-feeder(i386) to $R_VERSION"
fi

# opensky network (armhf)
R_VERSION=$(curl -s https://opensky-network.org/repos/debian/dists/opensky/custom/binary-armhf/Packages | grep-dctrl --show-field Filename -Pw opensky-feeder | cut -c 11-)
L_VERSION=$(grep "opensky-feeder_.*_armhf.deb" snap/snapcraft.yaml | grep "on armhf" | sed 's/.*on armhf: https:\/\/opensky-network.org\/repos\/debian\///')
if [ "$L_VERSION" != "$R_VERSION" ]; then
	echo "Upgrade opensky-feeder(armhf) to $R_VERSION"
fi

# opensky network (arm64)
R_VERSION=$(curl -s https://opensky-network.org/repos/debian/dists/opensky/custom/binary-arm64/Packages | grep-dctrl --show-field Filename -Pw opensky-feeder | cut -c 11-)
L_VERSION=$(grep "opensky-feeder_.*_arm64.deb" snap/snapcraft.yaml | grep "on arm64" | sed 's/.*on arm64: https:\/\/opensky-network.org\/repos\/debian\///')
if [ "$L_VERSION" != "$R_VERSION" ]; then
	echo "Upgrade opensky-feeder(arm64) to $R_VERSION"
fi

# planefinder
echo "Check https://planefinder.net/sharing/client, current version is $(grep "pfclient_.*_armhf.deb" snap/snapcraft.yaml | grep "on armhf:" | sed 's/.*\.net\///')"

# radarbox feeder
#R_VERSION=$(wget -qO - http://apt.rb24.com/dists/rpi-stable/main/binary-armhf/Packages | grep -A 10 "Package: rbfeeder" | grep "Filename: " | cut -c 11-)
R_VERSION=$(curl -s http://apt.rb24.com/dists/buster/main/binary-armhf/Packages | grep-dctrl --show-field Filename -Pw rbfeeder | cut -c 11-)
L_VERSION=$(grep "rbfeeder_.*_armhf.deb" snap/snapcraft.yaml | sed 's/.*\.com\///')
if [ "$L_VERSION" != "$R_VERSION" ]; then
	echo "Upgrade rbfeeder to $R_VERSION"
fi

# graphs1090
curl -s -H "Accept: application/vnd.github.v3+json" https://api.github.com/repos/wiedehopf/graphs1090/commits/master > graphs1090_master.json
R_VERSION=$(python3 -c 'import sys, json; data = json.load(sys.stdin); print(data["sha"]);' < graphs1090_master.json)
L_VERSION=$(python3 -c 'import sys, yaml, json; data = yaml.full_load(sys.stdin); print(data["parts"]["graphs1090"]["source-commit"]);' < snap/snapcraft.yaml)
if [ "$L_VERSION" != "$R_VERSION" ]; then
	echo "Upgrade graphs1090 to $R_VERSION"
fi
