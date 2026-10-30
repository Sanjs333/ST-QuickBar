# QuickBar 插件接入说明

适用于希望接入悬浮编辑按钮、标准魔法棒 / 扩展面板入口或运行时按钮的插件与脚本。用户操作见 [README.md](README.md#使用说明)。

悬浮编辑接入 API 和保存行为保持不变：插件字段仍使用源输入框实时同步与
上下文变更锁定，不会自动获得角色字段或预设条目的独立草稿能力。

## 基础用法

给触发按钮加上 `data-quickbar-editor-for`，值为同页面内文本框的
唯一 `id`。原有点击事件保持不变。

    <button type="button" data-quickbar-editor-for="my_plugin_notes">
      放大编辑
    </button>
    <textarea id="my_plugin_notes"></textarea>

未安装 QuickBar 时，按钮按原有逻辑工作。

如果按钮已经是酒馆原生的 `.editor_maximize[data-for]`，QuickBar
会自动识别，无需额外属性。

## 切换编辑对象

同一文本框被多个主题/方案复用时，需要在**切换对象、导入覆盖或
重新加载草稿**时更新标记：

    const field = document.getElementById("my_plugin_notes");
    let loadCount = 0;

    function showItem(item) {
      field.dataset.quickbarEditorKey =
        `my-plugin:${item.id}:${++loadCount}`;
      field.dataset.quickbarEditorTitle = `备注 · ${item.name}`; // 可选
      field.value = item.notes;
    }

规则：

- 仅在切换对象/导入/重载时更新，正常打字不要更新。
- 标记改变后旧悬浮窗会锁定，保留文字供复制。
- 异步加载前可先将 key 设为 `""` 临时停用入口，加载完成后再更新。
- 内容随角色或聊天切换时，同样需要更新标记。

## 行为约定

- 插件字段的悬浮编辑仍实时回写文本框并触发原生 `input` 事件，**不会**替插件
  执行「保存」。请确保原有输入处理能接收这些修改。
- 已同步或未修改的实时同步窗口，即使原框失效后锁定，关闭或刷新也不再误报未保存；
  只有未写回原框的本地修改才提示保留。关闭前会尝试提交尚未结束的组字输入。
  此判断只确认是否写回原框，不代表来源插件已完成持久化保存。
- 仅用于真实的文本编辑框。截断预览、复杂编辑器背后的临时值、
  富文本或 JSON 编辑器需先确认读写方式，不能只加属性就视为适配完成。

## 内置角色字段适配器（不属于插件接入 API）

已保存角色的以下原生字段使用专用内置适配器：

- 描述：`description_textarea` → `description`
- 性格：`personality_textarea` → `personality`
- 场景：`scenario_pole` → `scenario`
- 主开场白：`firstmessage_textarea` → `first_mes`（不包括已有聊天消息或备用开场白列表）

按 **角色 avatar + 字段** 建立独立草稿，标题标明角色和字段。
切换 A/B 后仍可编辑，重新打开同一角色的同一字段只聚焦已有草稿；
同一角色的不同字段可以分别开窗。所有草稿与普通字段窗口共用
**最多 3 个窗口** 的总上限。

- 停止输入约 **700ms** 后自动保存到绑定的角色字段，不覆盖其他字段或
  当前选中的其他角色。底部没有 **保存 / 重新加载** 按钮，也没有专用
  **Ctrl/Cmd+S** 保存快捷键；状态栏提示加载、待保存、保存中、已保存
  以及错误 / 冲突状态。
- 撤销 / 重做、历史恢复及「恢复」也会触发自动保存到绑定字段，
  无需另行手动保存。
- 同一 avatar 的保存请求按顺序串行执行，包括同一角色不同字段的保存，
  避免并发整卡读写互相覆盖；不会因该角色正在保存而以「忙碌」拒绝后续保存。
- 临时性保存失败会进行有上限的自动重试；永久性服务器错误不会无限重试，
  达到重试上限后也不会持续请求。加载 / 保存失败或保存结果无法确认时
  保留当前文本并提示，不把不确定结果视为已保存。
- 保存前若发现服务器同一字段与草稿基线不同，窗口会暂停自动同步并锁定，
  保留可复制文本，不强制覆盖。先复制需要保留的内容，再关闭锁定窗口并
  重新打开该角色字段，基于服务器最新记录继续编辑。此检查不是跨标签页
  或跨浏览器的原子锁。
- 正常关闭（包括关闭快捷键）会先等待待处理的自动保存完成，成功后再关闭。
  保存失败、结果不确定或冲突尚未解决时保留文本，并在丢弃前请求确认。
- 存在未保存或保存结果尚未确认的修改时，离开或刷新页面会请求浏览器
  显示离页提示。草稿不跨刷新持久化，刷新后不能恢复未保存草稿；
  窗口位置 / 尺寸的记忆不等于草稿存储。

这是仅针对上述已保存角色字段的内置能力，**不是任意插件字段的通用
多角色编辑接口**。插件仅添加接入属性、设置 key/title 或使用原生放大
按钮，不会自动启用独立草稿、角色字段自动保存或服务器冲突检测。

未适配的其他角色字段、世界书条目、自定义 CSS、插件输入框，以及尚未
保存的新建角色表单，仍保持原有源同步与上下文变更锁定行为。插件仍需
自行维护对象标记、响应 `input` 事件并处理保存。

## 内置预设条目适配器（不属于插件接入 API）

原生 Prompt Manager 的已有非 marker 文本条目现在使用「预设名 + identifier」独立草稿，
不再实时跟随原编辑框。关闭 / 保存原面板、打开另一条目、原框被清空或移除，
不会清空已有草稿。重复打开同一预设条目会回到原窗口。

关闭悬浮窗会自动提交正文到当前对应的条目设置，成功后直接关闭；底部纯 FA 保存图标 /
**Ctrl/⌘+S** 用于保存而不关闭窗口。整份命名预设仍需用户在酒馆保存。切换预设后需先切回，不能让旧窗口写入新预设。同一正文有并发修改、
条目不存在或保存失败时保留草稿并提示。只有自动保存失败、结果未确认或冲突时才询问
是否放弃并关闭，取消后草稿仍可继续编辑。刷新有离页提示；
不提供跨刷新恢复。尚未原生保存的新条目需先保存一次才能使用此适配器。

这不改变插件字段实时同步 + 上下文 key 锁定的 API，也不为任意插件提供通用保存能力。

## Token 计数范围

原生页面只补 Prompt Manager 正文标签；不重复添加世界书和角色卡的已有计数。
悬浮计数使用原生角色 / 用户设定、世界书正文、预设 / 系统提示词字段的明确白名单；
不是根据标题里有没有「提示词」猜测，也不会给任意第三方插件字段自动启用。
计数只读悬浮正文原文，使用酒馆当前分词器，不展开宏、不写回、不触发保存。
不使用原生 `data-token-counter` 注册属性，避免混入角色卡的总 token 统计。

## 标准魔法棒入口与来源显示策略

新接入优先使用标准 `#extensionsMenu` 原生按钮，提供稳定 DOM ID、纯 FA 图标和清晰名称。
用户扫描后可选择「仅隐藏原入口」或「加入所选」；加入快捷入口后，
由 QuickBar 统一管理工具栏、文件夹、角色区域、悬浮面板、排序和快捷键。
表情包管理器采用这条路径，不调用运行时注册 API。

提供标准原入口即可，无需调用运行时 API，例如：

```html
<!-- 由来源插件挂载到 #extensionsMenu；ID 应稳定且唯一。 -->
<div id="my_plugin_open" class="list-group-item" role="button" tabindex="0">
  <i class="fa-solid fa-plug"></i>
  <span>我的插件</span>
</div>
```

来源仍负责原按钮的点击与键盘处理。用户在「按钮管理 → 魔法棒入口」点击「扫描入口」，
勾选后选择「仅隐藏原入口」或「加入所选」。加入快捷入口时，QuickBar 只保存定位信息，
不复制处理函数；调用时重新定位节点并执行原按钮的 `click()`。
魔法棒扫描仅识别标准 `#extensionsMenu` 下的原生按钮；扩展面板扫描仅识别
`#extensions_settings` / `#extensions_settings2` 下的顶层原生折叠面板，分别保留对应分类。
名称定位必须唯一，不保存位置序号选择器；
核心酒馆顶栏、发送按钮、额外顶栏、iframe / 沙盒内部和面板子操作不在扫描或隐藏范围内。

来源脚本的 `data-quickbar-hide-source-default="true"` 仅保留为来源声明，
不再绕过 QuickBar 的统一默认策略：新增快捷入口（包括由仅隐藏项转换的入口）
遵从「更多设置」最后一次统一设置，初始默认关闭。
用户可对已加入快捷入口统一批量切换，也可通过入口行的眼睛按钮单独修改，以保存的 `hideOriginal` 偏好为准。
可选的同功能入口可用 `data-quickbar-source-for="原按钮稳定ID"` 关联，也受同一显示策略控制。

QuickBar 用 `data-quickbar-source-hidden="true"` 和自己的独立可移除样式控制显示，
不改写来源按钮的 style、hidden 或 class，不删除或移动原按钮。
来源不应把这个标记等同于自己被禁用；原点击处理函数仍需可执行。
显示状态变化会发 `quickbar:changed` 事件，便于来源更新自己的可选入口。

对于已加入的快捷入口，只有实际可访问的快捷布局才隐藏原入口；QuickBar 关闭、源脚本或布局消失时保留配置、撤销遮罩。
查询来源时同步临时停用仅 QuickBar 自己的遮罩样式，随后恢复，
所以被本插件隐藏的来源仍可重新扫描和转发，而来源自己的隐藏 / 禁用状态仍受尊重。
这是可选的兼容功能，不保证任意第三方脚本都允许在隐藏状态下程序化点击。

「更多设置 → 快捷入口可用时隐藏原入口」统一开关保存在 `externalEntries.hideOriginalByDefault`，
只批量同步所有已加入快捷入口的 `hideOriginal`，并设置后续新增或转换的快捷入口默认值，
不修改独立隐藏规则。单项眼睛按钮仍可独立调整，混合选择时统一开关显示半选。
初始化保留已有单项配置，不新增例外名单。

### 仅隐藏原入口

来源无需额外注册 API：提供上述标准原入口与稳定标识即可。用户选择「仅隐藏原入口」时，
QuickBar 只保存独立隐藏规则，不生成快捷按钮，不进入文件夹、角色区域或悬浮面板的按钮选择器，
也不写入快捷键、排序或布局。

独立隐藏仅要求 QuickBar 启用，不要求存在可达的快捷布局。关闭 QuickBar 会撤销自身遮罩、
恢复来源，重新启用后按保留规则隐藏。规则随设置保存；来源暂时不存在时不删除，
使用相同稳定标识重建后可继续应用。来源自身的隐藏 / 禁用状态仍受尊重，DOM 结构和原事件保持不动。

用户可在原分类通过眼睛恢复按钮删除单条规则并恢复原入口；「全部恢复」只作用于该分类的
仅隐藏记录，不影响已加入快捷入口的隐藏偏好。已有仅隐藏项仍可在扫描中勾选，
通过「加入所选」删除独立规则并转换为快捷入口，转换后遵从现有快捷隐藏策略和最近一次统一默认。
已加入的快捷入口不会重复创建仅隐藏规则，其原入口显示仍由原入口行的眼睛按钮管理。

## 来源脚本托管的快捷入口（兼容保留）

此接口为兼容既有来源脚本保留；新接入优先使用标准魔法棒按钮。运行时入口由来源脚本选择工具栏或悬浮面板，不参与 QuickBar 按钮管理、扫描或选择器：

```js
const entry = window.STQuickBar.registerExternalButton({
  id: 'my-script', label: '我的脚本', icon: 'fa-solid fa-plug',
  placement: 'toolbar', // 默认 toolbar；也支持 floating
  action: () => openMyPanel(),
});
entry.isActive(); // 宿主和所选区域是否可用，用于来源脚本保留备用入口
entry.unregister(); // 注销此次注册；旧句柄不会删除同 ID 的更新注册
```

`window.STQuickBar.apiVersion === 1`；提供 `unregisterExternalButton(id)`。
同 ID 替换回调，元数据 / 回调 / runtime key 不写入 QuickBar 设置。
就绪事件为 `quickbar:ready`，入口及启用状态变化事件为 `quickbar:changed`。
脚本需要在停用 / 销毁时注销，重载后重新注册；未启用目标区域时句柄仍保留但不活跃。
悬浮位置需启用悬浮面板；工具栏位置追加到当前工具栏，不支持在宿主中另设排序 / 文件夹 / 快捷键。
ID 格式为字母开头、最多 64 位的小写字母、数字、下划线或连字符。
非法描述符会抛出 TypeError；动作异常被捕获，执行中的异步动作不会重复触发。

### 加载顺序与生命周期

脚本可能早于或晚于 QuickBar 加载；同时检查现有 API 和监听 `quickbar:ready`，避免错过注册。用 `quickbar:changed` 更新备用入口，并在脚本停用 / 销毁时注销按钮及监听：

```js
let entry;

function updateFallback() {
  // 此函数由来源脚本实现，只控制自己的备用入口。
  setFallbackVisible(!entry?.isActive());
}

function registerQuickBarEntry() {
  const api = window.STQuickBar;
  if (api?.apiVersion !== 1) return;
  entry?.unregister();
  entry = api.registerExternalButton({
    id: 'my-script',
    label: '我的脚本',
    icon: 'fa-solid fa-plug',
    placement: 'toolbar',
    action: () => openMyPanel(),
  });
  updateFallback();
}

window.addEventListener('quickbar:ready', registerQuickBarEntry);
window.addEventListener('quickbar:changed', updateFallback);
registerQuickBarEntry();
updateFallback();

function disposeQuickBarEntry() {
  window.removeEventListener('quickbar:ready', registerQuickBarEntry);
  window.removeEventListener('quickbar:changed', updateFallback);
  entry?.unregister();
  entry = undefined;
  updateFallback();
}
```

`isActive()` 表示宿主和所选区域已启用，不保证按钮当前展开或在视口内可见。
此类按钮不参与扫描、管理、文件夹、角色区域、快捷键或原入口隐藏设置；来源需自行处理备用入口，重载后重新注册。
