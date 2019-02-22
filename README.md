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
* [collectd](https://collectd.org)
* graphs web (a fork of [adsb-receiver](https://github.com/jprochazka/adsb-receiver/) graphs web)
* other base tools and libraries, e.g python and tcl

# Build

To build the snap, you have to use *snapcraft*. Read the official [document](http://snapcraft.io/docs/build-snaps/) for the details. This command will produce a file named `adsb-box_<ver>_<arch>.snap`. `<ver>` means the version number and `<arch>` stands for the architecture of target machines.

```
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

```
$ cat << EOF | sudo tee /etc/modprobe.d/blacklist-rtl-sdr.conf
blacklist dvb_usb_rtl28xxu
blacklist e4000
blacklist rtl2832
EOF
$ sudo reboot
```

## enable experimental feature
It's necessary to enable the layouts feature of the core snap.
```
$ sudo snap set core experimental.layouts=true
```

## install adsb-box

Each snap has a revision (`<rev>`). A snap installed from the store always has a revision in number. But the revision of a local snap has a lead 'x'.

### Use the store

```
$ sudo snap install --beta adsb-box
```

### Use local snap

Upload the snap file to your target machine then install it.

```
$ sudo snap install --dangerous adsb-box_<ver>_<arch>.snap
```

## configure interfaces

These interfaces **MUST** be correctly configured, otherwise the services will not start successfully.

```
$ sudo snap connect adsb-box:raw-usb
$ sudo snap connect adsb-box:process-control
$ sudo snap connect adsb-box:system-observe
$ sudo snap connect adsb-box:network-observe
$ sudo snap restart adsb-box.dump1090
$ sudo snap restart adsb-box.piaware
$ sudo snap restart adsb-box.mount-observe
```

## optional configuration

### dump1090

The configuration of dump1090 is at `/var/snap/adsb-box/<rev>/dump1090-fa.conf`.
Change the items upon the requirements.

To feed your data to FlightAware, set `BEAST_OUTPUT_PORT=30005`

To enable show MLAT results, set `BEAST_INPUT_PORT=30104` and your location (*LAT*/*LON*)

### terrain-limit rings

Read `/snap/adsb-box/<rev>/usr/share/dump1090-fa/html/script.js`, and place the upintheair.json at `/var/snap/adsb-box/<rev>/`

### lighttpd

It's not allow to change the configuration of lighttpd currently.

### PiAware

See section **dump1090** to have a right configuration.

Use `adsb-box.piaware-config` to modify the configuration. Please refer [PiAware README](https://github.com/flightaware/piaware/blob/master/README.md) for the command usages.

```
$ sudo adsb-box.piaware-config -showall
$ sudo adsb-box.piaware-config flightaware-user <USERNAME> flightaware-password <PASSWORD>
$ sudo systemctl restart snap.adsb-box.piaware.service
```

### FR24Feed

Use `adsb-box.fr24feedcli` to sign-up or reconfigure the system.
People who don't setup the feeder before, please use
```
$ sudo adsb-box.fr24feedcli --signup
```
fr24feed will ask serval questions and here are the recommended answers for the questions.

Question | Answer | Note
-|-|-
email address | email_address | your email address on FR24
sharing key | sharying_key | If you ever share your day, find it on FR24 web
participate MLAT | yes_or_no (up to you) | If yes, need to specify your coordinates
automatically configure dump1090 | no |
receiver type | 4 | ModeS Beast
connection type | 1 | network connection
receiver address | localhost |
receiver port | 30005 |
enable RAW data feed | yes |
enable Basestation data feed | yes |
logfile mode | 0 | disable

If you want to modify the configurations later, please use:
```
$ sudo adsb-box.fr24feedcli --reconfigure
```

After finished the setup, restart the service
```
$ sudo snap restart adsb-box.fr24feed
```

### OpenSky Network

Before openskyd-feeder can run correctly, you need to set at least the GPS location of the receiver. Replace [LATITUDE], [LONGITUDE] and [ALTITUDE] with the real values
```
$ sudo snap set adsb-box receiver.latitude=[LATITUDE] receiver.longitude=[LONGITUDE] receiver.altitude=[ALTITUDE]
```

Username and serial of openskyd-feeder are optional. If you don't set them, you can change them later.
```
$ sudo snap set adsb-box opensky-network.username=[USERNAME] opensky-network.serial=[SERIAL]
```

## running status

### web interface

Use a web browser to open the built-in web pages. The url would be `http://your-device-ip:8080/`
There are two main pages: one is provided by dump1090 and another is for statistics graphs.

### service status

Use `adsb-box.piaware-status` to check the stuats of **dump1090**, **piaware**, **faup1090**, and **fa-mlat-client**. Due to the security limitations, the output result is not totally correct.

### fr24feed status

If fr24feed is configured correctly, you can find the web here `http://your-device-ip:8754/`.

# Backup, upgrade and restore

Configuration files and log files are store at `/var/snap/adsb-box/<rev>/`, To upgrade or backup your configurations, you can backup the whole directory, or just pick some of files.
```
# dump1090
$ sudo cp /var/snap/adsb-box/<rev>/dump1090-fa.conf $HOME
# piaware
$ sudo cp /var/snap/adsb-box/<rev>/piaware.conf $HOME
```

Snapd will refresh snaps automatically by default. If you want to do it manually, use this command:
```
$ sudo snap refresh adsb-box
```

To restore the settings, copy the file to the `/var/snap/adsb-box/<rev>/`
```
# restore configuration files
$ sudo cp $HOME/dump1090-fa.conf /var/snap/adsb-box/<rev>/
$ sudo cp $HOME/piaware.conf /var/snap/adsb-box/<rev>/
# restart services
$ sudo systemctl restart snap.adsb-box.dump1090.service && sleep 5
$ sudo systemctl restart snap.adsb-box.piaware.service
```

# Remove

To remove this snap

```
$ sudo snap remove adsb-box
```

# Bug reports and feedback

Please use the [github issues page](https://github.com/tsunghanliu/adsb-box.snap/issues) to report any problems and suggestions.

# Known issues

* piaware cannot get all system-information.
* piaware-status output is incorrect.

# Future plans

* Add a configuration item to contorl PiAware service.
* Support other feeders. E.g. planfinder.
* Support other architectures. (x86/armhf/arm64) (on-going)
* Include rtl-sdr tools.
