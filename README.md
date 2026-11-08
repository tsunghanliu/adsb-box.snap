# ADS-B Box snap

`adsb-box` turns a small computer with an RTL-SDR dongle into an ADS-B receiver station. It decodes the signals of nearby aircraft, shows them on a map, draws performance graphs and shares the data with several flight tracking services.

It is a snap, made for [Ubuntu Core](https://ubuntu.com/core), and also works on other Linux systems with snapd.

## Contents

- [Components](#components)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Web interface](#web-interface)
- [Configuration](#configuration)
- [Feeders](#feeders)
- [UAT 978MHz](#uat-978mhz)
- [Maintenance](#maintenance)
- [Building the snap](#building-the-snap)
- [Known issues](#known-issues)
- [Bug reports and feedback](#bug-reports-and-feedback)

## Components

- [dump1090 and faup1090](https://github.com/flightaware/dump1090/) (FlightAware): 1090MHz decoder and the Skyview map
- [dump978](https://github.com/flightaware/dump978/) (FlightAware): 978MHz UAT decoder
- [PiAware](https://github.com/flightaware/piaware/), [tcllauncher](https://github.com/flightaware/tcllauncher/) and [mlat-client](https://github.com/mutability/mlat-client/): feeder of FlightAware
- [fr24feed](https://www.flightradar24.com/share-your-data): feeder of Flightradar24
- [opensky-feeder](https://opensky-network.org/feed): feeder of OpenSky Network
- [pfclient](https://planefinder.net/sharing/): feeder of Plane Finder
- [rbfeeder](https://www.radarbox.com/sharing-data): feeder of RadarBox
- ADS-B Exchange feeding with socat and mlat-client
- [lighttpd](https://www.lighttpd.net/): web server
- [collectd](https://collectd.org) and [graphs1090](https://github.com/wiedehopf/graphs1090): statistics and performance graphs (the graphs page is a fork of the [adsb-receiver](https://github.com/jprochazka/adsb-receiver/) graphs page)
- other tools and libraries, e.g. Python, Tcl and rtl-sdr

## Requirements

- A computer which runs Ubuntu Core or another Linux system with snapd: a Raspberry Pi or a PC. The snap is built for `amd64`, `armhf` and `arm64`.
- An RTL-SDR dongle and a 1090MHz antenna
- Optional: a second RTL-SDR dongle and a 978MHz antenna for UAT (used in the USA), see [UAT 978MHz](#uat-978mhz)

## Quick start

### 1. Install Ubuntu Core

Follow the [official guide](https://ubuntu.com/core/docs/get-started) to install Ubuntu Core on your hardware.

### 2. Blacklist the kernel drivers of the RTL-SDR dongle

The kernel drivers of the dongle must be blacklisted, otherwise the dongle cannot be used by the snap.

``` sh
$ cat << EOF | sudo tee /etc/modprobe.d/blacklist-rtl-sdr.conf
blacklist dvb_usb_rtl28xxu
blacklist e4000
blacklist rtl2832
EOF
$ sudo reboot
```

Note: older versions of this document asked to run `sudo snap set core experimental.layouts=true`. This is no longer needed: layouts are always enabled in snapd.

### 3. Install adsb-box

From the Snap Store:

``` sh
$ sudo snap install adsb-box
# or the latest development version
$ sudo snap install adsb-box --edge
```

Or a snap file you built yourself (see [Building the snap](#building-the-snap)):

``` sh
$ sudo snap install --dangerous adsb-box_<version>_<arch>.snap
```

### 4. Connect the interfaces

These interfaces **must** be connected, otherwise the services do not start.

``` sh
$ sudo snap connect adsb-box:raw-usb
$ sudo snap connect adsb-box:process-control
$ sudo snap connect adsb-box:system-observe
$ sudo snap connect adsb-box:network-observe
$ sudo snap connect adsb-box:hardware-observe
$ sudo snap connect adsb-box:mount-observe
$ sudo snap restart adsb-box
```

### 5. Set the location of the receiver

Several feeders and the range graphs need the location of the receiver. The altitude is in meters.

``` sh
$ sudo adsb-box.config set receiver.latitude=<LATITUDE> receiver.longitude=<LONGITUDE> receiver.altitude=<ALTITUDE>
# or
$ sudo snap set adsb-box receiver.latitude=<LATITUDE> receiver.longitude=<LONGITUDE> receiver.altitude=<ALTITUDE>
$ sudo snap restart adsb-box
```

`adsb-box.config` checks the values and restarts the affected services, see [adsb-box.config](#adsb-boxconfig).

### 6. Open the web interface

Open `http://<your-device-ip>:8080/` in a web browser. You should see the aircraft around you on the map.

Then set up the [feeders](#feeders) you want to use.

## Web interface

Open `http://<your-device-ip>:8080/`. The page has three tabs:

- **Skyview Map**: the map and list of aircraft, provided by dump1090 (FlightAware SkyAware). The same page is also at `http://<your-device-ip>:8080/dump1090/`.
- **Performance Graphs**: statistics of the receiver and the system, see [Performance graphs](#performance-graphs).
- **Settings**: view and change the settings, see [Web settings page](#web-settings-page).

With a 978MHz receiver, the UAT map (SkyAware978) is at `http://<your-device-ip>:8978/`.

On narrow screens (phones), the tabs show only their icons. The pages can be used with the keyboard and screen readers.

### Dark mode

The pages follow the light or dark setting of your system. To choose a theme, use the switch on the right of the tab bar: **Auto** (follow the system, the default), **Light** or **Dark**. Each browser remembers its own choice, and the graphs and settings pages use it too, also when they are opened on their own. The Skyview map and the UAT map (FlightAware pages) stay light.

### Performance graphs

To save CPU, the graphs are drawn on demand: only while the **Performance Graphs** page is open, for the report period being viewed. They are redrawn at the same intervals as the schedule (e.g. every 5 minutes for the hourly graphs, every 15 minutes for the daily graphs) and are no longer drawn 5 minutes after the page is closed. When the page is opened after a while, it shows the old graphs first; the new ones appear within about 10-20 seconds.

On a Raspberry Pi 4B, this lowered the overall CPU utilization (all 4 cores, see the CPU graph of the Performance Graphs page) from about 19% to about 9% while nobody views the graphs. Drawing all graphs on schedule takes about 7% of one core.

To draw the graphs of all report periods on schedule, even if nobody views them:

``` sh
$ sudo adsb-box.config set graphs.always-generate=1
# or
$ sudo snap set adsb-box graphs.always-generate=1
$ sudo snap restart adsb-box.graphs-gend

# back to on demand
$ sudo adsb-box.config set graphs.always-generate=0
```

Installations updated from an older version keep drawing on schedule (`graphs.always-generate` is set to `1` once, at the first update). New installations draw on demand.

In dark mode, the graphs are drawn in the dark colour scheme of graphs1090. Each colour scheme is drawn only when it is viewed, so a theme switch shows the other graphs within about 10-20 seconds the first time. With `graphs.always-generate=1`, only one colour scheme is drawn on schedule, the light one by default; the other one is still drawn on demand. To draw the dark graphs on schedule instead:

``` sh
$ sudo adsb-box.config set graphs.default-dark-theme=1
```

Without a 978MHz receiver (`receiver.dump978.index` and `receiver.dump978.serial` are not set), the UAT graphs are not drawn.

### Web settings page

The **Settings** tab (`http://<your-device-ip>:8080/settings.html`) shows all settings of adsb-box, grouped by topic, with a short name and a description of each.

- Without a password, the page is read-only. The OpenSky Network username and serial and the ADS-B Exchange feeder name are hidden until you log in.
- To change the settings on the page, set a password, then click **Log in** and use the user name `admin`.

``` sh
# set or change the password, it asks for the new password twice
$ sudo adsb-box.config passwd
# remove the password, the page becomes read-only again
$ sudo adsb-box.config passwd --disable
```

Only a SHA-512 hash of the password is stored. Changing the password takes effect immediately, without restarting any service.

The page uses the same checks as `adsb-box.config` and restarts the affected services after **Apply**.

Note: the page is served over plain HTTP, so the password is sent unencrypted. Use it only on a trusted network. Changing `lighttpd.port`, `lighttpd.enable-localhost-log` or `receiver.dump978.serial` restarts the web server: the settings are saved, reload the page (or open the new port) in a moment.

## Configuration

### adsb-box.config

The settings of adsb-box are snap settings, so they can be changed with `snap set`. `adsb-box.config` is a helper for the same settings: it checks the values before saving them and restarts the affected services automatically. With `snap set`, the values are not checked and you have to restart the services yourself.

``` sh
# list all settings and their current values
$ sudo adsb-box.config list
# also show the name and description of each setting
$ sudo adsb-box.config list --details
# show a setting
$ sudo adsb-box.config get receiver.latitude
# show several settings in a table
$ sudo adsb-box.config get receiver.latitude receiver.longitude receiver.altitude
# change settings; nothing is changed if any value is invalid
$ sudo adsb-box.config set receiver.latitude=<LATITUDE> receiver.longitude=<LONGITUDE>
# an empty value unsets the setting
$ sudo adsb-box.config set dump1090.location-accuracy=
# interactive mode: press Enter to keep the current value, input - to unset it
$ sudo adsb-box.config
```

Add `--json` before the command (e.g. `sudo adsb-box.config --json list`) to get machine-readable output.

The same changes with `snap set`:

``` sh
$ sudo snap set adsb-box receiver.latitude=<LATITUDE> receiver.longitude=<LONGITUDE>
$ sudo snap unset adsb-box dump1090.location-accuracy
# restart the affected services, or all of them
$ sudo snap restart adsb-box
```

`sudo adsb-box.config list --details` shows every setting with its description. The examples in this document show both ways.

Note: `collectd.rrd-writes-per-seoncd` and `lighttpd.enable-log` were renamed to `collectd.rrd-writes-per-second` and `lighttpd.enable-localhost-log`. Old values are migrated automatically.

### Logs

To reduce the writes to the storage (SD cards wear out), the logs of the services are disabled or kept in memory (tmpfs) by default. To turn a log on, set its `enable-log` setting to `1`; use `0` to turn it off again.

``` sh
$ sudo adsb-box.config set piaware.enable-log=1
# or
$ sudo snap set adsb-box piaware.enable-log=1
$ sudo snap restart adsb-box.piaware
```

The log settings are `adsbexchange.enable-log`, `collectd.enable-log`, `dump1090.enable-log`, `dump978.enable-log`, `fr24feed.enable-log`, `graphs-gend.enable-log`, `openskyd.enable-log`, `piaware.enable-log`, `plane-finder.enable-log`, `rbfeeder.enable-log` and `skyaware978.enable-log`. `lighttpd.enable-localhost-log` turns on the access log of requests from the device itself.

### Web server

The web interface uses port `8080`. To use another port:

``` sh
$ sudo adsb-box.config set lighttpd.port=8081
# or
$ sudo snap set adsb-box lighttpd.port=8081
$ sudo snap restart adsb-box.lighttpd
```

Other options of lighttpd cannot be changed.

### collectd

To reduce the writes to the rrd files, the cache of the rrdtool plugin of collectd is enabled. _The trade-off is that the graphs "drag behind" a bit and more memory is used._ Read the [collectd manual](https://collectd.org/documentation/manpages/collectd.conf.html#plugin-rrdtool) before changing these settings.

``` sh
# CacheTimeout, default 300 (seconds), 0 disables the cache
$ sudo adsb-box.config set collectd.rrd-cache-timeout=0
# CacheFlush, default 10 * CacheTimeout
$ sudo adsb-box.config set collectd.rrd-cache-flush=0
# RandomTimeout, default 0
$ sudo adsb-box.config set collectd.rrd-random-timeout=0
# WritesPerSecond, default 50
$ sudo adsb-box.config set collectd.rrd-writes-per-second=80

# or with snap set, then restart collectd
$ sudo snap set adsb-box collectd.rrd-cache-timeout=0
$ sudo snap restart adsb-box.collectd
```

Another way to reduce the writes is to keep the rrd files in tmpfs:

1. When collectd starts, the rrd files are copied from `/var/snap/adsb-box/common/collectd/rrd` to tmpfs.
2. They are copied back periodically, at the configured period.
3. They are copied back again when collectd stops.

The drawback: if the system does not shut down properly (e.g. a power outage), the records since the last copy are lost, at most one period.

``` sh
# period in seconds
$ sudo adsb-box.config set collectd.rrd-backup-period=1800
# or
$ sudo snap set adsb-box collectd.rrd-backup-period=1800
$ sudo snap restart adsb-box.collectd adsb-box.graphs-gend
```

### dump1090

The configuration file of dump1090 is `/var/snap/adsb-box/current/dump1090-fa.conf`. By default, the BEAST output port is `30005` and the BEAST input port is `30104`. Edit the file if needed and restart dump1090 (`sudo snap restart adsb-box.dump1090`).

To show range rings on the Skyview map and the range graphs, dump1090 needs to know the location of the receiver: set the [receiver location](#5-set-the-location-of-the-receiver) and the location accuracy to `approximate` or `exact`.

``` sh
$ sudo adsb-box.config set dump1090.location-accuracy=exact
# disable it
$ sudo adsb-box.config set dump1090.location-accuracy=

# or
$ sudo snap set adsb-box dump1090.location-accuracy=exact
$ sudo snap unset adsb-box dump1090.location-accuracy
$ sudo snap restart adsb-box.dump1090
```

The dongle of dump1090 can be selected by its index or serial number (`receiver.dump1090.index`, `receiver.dump1090.serial`), and a bias-tee can be enabled for an active antenna (`receiver.dump1090.enable-biast`, `receiver.dump1090.biast-gpio`). See `sudo adsb-box.config list --details`.

#### Wisdom file

dump1090-fa supports [wisdom files](https://github.com/flightaware/dump1090#generating-wisdom-files), which select the fastest implementation of its signal processing for the hardware. Built-in wisdom files are used by default. To generate a local one:

``` sh
$ sudo snap stop adsb-box
$ sudo adsb-box.generate-wisdom
$ sudo snap start adsb-box
```

> Ideally, to get stable results, you want to do this on an idle system with CPU frequency scaling disabled. Running the benchmarks will take some time (10s of minutes).

#### Terrain-limit rings

The Skyview map can show the range limited by the terrain around the receiver, from [heywhatsthat.com](https://www.heywhatsthat.com):

1. Create a panorama for the location of the receiver on heywhatsthat.com.
2. Note the "view" value from the URL of the panorama, i.e. the `XXXX` in `https://www.heywhatsthat.com/?view=XXXX`.
3. Download the rings for the altitudes you want (in meters). Ubuntu Core has no `wget` or `curl`, so do this on another computer and copy the file to the device:

``` sh
# on your PC
$ wget -O upintheair.json 'https://www.heywhatsthat.com/api/upintheair.json?id=XXXX&refraction=0.25&alts=3048,9144'
$ scp upintheair.json <your-device-ip>:

# on the device
$ sudo cp upintheair.json /var/snap/adsb-box/current/
```

## Feeders

Each feeder runs as its own service and starts when it is configured. Check the services with:

``` sh
$ snap services adsb-box
```

Most feeders need the [receiver location](#5-set-the-location-of-the-receiver) for MLAT (multilateration).

### FlightAware (PiAware)

**Set up:** PiAware starts automatically. Claim the receiver for your FlightAware account at <https://flightaware.com/adsb/piaware/claim>.

Use `adsb-box.piaware-config` to change the configuration of PiAware, see the [PiAware README](https://github.com/flightaware/piaware/blob/master/README.md) for the options.

``` sh
# show all configuration items
$ sudo adsb-box.piaware-config -showall
# change an item, e.g.
$ sudo adsb-box.piaware-config allow-mlat yes
# restart PiAware to apply the changes
$ sudo snap restart adsb-box.piaware
```

**Check:**

``` sh
$ sudo adsb-box.piaware-status
```

Due to the confinement of the snap, some parts of its output are incorrect, see [Known issues](#known-issues). Your feeder page on FlightAware shows whether the data arrives.

**Log:** `piaware.enable-log`, see [Logs](#logs).

### Flightradar24 (fr24feed)

**Set up:** sign up (first time) or reconfigure the feeder, then restart it.

``` sh
# first time
$ sudo adsb-box.fr24feedcli --signup
# change the configuration later
$ sudo adsb-box.fr24feedcli --reconfigure
# apply
$ sudo snap restart adsb-box.fr24feed
```

fr24feed asks several questions. Recommended answers:

| Question | Answer | Note |
|---|---|---|
| email address | your email address | the email address of your FR24 account |
| sharing key | your sharing key | if you have shared data before, find it on the FR24 website |
| participate in MLAT | yes or no | MLAT needs the location of the receiver |
| automatically configure dump1090 | no | |
| receiver type | 4 | ModeS Beast |
| connection type | 1 | network connection |
| receiver address | 127.0.0.1 | |
| receiver port | 30005 | |
| enable RAW data feed | yes | |
| enable Basestation data feed | yes | |
| logfile mode | 0 | disabled |

> **May be outdated:** on `amd64`, fr24feed used to have issues with MLAT and with the receiver address `localhost` (answer **no** to MLAT and use `127.0.0.1`), see this [forum post](https://forum.flightradar24.com/forum/radar-forums/flightradar24-feeding-data-to-flightradar24/12639-1-0-24-5-amd64-error) from 2019. Check the [official documentation](https://www.flightradar24.com/share-your-data) for the current state.

**Check:**

``` sh
$ sudo adsb-box.fr24feed-status
FR24 Feeder/Decoder Process is running
FR24 Stats Timestamp: 2019-05-31 00:00:00
FR24 Link: connected [UDP]
FR24 Radar: T-RXYZ99
FR24 Tracked AC: 1
Receiver: connected (813 MSGS/0 SYNC)
```

The status page of fr24feed is at `http://<your-device-ip>:8754/`.

**Files:** the configuration is `/var/snap/adsb-box/current/fr24feed/fr24feed.ini`.

**Log:** `fr24feed.enable-log`.

### OpenSky Network (openskyd)

**Set up:** set the receiver location and, optionally, your OpenSky username and the serial of the feeder.

``` sh
$ sudo adsb-box.config set opensky-network.username=<USERNAME> opensky-network.serial=<SERIAL>
# or
$ sudo snap set adsb-box opensky-network.username=<USERNAME> opensky-network.serial=<SERIAL>
$ sudo snap restart adsb-box.openskyd
```

Note: openskyd reads these settings and the receiver location only when `/var/snap/adsb-box/current/openskyd/conf.d/10-debconf.conf` does not exist, i.e. at its first start. Changing them later does not affect openskyd.

**Check:** `snap services adsb-box.openskyd` and your receiver on the [OpenSky Network website](https://opensky-network.org/).

**Log:** `openskyd.enable-log`.

### Plane Finder (pfclient)

**Set up:** Plane Finder is configured on its own web page, `http://<your-device-ip>:30053/`. Follow the instructions there and set:

- **Receiver data format**: `Beast`
- **Receiver type**: `Network`
- **IP address**: `localhost`
- **Port number**: `30005`

See the [Plane Finder documentation](https://planefinder.net/sharing/client) for details.

**Check:** the same web page shows the status of the client.

**Files:** the configuration is `/var/snap/adsb-box/current/pfclient/pfclient-config.json`.

**Log:** `plane-finder.enable-log`.

### ADS-B Exchange

> **May be outdated:** adsb-box sends the BEAST data to `feed.adsbexchange.com` with socat and runs mlat-client against `feed.adsbexchange.com:31090`. ADS-B Exchange has changed the way to feed over the years; check the [official documentation](https://www.adsbexchange.com/how-to-feed/) whether this method is still accepted.

**Set up:** if ADS-B Exchange gave you a custom port for BEAST/AVR/AVRMLAT, set it (the default is `30005`):

``` sh
$ sudo adsb-box.config set adsbexchange.receiverport=<PORT>
# or
$ sudo snap set adsb-box adsbexchange.receiverport=<PORT>
$ sudo snap restart adsb-box.adsbexchange-netcat
```

For MLAT, set the receiver location and a feeder name:

``` sh
$ sudo adsb-box.config set adsbexchange.username=<FEEDER-NAME>
# or
$ sudo snap set adsb-box adsbexchange.username=<FEEDER-NAME>
$ sudo snap restart adsb-box.adsbexchange-mlat
```

**Check:** `snap services adsb-box` shows `adsbexchange-netcat` and `adsbexchange-mlat`.

**Log:** `adsbexchange.enable-log`.

### RadarBox (rbfeeder)

RadarBox provides its feeder only for ARM (Raspberry Pi), so it runs on `armhf` and `arm64` devices only.

**Set up:** make sure the service is running, get the sharing key and claim your station at <https://www.radarbox.com/raspberry-pi/claim>.

``` sh
$ snap services adsb-box.rbfeeder
Service            Startup  Current  Notes
adsb-box.rbfeeder  enabled  active   -
$ sudo adsb-box.rbfeedercli --showkey
```

For MLAT, set the receiver location; the feeder name is read from the configuration of rbfeeder. See the [RadarBox documentation](https://www.radarbox.com/sharing-data) for more information.

**Check:** your station page on RadarBox.

**Log:** `rbfeeder.enable-log`.

## UAT 978MHz

In the USA, some aircraft use UAT on 978MHz instead of ADS-B on 1090MHz. adsb-box can receive both with two RTL-SDR dongles, one for each frequency. Without a 978MHz dongle, the UAT services stay stopped.

### 1. Give each dongle a serial number

The services find the dongles by their serial numbers, which are stored in the EEPROM of the dongles. If your dongles already have different serial numbers (not `00000001`), skip this step. It is easier to program the dongles one by one: plug in only one dongle at a time.

``` sh
# run the rtl-sdr tools inside the snap
$ sudo snap run --shell adsb-box.dump1090
(in-snap)$ cd $SNAP
# list the dongles
(in-snap)$ rtl_test -t
Found 1 device(s):
  0:  Realtek, RTL2838UHIDIR, SN: 00000001
  ...
# set the serial number to an 8 digit number, e.g. 10900001 or 09780001
# -d for the index, -s for the serial
(in-snap)$ rtl_eeprom -d 0 -s 10900001

# unplug this dongle, plug in the other one and repeat rtl_test and rtl_eeprom
# with a different serial number

(in-snap)$ exit
```

### 2. Enable dump978

Use your serial numbers from the previous step. In this example, the dongle `10900001` is for dump1090 (1090MHz) and `09780001` is for dump978 (978MHz).

``` sh
$ sudo adsb-box.config set receiver.dump1090.serial=10900001 receiver.dump978.serial=09780001
# or
$ sudo snap set adsb-box receiver.dump1090.serial=10900001 receiver.dump978.serial=09780001

# tell PiAware to feed UAT
$ sudo adsb-box.piaware-config uat-receiver-type sdr
```

Connect both dongles with their cables and antennas, then restart adsb-box:

``` sh
$ sudo snap restart adsb-box
```

### 3. Check

- `snap services adsb-box` shows `dump978` and `skyaware978` as active.
- The Skyview map shows `UAT` in the legend, and aircraft using UAT. The UAT map (SkyAware978) is at `http://<your-device-ip>:8978/`.
- The Performance Graphs page shows the Dump978 graphs.
- Your feeder pages on FlightAware, RadarBox and Flightradar24 show UAT data.
- For Flightradar24 (fr24feed must be configured first): run `sudo adsb-box.fr24uat-feed-status` or open `http://<your-device-ip>:8755/`.

## Maintenance

### Status

``` sh
# overview of all services
$ snap services adsb-box
# dump1090, PiAware, faup1090 and mlat-client
$ sudo adsb-box.piaware-status
# Flightradar24
$ sudo adsb-box.fr24feed-status
```

### rtl-sdr tools

`adsb-box.rtltest` runs `rtl_test`, e.g. to measure the PPM error of the dongle (`-p`). Use `-h` for the options. Stop adsb-box first, because dump1090 uses the dongle:

``` sh
$ sudo snap stop adsb-box
$ sudo adsb-box.rtltest -p
$ sudo snap start adsb-box
```

### Update

snapd updates snaps automatically. To update now:

``` sh
$ sudo snap refresh adsb-box
```

The configuration files and logs are copied to the new revision, so there is no need to back them up for an update. To go back to the previous revision:

``` sh
$ sudo snap revert adsb-box
```

### Backup and restore

The easiest way is a snapshot of the snap settings and data:

``` sh
# create a snapshot (stored in /var/lib/snapd/snapshots/)
$ sudo snap save adsb-box
# list the snapshots
$ snap saved
# restore a snapshot, <id> is the "Set" column of "snap saved"
$ sudo snap restore <id>
```

To back up selected files instead: the snap settings can be saved with `snap get -d adsb-box`, the configuration files are in `/var/snap/adsb-box/current/` and the statistics in `/var/snap/adsb-box/common/`.

``` sh
# snap settings
$ sudo snap get -d adsb-box > $HOME/adsb-box-settings.json
# configuration files
$ sudo cp /var/snap/adsb-box/current/dump1090-fa.conf $HOME/            # dump1090
$ sudo cp -a /var/snap/adsb-box/current/piaware $HOME/                  # PiAware
$ sudo cp /var/snap/adsb-box/current/fr24feed/fr24feed.ini $HOME/       # Flightradar24
$ sudo cp -a /var/snap/adsb-box/current/openskyd $HOME/                 # OpenSky Network
$ sudo cp /var/snap/adsb-box/current/pfclient/pfclient-config.json $HOME/   # Plane Finder
# statistics (rrd files of collectd)
$ sudo cp -a /var/snap/adsb-box/common/collectd $HOME/
```

To restore them, set the settings again (e.g. `sudo adsb-box.config set KEY=VALUE ...` with the values in `adsb-box-settings.json`), copy the files back to the same places and restart adsb-box (`sudo snap restart adsb-box`).

### Remove

``` sh
$ sudo snap remove adsb-box
```

snapd keeps a snapshot of the data for a while after the removal. Use `sudo snap remove --purge adsb-box` to remove everything.

## Building the snap

The snap is built with [snapcraft](https://snapcraft.io/docs/snapcraft-overview). The result is a file named `adsb-box_<version>_<arch>.snap`.

``` sh
# build locally (snapcraft uses LXD or Multipass for the build environment)
$ snapcraft pack
# or build on Launchpad, e.g. for a Raspberry Pi
$ snapcraft remote-build --build-for arm64
```

Supported architectures: `amd64`, `armhf` and `arm64`. `check-feeder-version.sh` checks whether newer versions of the bundled feeders are available.

## Known issues

- The confinement of the snap prevents PiAware from collecting all system information, and some parts of the output of `adsb-box.piaware-status` are incorrect.
- openskyd reads the OpenSky settings and the receiver location only at its first start, see [OpenSky Network](#opensky-network-openskyd).

## Bug reports and feedback

Please use the [GitHub issues page](https://github.com/tsunghanliu/adsb-box.snap/issues) to report problems and suggestions.
