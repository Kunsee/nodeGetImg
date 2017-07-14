//爬取mezitu
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var fs = require('fs');
var async = require('async');
var mkdirp = require('mkdirp');

var url = 'http://www.mzitu.com/';
var start = 96408;//爬取起点
var end = 96410;//爬取终点
var urls = DoCheckUrl(url,start,end);

//爬取url入口
function DoCheckUrl(url,start,end){
    let urls = [];
    for(let i = start;i < end;i++){
        let result = `${url}${i}`;
        urls.push(result);
        let dir = `./meizitu/${i}`;
        DoMkdir(dir);
    }
    return urls;
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
async.mapLimit(urls,2,(url,callback)=>{
    fetchContent(url,callback);
},(err,callback)=>{
    if(err){
        console.log(err);
    }else{
        console.log('等待下载......')
    }
})

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
    let type = 'b';
    let $ = cheerio.load(data);
    let imgArr = $('.main-image img').toArray();//获取图片属性内容等
    let nameDate = $('.main-meta span').eq(1).text().split(' ')[1].split('-')[2];
    let list = url.split('/');
    let childDir = './meizitu/' + list[3];
    while(findModal){
        let index = i < 10 ? '0'+ i : i;
        let imgSrc = path.dirname(imgArr[0].attribs.src) +　'/' + nameDate + type + index + '.jpg';
        let fileName = createFileName(imgSrc);
        findModal = await solveCallback(imgSrc,fileName,childDir);
        console.log('结果:',findModal);
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
        if(response.statusCode == 404){
            console.log('没有东西了')
            let result =  false;
            callback(result);
        }
        if(error){
            console.log("错误:",error);
        }
        if (!error && response.statusCode == 200) {

            fs.writeFile(dir + '/' + fileName, body, 'binary', function (err) {
                if(err){ 
                    console.log(err);
                }
                console.log(`开始下载:${dir}/${fileName}done`);
            //     console.log('o(*￣▽￣*)o偷偷下载' + dir + '/' + filename + ' done');
            });
            let result = true;
            callback(result);
        }
    });
}