# INDESY - Indoor delivery system

[![David](https://img.shields.io/david/nicklasfrahm/indesy-robot.svg?style=flat-square)](https://david-dm.org/)

## Description

The robot for an indoor delivery system. The robot will be used to deliver objects and is the heart of the system.

## Installation

Create a `.env`-file and put in the following:

```ini
API_URL=http://localhost:8000
```

**Note:** If you want to connect to the production server instead, replace the `API_URL` accordingly.

Make sure to have at least the latest LTS of node installed. Then open a terminal and run:

```shell
npm install
npm start
```

## Deployment

1. Set up a static IP on your ethernet interface, that is part of the `192.168.137.0/24` network. This IP should not be `192.168.137.10` as this is the IP of the robot. _(This can be done via the control panel in Windows.)_
2. Open the _git bash_ on your computer and connect via SSH: `ssh pi@192.168.137.10`
3. Type in the password
4. Gain superuser priviledges: `sudo -s`
5. Navigate to the folder, where the application is located: `cd /opt/indesy-robot`
6. Stop the application: `pm2 stop all`
7. Checkout on the `remote-controlled`-branch: `git checkout remote-controlled`
8. Restart the application: `pm2 reload all`
