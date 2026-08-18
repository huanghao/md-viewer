import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  checkAgentBackendAvailable,
  parseAgentBackendsYaml,
  renderAgentShim,
  resolveAgentCommand,
  listAgentBackendStatuses,
  type AgentBackend,
} from "../../src/agent-backends";

const OLD_ENV = { ...process.env };
let tmpHome: string | null = null;

afterEach(() => {
  if (tmpHome) {
    rmSync(tmpHome, { recursive: true, force: true });
    tmpHome = null;
  }
  process.env = { ...OLD_ENV };
});

function backend(overrides: Partial<AgentBackend> = {}): AgentBackend {
  return {
    name: "mc",
    description: "CatPaw",
    command: "mc --code",
    env: {},
    envUnset: [],
    contextWindow: null,
    default: false,
    ...overrides,
  };
}

describe("agent backend config", () => {
  it("parses kolab-style backend yaml", () => {
    const parsed = parseAgentBackendsYaml(`
default: mc
backends:
  - name: kc
    description: "Kimi K3"
    command: "claude"
    context_window: 256000
    env:
      ANTHROPIC_BASE_URL: "https://example.test"
      ANTHROPIC_API_KEY: "\${KC_KEY}"
  - name: mc
    description: "CatPaw"
    command: "mc --code"
    env_unset:
      - EXTRA_ROUTE_VAR
`);

    expect(parsed.defaultName).toBe("mc");
    expect(parsed.backends.length).toBe(2);
    expect(parsed.backends[0]).toMatchObject({
      name: "kc",
      description: "Kimi K3",
      command: "claude",
      contextWindow: 256000,
      default: false,
    });
    expect(parsed.backends[0].env.ANTHROPIC_API_KEY).toBe("${KC_KEY}");
    expect(parsed.backends[1]).toMatchObject({
      name: "mc",
      command: "mc --code",
      envUnset: ["EXTRA_ROUTE_VAR"],
      default: true,
    });
  });

  it("reports missing env interpolation", () => {
    delete process.env.KC_KEY;
    const reason = checkAgentBackendAvailable(backend({
      env: { ANTHROPIC_API_KEY: "${KC_KEY}" },
    }));

    expect(reason).toBe("环境变量 KC_KEY 无法展开（ANTHROPIC_API_KEY 需要）");
  });

  it("renders a shim that unsets hijacking vars and exports backend env", () => {
    process.env.MC_KEY = "secret-value";
    const shim = renderAgentShim(backend({
      env: { ANTHROPIC_API_KEY: "${MC_KEY}" },
      envUnset: ["EXTRA_ROUTE_VAR"],
    }));

    expect(shim).toContain("unset ");
    expect(shim).toContain("ANTHROPIC_BASE_URL");
    expect(shim).toContain("EXTRA_ROUTE_VAR");
    expect(shim).not.toContain("unset ANTHROPIC_API_KEY");
    expect(shim).toContain("export ANTHROPIC_API_KEY='secret-value'");
    expect(shim).toContain('exec mc --code "$@"');
  });

  it("uses workspace command only when no backend is explicitly requested", () => {
    tmpHome = mkdtempSync(join(tmpdir(), "mdv-agent-home-"));
    process.env.HOME = tmpHome;
    const backends = [backend({ name: "mc", command: "mc --code", default: true })];

    const workspaceResolved = resolveAgentCommand(["custom-agent"], null, backends);
    expect(workspaceResolved).toMatchObject({ command: ["custom-agent"], source: "workspace-command" });

    const requestedResolved = resolveAgentCommand(["custom-agent"], "mc", backends);
    expect(requestedResolved.source).toBe("backend");
    expect(requestedResolved.backendName).toBe("mc");
    expect(requestedResolved.command[0]).toContain("mc.sh");
  });

  it("exposes backend default model from env", () => {
    tmpHome = mkdtempSync(join(tmpdir(), "mdv-agent-home-"));
    process.env.HOME = tmpHome;
    const configPath = join(tmpHome, ".config", "agent-backends.yaml");
    mkdirSync(join(tmpHome, ".config"), { recursive: true });
    Bun.write(configPath, `
default: kc
backends:
  - name: kc
    command: "claude"
    env:
      ANTHROPIC_MODEL: "\${KC_MODEL}"
`);
    process.env.KC_MODEL = "k3-256k";

    const status = listAgentBackendStatuses();
    expect(status[0].name).toBe("kc");
    expect(status[0].defaultModel).toBe("k3-256k");
  });
});
