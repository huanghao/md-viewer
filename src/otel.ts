/**
 * 本地 otel 接入（server 进程）。
 *
 * 只在 nanny 给这个进程注入了 OTEL_SERVICE_NAME 时才初始化（见 app-nanny.toml
 * [processes.server] 的 otel_service_name），避免 `bun run dev`（不走 nanny）
 * 时凭空起一个默认服务名的 tracer。就算 otel 容器没起，导出请求异步失败/丢弃，
 * 不影响本进程正常服务——见 app-nanny/otel/README.md「服务发现」一节。
 */
import { NodeTracerProvider, BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { trace, type Tracer } from "@opentelemetry/api";

const serviceName = process.env.OTEL_SERVICE_NAME;

let tracer: Tracer | undefined;

if (serviceName) {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318";
  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
    spanProcessors: [
      new BatchSpanProcessor(new OTLPTraceExporter({ url: `${endpoint}/v1/traces` })),
    ],
  });
  provider.register();
  tracer = trace.getTracer(serviceName);
}

/** 未接入 otel（无 OTEL_SERVICE_NAME）时返回 undefined，调用方需判空跳过埋点。 */
export function getTracer(): Tracer | undefined {
  return tracer;
}
