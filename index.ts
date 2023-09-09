import { time } from "console";
import express , {Request,Response} from "express";
import promClient from "prom-client";
import resposeTime from "response-time";

const collectmetrics = promClient.collectDefaultMetrics;
collectmetrics({ register: promClient.register });


const app = express();

const reqResTime = new promClient.Histogram({
  name: "http_express_req_time",
  help: "tells about time taken by request and response",
  labelNames:["method" , "route" , "status_code"],
  buckets:[1,5,50,100,300,500,800,1000,1500,2000,2500]
});

const totalReqCounter = new promClient.Counter({
    name:'http_req_count',
    help:'total number of req made'
})


app.use(resposeTime((req : Request,res : Response,time )=>{
    totalReqCounter.inc();
    reqResTime.labels({
        method: req.method,
        route:req.url,
        status_code:res.statusCode
    })
    .observe(time)
    
}))

app.get("/", (req : Request, res : Response) => {
  res.send({ messgage: "server started successfully" });
});
app.get("/taketime", (req: Request, res: Response) => {
  setTimeout(() => {
    res.send({ messgage: "server taking time" });
  }, 2000);
});

app.get("/metrics", async (req : Request, res : Response) => {
  res.setHeader("Content-Type", promClient.register.contentType);
  const metrics = await promClient.register.metrics();
  res.send(metrics);
});
app.listen(5000, () => {
  console.log("server started at port 5000");
});
