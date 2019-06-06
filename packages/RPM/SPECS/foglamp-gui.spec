Name:          foglamp-gui
Vendor:        Dianomic Systems Inc. <info@dianomic.com>
Version:       __VERSION__
Release:       1
BuildArch:     __ARCH__
Summary:       FogLAMP GUI
License:       Apache License
Group:         IoT
URL:           http://www.dianomic.com
Requires:      nginx

%description
FogLAMP GUI


%pre
#!/usr/bin/env bash
echo "Installing FogLAMP GUI"

stop_nginx () {
    sudo systemctl stop nginx 2> /dev/null  # upgrade safe

    if [ -f /run/nginx.pid ]; then 
      sudo /usr/sbin/nginx -s stop
    fi
    
    PSLIST=$(ps aux | grep '[n]ginx' | awk '{print $2}')
    if [ ! -z "${PSLIST}" ]; then
      sudo kill ${PSLIST}
    fi
}

stop_nginx


%post
#!/usr/bin/env bash
set -e

start_nginx () {
    sudo /usr/sbin/nginx -c /usr/share/nginx/html/nginx.conf
}

start_nginx

%postun
#!/usr/bin/env bash

PSLIST=$(ps aux | grep '[n]ginx' | awk '{print $2}')
if [ ! -z "${PSLIST}" ]; then
  sudo kill ${PSLIST}
fi

%define _datadir /usr/share/nginx/html
%files
%{_datadir}/*
