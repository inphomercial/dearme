the easiest way to journal ever. we send a few texts a day. you answer. we add
your instagram photos. you have a journal.

### running the app

```bash
make install
make server
make worker
```

### configuration

configuration is retrieved using [acm](https://www.npmjs.com/package/acm). see
`config/` directory for additional configuration options (linkedin, embedly,
monitoring, etc.). additional services and service providers:

```bash
export TWILIO_ACCOUNT_SID=         # your twilio account id
export TWILIO_AUTH_TOKEN=          # your twilio account auth token
export TWILIO_SERVICE_SID=         # your twilio messaging service id
```

### build

run `make`.