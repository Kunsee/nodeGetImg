/*********************************************
 * by:Kun time :2017/7/15 desc:fetch1.0meizi *
 *********************************************/ 

//爬取mezitu
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var fs = require('fs');
var async = require('async');
var mkdirp = require('mkdirp');

var url = 'http://www.mzitu.com/';
