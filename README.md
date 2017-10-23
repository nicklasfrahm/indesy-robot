# INDESY - Indoor delivery system
[![David](https://img.shields.io/david/nicklasfrahm/indesy-robot.svg?style=flat-square)](https://david-dm.org/)

## Description
The robot for an indoor delivery system. The robot will be used to deliver object and is the heart of the system.

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