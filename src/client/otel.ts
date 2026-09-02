// 本地 otel 接入（浏览器端）。给每个 fetch 请求打 trace span，同源 POST 到后端的
// /otel/v1/traces 转发接口（避免直连 collector 端口触发 CORS，见 src/routes/otel.ts）。
// otel 容器没起来时导出请求异步失败，静默丢弃，不影响正常使用——见
// app-nanny/otel/README.md「服务发现」一节。
import { WebTracerProvider, BatchSpanProcessor } from "@opentelemetry/sdk-trace-web";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const provider = new WebTracerProvider({
  resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: "md-viewer-client" }),
  spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter({ url: "/otel/v1/traces" }))],
});
provider.register();

registerInstrumentations({
  instrumentations: [
    new FetchInstrumentation({
      // /otel/v1/traces 本身不追踪（避免自我循环），/api/events 是长连接 SSE，不是一次性请求。
      ignoreUrls: [/\/otel\/v1\/traces$/, /\/api\/events$/],
    }),
  ],
});
