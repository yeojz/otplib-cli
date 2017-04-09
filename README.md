# otplib-cli

> Command-line tool for OTP token generation and verification

[![npm][npm-badge]][npm-link]
[![Build Status][circle-badge]][circle-link]


## Install

```
$ npm install --global otplib-cli
```

## Usage

```
Usage: otplib [options] [command]


 Commands:

   init [options]       initialise a new configuration
   generate [options]   generate new tokens
   verify [token]       validate a token against the setting or configuration

 Options:

   -h, --help              output usage information
   -V, --version           output the version number
   -k, --secret [key]      provide a secret key
   -c, --config [path]     path to configuration file
   -m, --mode [mode]       operation mode. (hotp | totp | authenticator)
   -d, --digits [number]   number of digits in token
   -a, --algorithm [type]  algorithm to generate for totp (sha1 | sha256 | sha512)
   -s, --step [number]     time step (totp / authenticator)
```

## Related

-   [otplib](https://github.com/yeojz/otplib) - API for this module

## License

`otplib-cli` is [MIT licensed](./LICENSE)

[npm-badge]: https://img.shields.io/npm/v/otplib-cli.svg?style=flat-square
[npm-link]: https://www.npmjs.com/package/otplib-cli

[circle-badge]: https://img.shields.io/circleci/project/github/yeojz/otplib-cli/master.svg?style=flat-square
[circle-link]: https://circleci.com/gh/yeojz/otplib-cli.svg
