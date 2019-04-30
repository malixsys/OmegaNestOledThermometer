## Omega Nest Oled Thermometer

![Omega](https://raw.githubusercontent.com/malixsys/OmegaNestOledThermometer/master/omega.jpg)

### Install

#### Node

- Install `node` and `npm`

> `opkg install nodejs`

> `opkg install npm`

- Install _onion-omega-oled-text_:
> `npm install onion-omega-oled-text`

### Nest

- Get a Nest Token, as shown [here](https://developers.nest.com/guides/samples/sample-code-auth).
    
- Rename `config.json.example` to `config.json` 

- Insert your token

### Service

- Create `/etc/init.d/temperature` with:

```bash
#!/bin/sh /etc/rc.common
START=99

USE_PROCD=1

start_service() {
		echo start
        procd_open_instance
        procd_set_param command /usr/bin/node
        procd_append_param command /overlay/lib/index.js
        procd_set_param respawn  # respawn the service if it exits
        procd_set_param stdout 1 # forward stdout of the command to logd
        procd_set_param stderr 1 # same for stderr
        procd_close_instance
}
```
- Change mode with:
    > `chmod +x /etc/init.d/temperature`
    
- Start with:
    > `/etc/init.d/temperature start`

- Enable with:
    > `/etc/init.d/temperature enable`

- Logs: `logread`
    
- Refs:
    - https://onion.io/2bt-initd-losant/
    - http://community.onion.io/topic/378/etc-init-d-script-not-running-on-boot/2
    
### Timezone

```bash
uci set system.@system[0].timezone='EST5EDT,M3.2.0,M11.1.0'
uci set system.@system[0].zonename='Montreal'
uci commit
echo "EST5EDT,M3.2.0,M11.1.0" > /etc/TZ
```    
