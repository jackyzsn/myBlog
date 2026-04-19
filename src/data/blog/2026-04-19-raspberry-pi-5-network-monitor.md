---
title: "Turn a Raspberry Pi 5 into a transparent network monitor"
description: "Step-by-step guide to building a WiFi access point on a Pi 5 that logs every device's traffic — destination IPs, ports, and DNS queries — with a live web dashboard."
pubDatetime: 2026-04-19T12:00:00Z
tags:
  - raspberry-pi
  - networking
  - linux
  - homelab
  - security
featured: true
draft: false
---

I wanted to know exactly what my home devices are doing on the network — which servers they phone home to, how often, on which ports. Rather than buying a managed switch or spinning up pfSense on dedicated hardware, I repurposed a Raspberry Pi 5 as a transparent WiFi router that logs everything.

The result: every device connects to a Pi-hosted WiFi network, and the Pi captures destination IPs, ports, and DNS queries for each device in real time.

## Architecture

```
[Rogers Modem / ISP]
        |
    [eth0 - Pi 5]  ← WAN (DHCP from modem)
        |
    Pi 5 routes + NATs + logs all traffic
        |
    [wlan0 - Pi 5]  ← WiFi AP  "PiMonitor"
        |
    Your devices (192.168.50.x)
```

| Layer | Tool |
|---|---|
| WiFi access point | hostapd |
| DHCP + DNS for devices | dnsmasq |
| NAT / routing | nftables |
| Traffic logging (IP + port) | nftables `log` |
| DNS query logging | dnsmasq `log-queries` |

## Hardware

- Raspberry Pi 5 (4 GB or 8 GB)
- NVMe SSD via M.2 HAT (recommended) or microSD
- Ethernet cable to modem/router

## Phase 1 — Flash the OS

Flash **Raspberry Pi OS Lite (64-bit)** with Raspberry Pi Imager. In the ⚙️ settings panel before flashing:

- **Hostname:** `pi-monitor`
- **Enable SSH** (password auth is fine for home use)
- **Username / password:** your choice
- **Skip WiFi** — we'll configure it as an AP manually

## Phase 2 — First Boot

Connect the Pi to your modem via ethernet, SSH in, and update:

```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

## Phase 3 — Install Packages

```bash
sudo apt install -y hostapd dnsmasq nftables curl git wget tcpdump
```

## Phase 4 — WiFi Access Point (hostapd)

Create the hostapd config:

```bash
sudo nano /etc/hostapd/hostapd.conf
```

```ini
interface=wlan0
driver=nl80211

ssid=PiMonitor
wpa_passphrase=yourpassword123

# 5 GHz 802.11ac — change to hw_mode=g channel=6 for 2.4 GHz
hw_mode=a
channel=36
ieee80211n=1
ieee80211ac=1
wmm_enabled=1

auth_algs=1
wpa=2
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP

country_code=CA
```

Tell the system where the config lives:

```bash
sudo nano /etc/default/hostapd
```

Set: `DAEMON_CONF="/etc/hostapd/hostapd.conf"`

Enable the service:

```bash
sudo systemctl unmask hostapd
sudo systemctl enable hostapd
```

## Phase 5 — DHCP + DNS (dnsmasq)

Back up the default config and replace it:

```bash
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.bak
sudo nano /etc/dnsmasq.conf
```

```ini
interface=wlan0
dhcp-range=192.168.50.10,192.168.50.200,255.255.255.0,24h
domain=local
address=/pi-monitor.local/192.168.50.1

# Upstream resolvers
server=8.8.8.8
server=1.1.1.1

