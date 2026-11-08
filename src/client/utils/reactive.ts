// 可订阅的响应式状态。
// - 普通对象与数组用 Proxy 包装：对任一属性的赋值、删除（且值确实变化）时通知订阅者；
// - Map / Set 用子类实现：set/delete/clear/add 等改变内容时通知；
// - 读取嵌套对象时返回同一个代理（缓存），所以 `file.content = x` 这样的深层写入同样会通知；
// - 通知是同步的，订阅者应自行合并（例如 requestSidebarRender 用微任务合并）。

type Listener = () => void;
const listeners = new Set<Listener>();

/** 订阅任意状态变化；返回取消订阅函数 */
export function subscribeReactive(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyReactive(): void {
  // 复制一份，避免订阅者在回调中增删订阅时被跳过或重复
  for (const l of Array.from(listeners)) l();
}

const proxyOf = new WeakMap<object, object>(); // raw -> proxy
const rawOf = new WeakMap<object, object>(); // proxy -> raw

function isPlainObject(value: object): boolean {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** 取得写入时应当存储的原始值：代理还原为原始对象，Map/Set 转为可响应式的子类 */
function normalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  const raw = rawOf.get(value);
  if (raw) return raw;
  if (value instanceof ReactiveMap || value instanceof ReactiveSet) return value;
  if (value instanceof Map) return new ReactiveMap(value.entries());
  if (value instanceof Set) return new ReactiveSet(value.values());
  return value;
}

/** 读取时返回的值：普通对象/数组给代理，其它原样返回 */
function view(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (rawOf.has(value)) return value; // 已经是代理
  if (value instanceof ReactiveMap || value instanceof ReactiveSet) return value;
  if (Array.isArray(value) || isPlainObject(value)) return proxyFor(value);
  return value;
}

function proxyFor(raw: object): object {
  const cached = proxyOf.get(raw);
  if (cached) return cached;
  const proxy = new Proxy(raw, {
    get(target, key, receiver) {
      return view(Reflect.get(target, key, receiver));
    },
    set(target, key, value) {
      const next = normalize(value);
      const had = Object.prototype.hasOwnProperty.call(target, key);
      const prev = (target as any)[key];
      const ok = Reflect.set(target, key, next);
      if (!had || !Object.is(prev, next)) notifyReactive();
      return ok;
    },
    deleteProperty(target, key) {
      const had = Object.prototype.hasOwnProperty.call(target, key);
      const ok = Reflect.deleteProperty(target, key);
      if (had) notifyReactive();
      return ok;
    },
  });
  proxyOf.set(raw, proxy);
  rawOf.set(proxy, raw);
  return proxy;
}

export class ReactiveMap<K, V> extends Map<K, V> {
  constructor(entries?: Iterable<readonly [K, V]> | null) {
    super();
    if (entries) for (const [k, v] of entries) super.set(k, normalize(v) as V);
  }
  override get(key: K): V | undefined {
    return view(super.get(key)) as V | undefined;
  }
  override set(key: K, value: V): this {
    const next = normalize(value) as V;
    if (super.has(key) && Object.is(super.get(key), next)) return this;
    super.set(key, next);
    notifyReactive();
    return this;
  }
  override delete(key: K): boolean {
    const removed = super.delete(key);
    if (removed) notifyReactive();
    return removed;
  }
  override clear(): void {
    if (this.size === 0) return;
    super.clear();
    notifyReactive();
  }
  override forEach(cb: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
    super.forEach((v, k) => cb.call(thisArg, view(v) as V, k, this));
  }
  override values(): MapIterator<V> {
    return (Array.from(super.values(), (v) => view(v) as V)[Symbol.iterator]()) as unknown as MapIterator<V>;
  }
  override entries(): MapIterator<[K, V]> {
    return (Array.from(super.entries(), ([k, v]) => [k, view(v) as V] as [K, V])[Symbol.iterator]()) as unknown as MapIterator<[K, V]>;
  }
  override [Symbol.iterator](): MapIterator<[K, V]> {
    return this.entries();
  }
}

export class ReactiveSet<T> extends Set<T> {
  constructor(values?: Iterable<T> | null) {
    super();
    if (values) for (const v of values) super.add(v);
  }
  override add(value: T): this {
    if (super.has(value)) return this;
    super.add(value);
    notifyReactive();
    return this;
  }
  override delete(value: T): boolean {
    const removed = super.delete(value);
    if (removed) notifyReactive();
    return removed;
  }
  override clear(): void {
    if (this.size === 0) return;
    super.clear();
    notifyReactive();
  }
}

/** 创建响应式根对象。初始值中的 Map/Set 会被转为可响应式的子类。 */
export function createReactive<T extends object>(initial: T): T {
  const target: any = {};
  for (const key of Object.keys(initial)) target[key] = normalize((initial as any)[key]);
  return proxyFor(target) as T;
}
