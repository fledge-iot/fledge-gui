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

kill_nginx_ps () {
  PSLIST=$(ps aux | grep '[n]ginx' | awk '{print $2}')
  if [ ! -z "${PSLIST}" ]; then
    kill ${PSLIST}
  fi
}

kill_nginx_ps
systemctl stop nginx


%post
#!/usr/bin/env bash
set -e

start_nginx () {
  systemctl start nginx
  systemctl status nginx | grep "Active:"
}

cp /usr/share/nginx/html/foglamp.html /usr/share/nginx/html/index.html
start_nginx

%postun
#!/usr/bin/env bash

PSLIST=$(ps aux | grep '[n]ginx' | awk '{print $2}')
if [ ! -z "${PSLIST}" ]; then
  kill ${PSLIST}
fi

%define _datadir /usr/share/nginx/html
%files
%{_datadir}/*
