---
title: "How to set up a modded minecraft server"
description: "Step-by-step guide to install a Forge-based modded Minecraft server on Linux and Windows, including firewall port configuration."
pubDatetime: 2020-11-02T12:00:00Z
tags:
  - linux
  - java
  - devops
  - notes
draft: false
---

You can set up minecraft in your machine and invite others in the LAN to play together. However your machine will act as both server and client. It uses your system resource so we might have lag sometime. If you have a server, you can install minecraft there. Then it won't take your system resource when play. Here it's how.

1. Download Forge installer from official website [http://files.minecraftforge.net/](http://files.minecraftforge.net/)

Linux:

```bash
$ wget https://files.minecraftforge.net/maven/net/minecraftforge/forge/1.16.3-34.1.0/forge-1.16.3-34.1.0-installer.jar
```

Windows:

```bash
Download from web page
```

2. Run the installer

Linux:

```bash
$ java -jar forge-1.16.3-34.1.0-installer.jar --installServer

JVM info: Oracle Corporation - 1.8.0_261 - 25.261-b12
java.net.preferIPv4Stack=true
Found java version 1.8.0_261
Target Directory: .
Extracting main jar:
  Extracted successfully
Considering minecraft server jar
  Downloading library from https://launcher.mojang.com/v1/objects/f02f4473dbf152c23d7d484952121db0b36698cb/server.jar
    Download completed: Checksum validated.
Downloading libraries
Considering library net.minecraftforge:forge:1.16.3-34.1.0
  Extracting library from /maven/net/minecraftforge/forge/1.16.3-34.1.0/forge-1.16.3-34.1.0.jar
    Extraction completed: Checksum validated.
Considering library org.ow2.asm:asm:7.2

...

  Patching net/minecraft/client/renderer/entity/ItemRenderer 1/1
  Patching net/minecraft/client/gui/screen/CreateWorldScreen$GameMode 1/1
  Output: /usr/minecraft_1.16.3/./libraries/net/minecraftforge/forge/1.16.3-34.1.0/forge-1.16.3-34.1.0-server.jar Checksum Validated: 3bb761476e8ee186a7980195542f43cc24b26c46
The server installed successfully, you should now be able to run the file forge
You can delete this installer file now if you wish
```

Windows:

```bash
Double click the jar file and select install as server
```

3. Create start up script and assign execute permission for Linux

Linux:

```bash
$ vi ./startMine.sh

#!/bin/bash
java -Xms1024M -Xmx4096M -jar /usr/minecraft_1.16.3/forge-1.16.3-34.1.0.jar nogui

$ chmod +x startMine.sh
```

Windows:

```bash
Use notepad to create startMine.bat

java -Xms1024M -Xmx4096M -jar /usr/minecraft_1.16.3/forge-1.16.3-34.1.0.jar nogui

```

4. Create eula.txt to accept the agreement

```bash
$ vi ./eula.txt

#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://account.mojang.com/documents/minecraft_eula).
#Sun Nov 01 13:55:17 EST 2020
eula=true

```

5. Create mods folder, download and place the mod jars to the folder. Version has to be matched.

6. Start the server

Linux:

```bash
$ ./startMine.sh
```

Windows:

```bash
$ startMine.bat
```

7. Find the port for the server by checking the log

```bash
...
[14:02:25] [Server thread/INFO] [minecraft/DedicatedServer]: Starting Minecraft server on *:25565
...
```

8. You can change the default port by editing server.properties, then restart server

```bash
...
server-port=25565
...
```

9. Open the port in Linux if you have firewall

```bash
## Command to list active zone
$ sudo firewall-cmd --get-active-zones

## Command to open the port on firewall
$ sudo firewall-cmd --zone=home --add-port=25565/tcp --permanent

## Command to reload setting
$ sudo firewall-cmd --reload

## Command to restart firewall
$ sudo systemctl restart firewalld

```

10. You should be able to connect to Minecraft server

11. To stop the sever, type stop in terminal.

```bash
## Command to stop minecraft server
[14:03:33] [Server thread/INFO] [minecraft/DedicatedServer]: Done (66.692s)! For help, type "help"
> stop

```