# Log every DNS query — this is the magic line
log-queries
```

```bash
sudo systemctl enable dnsmasq
```

## Phase 6 — IP Forwarding

Without this the Pi receives packets but won't forward them to the internet.

```bash
sudo nano /etc/sysctl.d/99-forwarding.conf
```

```
net.ipv4.ip_forward=1
```

Apply immediately (no reboot needed):

```bash
sudo sysctl -p /etc/sysctl.d/99-forwarding.conf
```

## Phase 7 — NAT + Traffic Logging (nftables)

This is the core of the monitor. The `log prefix "[TRAFFIC]"` line writes a line to the kernel log for every forwarded packet — source IP, destination IP, protocol, source port, destination port.

```bash
sudo tee /etc/nftables.conf << 'EOF'
#!/usr/sbin/nft -f

flush ruleset

table inet filter {
    chain input {
        type filter hook input priority filter;
    }
    chain forward {
        type filter hook forward priority filter;
        # Log every forwarded packet with structured prefix
        log prefix "[TRAFFIC] " flags all;
        accept;
    }
    chain output {
        type filter hook output priority filter;
    }
}

table ip nat {
    chain postrouting {
        type nat hook postrouting priority 100;
        # Masquerade all outbound traffic on the WAN interface
        oifname "eth0" masquerade;
    }
}
EOF

sudo nft -f /etc/nftables.conf
sudo systemctl enable nftables
```

## Phase 8 — Persistence (survives reboot)

The tricky part: `wlan0` needs a static IP assigned *after* hostapd brings it up, and the WiFi radio needs to be unblocked before hostapd runs. Two small systemd units handle this.

### Unblock WiFi before hostapd

```bash
sudo tee /etc/systemd/system/wifi-unblock.service << 'EOF'
[Unit]
Description=Unblock WiFi and bring up wlan0
Before=hostapd.service
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/sbin/rfkill unblock wlan
ExecStart=/sbin/ip link set wlan0 up
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable wifi-unblock.service
```

### Assign static IP after hostapd

```bash
sudo tee /etc/systemd/system/wlan0-setup.service << 'EOF'
[Unit]
Description=Setup wlan0 static IP
After=hostapd.service
Requires=hostapd.service

[Service]
Type=oneshot
ExecStart=/sbin/ip addr flush dev wlan0
ExecStart=/sbin/ip addr add 192.168.50.1/24 dev wlan0
ExecStart=/sbin/ip link set wlan0 up
ExecStartPost=/bin/systemctl restart dnsmasq
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable wlan0-setup.service
```

Reboot and verify:

```bash
sudo reboot

# After reboot:
ip addr show wlan0              # should show 192.168.50.1
cat /proc/sys/net/ipv4/ip_forward  # should be 1
sudo systemctl status hostapd dnsmasq nftables wlan0-setup
```

## Phase 9 — Connect Devices

Connect your phone or laptop to the **PiMonitor** WiFi, then check what leases dnsmasq has handed out:

```bash
cat /var/lib/misc/dnsmasq.leases
```

You'll see something like:

```
1745180000 aa:bb:cc:dd:ee:ff 192.168.50.57 my-iphone *
```

## Live Monitoring

### Real-time traffic (IP + port)

```bash
sudo journalctl -f -k | grep "\[TRAFFIC\]"
```

Every forwarded packet appears as a structured log line:

```
[TRAFFIC] IN=wlan0 OUT=eth0 SRC=192.168.50.57 DST=142.250.80.46
          PROTO=TCP SPT=52341 DPT=443
