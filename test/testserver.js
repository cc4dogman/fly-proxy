const Koa = require('koa');

module.exports = {
    startServer: function (port) {
        const app = new Koa();
        app.use(async (ctx, next) => {
            let res = "the server port is " + port;
            ctx.body = {
                status: 200,
                data: res,
            };
            await next();
        });
        app.listen(port);
    }
}