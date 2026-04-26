---
title: "Pi 5 network monitor, one month in: fixes, upgrades, and what I actually found"
description: "A retrospective on the Pi 5 transparent network monitor — the bugs that bit, the dashboard rewrite, an AI-friendly export format, and the surprising things home devices do when no one is watching."
pubDatetime: 2026-04-25T12:00:00Z
tags:
  - raspberry-pi
  - networking
  - linux
  - homelab
  - security
featured: false
draft: false
---

A month after [building the Pi 5 network monitor](/posts/2026-04-19-raspberry-pi-5-network-monitor), I have notes. Some are fixes for things that broke in the wild. Some are upgrades that made the dashboard actually useful. And some are stories about what my own devices were doing the whole time.

This post is the sequel to the setup guide — read that first if you want the full stack. Here I'll focus on what changed and why.

## Three bugs that bit

### 1. The disk filled up in two days

The original nftables rule logged every forwarded packet:

```nftables
log prefix "[TRAFFIC] " flags all;
```

That sounds fine until you realize a single TLS connection is hundreds of packets, and a single device watching YouTube generates millions per hour. `kern.log` hit 1 GB in 48 hours.

The fix is one phrase — `ct state new` — which tells nftables to log only the first packet of each new connection:

```nftables
ct state new log prefix "[TRAFFIC] " flags all;
```

Same connection visibility, ~100× less data. Volume dropped from millions of lines per day to about 18,500 (~5 MB/day). Every analysis I had been doing — top destinations, port usage, country breakdown — works identically on the smaller dataset, because I never cared about packet counts in the first place. I cared about *who talked to whom*.

### 2. Logs disappeared after rotation

After a few days I noticed the dashboard would occasionally go blank. Always around the same time — right after logrotate ran.