```

- `SRC` — your device's IP on the Pi network
- `DST` — the remote server it's talking to
- `DPT=443` — HTTPS; `DPT=80` — HTTP; `DPT=53` — DNS

### Real-time DNS queries

```bash
sudo journalctl -fu dnsmasq | grep -i "query\|reply"
```

```
query[A] www.google.com from 192.168.50.57
reply www.google.com is 142.251.150.119
```

This shows you *by name* what every device is resolving — apps, analytics SDKs, ad networks, update servers.

### Combined live feed

```bash
sudo journalctl -f | grep -E "TRAFFIC|query\[A\]"
```

## Web Dashboard

The Pi runs a web dashboard on port 8080 — a world-map visualization of every connection, filterable by country and device.

![Dashboard overview: 6 devices, 43 countries, 447k total hits — connections fanning out from Toronto](/assets/images/posts/P20260419/dashboard-overview.png)

The "By Device" tab breaks down each connection by source device (shown as the last octet of the device IP), so you can see exactly which device is responsible for which traffic:

![By Device view — each row shows which device initiated the connection, the destination IP, port, country, and org](/assets/images/posts/P20260419/dashboard-by-device.png)

Filtering to **China** is where things get interesting. Of 447k total hits, 1,919 destination IPs resolve to China — mostly Tencent and Alibaba infrastructure. Most came from one device (`*.57`):

![China filter: all connections from Toronto pointing to Chinese IPs (Tencent, Alibaba, ChinaTelecom)](/assets/images/posts/P20260419/dashboard-china.png)

## Useful One-Liners

All of these run on the Pi via SSH.

**Connected devices right now:**

```bash
cat /var/lib/misc/dnsmasq.leases
```

**Top 20 domains queried today:**

```bash
sudo journalctl -u dnsmasq --since today | grep "query\[A\]" | \
  awk '{print $NF}' | sort | uniq -c | sort -rn | head -20
```

**Traffic volume per device today:**

```bash
sudo journalctl -k --since today | grep "TRAFFIC" | \
  grep -oP "SRC=\K[^ ]+" | sort | uniq -c | sort -rn | head -20
```

**Top destination IPs today:**

```bash
sudo journalctl -k --since today | grep "TRAFFIC" | \
  grep -oP "DST=\K[^ ]+" | sort | uniq -c | sort -rn | head -20
```

**Count HTTPS connections today:**

```bash
sudo journalctl -k --since today | grep "TRAFFIC" | grep "DPT=443" | wc -l
```

**Watch one specific device:**

```bash
sudo journalctl -fu dnsmasq | grep "192.168.50.57"
```

## Troubleshooting

**Phone can't connect to PiMonitor:**

```bash
sudo systemctl status hostapd   # check for errors
rfkill list                     # is radio blocked?
sudo rfkill unblock wlan
ip addr show wlan0              # must show 192.168.50.1
```

**Connected but no internet:**

```bash
cat /proc/sys/net/ipv4/ip_forward   # must be 1
sudo nft -f /etc/nftables.conf      # re-apply NAT rules
ping -c 3 8.8.8.8                   # test eth0 has internet
```

**No traffic in logs:**

```bash
sudo nft list ruleset   # verify "log prefix [TRAFFIC]" and "masquerade" are present
```

**Full restart sequence (when things get out of order):**

```bash
sudo rfkill unblock wlan
sudo systemctl restart wifi-unblock
sudo systemctl restart hostapd
sudo systemctl restart wlan0-setup
sudo systemctl restart dnsmasq
sudo nft -f /etc/nftables.conf
```

## Network Summary

| Interface | IP | Role |
|---|---|---|
| `eth0` | DHCP from modem | WAN — internet uplink |
| `wlan0` | `192.168.50.1` (static) | LAN — WiFi AP gateway |
| Devices | `192.168.50.10–200` | Clients |

## Key Files

| File | Purpose |
|---|---|
| `/etc/hostapd/hostapd.conf` | WiFi AP name, password, band |
| `/etc/default/hostapd` | Points system to the config above |
| `/etc/dnsmasq.conf` | DHCP range + DNS logging |
| `/etc/nftables.conf` | NAT + per-packet traffic logging |
| `/etc/sysctl.d/99-forwarding.conf` | Enables IP forwarding |
| `/etc/systemd/system/wlan0-setup.service` | Assigns wlan0 IP on boot |
| `/etc/systemd/system/wifi-unblock.service` | Unblocks WiFi radio on boot |

---

The whole stack — hostapd + dnsmasq + nftables — runs comfortably on a Pi 5 with headroom to spare. Total idle CPU is under 5%. The NVMe SSD makes log writes fast and keeps wear off the SD card. I've had it running for weeks now without intervention, and it's been eye-opening to see just how chatty smart home devices are.
