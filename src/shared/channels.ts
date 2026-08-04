/** 主进程 ↔ 渲染进程 IPC 通道名 */
export const IpcChannels = {
  /** 读取完整应用状态 */
  GET_STATE: 'fluffy:get-state',
  /** 部分更新应用状态 */
  SET_STATE: 'fluffy:set-state',
  /** 打开小家窗口 */
  OPEN_HOME: 'fluffy:open-home',
  /** 关闭小家窗口 */
  CLOSE_HOME: 'fluffy:close-home',
  /** 设置桌宠点击穿透 */
  SET_CLICK_THROUGH: 'fluffy:set-click-through',
  /** 更新桌宠窗口位置（拖拽落点） */
  MOVE_PET: 'fluffy:move-pet',
  /** 开始 / 结束专注模式 */
  TOGGLE_FOCUS: 'fluffy:toggle-focus',
  /** 主进程推送状态变更 */
  STATE_CHANGED: 'fluffy:state-changed'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]
