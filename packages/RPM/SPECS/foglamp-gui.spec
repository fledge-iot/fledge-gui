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
stop_nginx_service () {
    sudo systemctl stop nginx
}

stop_nginx_service


%post
#!/usr/bin/env bash
set -e

start_nginx_service () {
    sudo systemctl start nginx
    sudo systemctl status nginx | grep "Active:"
}

start_nginx_service

%define _datadir /usr/share/nginx/html
%files
%{_datadir}/*
