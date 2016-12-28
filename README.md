# Snap of ADS-B Box

This is a snap packages to establish a ADS-B reciver box.

# Components

* [dump1090](https://github.com/mutability/dump1090/)
* [lighttpd](https://www.lighttpd.net/)

# Build

To build the snap, you have to use snapcraft. Read the [document](http://snapcraft.io/docs/build-snaps/) for the details.

````
$ snapcraft snap
````

# Installation

## blacklist the drivers of RTLSDR devices

````
$ cat << EOF > /tmp/blacklist-rtl-sdr.conf
blacklist dvb_usb_rtl28xxu
blacklist e4000
blacklist rtl2832
EOF
$ sudo mv /tmp/blacklist-rtl-sdr.conf /etc/modprobe.d
````

## install the snap

Upload the snap file to your target machine then install it.

````
$ sudo snap install --dangerous adsb-box_0.1_amd64.snap
$ sudo systemctl stop snap.adsb-box.dump1090.service
$ sudo snap connect adsb-box:raw-usb
$ sudo snap connect adsb-box:process-control
$ sudo mkdir -p /run/user/0
$ sudo systemctl start snap.adsb-box.dump1090.service
````

## optional configuration

### dump1090

The configuration of dump1090 is at `/var/snap/adsb-box/x1/dump1090-mutability.conf`.
Change the items upon the requirements.

### terrain-limit rings

Read `/snap/adsb-box/x1/usr/share/dump1090-mutability/html/script.js`, and place the upintheair.json at `/var/snap/adsb-box/x1/`

### lighttpd

It's not allow to change the configuration of lighttpd at this moment.

# Remove

To remove this snap

````
$ sudo snap remove adsb-box
````

# Bug reports and feedback

Please use the [github issues page](https://github.com/tsunghanliu/adsb-box.snap/issues) to report any problems and suggestions.

# Future plans

* Support feeders, e.g. PiAware. But I don't have any ideas yet.
* Support other architectures. (x86/armhf/arm64)

