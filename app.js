"use strict";
const Koa = require('koa');
const helmet = require("koa-helmet");
const bodyParser = require('koa-bodyparser');
const Proxy = require('fly-proxy-nginx');
var lazyresponse = require('fly-proxy-nginx/module/lazyresponse');
const ratelimit = require('koa-ratelimit');
const Redis = require('ioredis');
const sqlInjection = require("./module/security/sqlInjection");
const xssInjection = require("./module/security/xss");
const app = new Koa();

//1.注入security headers，简单进行防御
// app.use(helmet());
//2.body 解析 后面会用到
// app.use(bodyParser());
//3.对其他安全进行防护
// app.use(sqlInjection());
// app.use(xssInjection());

// logger
app.use(async (ctx, next) => {
    await next();
    if (ctx.status!=200){
        console.log(ctx.status+" "+ctx.message);
    }
});
//放在最后修改http中间件的前面
app.use(lazyresponse());

// x-response-time
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.response.set('X-Response-Time', `${ms}ms`);
});
//限速
//TODO:这块需要改进，限速太过单一，目前只支持了按账号限制，理想状况下可以按照IP和账号进行限制
// app.use(ratelimit({
//     db: new Redis({
//         port: 6488,          // Redis port
//         host: '192.168.1.44',   // Redis host
//         family: 4,           // 4 (IPv4) or 6 (IPv6)
//         password: '',
//         db: 15
//     }),
//     duration: 60 * 1000,
//     errorMessage: null,
//     id: (ctx) => {
//         var token = ctx.headers["x-auth-token"];
//         if (token && token.length > 0) {
//             return token;
//         }
//         //没有登录的不用限流
//         return false;
//
//
//     },
//     headers: {
//         remaining: 'Rate-Limit-Remaining',
//         reset: 'Rate-Limit-Reset',
//         total: 'Rate-Limit-Total'
//     },
//     max: 30,
//     disableHeader: false,
// }));
//proxy
/*
 * TODO:代理层面需要自己修改下代码，主要支持以下特性:
 * 1.backend服务的负载均衡
 * 2.backend服务的动态获取
 * 3.backend服务的health check
 * 4.配合Jenkins动态的上下线
 * 5.
 */
const Ngnix = Proxy.proxy({
    proxies: [
        {
            upstreams: [{uri: 'http://10.4.96.4:3100'}, {uri: 'http://10.4.96.4:3101'}],
            context: '',
            enablelog: false,
            proxyTimeout: 10000,
        },
    ],
    proxyTimeout: 5000,
    logLevel: 'debug',
});
app.use(Ngnix);

app.listen(3000);