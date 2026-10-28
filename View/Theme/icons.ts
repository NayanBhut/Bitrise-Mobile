/**
 * Single source of truth mapping semantic icon names to platform symbols:
 * SF Symbols on iOS, Material Symbols on Android. `AppIcon` consumes this map
 * so screens never reference raw symbol strings.
 */
export const icons = {
  apps: {ios: 'square.stack.3d.up', android: 'stacks'},
  build: {ios: 'hammer', android: 'build'},
  success: {ios: 'checkmark.circle.fill', android: 'check_circle'},
  failed: {ios: 'xmark.octagon.fill', android: 'dangerous'},
  aborted: {ios: 'stop.circle.fill', android: 'stop_circle'},
  running: {ios: 'arrow.triangle.2.circlepath', android: 'sync'},
  onHold: {ios: 'pause.circle.fill', android: 'pause_circle'},
  branch: {ios: 'arrow.triangle.branch', android: 'fork_right'},
  workflow: {ios: 'flowchart', android: 'account_tree'},
  trigger: {ios: 'play.fill', android: 'play_arrow'},
  abort: {ios: 'stop.fill', android: 'stop'},
  logs: {ios: 'doc.text.magnifyingglass', android: 'plagiarism'},
  logout: {ios: 'rectangle.portrait.and.arrow.right', android: 'logout'},
  token: {ios: 'key.fill', android: 'key'},
  show: {ios: 'eye', android: 'visibility'},
  hide: {ios: 'eye.slash', android: 'visibility_off'},
  envVar: {ios: 'curlybraces', android: 'data_object'},
  error: {ios: 'exclamationmark.triangle.fill', android: 'error'},
  empty: {ios: 'tray', android: 'inbox'},
  appGlyph: {ios: 'hammer.circle.fill', android: 'build_circle'},
  chevron: {ios: 'chevron.right', android: 'chevron_right'},
} as const;

/** Union of valid semantic icon names. */
export type IconName = keyof typeof icons;
