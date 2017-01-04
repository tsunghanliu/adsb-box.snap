ARCH=$(shell uname -m)
$(info ARCH $(ARCH))

ARCHDIR=

ifeq ($(ARCH),x86_64)
	ARCHDIR="x86_64-linux-gnu"
endif
ifeq ($(ARCH),i386)
	ARCHDIR="i386-linux-gnu"
endif
ifeq ($(ARCH),armhf)
	ARCHDIR="arm-linux-gnueabihf"
endif
ifeq ($(ARCH),arm64)
	ARCHDIR="aarch64-linux-gnu"
endif

$(info ARCHDIR $(ARCHDIR))

ifeq ($(ARCHDIR),)
	$(error no ARCHDIR defined)
endif

all:
	@echo "copy files needed ..."
	@cp ../../piaware/install/usr/lib/tcltk/$(ARCHDIR)/itcl3.4/pkgIndex.tcl itcl3.4-pkgIndex.tcl
	@cp ../../piaware/install/usr/lib/tclx8.4/pkgIndex.tcl tclx8.4-pkgIndex.tcl
	@cp ../../piaware/install/usr/share/tcltk/tls1.6.7/pkgIndex.tcl tls1.6.7-pkgIndex.tcl
	@echo "apply patches ..."
	@sed -i 's/\/usr/\$$\:\:env\(SNAP\)\/usr/g' *-pkgIndex.tcl

install:
	@mkdir -p $(DESTDIR)/usr/lib/tcltk/$(ARCHDIR)/itcl3.4/
	@cp itcl3.4-pkgIndex.tcl $(DESTDIR)/usr/lib/tcltk/$(ARCHDIR)/itcl3.4/pkgIndex.tcl
	@mkdir -p $(DESTDIR)/usr/lib/tclx8.4
	@cp tclx8.4-pkgIndex.tcl $(DESTDIR)/usr/lib/tclx8.4/pkgIndex.tcl
	@mkdir -p $(DESTDIR)/usr/share/tcltk/tls1.6.7/
	@cp tls1.6.7-pkgIndex.tcl $(DESTDIR)/usr/share/tcltk/tls1.6.7/pkgIndex.tcl

clean:
	@echo "remove files"
	@rm -rf *-pkgIndex.tcl
