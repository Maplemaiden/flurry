/** 主进程 ↔ 渲染进程 IPC 通道名 */
export const IpcChannels = {
  GET_STATE: 'fluffy:get-state',
  SET_STATE: 'fluffy:set-state',
  OPEN_HOME: 'fluffy:open-home',
  CLOSE_HOME: 'fluffy:close-home',
  SET_CLICK_THROUGH: 'fluffy:set-click-through',
  /** 穿透模式下临时忽略/接收鼠标（热区），不改持久设置 */
  SET_PET_MOUSE_PASSTHROUGH: 'fluffy:set-pet-mouse-passthrough',
  MOVE_PET: 'fluffy:move-pet',
  /** 读取桌宠当前窗口位置 */
  GET_PET_BOUNDS: 'fluffy:get-pet-bounds',
  /** 展开/收起桌宠快捷菜单时调整窗口大小 */
  SET_PET_MENU_OPEN: 'fluffy:set-pet-menu-open',
  /** 关闭小窝后轻唤桌宠（气泡提示） */
  NUDGE_PET: 'fluffy:nudge-pet',
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
