# Snap of ADS-B Box

This is a snap to establish a ADS-B receiver box.

# Components

* [dump1090 and faup1090](https://github.com/mutability/dump1090/)
* [lighttpd](https://www.lighttpd.net/)
* [tcllauncher](https://github.com/flightaware/tcllauncher/)
* [piaware](https://github.com/flightaware/piaware/)
* [mlat-client](https://github.com/mutability/mlat-client/)
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
```

## optional configuration

### dump1090

The configuration of dump1090 is at `/var/snap/adsb-box/<rev>/dump1090-mutability.conf`.
Change the items upon the requirements.

To feed your data to FlightAware, set `BEAST_OUTPUT_PORT=30005`

To enable show MLAT results, set `BEAST_INPUT_PORT=30104`

### terrain-limit rings

Read `/snap/adsb-box/<rev>/usr/share/dump1090-mutability/html/script.js`, and place the upintheair.json at `/var/snap/adsb-box/<rev>/`

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

## running status

### web interface

Use a web browser to open the web page provide by dump1090. The url would be `http://your-device-ip:8080/`

### service status

Use `piaware-status` to check the stuats of **dump1090**, **piaware**, **faup1090**, and **fa-mlat-client**. Due to the security limitations, the output result is not totally correct.

# Backup, upgrade and restore

Configuration files and log files are store at `/var/snap/adsb-box/<rev>/`, To upgrade or backup your configurations, you can backup the whole directory, or just pick some of files.
```
# dump1090
$ sudo cp /var/snap/adsb-box/<rev>/dump1090-mutability.conf $HOME
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
$ sudo cp $HOME/dump1090-mutability.conf /var/snap/adsb-box/<rev>/
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
* Support other feeders. But I don't have any ideas yet.
* Support other architectures. (x86/armhf/arm64) (on-going)
* Include rtl-sdr tools.
