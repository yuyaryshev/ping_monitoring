const axiosLib = require('axios');
axiosLib.defaults.withCredentials = true;

const axios = axiosLib.create({
  baseURL: 'http://192.168.8.8/',
  // timeout: 1000,
  // headers: {'X-Custom-Header': 'foobar'},
    withCredentials : true,
});

module.exports = {axios};