# Snap of ADS-B Box

This is a snap to establish a ADS-B receiver box.

# Components

* [dump1090 and faup1090](https://github.com/flightaware/dump1090/)
* [lighttpd](https://www.lighttpd.net/)
* [tcllauncher](https://github.com/flightaware/tcllauncher/)
* [piaware](https://github.com/flightaware/piaware/)
* [mlat-client](https://github.com/mutability/mlat-client/)
* [fr24feed](https://www.flightradar24.com/share-your-data)
* [opensky-network](https://opensky-network.org/contribute/improve-coverage)
* [plane finder](https://planefinder.net/sharing/)
* [RadarBox](https://www.radarbox24.com/)
* [collectd](https://collectd.org)
* graphs web (a fork of [adsb-receiver](https://github.com/jprochazka/adsb-receiver/) graphs web)
* other base tools and libraries, e.g python and tcl

# Build

To build the snap, you have to use *snapcraft*. Read the official [document](http://snapcraft.io/docs/build-snaps/) for the details. This command will produce a file named `adsb-box_<ver>_<arch>.snap`. `<ver>` means the version number and `<arch>` stands for the architecture of target machines.

``` sh
$ snapcraft snap
```

# Hardware requirement

* PC, Raspberry Pi or any platform can install Ubuntu Core
* RTLSDR dongle
* 1090MHz antenna

# Installation

## install Ubuntu Core

Please read the official [document](https://developer.ubuntu.com/core/get-started) and install Ubuntu Core onto your hardware.

## blacklist the drivers of RTLSDR devices

The drivers have to be blacklisted, or the librtlsdr won't access the dongle.

``` sh
$ cat << EOF | sudo tee /etc/modprobe.d/blacklist-rtl-sdr.conf
blacklist dvb_usb_rtl28xxu
blacklist e4000
blacklist rtl2832
EOF
$ sudo reboot
```

## enable experimental feature
It's necessary to enable the layouts feature of the core snap.
``` sh
$ sudo snap set core experimental.layouts=true
```

## install adsb-box

Each snap has a revision (`<rev>`). A snap installed from the store always has a revision in number. But the revision of a local snap has a lead 'x'.

### Use the store

``` sh
$ sudo snap install adsb-box
```

If you want to try the latest/development version, you can add `--edge` to the above command.

### Use local snap

Upload the snap file to your target machine then install it.

``` sh
$ sudo snap install --dangerous adsb-box_<ver>_<arch>.snap
```

## configure interfaces

These interfaces **MUST** be correctly configured, otherwise the services will not start successfully.

``` sh
$ sudo snap connect adsb-box:raw-usb
$ sudo snap connect adsb-box:process-control
$ sudo snap connect adsb-box:system-observe
$ sudo snap connect adsb-box:network-observe
$ sudo snap connect adsb-box:hardware-observe
$ sudo snap connect adsb-box:mount-observe
$ sudo snap restart adsb-box
```

## optional configuration

### snap settings

There are some global settings which shared by several feeders. For now, it's the location of the receiver. Replace [LATITUDE], [LONGITUDE] and [ALTITUDE] with the real values.

Note: unit of altitude is meter.
``` sh
$ sudo snap set adsb-box receiver.latitude=[LATITUDE] receiver.longitude=[LONGITUDE] receiver.altitude=[ALTITUDE]
```

### logging

On Ubuntu Core 16, the rsyslog service is default enabled. If you are using SD card or USB disk as the primary storage, to avoid the wearing, it would be better to disable rsyslog. For Ubuntu Core 18, this operation is not necessary, since the rsyslog service is disabled by default.

``` sh
$ snap set system service.rsyslog.disable=true

# to enable it again
$ snap set system service.rsyslog.disable=false
```

For the same reason, by default, the log files of the feeders are disabled or placed in tmpfs to reduce the writing of storage. Use the following commands to turn them on.

``` sh
# lighttpd access log: local traffic
$ snap set adsb-box lighttpd.enable-localhost-log=1
# plane-finder
$ snap set adsb-box plane-finder.enable-log=1
# piaware
$ snap set adsb-box piaware.enable-log=1
# fr24feed
$ snap set adsb-box fr24feed.enable-log=1
```
Use 0 instead of 1 to disable logging again.

### lighttpd

It's not allow to change the configuration of lighttpd currently.

### collectd
To reduce the number/overhead of rrd file updating, the cache mechanism of rrdtool plugin is enabled. _The trade off is that the graphs kind of "drag behind" and that more memory is used._ The [manual of collectd](https://collectd.org/documentation/manpages/collectd.conf.5.shtml#plugin_rrdtool) provides more explanations. To disable or adjust the settings, please refer to the following commands:
``` sh
## Read the manual before tuning the settings!
# CacheTimeout, defulat - 300, 0 to disable cache
$ snap set adsb-box collectd.rrd-cache-timeout=0
# CacheFlush, default - 10*CacheTimeout
$ snap set adsb-box collectd.rrd-cache-flush=0
# RandomTimeout, default - 0
$ snap set adsb-box collectd.rrd-random-timeout=0
# WritesPerSecond, default - 50
$ snap set adsb-box collectd.rrd-writes-per-second=80
```

Another method to reduce the number of Disk I/O is moving the rrd files to tmpfs. This implementation will:
1. when collectd starts, copy rrd files from `$SNAP_COMMON/collectd/rrd` to `/tmp/rrd` which is located on tmpfs.
2. periodically sync the rrd files back to `$SNAP_COMMON/collectd/rrd` according to the config value.
3. when collectd shuts down, sync the rrd files again.
The method has a drawback. If the system does not shut down properly (e.g. power outage), the records will be lost. Maximum duration is equal to the period configured.
To enable this feature:
``` sh
# unit of period is second
$ snap set adsb-box collectd.rrd-backup-period=1800
# restart related services
$ snap restart adsb-box.collectd
$ snap restart adsb-box.graphs-gend
```

### dump1090

The configuration of dump1090 is at `/var/snap/adsb-box/<rev>/dump1090-fa.conf`.
By default, the port of BEAST-format output is `30005` and the port of BEAST-format input is `30104`.
Change the items upon the requirements.

If you want to have range circles on the dump1090 webpage and graphs of the maximum range, change the accuracy of location to `approximate` or `exact`.

``` sh
# enable locationing in dump1090
$ snap set adsb-box dump1090.location-accuracy=<approximate|exact>
# disable it
$ snap set adsb-box dump1090.location-accuracy=

# restart dump1090 to apply
$ snap restart adsb-box.dump1090
```

### terrain-limit rings

Read the following code block or `/snap/adsb-box/<rev>/usr/share/dump1090-fa/html/script.js`. Get your upintheair.json and place it at `/var/snap/adsb-box/<rev>/`.

``` javascript
        // Add terrain-limit rings. To enable this:
        //
        //  create a panorama for your receiver location on heywhatsthat.com
        //
        //  note the "view" value from the URL at the top of the panorama
        //    i.e. the XXXX in http://www.heywhatsthat.com/?view=XXXX
        //
        // fetch a json file from the API for the altitudes you want to see:
        //
        //  wget -O /usr/share/dump1090-mutability/html/upintheair.json \
        //    'http://www.heywhatsthat.com/api/upintheair.json?id=XXXX&refraction=0.25&alts=3048,9144'
        //
        // NB: altitudes are in _meters_, you can specify a list of altitudes
```

If you are using Ubuntu Core, there is no wget command available. Please do this on another machine. For instnace:

``` sh
# create a panorama on heywhatsthat.com and get the view value on the webpage.

# on your Linux PC:
$ wget -O upintheair.json 'http://www.heywhatsthat.com/api/upintheair.json?id=XXXX&refraction=0.25&alts=3048,9144'
$ scp upintheair.json YOUR-UBUNTU-CORE-IP-ADDRESS:

# on your ubuntu core system:
$ sudo cp upintheair.json /var/snap/adsb-box/current/
```

### PiAware

If piaware is working, you can associate the feeder with your account by opening the [URL](https://flightaware.com/adsb/piaware/claim) to claim your new feeder on the FlightAware.

Use `adsb-box.piaware-config` to modify the configuration. Please refer [PiAware README](https://github.com/flightaware/piaware/blob/master/README.md) for the command usages.

``` sh
# display all configuration items
$ sudo adsb-box.piaware-config -showall
## update the configurations accordingly
# restart the piaware to apply the new configuration
$ sudo snap restart adsb-box.piaware
```

The log of PiAware is disabled by default. Please use `snap set adsb-box piaware.enable-log=1` to enable it and use 0 instead of 1 to disable.

### FR24Feed

Use `adsb-box.fr24feedcli` to sign-up or reconfigure the system.
People who don't setup the feeder before, please use
``` sh
$ sudo adsb-box.fr24feedcli --signup
```
fr24feed will ask serval questions and here are the recommended answers for the questions.

Question | Answer | Note
-|-|-
email address | email_address | your email address on FR24
sharing key | sharying_key | If you ever share your day, find it on FR24 web
participate MLAT | yes_or_no (up to you) | On amd64/i386, MLAT is not supported, please answer **no**. If yes, need to specify your coordinates
automatically configure dump1090 | no |
receiver type | 4 | ModeS Beast
connection type | 1 | network connection
receiver address | 127.0.0.1 | On amd64/i386, please don't use _localhost_
receiver port | 30005 |
enable RAW data feed | yes |
enable Basestation data feed | yes |
logfile mode | 0 | disable

There are some known issues on amd64/i386 platform, see the [post](https://forum.flightradar24.com/forum/radar-forums/flightradar24-feeding-data-to-flightradar24/12639-1-0-24-5-amd64-error) for detail.

If you want to modify the configurations later, please use:
``` sh
$ sudo adsb-box.fr24feedcli --reconfigure
```

After finished the setup, restart the service
``` sh
$ sudo snap restart adsb-box.fr24feed
```

### OpenSky Network

Username and serial of openskyd-feeder are optional. If you don't set them, you can change them later.
``` sh
$ sudo snap set adsb-box opensky-network.username=[USERNAME] opensky-network.serial=[SERIAL]
```

Restart openskyd-feeder to apply the configurations
``` sh
$ sudo snap restart adsb-box.openskyd
```

### Plane Finder

Due to the limitation of the configuration mechanism, users have to configure the Plane Finder client through its web interface.
* After installation, open this URL: `http://your-device-ip:30053/` and follow the instructions to fill in fields.
* Remember to set **Receiver data format** to `Beast`, receiver type to `Network`, **IP address** to `localhost` and **Port number** to `30005`.
* For more details, please refer to the [document](https://planefinder.net/sharing/client).
The logs are by default disabled. Use `sudo snap set adsb-box plane-finder.enable-log=1` to enable and change 1 to 0 to disable it.

### ADSB Exchange

For BEAST/AVR/AVRMLAT, you have a costomized port, use the commands to set.

``` sh
$ snap set adsb-box adsbexchange.receiverport=[PORTNUM]
$ snap restart adsb-box.adsbexchange-netcat
```

For MLAT, you need to set the location (see the **snap settings** section) and feeder name.

``` sh
$ snap set adsb-box adsbexchange.username=[FEEDER]
$ snap restart adsb-box.adsbexchange-mlat
```

### RadarBox

RadarBox only provides the feeder for Raspberry Pi platform (armhf) officially. So, it's not available on x86/amd64 platforms.
Before setup, make sure the service is running correctly, then claim your station at the [webpage](https://www.radarbox.com/raspberry-pi/claim)
``` sh
$ snap services adsb-box.rbfeeder
Service            Startup  Current  Notes
adsb-box.rbfeeder  enabled  active   -
$ adsb-box.rbfeedercli --showkey
```
Copy your `sharing key` to the field and claim it.

To enable MLAT client, you need to set the location (see the **snap settings** section). The program will get the feeder name from the configuration file of rbfeeder.

Read the [document](https://www.radarbox24.com/sharing-data) for more information.

## Running Status

### web interface

Use a web browser to open the built-in web pages. The url would be `http://your-device-ip:8080/`
There are two main pages: one is provided by dump1090 and another is for statistics graphs.

### service status

Use `adsb-box.piaware-status` to check the stuats of **dump1090**, **piaware**, **faup1090**, and **fa-mlat-client**. Due to the security limitations, the output result is not totally correct.
Use `snap services adsb-box` to check the overview of adsb-box services.

### fr24feed status

If fr24feed is configured correctly, you can find the web here `http://your-device-ip:8754/`. Another CLI tool `fr24feed-status` can show a summary. Here is an example output.

``` sh
$ adsb-box.fr24feedcli
FR24 Feeder/Decoder Process is running
FR24 Stats Timestamp: 2019-05-31 00:00:00
FR24 Link: connected [UDP]
FR24 Radar: T-RXYZ99
FR24 Tracked AC: 1
Receiver: connected (813 MSGS/0 SYNC)
```

### pfclient status

Check the pfclient built-in web at `http://your-device-ip:30053/`.

## rtl-sdr tools
Use ` $ sudo adsb-box.rtltest` to run the rtl_test utility.
You can use it to do PPM error measurement (`-p`) or other tests. Use `-h` to show the help messages.

# Upgrade, backup and restore

## Upgrade this snap
Snapd will refresh snaps automatically by default. If you want to do it manually, use this command:
``` sh
$ sudo snap refresh adsb-box
```
When upgrading, snapd will clone the files, including configuration files and logs, for the new revision. It's not necessary to perform *backup* or *restore* operations for upgrading.
 
## Backup configuration files
Configuration files and log files are store at `/var/snap/adsb-box/<rev>/`, To backup your configurations, you can archive the whole directory, or just pick some of files.
``` sh
# snap settings
$ snap get -d adsb-box $HOME/snap-set.json
# dump1090
$ sudo cp /var/snap/adsb-box/<rev>/dump1090-fa.conf $HOME
# piaware
$ sudo cp -a /var/snap/adsb-box/<rev>/piaware $HOME
# fr24feed
$ sudo cp /var/snap/adsb-box/<rev>/fr24feed.ini $HOME
# opensky feeder
$ sudo cp -a /var/snap/adsb-box/<rev>/openskyd $HOME
# plane finder
$ sudo cp -a /var/snap/adsb-box/<rev>/pfclient/pfclient-config.json $HOME
# collectd
$ sudo cp -a /var/snap/adsb-box/common/collectd $HOME
```

Alternatively, create a snapshot of the snap data and configuration with:
``` sh
$ sudo snap save adsb-box
```
This creates a new snapshot (zip archive) under `/var/lib/snapd/snapshots/` directory. It can be restored at any time with `snap restore <id>` command. Existing snapshots can be listed with `snap saved`.

## Restore configuration files
To restore the settings, copy the file to the `/var/snap/adsb-box/<rev>/`
``` sh
# snap settings. sorry, there's no easy way to restore them.
$ cat $HOME/snap-set.json
### use "$ snap set adsb-box KEY=value" to restore your settings then
# restore configuration files
$ sudo cp $HOME/dump1090-fa.conf /var/snap/adsb-box/<rev>/
$ sudo cp -a $HOME/piaware /var/snap/adsb-box/<rev>/
$ sudo cp $HOME/fr24feed.ini /var/snap/adsb-box/<rev>/
$ sudo cp -a $HOME/openskyd /var/snap/adsb-box/<rev>/
$ sudo mkdir /var/snap/adsb-box/<rev>/pfclient
$ sudo cp $HOME/pfclient-config.json /var/snap/adsb-box/<rev>/pfclient/
$ sudo cp -a $HOME/collectd /var/snap/adsb-box/common/

# restart services
$ sudo snap restart adsb-box
```

# Remove

To remove this snap

``` sh
$ sudo snap remove adsb-box
```

# Bug reports and feedback

Please use the [github issues page](https://github.com/tsunghanliu/adsb-box.snap/issues) to report any problems and suggestions.

# Known issues

* piaware cannot get all system-information.
* piaware-status output is incorrect.

# Future plans

* Add a configuration item to contorl PiAware service.
* Support other feeders. Is there any other public projects?!
    * [RadarBox24](https://www.radarbox24.com/) (in-progress)
* Support other architectures. (x86/armhf/arm64)
    adsb-box is available for x86/armhf/arm64 as well, but it hasn't been fully verified.
