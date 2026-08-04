/** 主进程 ↔ 渲染进程 IPC 通道名 */
export const IpcChannels = {
  GET_STATE: 'fluffy:get-state',
  SET_STATE: 'fluffy:set-state',
  OPEN_HOME: 'fluffy:open-home',
  CLOSE_HOME: 'fluffy:close-home',
  SET_CLICK_THROUGH: 'fluffy:set-click-through',
  MOVE_PET: 'fluffy:move-pet',
  /** 开始专注（可选覆盖分钟数） */
  START_FOCUS: 'fluffy:start-focus',
  /** 结束专注；natural=true 表示计时到点 */
  STOP_FOCUS: 'fluffy:stop-focus',
  TOGGLE_FOCUS: 'fluffy:toggle-focus',
  /** 消费并清空 pendingPetEvent */
  CLEAR_PET_EVENT: 'fluffy:clear-pet-event',
  /** 记录互动时间（可选带亲密度增量） */
  NOTE_INTERACTION: 'fluffy:note-interaction',
  STATE_CHANGED: 'fluffy:state-changed'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]
