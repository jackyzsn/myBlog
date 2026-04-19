---
title: "Start springboot application at boot time in CentOS 7"
description: "Create systemd service files with start/stop shell scripts so a Spring Boot scheduler job starts automatically on CentOS 7 reboot."
pubDatetime: 2020-11-03T12:00:00Z
tags:
  - linux
  - centos
  - springboot
  - devops
draft: false
---

I have a springbbot scheduler job running in my CentOS 7 server. I want to make it automatically start every time when I reboot the system. So I don't need to do it manually. Here it's how.

1. Create start stop shell script

```bash
$ vi startrets.sh

#!/bin/bash
java -Xmx4096m -jar /usr/programs/web/rets-load-1.0.0.jar >> /usr/programs/web/rets.log 2> /usr/programs/web/rets_err.log < /dev/null
echo "rets-load started.."

$ chmod +x startrets.sh
```

```bash
$ vi stoprets.sh

#!/bin/bash
PID=`ps -ef | grep rets-load | grep -v grep | awk '{print $2}'`
if [[ "" !=  "$PID" ]]; then
  echo "killing $PID - RETS-LOAD app.."
  kill -9 $PID
fi
timeStr=`date "+%Y-%m-%dT%H.%M.%S"`
mv rets.log retslog.$timeStr
echo "RETS-LOAD stopped..

$ chmod +x stoprets.sh
```

2. Create system service under /etc/systemd/system

```bash
$ vi rets.service

[Unit]
Description=RETS data load service
After=mnt.mount mongod.service mysqld.service

[Service]
Type=simple
ExecStart=/usr/programs/web/startrets.sh
ExecStop=/usr/programs/web/stoprets.sh
TimeoutStartSec=0
User=jacky
Group=jacky

[Install]
WantedBy=multi-user.target
```

3. Command to enable the service

```bash
$ sudo systemctl enable rets
```

4. Commands to start/stop/restart/disable/show the service

```bash
$ sudo systemctl start rets

$ sudo systemctl stop rets

$ sudo systemctl restart rets

$ sudo systemctl disable rets

$ sudo systemctl status rets

```

5. After enable the service, every time after reboot, the service will be brought up automatically
