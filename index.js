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
var start = 89998;//爬取起点
var end = 90000;//爬取终点
var urls;

DoCheckUrl(url,start,end);

//爬取url入口
async function DoCheckUrl(url,start,end){
    let urls = [];//存放url数组
    let numberArr = [];//存放已经爬过的文件夹编号
    for(let i = start;i < end;i++){
        let result = `${url}${i}`;
        let number = await resolveCallback(result);
        if(numberArr.indexOf(number) === -1 && number !== 'error' && number !== 404){
            numberArr.push(number);//存放文件夹编号
            urls.push(result);//存放url
            let dir = `./meizitu/${number}`;
            DoMkdir(dir);
        }else if(number === 'error'){
            console.log('错误请求，提前下载')
            moreRequest(urls);
        }else if(number === 404){
            continue;
        }
    }
    console.log(urls);
    moreRequest(urls);
}

//处理回掉
function resolveCallback(result){
    return new Promise((resolve,reject)=>{
            checkRequestUrlList(result,(text)=>{
            resolve(text);
        })
    })
}

//检查该路径下是否是新的图片列表
var doNum = 0;//错误提前下载，执行一次
function checkRequestUrlList(result,callback){
     let options ={
        url:result,
        headers:{
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36',
            'Connection': 'keep-alive'
        }
    }
    request(options,(error,response,body)=>{
        let urls = [];
        if(error){
            console.log(`${error},暂时中止`);
            if(doNum==0){
                 callback('error');
                 doNum++;
            }
        }else{
            console.log('正在查找......')
        }
        if(!error&&response.statusCode == 200){
             let $ = cheerio.load(body);
             let href = $('head link').toArray();
             let text = href[0].attribs.href.split('/')[3];
             callback(text);
        }else{
            if(!error && eresponse.statusCode){
                callback(response.statusCode);
            }
        }
           
    })
}


//处理爬取后的文件目录
function DoMkdir(dir){
    //创建目录
    mkdirp(dir,(err)=>{
        if(err){
            console.log(err);
        }else{
            console.log(`${dir}文件夹创建成功`);
        }
    })
}

//多次异步请求的数量
function moreRequest(urls){
    async.mapLimit(urls,2,(url,callback)=>{
    fetchContent(url,callback);
    },(err,callback)=>{
        if(err){
            console.log(err);
        }else{
            console.log('等待下载......')
        }
    })
}


function fetchContent(url,callback){
    let options ={
        url:url,
        headers:{
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36',
            'Connection': 'keep-alive'
        }
    }
    console.log(`开始抓取:${options.url}`);
    //request请求
    request(options,(error,response,body)=>{
        if(error){
            console.log(`error:${error}`)
        }else{
            console.log(`url已经打开,准备抓取内容:${options.url}`);
        }

        if(!error&&response.statusCode == 200){
            requireData(options.url,body);

        }
    })
    
}

async function requireData(url,data){
    let findModal = true;//判断是否继续查询
    let i = 1;
    let $ = cheerio.load(data);
    // var $element = $('body > div.main > div.content > div.pagenavi').find('a').last().prev();
    // console.log('$element:',$element.attr('href').split('/').pop());
    let imgArr = $('.main-image img').toArray();//获取图片属性内容等
    let type = path.basename(imgArr[0].attribs.src).replace('.jpg','').match(/\D+/g)[0];
    let nameDate = $('.main-meta span').eq(1).text().split(' ')[1].split('-')[2];
    let list = url.split('/');
    let childDir = './meizitu/' + list[3];
    while(findModal){
        let index = i < 10 ? '0'+ i : i;
        let imgSrc = path.dirname(imgArr[0].attribs.src) +　'/' + nameDate + type + index + '.jpg';
        console.log(imgSrc);
        let fileName = createFileName(imgSrc);
        findModal = await solveCallback(imgSrc,fileName,childDir);
        i++;
    }
    console.log('结束');
    i = 1;
    findModal = true;
}

//solveCallback处理回调函数
function solveCallback(imgSrc,fileName,childDir){
    return new Promise((resolve,reject)=>{
        downloadImg(imgSrc,fileName,childDir,(result)=>{
                resolve(result);
            })
        })
}


//生成文件名
function createFileName(address){
    let filename = path.basename(address);
    return filename;
}

function downloadImg(imgSrc,fileName,dir,callback){
    request({ uri: imgSrc, encoding: 'binary' }, function (error, response, body) {
        if(error){
            console.log("错误:",error);
        }
        if (!error && response.statusCode == 200) {

            fs.writeFile(dir + '/' + fileName, body, 'binary', function (err) {
                if(err){ 
                    console.log(err);
                }
                console.log(`开始下载:${dir}/${fileName}done`);
            });
            let result = true;
            callback(result);
        }
         if(!error&&response.statusCode == 404){
            console.log('没有东西了')
            let result =  false;
            callback(result);
        }
    });
}