The culprit was `delaycompress` in the rotation config: when logrotate runs, it renames `kern.log` → `kern.log.1` and starts a fresh empty `kern.log`. The "delay" part means `kern.log.1` stays uncompressed for one cycle before getting gzipped. My extract script was reading `kern.log` (now empty) and `kern.log.*.gz` (didn't include the .1 yet), so it would happily produce zero data until the next rotation.

The fixed extractor reads all three sources:

```bash
{
  cat /var/log/kern.log 2>/dev/null
  cat /var/log/kern.log.1 2>/dev/null
  zcat /var/log/kern.log.*.gz 2>/dev/null
} | grep -a "\[TRAFFIC\]" \
  | grep -a "IN=wlan0 OUT=eth0"
```

Two small details: `cat /var/log/kern.log.1` covers the gap, and `grep -a` forces text mode — gzip-decompressed streams can briefly look binary to grep, which silently exits without matches.

### 3. The regex returned MAC addresses

The parser used `re.search(r'SRC=(\S+)', line)` to extract the source IP. Worked in testing, broke on real logs, because nftables log lines look like:

```
[TRAFFIC] IN=wlan0 OUT=eth0 MACSRC=aa:bb:cc:dd:ee:ff SRC=192.168.50.57 DST=...
```

`SRC=` matches inside `MACSRC=` first. The dashboard was grouping connections by MAC address instead of IP — which mostly *looked* right because each device has a stable MAC, but device filtering broke entirely.

A negative lookbehind fixes it:

```python
src = re.search(r'(?<!MAC)SRC=(\S+)', line)
```

This is the kind of bug that doesn't blow up — it just gives you wrong data forever. Worth re-reading your own regexes.

## Smarter log rotation

The default Debian logrotate runs daily and rotates by age. With the connection-only logging from fix #1, I cared about size, not time — I want predictable disk usage, not predictable rotation timing.

`/etc/logrotate.d/rsyslog` now uses:

```
size 100M
rotate 10
compress
delaycompress
```

And I moved the logrotate cron from `/etc/cron.daily/` to `/etc/cron.hourly/` so it actually checks the size frequently:

```bash
sudo mv /etc/cron.daily/logrotate /etc/cron.hourly/
```

Result: ~1 GB ceiling, roughly six months of history at current traffic levels, and no surprises after a holiday weekend of streaming.

## A 7-day rolling window

The first dashboard showed every IP ever seen, all the way back to first boot. Useful for the first week, then a wall of stale data.

I added a `DAYS=7` cutoff at the top of the extractor, computed once with `date -d "$DAYS days ago"`, then applied with awk over the timestamp prefix of each log line:

```bash
awk -v cutoff="$CUTOFF" 'substr($1, 1, 10) >= cutoff { print }'
```

The dashboard always shows recent activity. Old data still lives in the rotated archives if I ever want it.

## Dashboard upgrades

The original dashboard was a world map with destination dots. Useful, but it answered exactly one question: "where is my traffic going." Everything else required SSH and grep.

The rewrite has three sidebar tabs:

- **Destinations** — every unique IP, sorted by hit count, with port, country, and org
- **By Device** — every `src → dst` pair, so you can see exactly which device made which connection
- **By Port** — port breakdown with service names (443 = HTTPS, 53 = DNS, 4500 = IPSec NAT-T, etc.)

Plus filters that compose freely:

- **Country buttons** — All / China / USA / Canada / Other
- **Device buttons** — one per device on the network, color-coded by source IP last octet
- **Stats bar** that updates live as you filter — Unique IPs, Devices, Countries, Hits

The map dots got tooltips with city, org, devices that hit them, and top ports. Bubble size scales with hit count. Connection lines color-code by country or device depending on which filter is active.

The most useful change was making **everything reactive to the active filter**. Before, the stats bar always showed global numbers, so when I filtered to "China only" I'd still see "447k total hits" and have no idea what fraction of that was China traffic. Now the count says "1,919 hits, 6 countries, 2 devices" — actual signal.

## Exporting for AI analysis

This was the upgrade I didn't plan but ended up using the most.

When you stare at a list of 6,000 unique destination IPs, your eyes glaze over. The interesting question — *is anything in here suspicious?* — is the kind of pattern-matching task an LLM is great at, if you can hand it the data in a useful shape.

So I added an export button with four formats:

| Format | Use case |
|---|---|
| **Summary Report** | Pre-formatted prose with auto-detected suspicious signals at the top — paste straight into a chat |
| **Full IP List** | Plain-text table of all connections |
| **Suspicious Only** | Just flagged connections (high/medium/low risk) |
| **CSV** | Spreadsheet-friendly format |

The Summary Report is the workhorse. It runs a small classifier on the connections before exporting:

- **High risk** — unencrypted HTTP to high-risk countries
- **Medium risk** — VPN-style ports (500, 4500), non-standard ports to China, high-volume HTTP
- **Low risk** — high-volume traffic to a single country, unknown country codes, unusual ports

These rules generate noise — that's the point. The export respects whatever country/device filter is active, so I can ask "anything suspicious from the Huawei phone?" by filtering to that device first, then exporting just that subset.

Pasting the Summary Report into a chat with "explain anything that looks worth investigating" is genuinely useful. Most of the time the answer is "this is normal CDN behavior" — but the few times it isn't, that's exactly what I want to know.

## What I actually found

The fun part. With a month of data, here are the things that surprised me:

**The Huawei phone had 517 hits to Huawei Cloud Ireland while sitting idle.** No apps open, screen off, just background services phoning home every few minutes. Not malicious — every phone does this — but the volume was higher than I expected from a device I considered "off."

**Chinese apps route through Mexico and Singapore.** Douyin (TikTok's China sibling) traffic showed up resolving to Mexican and Singaporean CDN edge nodes, not Chinese ones. Makes sense: TikTok runs its own global CDN; the China filter would miss this if I trusted it as a proxy for "is this app talking to China."

**WhatsApp uses Tencent CDN.** This one tripped my suspicious-traffic classifier. WhatsApp connecting to Tencent IPs looks alarming for ~10 seconds until you remember Tencent runs one of the largest CDNs on the planet, and Meta is a customer. Looked suspicious, was nothing.

**Bell ports 500 and 4500 are WhatsApp calls.** My VPN-port heuristic flagged these immediately. Turns out WhatsApp uses an IPSec-style protocol on the same UDP ports. False positive in my classifier — but a good one, because I learned what those ports actually meant.

**Facebook port 80 was a legacy health check.** A handful of unencrypted HTTP connections to Facebook IPs, very low volume, very regular interval. After some digging: legacy connectivity probes. Mildly annoying that Facebook is still doing them in 2026 but not actually a problem.

The takeaway across all of these: **suspicious patterns and normal app behavior look identical from the outside.** A connection to Tencent could be malware exfiltration or it could be your messaging app loading a sticker pack. The IP and port don't tell you. The DNS query, the app context, and the *pattern over time* do.

This is also why the AI export is useful — it's not that the LLM "knows" what's malicious, it's that it can quickly correlate the noisy signals (port + country + org + frequency) into a readable narrative.

## Lessons learned

A grab bag of things I'd tell past-me:

1. **Default settings will blow up your disk.** Anything that touches every packet — logging, accounting, IDS — needs an explicit cardinality limit. `ct state new` is one. Sampling is another.
2. **`delaycompress` is a footgun if you don't know it exists.** Any log-reading script must include the `.1` file or it will silently lose data for one rotation cycle.
3. **Free geo APIs need batching, caching, and fallback.** ip-api.com has a `/batch` endpoint that takes 100 IPs in one POST. ipapi.co is a usable fallback when the primary 429s. The cache survives reboots and means subsequent runs are basically free.
4. **Filter at the source, not the display.** Excluding private/CGNAT IPs in the parser keeps the JSON clean and the dashboard simple. Doing it in the browser means shipping noise across the wire and filtering it out at the edge.
5. **Negative lookbehinds are your friend.** When two log fields share a prefix (`SRC=` and `MACSRC=`), the wrong regex will match silently and quietly poison your data.
6. **Suspicious looks like normal at first glance.** Don't trust port-and-country heuristics in isolation. Cross-reference with DNS query logs and the *pattern* of traffic before you panic about the Tencent connection.
7. **Make the dashboard respect the filter.** Global stats during a filtered investigation are worse than no stats — they actively mislead.
8. **The most useful new feature was the one I didn't plan.** The AI export started as "let me just dump this somewhere" and ended up being how I actually investigate anomalies.

## What's next

A few things on the list:

- Map MAC addresses to friendly device names (`huawei-phone` instead of `*.157`)
- Pull SNI hostnames from a Zeek sidecar to enrich destinations beyond just the IP
- Day-over-day diffing — a daily "new connections you haven't seen before" report
- Telegram alerts for the high-risk classifier hits

The whole thing is still running on the same Pi 5, still under 5% idle CPU. A month of data fits in about 150 MB of compressed logs. Nothing about this needs more hardware than a $80 board and an afternoon — and the visibility into what your own network is doing is genuinely worth it.
