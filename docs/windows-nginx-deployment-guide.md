
### Instructions to install and use

https://www.nginx.com/resources/wiki/start/topics/tutorials/install/#official-win32-binaries

```
cd C:\
unzip nginx-1.12.2.zip
ren nginx-1.12.2 nginx
cd nginx
start nginx
```

`C:\nginx> .\nginx.exe -c <PATH TO>\foglamp-gui\nginx.conf`

> UNIX style path (forward slash in conf)

```
PS C:\nginx> tasklist /fi "imagename eq nginx.exe"

Image Name                     PID Session Name        Session#    Mem Usage
========================= ======== ================ =========== ============
nginx.exe                     9940 Console                    1      7,472 K
nginx.exe                    10672 Console                    1      7,596 K

```

One of the processes is the master process and another is the worker process. If nginx does not start, look for the reason in the error log file logs\error.log. If the log file has not been created, the reason for this should be reported in the Windows Event Log. If an error page is displayed instead of the expected page, also look for the reason in the logs\error.log file.


```
PS C:\nginx> .\nginx.exe -s stop
PS C:\nginx> tasklist /fi "imagename eq nginx.exe"
INFO: No tasks are running which match the specified criteria.
```