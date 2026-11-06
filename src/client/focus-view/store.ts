import { createRenderSignal } from '../utils/render-signal';

/** focus 视图的重绘信号；数据在渲染时由 buildFocusView 从 state 读取 */
export const focusViewStore = createRenderSignal();
