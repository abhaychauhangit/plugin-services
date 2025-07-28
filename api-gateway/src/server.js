import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import proxy from "express-http-proxy";
import errorHandler from "./middleware/errorHandler.js";
import { validateToken } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;


const redisClient = new Redis(process.env.UPSTASH_REDIS_URL, {tls: {}});
redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});


app.use(helmet());
app.use(cors());
app.use(express.json());


const rateLimitOption = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log("api-gateway: ", `Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "To many requests" });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

app.use(rateLimitOption);

app.use((req, res, next) => {
    console.log(`Received ${req.method} request to ${req.url}`);
    console.log(`Request body, ${req.body}`);
    next();
});

const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api");
    },
    proxyErrorHandler: (err, res, next) => {
        console.log(`Proxy error: ${err.message}`);
        res.status(500).json({
            message: `Internal server error`,
            error: err.message,
        });
    },
};


app.use(
    "/v1/auth",
    proxy(process.env.IDENTITY_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers["Content-Type"] = "application/json";
            
            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            console.log(`Response received from Identity service: ${proxyRes.statusCode}`);

            return proxyResData;
        },
    })
);


app.use(
    "/v1/posts",
    validateToken,
    proxy(process.env.POST_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers["Content-Type"] = "application/json";
            proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            console.log(`Response received from Identity service: ${proxyRes.statusCode}`);

            return proxyResData;
        },
    })
);


app.use(
    "/v1/media",
    validateToken,
    proxy(process.env.MEDIA_SERVICE_URL, {
      ...proxyOptions,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        if (!srcReq.headers["content-type"].startsWith("multipart/form-data")) {
          proxyReqOpts.headers["Content-Type"] = "application/json";
        }
  
        return proxyReqOpts;
      },
      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        console.log(
          `Response received from media service: ${proxyRes.statusCode}`
        );
  
        return proxyResData;
      },
      parseReqBody: false,
    })
);


app.use(
    "/v1/search",
    validateToken,
    proxy(process.env.SEARCH_SERVICE_URL, {
      ...proxyOptions,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json";
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
  
        return proxyReqOpts;
      },
      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        console.log(
          `Response received from Search service: ${proxyRes.statusCode}`
        );
  
        return proxyResData;
      },
    })
);


app.use(
    "/v1/messages",
    validateToken,
    proxy(process.env.CHAT_SERVICE_URL, {
      ...proxyOptions,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        // if (!srcReq.headers["content-type"].startsWith("multipart/form-data")) {

        //   proxyReqOpts.headers["Content-Type"] = "application/json";

        // } else {
            // proxyReqOpts.headers["Content-Type"] = "multipart/form-data";
        // }
  
        return proxyReqOpts;
      },
      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        console.log(
          `Response received from media service: ${proxyRes.statusCode}`
        );
  
        return proxyResData;
      },
      parseReqBody: false,
    })
);







app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
    console.log(
        `Identity service is running on port ${process.env.IDENTITY_SERVICE_URL}`
    );
    console.log(
        `Post service is running on port ${process.env.POST_SERVICE_URL}`
    );
    console.log(
        `Media service is running on port ${process.env.MEDIA_SERVICE_URL}`
    );
    console.log(
        `Search service is running on port ${process.env.SEARCH_SERVICE_URL}`
    );
    console.log(
        `Chat service is running on port ${process.env.CHAT_SERVICE_URL}`
    );
    console.log(`Redis Url ${process.env.UPSTASH_REDIS_URL}`);
})
